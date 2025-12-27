import { useState } from "react";
import { Button } from "@/components/ui/button";
import Home from "@/components/hr/Home";
import MarkAttendance from "@/components/hr/MarkAttendance";
import ViewReport from "@/components/hr/ViewReport";
import ApplyLeave from "@/components/hr/ApplyLeave";
import EmployeeTasks from "@/components/hr/EmployeeTasks";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Building, Users } from "lucide-react";

type Page = "home" | "attendance" | "report" | "leave" | "tasks" | "admin";
type AdminData = { email: string; name: string; role: string } | null;

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [adminData, setAdminData] = useState<AdminData>(null);

  const handleAdminLogin = (data: { email: string; name: string; role: string }) => {
    setAdminData(data);
  };

  const handleAdminLogout = () => {
    setAdminData(null);
    setCurrentPage("home");
  };

  if (currentPage === "admin") {
    if (!adminData) {
      return <AdminLogin onLogin={handleAdminLogin} />;
    } else {
      return <AdminDashboard adminData={adminData} onLogout={handleAdminLogout} />;
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={setCurrentPage} />;
      case "attendance":
        return <MarkAttendance onNavigate={setCurrentPage} />;
      case "report":
        return <ViewReport onNavigate={setCurrentPage} />;
      case "leave":
        return <ApplyLeave onNavigate={setCurrentPage} />;
      case "tasks":
        return <EmployeeTasks onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Access Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={() => setCurrentPage("admin")}
          className="gradient-primary text-white shadow-lg"
          size="sm"
        >
          <Building className="h-4 w-4 mr-2" />
          Admin Panel
        </Button>
      </div>
      
      {renderPage()}
    </div>
  );
};

export default Index;
