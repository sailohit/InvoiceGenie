import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ProductEntity } from "@/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, Package as PackageIcon, Pencil } from "lucide-react";
import * as Papa from 'papaparse';
import { useRef } from "react";
import { Upload } from "lucide-react";

const AdminProducts = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [sku, setSku] = useState("");
    const [inventory, setInventory] = useState("");
    const [minStock, setMinStock] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [category, setCategory] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const openAdd = () => {
        setName("");
        setPrice("");
        setSku("");
        setInventory("0");
        setMinStock("5");
        setCostPrice("");
        setCategory("");

        setIsEditing(false);
        setCurrentId(null);
        setIsOpen(true);
    };

    const openEdit = (product: ProductEntity) => {
        setName(product.name);
        setPrice(product.price.toString());
        setSku(product.sku || "");
        setInventory(product.inventory?.toString() || "0");
        setMinStock(product.minStock?.toString() || "5");
        setCostPrice(product.costPrice?.toString() || "");
        setCategory(product.category || "");

        setIsEditing(true);
        setCurrentId(product.id!);
        setIsOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!name || !price) {
                toast.error("Name and Price are required");
                return;
            }

            const numPrice = parseFloat(price);
            const numInventory = parseInt(inventory) || 0;
            const numMinStock = parseInt(minStock) || 0;
            const numCostPrice = costPrice ? parseFloat(costPrice) : undefined;

            if (isNaN(numPrice)) {
                toast.error("Invalid price");
                return;
            }

            const productData = {
                name,
                price: numPrice,
                sku,
                inventory: numInventory,
                minStock: numMinStock,
                costPrice: numCostPrice,
                category
            };

            if (isEditing && currentId) {
                await db.products.update(currentId, productData);
                toast.success("Product updated");
            } else {
                await db.products.add({
                    ...productData,
                    createdAt: new Date().toISOString()
                });
                toast.success("Product added");
            }

            setIsOpen(false);
        } catch (error) {
            toast.error("Failed to save product");
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setIsOpen(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            await db.products.delete(id);
            toast.success("Product deleted");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newProducts: Omit<ProductEntity, 'id'>[] = [];
                const errors: string[] = [];

                results.data.forEach((row: any, index) => {
                    if (!row.name || !row.price) {
                        errors.push(`Row ${index + 1}: Missing name or price`);
                        return;
                    }
                    newProducts.push({
                        name: row.name,
                        price: parseFloat(row.price) || 0,
                        sku: row.sku || undefined,
                        inventory: parseInt(row.inventory) || 0,
                        minStock: parseInt(row.minStock) || 5,
                        category: row.category || undefined,
                        costPrice: row.costPrice ? parseFloat(row.costPrice) : undefined,
                        createdAt: new Date().toISOString()
                    });
                });

                if (newProducts.length > 0) {
                    try {
                        await db.products.bulkAdd(newProducts);
                        toast.success(`Imported ${newProducts.length} products successfully`);
                        if (errors.length > 0) {
                            toast.warning(`Skipped ${errors.length} invalid rows`);
                            console.warn("Import errors:", errors);
                        }
                    } catch (error) {
                        console.error("Import failed", error);
                        toast.error("Failed to import products");
                    }
                } else {
                    toast.error("No valid products found in file");
                }

                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (error) => {
                console.error("Parse error", error);
                toast.error("Failed to parse CSV file");
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Management</h2>
                    <p className="text-muted-foreground">Manage inventory, specific pricing, and SKUs.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button onClick={openAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                            Configure product details for inventory tracking and invoices.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mouse" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU / Barcode</Label>
                                <Input id="sku" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. WM-001" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Selling Price (₹) *</Label>
                                <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                                <Input id="costPrice" type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Electronics" />
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                            <Label className="text-sm font-semibold">Inventory Tracking</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="inventory">Current Stock</Label>
                                    <Input id="inventory" type="number" value={inventory} onChange={e => setInventory(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minStock">Low Stock Alert Level</Label>
                                    <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>{isEditing ? "Update Product" : "Create Product"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No products found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {products?.map((prod) => {
                            const isLowStock = prod.inventory <= (prod.minStock || 5);
                            return (
                                <TableRow key={prod.id}>
                                    <TableCell className="text-xs font-mono text-muted-foreground">{prod.sku || "-"}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <PackageIcon className="h-4 w-4 text-primary" />
                                            {prod.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{prod.category || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${prod.inventory === 0 ? "bg-destructive/10 text-destructive" :
                                            isLowStock ? "bg-yellow-500/10 text-yellow-600" :
                                                "bg-green-500/10 text-green-600"
                                            }`}>
                                            {prod.inventory} units
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">₹{prod.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(prod)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => prod.id && handleDelete(prod.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminProducts;
