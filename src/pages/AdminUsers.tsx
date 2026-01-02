import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, UserRole } from "@/db/db";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, UserPlus, Shield, User } from "lucide-react";

// Helper to hash password (duplicated from AuthContext to keep page standalone-ish or generic)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

const AdminUsers = () => {
    const users = useLiveQuery(() => db.users.toArray());
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("user");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!username || !password || !name) {
                toast.error("All fields are required");
                return;
            }

            // Check if username exists
            const existing = await db.users.where('username').equals(username).first();
            if (existing) {
                toast.error("Username already taken");
                return;
            }

            const passwordHash = await hashPassword(password);

            await db.users.add({
                name,
                username,
                passwordHash,
                role,
                createdAt: new Date().toISOString()
            });

            toast.success("User created successfully");
            setIsOpen(false);
            // Reset form
            setName("");
            setUsername("");
            setPassword("");
            setRole("user");
        } catch (error) {
            toast.error("Failed to create user");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (username === 'admin') {
            toast.error("Cannot delete the main admin user");
            return;
        }
        if (confirm(`Are you sure you want to delete user "${username}"?`)) {
            await db.users.delete(id);
            toast.success("User deleted");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage access to the application.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new account for an employee or admin.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="jdoe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(val: UserRole) => setRole(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User (Invoice Only)</SelectItem>
                                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.role === 'admin' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                        <span className="capitalize">{user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {user.username !== 'admin' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => user.id && handleDeleteUser(user.id, user.username)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminUsers;
