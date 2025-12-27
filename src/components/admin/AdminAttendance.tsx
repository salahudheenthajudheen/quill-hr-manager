/**
 * Admin Attendance Component
 * Attendance management with Appwrite integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Search,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  CalendarIcon,
  MapPin,
  Loader2,
  Home,
  Building2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { attendanceService, type AttendanceRecord } from "@/services/attendance.service";

interface AdminAttendanceProps {
  onBack: () => void;
}

const AdminAttendance = ({ onBack }: AdminAttendanceProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    wfh: 0,
    total: 0,
  });
  const { toast } = useToast();

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const [records, statsData] = await Promise.all([
        attendanceService.getAttendanceByDate(dateStr),
        attendanceService.getAttendanceStats(dateStr),
      ]);

      setAttendanceRecords(records);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-success/10 text-success border-success/20";
      case "late": return "bg-warning/10 text-warning border-warning/20";
      case "half-day": return "bg-orange-100 text-orange-800 border-orange-200";
      case "absent": return "bg-destructive/10 text-destructive border-destructive/20";
      case "wfh": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "--:--";
    try {
      return new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "--:--";
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Employee ID", "Employee Name", "Date", "Check In", "Check Out", "Status", "Type", "Working Hours"];
    const rows = filteredRecords.map(record => [
      record.employeeId,
      record.employeeName,
      record.date,
      formatTime(record.checkIn),
      formatTime(record.checkOut),
      record.status,
      record.attendanceType,
      record.workingHours?.toFixed(1) || "0"
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Export Successful",
      description: "Attendance data exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading attendance...</p>
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
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Track and manage employee attendance</p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold text-success">{stats.present}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold text-warning">{stats.late}</div>
            <div className="text-sm text-muted-foreground">Late</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Home className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.wfh}</div>
            <div className="text-sm text-muted-foreground">WFH</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-orange-600">{stats.halfDay}</div>
            <div className="text-sm text-muted-foreground">Half Day</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-destructive mb-2" />
            <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[180px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="wfh">WFH</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {filteredRecords.length} records for {format(selectedDate, "MMMM dd, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No attendance records found</p>
              <p className="text-sm">Try selecting a different date or adjusting filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.$id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="gradient-primary text-white text-sm">
                        {record.employeeName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{record.employeeName}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {record.employeeId.substring(0, 8)}
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          In: {formatTime(record.checkIn)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Out: {formatTime(record.checkOut)}
                        </div>
                        <div className="flex items-center">
                          {record.attendanceType === 'wfh' ? (
                            <Home className="h-3 w-3 mr-1" />
                          ) : (
                            <Building2 className="h-3 w-3 mr-1" />
                          )}
                          {record.attendanceType === 'wfh' ? 'Work From Home' : 'Office'}
                        </div>
                        {record.workingHours && (
                          <div className="text-primary font-medium">
                            {record.workingHours.toFixed(1)}h worked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {record.checkInLocation && (
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {typeof record.checkInLocation === 'object'
                          ? `${record.checkInLocation.lat.toFixed(4)}, ${record.checkInLocation.lng.toFixed(4)}`
                          : record.checkInLocation
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAttendance;