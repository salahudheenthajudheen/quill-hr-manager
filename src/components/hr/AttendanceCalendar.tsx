import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Coffee, Heart, Baby, User } from "lucide-react";
import "react-calendar/dist/Calendar.css";

interface AttendanceCalendarProps {
  employeeId: string;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface AttendanceData {
  [key: string]: {
    status: "present" | "absent" | "holiday" | "leave";
    leaveType?: "Annual" | "Casual" | "Sick" | "Optional" | "Maternity" | "Parent";
    hours?: number;
  };
}

const AttendanceCalendar = ({ employeeId }: AttendanceCalendarProps) => {
  const [value, setValue] = useState<Value>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});

  useEffect(() => {
    // Generate sample attendance data
    const generateSampleData = () => {
      const data: AttendanceData = {};
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Generate data for current month
      for (let day = 1; day <= 31; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date.getMonth() === currentMonth) {
          const dateKey = date.toISOString().split('T')[0];
          
          // Simulate different attendance statuses
          const random = Math.random();
          if (date.getDay() === 0 || date.getDay() === 6) {
            // Weekends
            data[dateKey] = { status: "holiday" };
          } else if (random < 0.1) {
            // 10% chance of leave
            const leaveTypes: Array<"Annual" | "Casual" | "Sick" | "Optional" | "Maternity" | "Parent"> = 
              ["Annual", "Casual", "Sick", "Optional", "Maternity", "Parent"];
            data[dateKey] = { 
              status: "leave", 
              leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)]
            };
          } else if (random < 0.15) {
            // 5% chance of absence
            data[dateKey] = { status: "absent" };
          } else if (date <= currentDate) {
            // Present for past dates
            data[dateKey] = { 
              status: "present", 
              hours: 8 + Math.random() * 2 // 8-10 hours
            };
          }

          // Add some company holidays
          if (day === 15) {
            data[dateKey] = { status: "holiday" };
          }
        }
      }

      setAttendanceData(data);
    };

    generateSampleData();
  }, [employeeId]);

  const getTileClassName = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split('T')[0];
    const attendance = attendanceData[dateKey];
    
    if (!attendance) return "";
    
    switch (attendance.status) {
      case "present":
        return "bg-success/20 text-success-foreground";
      case "absent":
        return "bg-destructive/20 text-destructive-foreground";
      case "holiday":
        return "bg-muted text-muted-foreground";
      case "leave":
        return "bg-warning/20 text-warning-foreground";
      default:
        return "";
    }
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split('T')[0];
    const attendance = attendanceData[dateKey];
    
    if (!attendance) return null;
    
    return (
      <div className="text-xs mt-1">
        {attendance.status === "present" && "✓"}
        {attendance.status === "absent" && "✗"}
        {attendance.status === "holiday" && "🏢"}
        {attendance.status === "leave" && "📅"}
      </div>
    );
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType) {
      case "Annual": return <CalendarIcon className="h-4 w-4" />;
      case "Casual": return <Coffee className="h-4 w-4" />;
      case "Sick": return <Heart className="h-4 w-4" />;
      case "Optional": return <Clock className="h-4 w-4" />;
      case "Maternity": return <Baby className="h-4 w-4" />;
      case "Parent": return <User className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case "Annual": return "bg-blue-100 text-blue-800";
      case "Casual": return "bg-green-100 text-green-800";
      case "Sick": return "bg-red-100 text-red-800";
      case "Optional": return "bg-purple-100 text-purple-800";
      case "Maternity": return "bg-pink-100 text-pink-800";
      case "Parent": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const currentMonthStats = Object.values(attendanceData).reduce(
    (stats, day) => {
      if (day.status === "present") stats.present++;
      else if (day.status === "absent") stats.absent++;
      else if (day.status === "leave") stats.leave++;
      else if (day.status === "holiday") stats.holidays++;
      return stats;
    },
    { present: 0, absent: 0, leave: 0, holidays: 0 }
  );

  const leaveBreakdown = Object.values(attendanceData)
    .filter(day => day.status === "leave" && day.leaveType)
    .reduce((breakdown, day) => {
      const type = day.leaveType!;
      breakdown[type] = (breakdown[type] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{currentMonthStats.present}</div>
            <div className="text-sm text-muted-foreground">Present Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{currentMonthStats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{currentMonthStats.leave}</div>
            <div className="text-sm text-muted-foreground">Leave Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{currentMonthStats.holidays}</div>
            <div className="text-sm text-muted-foreground">Holidays</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Attendance Calendar
          </CardTitle>
          <CardDescription>
            View your monthly attendance record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              onChange={setValue}
              value={value}
              tileClassName={getTileClassName}
              tileContent={getTileContent}
              className="react-calendar border-0 w-full max-w-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leave Breakdown */}
      {Object.keys(leaveBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Breakdown</CardTitle>
            <CardDescription>
              Types of leaves taken this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(leaveBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Badge variant="secondary" className={`${getLeaveTypeColor(type)} border-0`}>
                    {getLeaveTypeIcon(type)}
                    <span className="ml-1">{type}</span>
                  </Badge>
                  <span className="text-sm font-medium">{count} days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-success/20 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-destructive/20 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-warning/20 rounded"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <span>Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendar;