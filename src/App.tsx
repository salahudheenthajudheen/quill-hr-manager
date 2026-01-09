import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, EmployeeRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";

// Employee Components
import EmployeeSignIn from "@/components/hr/EmployeeSignIn";
import EmployeeDashboard from "@/components/hr/EmployeeDashboard";
import MarkAttendance from "@/components/hr/MarkAttendance";

// Admin Components
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for employee pages that need navigation prop
interface EmployeePageWrapperProps {
  Component: React.ComponentType<{ onNavigate: (page: string) => void }>;
}

const EmployeePageWrapper = ({ Component }: EmployeePageWrapperProps) => {
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    switch (page) {
      case "home":
        navigate("/employee/dashboard");
        break;
      case "attendance":
        navigate("/employee/attendance");
        break;
      default:
        navigate("/employee/dashboard");
    }
  };

  return <Component onNavigate={handleNavigate} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Employee Authentication */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <EmployeeSignIn />
                </PublicOnlyRoute>
              }
            />

            {/* Admin Authentication */}
            <Route
              path="/admin/login"
              element={
                <PublicOnlyRoute>
                  <AdminLogin />
                </PublicOnlyRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <EmployeeRoute>
                  <EmployeeDashboard />
                </EmployeeRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <EmployeeRoute>
                  <EmployeePageWrapper Component={MarkAttendance} />
                </EmployeeRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardWithAuth />
                </AdminRoute>
              }
            />

            {/* Legacy route redirects */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Wrapper for AdminDashboard to inject auth data
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboardWithAuth = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const adminData = {
    email: user?.email || "",
    name: user?.name || "Admin",
    role: "HR Manager",
  };

  return <AdminDashboard adminData={adminData} onLogout={handleLogout} />;
};

export default App;
