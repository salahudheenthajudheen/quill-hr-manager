/**
 * Apply Leave Component
 * Leave application for employees with Appwrite integration
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  FileUp,
  Loader2,
  CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { leaveService, type ApplyLeaveData } from "@/services/leave.service";
import { employeeService, type Employee, type LeaveBalance } from "@/services/employee.service";

interface ApplyLeaveProps {
  onNavigate?: (page: "home" | "attendance" | "report" | "leave" | "tasks") => void;
}

const leaveTypes = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

const ApplyLeave = ({ onNavigate }: ApplyLeaveProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [leaveData, setLeaveData] = useState<{
    leaveType: string;
    subject: string;
    description: string;
    fromDate: Date | undefined;
    toDate: Date | undefined;
  }>({
    leaveType: "",
    subject: "",
    description: "",
    fromDate: undefined,
    toDate: undefined,
  });

  // Fetch employee data and leave balance
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.profileId) return;

      try {
        setLoading(true);
        const [employeeData, balanceData] = await Promise.all([
          employeeService.getEmployee(user.profileId),
          employeeService.getLeaveBalance(user.profileId),
        ]);
        setEmployee(employeeData);
        setLeaveBalance(balanceData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load your information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.profileId]);

  const calculateDays = () => {
    if (!leaveData.fromDate || !leaveData.toDate) return 0;
    return differenceInDays(leaveData.toDate, leaveData.fromDate) + 1;
  };

  const getAvailableBalance = (type: string): number => {
    if (!leaveBalance) return 0;
    switch (type) {
      case "casual": return leaveBalance.casual;
      case "sick": return leaveBalance.sick;
      case "earned": return leaveBalance.earned;
      default: return 999; // Unlimited for emergency, unpaid, etc.
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!leaveData.leaveType || !leaveData.subject || !leaveData.fromDate || !leaveData.toDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user?.profileId || !employee) {
      toast({
        title: "Error",
        description: "User session not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Check balance for specific leave types
    const available = getAvailableBalance(leaveData.leaveType);
    if (days > available && leaveData.leaveType !== "unpaid" && leaveData.leaveType !== "emergency") {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${available} days of ${leaveData.leaveType} leave available`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const applyData: ApplyLeaveData = {
        employeeId: user.profileId,
        employeeName: employee.name,
        leaveType: leaveData.leaveType,
        subject: leaveData.subject,
        description: leaveData.description,
        fromDate: format(leaveData.fromDate, 'yyyy-MM-dd'),
        toDate: format(leaveData.toDate, 'yyyy-MM-dd'),
        days,
      };

      await leaveService.applyLeave(applyData);

      setSubmitted(true);
      toast({
        title: "Leave Applied",
        description: "Your leave request has been submitted for approval",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit leave request";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("home");
    } else {
      navigate("/employee/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto mt-20 text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
              <h2 className="text-2xl font-bold mb-2">Leave Request Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your leave request for {calculateDays()} days has been submitted.
                You will be notified once it's reviewed.
              </p>
              <Button onClick={handleBack} className="gradient-primary text-white">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Apply for Leave</h1>
            <p className="text-muted-foreground">
              {user?.name} • Submit a new leave request
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Leave Balance Card */}
          {leaveBalance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Leave Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{leaveBalance.casual}</p>
                    <p className="text-sm text-muted-foreground">Casual</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">{leaveBalance.sick}</p>
                    <p className="text-sm text-muted-foreground">Sick</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <p className="text-2xl font-bold text-purple-600">{leaveBalance.earned}</p>
                    <p className="text-sm text-muted-foreground">Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Details</CardTitle>
              <CardDescription>Fill in the details for your leave request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label>Leave Type *</Label>
                <Select
                  value={leaveData.leaveType}
                  onValueChange={(value) => setLeaveData(prev => ({ ...prev, leaveType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Reason *</Label>
                <Input
                  id="subject"
                  value={leaveData.subject}
                  onChange={(e) => setLeaveData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief reason for leave"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        {leaveData.fromDate ? format(leaveData.fromDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={leaveData.fromDate}
                        onSelect={(date) => setLeaveData(prev => ({ ...prev, fromDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        {leaveData.toDate ? format(leaveData.toDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={leaveData.toDate}
                        onSelect={(date) => setLeaveData(prev => ({ ...prev, toDate: date }))}
                        disabled={(date) => date < (leaveData.fromDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Days Calculation */}
              {leaveData.fromDate && leaveData.toDate && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Total days: <strong>{calculateDays()}</strong>
                    {leaveData.leaveType && (
                      <span className="ml-2">
                        (Available: {getAvailableBalance(leaveData.leaveType)} days)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  value={leaveData.description}
                  onChange={(e) => setLeaveData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full gradient-primary text-white"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Leave Request"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;