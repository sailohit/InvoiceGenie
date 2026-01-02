import { db, OrderEntity, CustomerEntity, ProductEntity, SettingEntity, UserEntity } from "@/db/db";
import { toast } from "sonner";

export interface BackupData {
    version: number;
    timestamp: string;
    data: {
        orders: OrderEntity[];
        customers: CustomerEntity[];
        products: ProductEntity[];
        settings: SettingEntity[];
        users: UserEntity[];
    };
}

export const exportData = async () => {
    try {
        const orders = await db.orders.toArray();
        const customers = await db.customers.toArray();
        const products = await db.products.toArray();
        const settings = await db.settings.toArray();
        const users = await db.users.toArray();

        const backup: BackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                orders,
                customers,
                products,
                settings,
                users
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-genie-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Export failed:", error);
        toast.error("Failed to export data");
        return false;
    }
};

export const importData = async (file: File, mode: 'merge' | 'overwrite' = 'merge') => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const backup = JSON.parse(text) as BackupData;

                if (!backup.data || !backup.version) {
                    throw new Error("Invalid backup file format");
                }

                await db.transaction('rw', [db.orders, db.customers, db.products, db.settings, db.users], async () => {
                    if (mode === 'overwrite') {
                        await db.orders.clear();
                        await db.customers.clear();
                        await db.products.clear();
                        await db.settings.clear();
                        // We strictly might NOT want to clear users if the restore doesn't have an admin, but for full restore we should.
                        // Ideally we check if the backup has users.
                        if (backup.data.users?.length > 0) {
                            await db.users.clear();
                        }
                    }

                    if (backup.data.orders?.length) await db.orders.bulkPut(backup.data.orders);
                    if (backup.data.customers?.length) await db.customers.bulkPut(backup.data.customers);
                    if (backup.data.products?.length) await db.products.bulkPut(backup.data.products);
                    if (backup.data.settings?.length) await db.settings.bulkPut(backup.data.settings);
                    if (backup.data.users?.length) await db.users.bulkPut(backup.data.users);
                });

                resolve(true);
            } catch (error) {
                console.error("Import failed:", error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};

export const factoryReset = async () => {
    try {
        await db.transaction('rw', [db.orders, db.customers, db.products, db.settings], async () => {
            await db.orders.clear();
            await db.customers.clear();
            await db.products.clear();
            await db.settings.clear();
            // Do NOT clear users by default to avoid locking out the admin
        });
        return true;
    } catch (error) {
        console.error("Reset failed:", error);
        return false;
    }
};
