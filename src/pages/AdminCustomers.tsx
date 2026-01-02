import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, CustomerEntity } from "@/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const AdminCustomers = () => {
    const customers = useLiveQuery(() => db.customers.toArray());
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Address State
    const [building, setBuilding] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [locality, setLocality] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

    const [taxId, setTaxId] = useState("");
    const [notes, setNotes] = useState("");

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    ) || [];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const customerData = {
                name, email, phone,
                building, streetAddress, locality, city, state, pincode,
                taxId, notes
            };

            if (currentId) {
                await db.customers.update(currentId, customerData);
                toast.success("Customer updated");
            } else {
                await db.customers.add({
                    ...customerData,
                    createdAt: new Date().toISOString()
                });
                toast.success("Customer added");
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save customer");
        }
    };

    const handleEdit = (customer: CustomerEntity) => {
        setCurrentId(customer.id);
        setName(customer.name);
        setEmail(customer.email || "");
        setPhone(customer.phone || "");

        setBuilding(customer.building || "");
        setStreetAddress(customer.streetAddress || "");
        setLocality(customer.locality || "");
        setCity(customer.city || "");
        setState(customer.state || "");
        setPincode(customer.pincode || "");

        setTaxId(customer.taxId || "");
        setNotes(customer.notes || "");
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            await db.customers.delete(id);
            toast.success("Customer deleted");
        }
    };

    const resetForm = () => {
        setCurrentId(null);
        setName("");
        setEmail("");
        setPhone("");
        setBuilding("");
        setStreetAddress("");
        setLocality("");
        setCity("");
        setState("");
        setPincode("");
        setTaxId("");
        setNotes("");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
                    <p className="text-muted-foreground">Manage your client database.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentId ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Customer Name *</Label>
                                <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address Details</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="building">Building / Flat</Label>
                                    <Input id="building" value={building} onChange={e => setBuilding(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="street">Street</Label>
                                    <Input id="street" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="locality">Locality</Label>
                                    <Input id="locality" value={locality} onChange={e => setLocality(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" value={state} onChange={e => setState(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID / GSTIN</Label>
                                <Input id="taxId" value={taxId} onChange={e => setTaxId(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Internal Notes</Label>
                                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, preferences, etc." />
                            </div>
                            <Button type="submit" className="w-full">Save Customer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No customers found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="font-medium">{customer.name}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{customer.taxId || "No Tax ID"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{customer.email}</div>
                                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{customer.city}</div>
                                        <div className="text-xs text-muted-foreground">{customer.state}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(customer.id!)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminCustomers;
