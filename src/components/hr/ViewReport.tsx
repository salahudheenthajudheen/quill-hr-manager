import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, QrCode, FileText, Calendar as CalendarIcon, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRScanner from "@/components/hr/QRScanner";
import AttendanceCalendar from "@/components/hr/AttendanceCalendar";

interface ViewReportProps {
  onNavigate: (page: "home" | "attendance" | "report" | "leave" | "tasks") => void;
}

const ViewReport = ({ onNavigate }: ViewReportProps) => {
  const [employeeId, setEmployeeId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [step, setStep] = useState<"input" | "otp" | "calendar">("input");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { toast } = useToast();

  const handleRequestOTP = async () => {
    if (!employeeId.trim()) {
      setMessage({ type: "error", text: "Please enter employee ID" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwOLgXrfpW0PYNDy6zHtUQKnBiElajhHldZWEJFTlAjEbGlADC_NfpAF3mzIBZUDBX7lg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "viewAttendance",
            payload: { employee_id: employeeId }
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setStep("otp");
        setMessage({ type: "success", text: "OTP sent to your registered phone number" });
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code",
        });
      } else {
        setMessage({ type: "error", text: result.message || "Failed to send OTP" });
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setMessage({ type: "error", text: "Please enter OTP" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 4-digit OTP
      if (otp.length === 4) {
        setStep("calendar");
        setMessage({ type: "success", text: "OTP verified successfully" });
        toast({
          title: "Access Granted",
          description: "Attendance report loaded successfully",
        });
      } else {
        setMessage({ type: "error", text: "Invalid OTP. Please try again." });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (scannedData: string) => {
    setEmployeeId(scannedData);
    setShowScanner(false);
    toast({
      title: "QR Code Scanned",
      description: `Employee ID: ${scannedData}`,
    });
  };

  const handleBackToInput = () => {
    setStep("input");
    setOtp("");
    setMessage(null);
  };

  if (step === "calendar") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={handleBackToInput}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Input
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Attendance Report</h1>
              <p className="text-muted-foreground">Employee ID: {employeeId}</p>
            </div>
          </div>

          <AttendanceCalendar employeeId={employeeId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate("home")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold">View Attendance Report</h1>
            <p className="text-muted-foreground">Access your attendance records securely</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {step === "input" && (
            <>
              {/* QR Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2 text-primary" />
                    QR Code Scanner
                  </CardTitle>
                  <CardDescription>
                    Scan employee ID QR code for quick access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setShowScanner(!showScanner)}
                    className="w-full gradient-primary text-white"
                    variant="default"
                  >
                    {showScanner ? "Close Scanner" : "Open QR Scanner"}
                  </Button>
                  
                  {showScanner && (
                    <div className="animate-slide-up">
                      <QRScanner onScan={handleQRScan} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Manual Entry
                  </CardTitle>
                  <CardDescription>
                    Enter employee ID manually to request access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter your employee ID"
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleRequestOTP}
                    disabled={loading || !employeeId.trim()}
                    className="w-full gradient-primary text-white"
                    variant="default"
                  >
                    {loading ? "Sending OTP..." : "Request OTP"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {step === "otp" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-accent" />
                  OTP Verification
                </CardTitle>
                <CardDescription>
                  Enter the 4-digit code sent to your registered phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    maxLength={4}
                    className="mt-1 text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={handleBackToInput}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerifyOTP}
                    disabled={loading || !otp.trim()}
                    className="flex-1 gradient-primary text-white"
                    variant="default"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          {message && (
            <Alert className={`animate-slide-up ${message.type === 'success' ? 'border-success' : 'border-destructive'}`}>
              <AlertDescription className={message.type === 'success' ? 'text-success' : 'text-destructive'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewReport;