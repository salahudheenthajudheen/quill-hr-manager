/**
 * Employee Dashboard Component
 * Main dashboard for employee - Attendance Only
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Clock,
    LogOut,
    MapPin,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, type AttendanceRecord } from '@/services/attendance.service';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.profileId) return;

            try {
                setLoading(true);

                const attendance = await attendanceService.getTodayAttendance(user.profileId);
                setTodayAttendance(attendance);
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

                {/* Attendance Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
                            <div className="text-2xl font-semibold mb-2">
                                {todayAttendance?.checkIn
                                    ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </div>
                            <div className="text-muted-foreground mb-2">Check-in Time</div>
                            {getAttendanceStatusBadge()}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <Clock className="h-12 w-12 mx-auto text-accent mb-4" />
                            <div className="text-2xl font-semibold mb-2">
                                {todayAttendance?.checkOut
                                    ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </div>
                            <div className="text-muted-foreground mb-2">Check-out Time</div>
                            {todayAttendance?.checkOut ? (
                                <Badge className="bg-success/10 text-success">Completed</Badge>
                            ) : (
                                <Badge variant="secondary">Pending</Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Action */}
                <div className="mb-8">
                    <Button
                        onClick={() => navigate('/employee/attendance')}
                        variant="outline"
                        className="w-full h-20 flex-col space-y-2 text-lg"
                    >
                        <MapPin className="h-8 w-8" />
                        <span>Mark Attendance</span>
                    </Button>
                </div>

                {/* Attendance Status Alert */}
                {!todayAttendance && (
                    <Card className="border-warning/50 bg-warning/5">
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
