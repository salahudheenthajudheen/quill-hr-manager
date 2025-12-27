/**
 * Employee Dashboard Component
 * Main dashboard for employee with quick access to all features
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Clock,
    Calendar,
    CheckSquare,
    FileText,
    LogOut,
    MapPin,
    AlertCircle,
    CheckCircle,
    User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, type AttendanceRecord } from '@/services/attendance.service';
import { taskService, type Task } from '@/services/task.service';
import { leaveService, type LeaveRequest } from '@/services/leave.service';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [todayTasks, setTodayTasks] = useState<Task[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState({ annual: 0, sick: 0, casual: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.profileId) return;

            try {
                setLoading(true);

                const [attendance, tasks, leaves, balance] = await Promise.all([
                    attendanceService.getTodayAttendance(user.profileId),
                    taskService.getTodaysTasks(user.profileId),
                    leaveService.getEmployeeLeaves(user.profileId),
                    leaveService.getLeaveBalance(user.profileId),
                ]);

                setTodayAttendance(attendance);
                setTodayTasks(tasks);
                setPendingLeaves(leaves.filter(l => l.status === 'pending'));
                setLeaveBalance(balance);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.profileId, toast]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        toast({
            title: 'Logged out',
            description: 'You have been successfully logged out',
        });
    };

    const getAttendanceStatusBadge = () => {
        if (!todayAttendance) {
            return <Badge variant="secondary">Not Checked In</Badge>;
        }

        const status = todayAttendance.status;
        const colors: Record<string, string> = {
            present: 'bg-success/10 text-success',
            late: 'bg-warning/10 text-warning',
            wfh: 'bg-blue-100 text-blue-800',
            'half-day': 'bg-orange-100 text-orange-800',
        };

        return (
            <Badge className={colors[status] || 'bg-muted'}>
                {todayAttendance.checkOut ? 'Completed' : status.toUpperCase()}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14">
                            <AvatarFallback className="gradient-primary text-white text-lg">
                                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Employee'}</h1>
                            <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                            <div className="text-lg font-semibold">
                                {todayAttendance?.checkIn
                                    ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </div>
                            <div className="text-sm text-muted-foreground">Check-in Time</div>
                            {getAttendanceStatusBadge()}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckSquare className="h-8 w-8 mx-auto text-accent mb-2" />
                            <div className="text-2xl font-bold">{todayTasks.length}</div>
                            <div className="text-sm text-muted-foreground">Today's Tasks</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <Calendar className="h-8 w-8 mx-auto text-warning mb-2" />
                            <div className="text-2xl font-bold">{pendingLeaves.length}</div>
                            <div className="text-sm text-muted-foreground">Pending Leaves</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <FileText className="h-8 w-8 mx-auto text-success mb-2" />
                            <div className="text-2xl font-bold">{leaveBalance.total}</div>
                            <div className="text-sm text-muted-foreground">Leave Balance</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Button
                        onClick={() => navigate('/employee/attendance')}
                        variant="outline"
                        className="h-20 flex-col space-y-2 text-lg"
                    >
                        <MapPin className="h-6 w-6" />
                        <span>Mark Attendance</span>
                    </Button>
                    <Button
                        onClick={() => navigate('/employee/tasks')}
                        variant="outline"
                        className="h-20 flex-col space-y-2 text-lg"
                    >
                        <CheckSquare className="h-6 w-6" />
                        <span>View Tasks</span>
                    </Button>
                    <Button
                        onClick={() => navigate('/employee/leave')}
                        variant="outline"
                        className="h-20 flex-col space-y-2 text-lg"
                    >
                        <Calendar className="h-6 w-6" />
                        <span>Apply Leave</span>
                    </Button>
                    <Button
                        onClick={() => navigate('/employee/reports')}
                        variant="outline"
                        className="h-20 flex-col space-y-2 text-lg"
                    >
                        <FileText className="h-6 w-6" />
                        <span>View Reports</span>
                    </Button>
                </div>

                {/* Today's Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckSquare className="h-5 w-5 mr-2 text-primary" />
                                Today's Tasks
                            </CardTitle>
                            <CardDescription>Tasks due today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todayTasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                                    <p>No tasks due today!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayTasks.slice(0, 5).map(task => (
                                        <div
                                            key={task.$id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-medium">{task.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {task.description}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    task.priority === 'high'
                                                        ? 'bg-red-100 text-red-800'
                                                        : task.priority === 'medium'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                }
                                            >
                                                {task.priority.toUpperCase()}
                                            </Badge>
                                        </div>
                                    ))}
                                    {todayTasks.length > 5 && (
                                        <Button
                                            variant="link"
                                            className="w-full"
                                            onClick={() => navigate('/employee/tasks')}
                                        >
                                            View all {todayTasks.length} tasks →
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Leave Balance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-accent" />
                                Leave Balance
                            </CardTitle>
                            <CardDescription>Your available leave days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="text-2xl font-bold text-blue-600">{leaveBalance.annual}</div>
                                    <div className="text-sm text-muted-foreground">Annual</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                    <div className="text-2xl font-bold text-red-600">{leaveBalance.sick}</div>
                                    <div className="text-sm text-muted-foreground">Sick</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <div className="text-2xl font-bold text-green-600">{leaveBalance.casual}</div>
                                    <div className="text-sm text-muted-foreground">Casual</div>
                                </div>
                            </div>

                            {pendingLeaves.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-medium flex items-center mb-3">
                                        <AlertCircle className="h-4 w-4 mr-2 text-warning" />
                                        Pending Requests
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingLeaves.slice(0, 3).map(leave => (
                                            <div
                                                key={leave.$id}
                                                className="flex items-center justify-between p-2 rounded bg-warning/10"
                                            >
                                                <div>
                                                    <span className="font-medium">{leave.leaveType}</span>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        ({leave.days} days)
                                                    </span>
                                                </div>
                                                <Badge variant="secondary">Pending</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Status Alert */}
                {!todayAttendance && (
                    <Card className="mt-6 border-warning/50 bg-warning/5">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-warning mr-3" />
                                <div>
                                    <p className="font-medium">You haven't marked attendance today</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click the button to mark your attendance
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/employee/attendance')}
                                className="gradient-primary text-white"
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Mark Attendance
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
