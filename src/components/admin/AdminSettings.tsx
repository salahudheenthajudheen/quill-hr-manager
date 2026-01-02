/**
 * Admin Settings Component
 * Settings page with export functionality
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Download,
    FileSpreadsheet,
    Users,
    Clock,
    Calendar,
    CheckSquare,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employeeService } from "@/services/employee.service";
import { attendanceService } from "@/services/attendance.service";
import { leaveService } from "@/services/leave.service";
import { taskService } from "@/services/task.service";

interface AdminSettingsProps {
    onBack: () => void;
}

const AdminSettings = ({ onBack }: AdminSettingsProps) => {
    const [exporting, setExporting] = useState<string | null>(null);
    const { toast } = useToast();

    const downloadCSV = (filename: string, csvContent: string) => {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExportEmployees = async () => {
        setExporting("employees");
        try {
            const { employees } = await employeeService.getEmployees({ limit: 1000 });

            const headers = ["Employee ID", "Name", "Email", "Phone", "Department", "Position", "Status", "Join Date", "Location"];
            const rows = employees.map(emp => [
                emp.employeeId || emp.$id.substring(0, 8),
                emp.name,
                emp.email,
                emp.phone,
                emp.department,
                emp.position,
                emp.status,
                emp.joinDate,
                emp.location || ""
            ]);

            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
            downloadCSV(`employees_${new Date().toISOString().split('T')[0]}.csv`, csvContent);

            toast({ title: "Export Successful", description: `Exported ${employees.length} employees to CSV` });
        } catch (error) {
            console.error("Export employees error:", error);
            toast({ title: "Export Failed", description: "Failed to export employee data", variant: "destructive" });
        } finally {
            setExporting(null);
        }
    };

    const handleExportAttendance = async () => {
        setExporting("attendance");
        try {
            const { records } = await attendanceService.getAttendance({ limit: 1000 });

            const headers = ["Date", "Employee Name", "Check In", "Check Out", "Status", "Type", "Work Hours"];
            const rows = records.map(rec => [
                rec.date,
                rec.employeeName,
                rec.checkIn || "",
                rec.checkOut || "",
                rec.status,
                rec.attendanceType || "",
                rec.workingHours?.toFixed(2) || ""
            ]);

            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
            downloadCSV(`attendance_${new Date().toISOString().split('T')[0]}.csv`, csvContent);

            toast({ title: "Export Successful", description: `Exported ${records.length} attendance records to CSV` });
        } catch (error) {
            console.error("Export attendance error:", error);
            toast({ title: "Export Failed", description: "Failed to export attendance data", variant: "destructive" });
        } finally {
            setExporting(null);
        }
    };

    const handleExportLeaveRequests = async () => {
        setExporting("leave");
        try {
            const { requests } = await leaveService.getLeaveRequests({ limit: 1000 });

            const headers = ["Employee Name", "Leave Type", "From Date", "To Date", "Days", "Status", "Subject", "Applied Date"];
            const rows = requests.map(req => [
                req.employeeName,
                req.leaveType,
                req.fromDate,
                req.toDate,
                req.days?.toString() || "",
                req.status,
                req.subject || "",
                req.appliedDate || ""
            ]);

            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
            downloadCSV(`leave_requests_${new Date().toISOString().split('T')[0]}.csv`, csvContent);

            toast({ title: "Export Successful", description: `Exported ${requests.length} leave requests to CSV` });
        } catch (error) {
            console.error("Export leave requests error:", error);
            toast({ title: "Export Failed", description: "Failed to export leave data", variant: "destructive" });
        } finally {
            setExporting(null);
        }
    };

    const handleExportTasks = async () => {
        setExporting("tasks");
        try {
            const { tasks } = await taskService.getTasks({ limit: 1000 });

            const headers = ["Title", "Employee", "Priority", "Status", "Due Date", "Assigned Date", "Description"];
            const rows = tasks.map(task => [
                task.title,
                task.employeeName,
                task.priority,
                task.status,
                task.dueDate,
                task.assignedDate,
                task.description || ""
            ]);

            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
            downloadCSV(`tasks_${new Date().toISOString().split('T')[0]}.csv`, csvContent);

            toast({ title: "Export Successful", description: `Exported ${tasks.length} tasks to CSV` });
        } catch (error) {
            console.error("Export tasks error:", error);
            toast({ title: "Export Failed", description: "Failed to export task data", variant: "destructive" });
        } finally {
            setExporting(null);
        }
    };

    const exportOptions = [
        {
            id: "employees",
            title: "Export Employees",
            description: "Download all employee data including contact info, department, and status",
            icon: Users,
            onClick: handleExportEmployees,
            color: "text-primary"
        },
        {
            id: "attendance",
            title: "Export Attendance",
            description: "Download attendance records with check-in/out times and work hours",
            icon: Clock,
            onClick: handleExportAttendance,
            color: "text-success"
        },
        {
            id: "leave",
            title: "Export Leave Requests",
            description: "Download all leave requests with approval status and dates",
            icon: Calendar,
            onClick: handleExportLeaveRequests,
            color: "text-warning"
        },
        {
            id: "tasks",
            title: "Export Tasks",
            description: "Download task assignments with priority, status, and due dates",
            icon: CheckSquare,
            onClick: handleExportTasks,
            color: "text-accent"
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage exports and application settings</p>
                </div>
            </div>

            {/* Export Data Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 mr-2" />
                        Export Data
                    </CardTitle>
                    <CardDescription>
                        Download your HR data in CSV format for reporting and analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exportOptions.map((option) => (
                            <Card key={option.id} className="border-2 hover:border-primary/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg bg-muted ${option.color}`}>
                                                <option.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{option.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-4"
                                        variant="outline"
                                        onClick={option.onClick}
                                        disabled={exporting !== null}
                                    >
                                        {exporting === option.id ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Exporting...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Download CSV
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Export All Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Export</CardTitle>
                    <CardDescription>
                        Export all data at once for complete backup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        className="gradient-primary text-white"
                        onClick={async () => {
                            await handleExportEmployees();
                            await handleExportAttendance();
                            await handleExportLeaveRequests();
                            await handleExportTasks();
                        }}
                        disabled={exporting !== null}
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Exporting All Data...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Export All Data
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettings;
