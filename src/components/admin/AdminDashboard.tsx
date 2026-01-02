import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Calendar,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  CalendarCheck,
  CalendarX,
  Loader2,
  Shield
} from "lucide-react";
import AdminEmployees from "./AdminEmployees";
import AdminAttendance from "./AdminAttendance";
import AdminLeaveRequests from "./AdminLeaveRequests";
import AdminTasks from "./AdminTasks";
import AdminManagement from "./AdminManagement";
import AdminSettings from "./AdminSettings";
import { employeeService } from "@/services/employee.service";
import { attendanceService } from "@/services/attendance.service";
import { taskService } from "@/services/task.service";
import { leaveService } from "@/services/leave.service";

interface AdminDashboardProps {
  adminData: { email: string; name: string; role: string };
  onLogout: () => void;
}

type AdminPage = "dashboard" | "employees" | "attendance" | "leave" | "tasks" | "admins" | "settings";

const AdminDashboard = ({ adminData, onLogout }: AdminDashboardProps) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    completedTasks: 0,
    pendingTasks: 0,
    onLeaveToday: 0,
    lateArrivals: 0
  });

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (currentPage !== "dashboard") return;

      try {
        setLoading(true);
        const [employeeStats, attendanceStats, taskStats, leaveStats, employeesOnLeave] = await Promise.all([
          employeeService.getEmployeeStats(),
          attendanceService.getAttendanceStats(),
          taskService.getTaskStats(),
          leaveService.getLeaveStats(),
          leaveService.getEmployeesOnLeaveToday(),
        ]);

        setDashboardStats({
          totalEmployees: employeeStats.total,
          presentToday: attendanceStats.present + attendanceStats.wfh,
          absentToday: employeeStats.active - (attendanceStats.present + attendanceStats.wfh + attendanceStats.late),
          pendingLeaves: leaveStats.pending,
          completedTasks: taskStats.completed + taskStats.accepted,
          pendingTasks: taskStats.pending + taskStats.inProgress,
          onLeaveToday: employeesOnLeave.length,
          lateArrivals: attendanceStats.late,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentPage]);

  const recentActivities = [
    { id: 1, type: "info", message: "Dashboard connected to Appwrite", time: "Just now", status: "success" },
    { id: 2, type: "info", message: "Real-time statistics enabled", time: "Just now", status: "success" },
  ];

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "leave", label: "Leave Requests", icon: Calendar },
    { id: "tasks", label: "Task Management", icon: CheckSquare },
    { id: "admins", label: "Admin Management", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case "employees":
        return <AdminEmployees onBack={() => setCurrentPage("dashboard")} />;
      case "attendance":
        return <AdminAttendance onBack={() => setCurrentPage("dashboard")} />;
      case "leave":
        return <AdminLeaveRequests onBack={() => setCurrentPage("dashboard")} />;
      case "tasks":
        return <AdminTasks onBack={() => setCurrentPage("dashboard")} />;
      case "admins":
        return <AdminManagement onBack={() => setCurrentPage("dashboard")} currentAdminEmail={adminData.email} />;
      case "settings":
        return <AdminSettings onBack={() => setCurrentPage("dashboard")} />;
      default:
        return (
          <div className="p-6 space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {adminData.name}</h1>
                <p className="text-muted-foreground">{adminData.role} • {adminData.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Present Today</p>
                      <p className="text-2xl font-bold text-success">{dashboardStats.presentToday}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Absent Today</p>
                      <p className="text-2xl font-bold text-destructive">{dashboardStats.absentToday}</p>
                    </div>
                    <UserX className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Leaves</p>
                      <p className="text-2xl font-bold text-warning">{dashboardStats.pendingLeaves}</p>
                    </div>
                    <CalendarX className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <CalendarCheck className="h-6 w-6 mx-auto text-accent mb-2" />
                  <div className="text-lg font-semibold">{dashboardStats.onLeaveToday}</div>
                  <div className="text-sm text-muted-foreground">On Leave Today</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto text-warning mb-2" />
                  <div className="text-lg font-semibold">{dashboardStats.lateArrivals}</div>
                  <div className="text-sm text-muted-foreground">Late Arrivals</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckSquare className="h-6 w-6 mx-auto text-success mb-2" />
                  <div className="text-lg font-semibold">{dashboardStats.completedTasks}</div>
                  <div className="text-sm text-muted-foreground">Completed Tasks</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                  <div className="text-lg font-semibold">{dashboardStats.pendingTasks}</div>
                  <div className="text-sm text-muted-foreground">Pending Tasks</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest updates from your HR system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-success' :
                          activity.status === 'warning' ? 'bg-warning' :
                            'bg-primary'
                          }`} />
                        <span className="text-sm">{activity.message}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          activity.status === 'success' ? 'default' :
                            activity.status === 'warning' ? 'destructive' :
                              'secondary'
                        }>
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => setCurrentPage("employees")}
                variant="outline"
                className="h-16 flex-col space-y-2"
              >
                <Users className="h-6 w-6" />
                <span>Manage Employees</span>
              </Button>
              <Button
                onClick={() => setCurrentPage("attendance")}
                variant="outline"
                className="h-16 flex-col space-y-2"
              >
                <Clock className="h-6 w-6" />
                <span>View Attendance</span>
              </Button>
              <Button
                onClick={() => setCurrentPage("leave")}
                variant="outline"
                className="h-16 flex-col space-y-2"
              >
                <Calendar className="h-6 w-6" />
                <span>Leave Requests</span>
              </Button>
              <Button
                onClick={() => setCurrentPage("tasks")}
                variant="outline"
                className="h-16 flex-col space-y-2"
              >
                <CheckSquare className="h-6 w-6" />
                <span>Assign Tasks</span>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold">HR Admin</h2>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${currentPage === item.id ? 'gradient-primary text-white' : ''}`}
              onClick={() => setCurrentPage(item.id as AdminPage)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;