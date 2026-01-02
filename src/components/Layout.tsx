import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FileText, BarChart3, Menu, X, Rocket, Users, LogOut, Package, Database } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: FileText, label: 'Invoice Generator', path: '/app/generate' },
        ...(user?.role === 'admin' ? [
            { icon: BarChart3, label: 'Analytics Dashboard', path: '/app/dashboard' },
            { icon: Users, label: 'Customers', path: '/app/customers' },
            { icon: Package, label: 'Products', path: '/app/products' },
            { icon: Users, label: 'User Management', path: '/app/users' },
            { icon: Database, label: 'Data & Settings', path: '/app/data' }
        ] : [])
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">Invoice Genie</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:sticky top-0 h-screen w-72 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-xl md:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Rocket className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight">Invoice Genie</h1>
                            <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-full">Pro Edition</span>
                        </div>
                    </div>
                    {user && (
                        <div className="mt-4 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                            Signed in as <span className="font-semibold text-foreground">{user.username}</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link to={item.path} key={item.path} onClick={() => setIsSidebarOpen(false)}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}>
                                    <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "")} />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border/50 space-y-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-xl border border-primary/10">
                        <h4 className="font-semibold text-sm mb-1">Need Help?</h4>
                        <p className="text-xs text-muted-foreground mb-3">Contact support for custom features.</p>
                        <Button size="sm" variant="outline" className="w-full bg-background/50 hover:bg-background">Support</Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:h-screen">
                <div className="container max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
