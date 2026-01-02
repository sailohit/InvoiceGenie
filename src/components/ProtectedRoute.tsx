import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    requireAdmin?: boolean;
}

const ProtectedRoute = ({ requireAdmin }: ProtectedRouteProps) => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user?.role !== 'admin') {
        // Redirect non-admins trying to access admin routes to the main app page or a 'forbidden' page
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
