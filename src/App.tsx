import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminCustomers from "./pages/AdminCustomers";
import AdminData from "./pages/AdminData";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes (Wrapped in Layout) */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/app/generate" replace />} />
                <Route path="generate" element={<Index />} />

                {/* Admin Only Routes */}
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="data" element={<AdminData />} />
                </Route>
              </Route>
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
