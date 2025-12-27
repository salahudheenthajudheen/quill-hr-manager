/**
 * Admin Employees Component
 * Employee management with Appwrite integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { employeeService, type Employee, type CreateEmployeeData } from "@/services/employee.service";

interface AdminEmployeesProps {
  onBack: () => void;
}

const AdminEmployees = ({ onBack }: AdminEmployeesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, onLeave: 0 });

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    position: "",
    joinDate: new Date().toISOString().split('T')[0],
    location: "",
    employeeId: "",
  });
  const [generatingId, setGeneratingId] = useState(false);

  const { toast } = useToast();

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [employeesData, statsData] = await Promise.all([
        employeeService.getEmployees({ limit: 100 }),
        employeeService.getEmployeeStats(),
      ]);
      setEmployees(employeesData.employees);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success border-success/20";
      case "inactive": return "bg-destructive/10 text-destructive border-destructive/20";
      case "on-leave": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password || !newEmployee.phone || !newEmployee.department || !newEmployee.position) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields including password",
        variant: "destructive",
      });
      return;
    }

    if (newEmployee.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await employeeService.createEmployee(newEmployee);
      toast({
        title: "Employee Added",
        description: `${newEmployee.name} has been added with login credentials`,
      });
      setShowAddDialog(false);
      setNewEmployee({
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        position: "",
        joinDate: new Date().toISOString().split('T')[0],
        location: "",
        employeeId: "",
      });
      fetchEmployees();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add employee";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    setActionLoading(true);
    try {
      await employeeService.updateEmployee(selectedEmployee.$id, {
        name: selectedEmployee.name,
        phone: selectedEmployee.phone,
        department: selectedEmployee.department,
        position: selectedEmployee.position,
        status: selectedEmployee.status,
        location: selectedEmployee.location,
      });
      toast({
        title: "Employee Updated",
        description: `${selectedEmployee.name}'s information has been updated`,
      });
      setShowEditDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update employee";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setActionLoading(true);
    try {
      await employeeService.deactivateEmployee(selectedEmployee.$id);
      toast({
        title: "Employee Removed",
        description: `${selectedEmployee.name} has been deactivated`,
      });
      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove employee";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Employee ID", "Name", "Email", "Phone", "Department", "Position", "Status", "Join Date", "Location"];
    const rows = filteredEmployees.map(emp => [
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: "Export Successful", description: "Employee data exported to CSV" });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">Manage your organization's workforce</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="gradient-primary text-white" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Employees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{stats.onLeave}</div>
            <div className="text-sm text-muted-foreground">On Leave</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.inactive}</div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            {filteredEmployees.length} of {employees.length} employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.$id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="gradient-primary text-white">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{employee.name}</h3>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {employee.employeeId || employee.$id.substring(0, 8)}
                      </Badge>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {employee.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {employee.phone}
                      </div>
                      {employee.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {employee.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-medium">{employee.position}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{employee.department}</span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {new Date(employee.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedEmployee(employee);
                      setShowEditDialog(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Employee
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account with login credentials
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">GW-</span>
                  <Input
                    id="employeeId"
                    value={newEmployee.employeeId.replace('GW-', '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setNewEmployee(prev => ({ ...prev, employeeId: value ? `GW-${value}` : '' }));
                    }}
                    placeholder="001234"
                    className="pl-12 font-mono"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={generatingId}
                  onClick={async () => {
                    setGeneratingId(true);
                    try {
                      const id = await employeeService.generateEmployeeId();
                      setNewEmployee(prev => ({ ...prev, employeeId: id }));
                    } catch (e) {
                      console.error('Failed to generate ID:', e);
                    } finally {
                      setGeneratingId(false);
                    }
                  }}
                  title="Auto-generate ID"
                >
                  {generatingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={newEmployee.joinDate}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, joinDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newEmployee.location}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                placeholder="New York, NY"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} disabled={actionLoading} className="gradient-primary text-white">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={selectedEmployee.name}
                  onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={selectedEmployee.phone}
                  onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={selectedEmployee.department}
                  onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, department: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPosition">Position</Label>
                <Input
                  id="editPosition"
                  value={selectedEmployee.position}
                  onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, position: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={selectedEmployee.status}
                  onValueChange={(value: "active" | "inactive" | "on-leave") =>
                    setSelectedEmployee(prev => prev ? { ...prev, status: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={selectedEmployee.location}
                  onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, location: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} disabled={actionLoading} className="gradient-primary text-white">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {selectedEmployee?.name}'s account. They will no longer be able to log in.
              This action can be undone by reactivating the account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEmployees;