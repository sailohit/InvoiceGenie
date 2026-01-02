import Dexie, { Table } from 'dexie';
import { OrderData } from '@/utils/orderUtils';

/**
 * Interface representing an Order record in the database.
 * Extends the base OrderData used in the UI.
 */
export interface OrderEntity extends OrderData {
    id?: number; // Auto-incremented primary key
}

/**
 * Interface for application settings (key-value store).
 */
export interface SettingEntity {
    key: string;
    value: any;
}

export type UserRole = 'admin' | 'user';

/**
 * Interface representing a User in the system.
 */
export interface UserEntity {
    id?: number;
    username: string;
    passwordHash: string; // Stored as SHA-256 hash
    salt?: string; // Random salt for security
    role: UserRole;
    name: string;
    createdAt: string;
}

/**
 * Interface representing a Product in the inventory.
 */
export interface ProductEntity {
    id?: number;
    name: string;
    description?: string;
    price: number;
    sku?: string;
    image?: string; // Data URL or path

    // Inventory Management
    inventory: number;
    minStock?: number;
    costPrice?: number;
    category?: string;

    createdAt?: string;
}

/**
 * Interface representing a Customer.
 */
export interface CustomerEntity {
    id?: number;
    name: string;
    email?: string;
    phone?: string;

    // Structured Address
    building?: string;
    streetAddress?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;

    taxId?: string;
    paymentTerms?: string;
    notes?: string;
    createdAt?: string;
}

/**
 * The main Database class extending Dexie.
 * Manages all local IndexedDB tables and schema versions.
 */
export class InvoiceGenieDB extends Dexie {
    orders!: Table<OrderEntity>;
    settings!: Table<SettingEntity>;
    users!: Table<UserEntity>;
    products!: Table<ProductEntity>;
    customers!: Table<CustomerEntity>;

    constructor() {
        super('InvoiceGenieDB');
        this.version(3).stores({
            orders: '++id, orderNumber, invoiceNumber, timestamp, orderDate',
            settings: 'key',
            users: '++id, &username, role' // &username = unique index
        });

        // Version 4: Ensure admin exists for existing users migrating from v2->v3 who missed the populate event
        this.version(4).stores({
            orders: '++id, orderNumber, invoiceNumber, timestamp, orderDate',
            settings: 'key',
            users: '++id, &username, role'
        }).upgrade(async tx => {
            // Seed default admin if not exists (Lazy migration will add salt later)
            const adminExists = await tx.table('users').where('username').equals('admin').count();
            if (adminExists === 0) {
                // Legacy hash for 'admin123' (simple SHA-256 of 'admin123')
                // We'll let the app upgrade this to salted on first login
                // SHA-256('admin123') = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
                await tx.table('users').add({
                    username: 'admin',
                    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
                    role: 'admin',
                    name: 'Administrator',
                    createdAt: new Date().toISOString()
                });
            }
        });

        // Version 5: Add products table
        this.version(5).stores({
            orders: '++id, orderNumber, invoiceNumber, timestamp, orderDate',
            settings: 'key',
            users: '++id, &username, role',
            products: '++id, name, sku'
        });

        // Version 6: Add customers table
        this.version(6).stores({
            orders: '++id, orderNumber, invoiceNumber, timestamp, orderDate',
            settings: 'key',
            users: '++id, &username, role',
            products: '++id, name, sku',
            customers: '++id, name, email, phone, city' // Index common search fields
        });

        // Version 7: Update products table with inventory fields
        this.version(7).stores({
            orders: '++id, orderNumber, invoiceNumber, timestamp, orderDate',
            settings: 'key',
            users: '++id, &username, role',
            products: '++id, name, sku, category', // Index category
            customers: '++id, name, email, phone, city'
        }).upgrade(async tx => {
            // Initialize inventory for existing products
            await tx.table('products').toCollection().modify({ inventory: 0 });
        });

        // Seed default admin user if not exists
        this.on('populate', () => {
            // We can't use async crypto here easily in populate, so we might seed later or use a hardcoded hash for "admin123"
            // SHA-256 for "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
            this.users.add({
                username: 'admin',
                passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
                role: 'admin',
                name: 'Administrator',
                createdAt: new Date().toISOString()
            });
        });
    }
}

export const db = new InvoiceGenieDB();

// --- Helper Functions ---

const PAD_LENGTH = 4;

export const getNextSequence = async (type: 'invoice' | 'order'): Promise<string> => {
    const key = type === 'invoice' ? 'lastInvoiceSequence' : 'lastOrderSequence';

    return await db.transaction('rw', db.settings, async () => {
        const setting = await db.settings.get(key);
        const currentSeq = setting?.value || 0;
        const nextSeq = currentSeq + 1;

        // Save the new sequence immediately to reserve it
        // (In a real high-concurrency app we might do this differently, but fine for local single-user)
        // Actually, we should probably only save it when the order is finalized, 
        // but to prevent duplicates in UI, we often fetch next. 
        // For now, let's just return the potential next string without incrementing?
        // User wants "stored in local database". 
        // Strategy: We'll have a function to *reserve/increment* and one to just *peek* if needed.
        // For simplicity: We will increment only when saving the order.
        // But the UI needs to show it. 
        // Let's return the "next" number based on current + 1. 

        // If we want TRULY continuous, we only increment when we successfully create the order.
        // But the UI "Invoice Number" field is usually auto-populated.
        // Let's return (current + 1).

        const prefix = type === 'invoice' ? 'INV' : 'ORD';
        // Optional: Add Year? INV-2024-001. User said "Continuous". 
        // Simple continuous is often better for small businesses. INV-001.
        const formattedDate = new Date().getFullYear();
        // Let's do INV-{SEQ} for simplicity as per "continuous" request usually implying 1, 2, 3...
        return `${prefix}-${String(nextSeq).padStart(PAD_LENGTH, '0')}`;
    });
};

export const incrementSequence = async (type: 'invoice' | 'order') => {
    const key = type === 'invoice' ? 'lastInvoiceSequence' : 'lastOrderSequence';
    await db.transaction('rw', db.settings, async () => {
        const setting = await db.settings.get(key);
        const currentSeq = setting?.value || 0;
        await db.settings.put({ key, value: currentSeq + 1 });
    });
};

export const updateStock = async (productId: number, change: number) => {
    return await db.transaction('rw', db.products, async () => {
        const product = await db.products.get(productId);
        if (product) {
            const newStock = (product.inventory || 0) + change;
            await db.products.update(productId, { inventory: newStock });
            return newStock;
        }
        return null;
    });
};

export const saveOrder = async (order: OrderData) => {
    await db.transaction('rw', db.orders, db.products, db.settings, async () => {
        // 1. Save the order
        await db.orders.add(order);

        // 2. Deduct Inventory if product is linked
        if (order.productId) {
            const qty = typeof order.quantity === 'string' ? parseFloat(order.quantity) : order.quantity;
            if (!isNaN(qty) && qty > 0) {
                await updateStock(order.productId, -qty);
            }
        }

        // 3. Increment sequences implicitly (we handle this via incrementSequence in UI usually, 
        // strictly speaking we should probably do it here to be safe and atomic)
    });
};
