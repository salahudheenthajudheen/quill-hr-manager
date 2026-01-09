/**
 * Admin Employees Component
 * Allows admin to create new employees with custom ID generator
 * ID Format: XX-0000 (2-letter prefix + 4-digit number)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    UserPlus,
    Loader2,
    RefreshCw,
    Users,
    Mail,
    Phone,
    Building,
    Briefcase,
    Calendar,
    Key,
    Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employeeService, type Employee } from "@/services/employee.service";

interface AdminEmployeesProps {
    onBack: () => void;
}

const AdminEmployees = ({ onBack }: AdminEmployeesProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        prefix: "",
        number: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        position: "",
        joinDate: new Date().toISOString().split('T')[0],
    });

    // Load employees on mount
    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const result = await employeeService.getEmployees({ limit: 100 });
            setEmployees(result.employees);
        } catch (error) {
            console.error('Failed to load employees:', error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    // Generate employee ID from prefix and number
    const generateEmployeeId = (): string => {
        const prefix = formData.prefix.toUpperCase().slice(0, 2);
        const num = formData.number.padStart(4, '0').slice(0, 4);
        return `${prefix}-${num}`;
    };

    // Auto-generate next available number for a prefix
    const suggestNextNumber = () => {
        const prefix = formData.prefix.toUpperCase().slice(0, 2);
        if (prefix.length !== 2) {
            toast({
                title: "Enter Prefix First",
                description: "Please enter a 2-letter prefix first",
                variant: "destructive",
            });
            return;
        }

        // Find highest number for this prefix
        let maxNumber = 0;
        for (const emp of employees) {
            if (emp.employeeId && emp.employeeId.startsWith(`${prefix}-`)) {
                const match = emp.employeeId.match(/^[A-Z]{2}-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        }

        const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
        setFormData(prev => ({ ...prev, number: nextNumber }));
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'prefix') {
            // Only allow letters, max 2 characters
            value = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
        } else if (field === 'number') {
            // Only allow numbers, max 4 digits
            value = value.replace(/[^0-9]/g, '').slice(0, 4);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (formData.prefix.length !== 2) {
            toast({ title: "Invalid Prefix", description: "Prefix must be exactly 2 letters", variant: "destructive" });
            return false;
        }
        if (formData.number.length === 0 || formData.number.length > 4) {
            toast({ title: "Invalid Number", description: "Number must be 1-4 digits", variant: "destructive" });
            return false;
        }
        if (!formData.name.trim()) {
            toast({ title: "Name Required", description: "Please enter employee name", variant: "destructive" });
            return false;
        }
        if (!formData.email.includes('@')) {
            toast({ title: "Invalid Email", description: "Please enter a valid email", variant: "destructive" });
            return false;
        }
        if (formData.password.length < 8) {
            toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
            return false;
        }
        if (!formData.phone.trim()) {
            toast({ title: "Phone Required", description: "Please enter phone number", variant: "destructive" });
            return false;
        }
        if (!formData.department.trim()) {
            toast({ title: "Department Required", description: "Please enter department", variant: "destructive" });
            return false;
        }
        if (!formData.position.trim()) {
            toast({ title: "Position Required", description: "Please enter position", variant: "destructive" });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const employeeId = generateEmployeeId();

            await employeeService.createEmployee({
                employeeId,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                department: formData.department,
                position: formData.position,
                joinDate: formData.joinDate,
            });

            toast({
                title: "Employee Created",
                description: `${formData.name} (${employeeId}) has been created successfully!`,
            });

            // Reset form
            setFormData({
                prefix: formData.prefix, // Keep prefix for convenience
                number: "",
                name: "",
                email: "",
                password: "",
                phone: "",
                department: "",
                position: "",
                joinDate: new Date().toISOString().split('T')[0],
            });

            // Reload employees
            loadEmployees();

        } catch (error: unknown) {
            const err = error as { message?: string };
            toast({
                title: "Creation Failed",
                description: err.message || "Failed to create employee",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create Employee</h1>
                    <p className="text-muted-foreground">Add a new employee with login credentials</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Employee Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <UserPlus className="h-5 w-5 mr-2" />
                            New Employee
                        </CardTitle>
                        <CardDescription>
                            Fill in the details to create a new employee account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Employee ID Generator */}
                            <div className="p-4 border rounded-lg bg-muted/30">
                                <Label className="text-base font-semibold flex items-center mb-3">
                                    <Hash className="h-4 w-4 mr-2" />
                                    Employee ID Generator
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Prefix (2 letters)</Label>
                                        <Input
                                            value={formData.prefix}
                                            onChange={(e) => handleInputChange('prefix', e.target.value)}
                                            placeholder="AB"
                                            className="text-lg font-mono uppercase"
                                            maxLength={2}
                                        />
                                    </div>
                                    <span className="text-2xl font-bold text-muted-foreground pt-5">-</span>
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Number (4 digits)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={formData.number}
                                                onChange={(e) => handleInputChange('number', e.target.value)}
                                                placeholder="0001"
                                                className="text-lg font-mono"
                                                maxLength={4}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={suggestNextNumber}
                                                title="Auto-generate next number"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {formData.prefix.length === 2 && formData.number && (
                                    <div className="mt-3 text-center">
                                        <Badge variant="secondary" className="text-lg px-4 py-1 font-mono">
                                            {generateEmployeeId()}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Users className="h-4 w-4 mr-2" />
                                        Full Name *
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email *
                                    </Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Key className="h-4 w-4 mr-2" />
                                        Password *
                                    </Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Min 8 characters"
                                    />
                                </div>
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Phone *
                                    </Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 1234567890"
                                    />
                                </div>
                            </div>

                            {/* Work Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Building className="h-4 w-4 mr-2" />
                                        Department *
                                    </Label>
                                    <Input
                                        value={formData.department}
                                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                        placeholder="Engineering"
                                    />
                                </div>
                                <div>
                                    <Label className="flex items-center mb-2">
                                        <Briefcase className="h-4 w-4 mr-2" />
                                        Position *
                                    </Label>
                                    <Input
                                        value={formData.position}
                                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                        placeholder="Software Developer"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="flex items-center mb-2">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Join Date
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.joinDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full gradient-primary text-white"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating Employee...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create Employee
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Existing Employees */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-base">
                            <Users className="h-5 w-5 mr-2" />
                            Existing Employees
                        </CardTitle>
                        <CardDescription>
                            {employees.length} employee(s) registered
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingEmployees ? (
                            <div className="text-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </div>
                        ) : employees.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No employees yet
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {employees.map((emp) => (
                                    <div
                                        key={emp.$id}
                                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.department}</p>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {emp.employeeId || 'N/A'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminEmployees;
