/**
 * Admin Management Component
 * Allows admins to create and manage other admin users
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    ArrowLeft,
    UserPlus,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    Shield,
    Mail,
    Calendar
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { adminService, type Admin } from "@/services/admin.service";

interface AdminManagementProps {
    onBack: () => void;
    currentAdminEmail?: string;
}

const AdminManagement = ({ onBack, currentAdminEmail }: AdminManagementProps) => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [newAdmin, setNewAdmin] = useState({
        name: "",
        email: "",
        password: "",
        role: "HR Manager",
    });

    const { toast } = useToast();

    // Fetch admins
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAdmins();
            setAdmins(data.admins);
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to load admins",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (newAdmin.password.length < 8) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 8 characters",
                variant: "destructive",
            });
            return;
        }

        setActionLoading(true);
        try {
            await adminService.createAdmin(newAdmin);
            toast({
                title: "Admin Added",
                description: `${newAdmin.name} has been added as an admin`,
            });
            setShowAddDialog(false);
            setNewAdmin({
                name: "",
                email: "",
                password: "",
                role: "HR Manager",
            });
            fetchAdmins();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to add admin";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAdmin = async () => {
        if (!selectedAdmin) return;

        // Prevent deleting yourself
        if (selectedAdmin.email === currentAdminEmail) {
            toast({
                title: "Cannot Delete",
                description: "You cannot delete your own admin account",
                variant: "destructive",
            });
            setShowDeleteDialog(false);
            return;
        }

        setActionLoading(true);
        try {
            await adminService.deleteAdmin(selectedAdmin.$id);
            toast({
                title: "Admin Removed",
                description: `${selectedAdmin.name} has been removed`,
            });
            setShowDeleteDialog(false);
            setSelectedAdmin(null);
            fetchAdmins();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to remove admin";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading admins...</p>
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
                        <h1 className="text-3xl font-bold">Admin Management</h1>
                        <p className="text-muted-foreground">Manage administrator accounts</p>
                    </div>
                </div>
                <Button className="gradient-primary text-white" onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                </Button>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{admins.length}</div>
                        <div className="text-sm text-muted-foreground">Total Admins</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Shield className="h-6 w-6 mx-auto text-primary mb-1" />
                        <div className="text-sm text-muted-foreground">Full Access</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-sm font-medium text-muted-foreground">
                            All admins have full HR management access
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin List */}
            <Card>
                <CardHeader>
                    <CardTitle>Administrator Accounts</CardTitle>
                    <CardDescription>
                        {admins.length} administrator{admins.length !== 1 ? 's' : ''} with access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {admins.map((admin) => (
                            <div key={admin.$id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="gradient-primary text-white">
                                            {admin.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold">{admin.name}</h3>
                                            <Badge variant="secondary" className="text-xs">
                                                <Shield className="h-3 w-3 mr-1" />
                                                {admin.role}
                                            </Badge>
                                            {admin.email === currentAdminEmail && (
                                                <Badge className="bg-primary/10 text-primary border-primary/20">You</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <div className="flex items-center">
                                                <Mail className="h-3 w-3 mr-1" />
                                                {admin.email}
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                Added {new Date(admin.$createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {admin.email !== currentAdminEmail && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setSelectedAdmin(admin);
                                            setShowDeleteDialog(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        {admins.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No admins found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Admin Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Admin</DialogTitle>
                        <DialogDescription>
                            Create a new administrator account with full access
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="admin@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
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
                            <Label htmlFor="role">Role</Label>
                            <Input
                                id="role"
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value }))}
                                placeholder="HR Manager"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddAdmin} disabled={actionLoading} className="gradient-primary text-white">
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Add Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Admin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {selectedAdmin?.name}'s admin access.
                            They will no longer be able to log in to the admin panel.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive text-destructive-foreground">
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Remove Admin
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminManagement;
