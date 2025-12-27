/**
 * Mark Attendance Component
 * Updated to use Appwrite with geolocation validation
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, Home, Building2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceService, type AttendanceRecord } from "@/services/attendance.service";
import { isWithinOfficeRadius, formatCoordinates, getGoogleMapsUrl } from "@/utils/geolocation.utils";

interface MarkAttendanceProps {
  onNavigate?: (page: "home" | "attendance" | "report" | "leave" | "tasks") => void;
}

const MarkAttendance = ({ onNavigate }: MarkAttendanceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "success" | "error">("loading");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [attendanceType, setAttendanceType] = useState<"office" | "wfh">("office");
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [geoCheckResult, setGeoCheckResult] = useState<{
    isWithin: boolean;
    distance: number;
    allowedRadius: number;
  } | null>(null);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setLocationStatus("success");

          // Check if within office radius
          const geoCheck = isWithinOfficeRadius(loc.lat, loc.lng);
          setGeoCheckResult(geoCheck);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus("error");
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enable location services.",
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setLocationStatus("error");
    }
  }, [toast]);

  // Check for existing attendance today
  useEffect(() => {
    const checkTodayAttendance = async () => {
      if (!user?.profileId) return;
      try {
        const attendance = await attendanceService.getTodayAttendance(user.profileId);
        setTodayAttendance(attendance);
      } catch (error) {
        console.error("Error checking attendance:", error);
      }
    };

    checkTodayAttendance();
  }, [user?.profileId]);

  const handleCheckIn = async () => {
    if (!user?.profileId) {
      setMessage({ type: "error", text: "User session not found. Please login again." });
      return;
    }

    if (!location) {
      setMessage({ type: "error", text: "Location not available. Please enable location services." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const attendance = await attendanceService.checkIn({
        employeeId: user.profileId,
        employeeName: user.name,
        location,
        attendanceType,
      });

      setTodayAttendance(attendance);
      setMessage({ type: "success", text: "Check-in successful!" });
      toast({
        title: "Check-in Successful",
        description: `You have checked in at ${new Date().toLocaleTimeString()}`,
      });
    } catch (error: unknown) {
      console.error("Error marking attendance:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check in. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || !location) {
      setMessage({ type: "error", text: "Cannot check out. Missing attendance record or location." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const updated = await attendanceService.checkOut(todayAttendance.$id, location);
      setTodayAttendance(updated);
      setMessage({ type: "success", text: "Check-out successful!" });
      toast({
        title: "Check-out Successful",
        description: `You worked ${updated.workingHours?.toFixed(1)} hours today.`,
      });
    } catch (error: unknown) {
      console.error("Error checking out:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check out. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("home");
    } else {
      navigate("/employee/dashboard");
    }
  };

  const canCheckInOffice = attendanceType === "office" && geoCheckResult?.isWithin;
  const canCheckInWfh = attendanceType === "wfh";
  const canCheckIn = !todayAttendance && location && (canCheckInOffice || canCheckInWfh);
  const canCheckOut = todayAttendance && !todayAttendance.checkOut;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">
              {user?.name} • {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Today's Status */}
          {todayAttendance && (
            <Card className="border-success/50 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center text-success">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Today's Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-semibold">
                      {todayAttendance.checkIn
                        ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-semibold">
                      {todayAttendance.checkOut
                        ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{todayAttendance.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{todayAttendance.attendanceType}</p>
                  </div>
                </div>

                {canCheckOut && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="w-full mt-4"
                    variant="destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {loading ? "Checking out..." : "Check Out"}
                  </Button>
                )}

                {todayAttendance.checkOut && todayAttendance.workingHours && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-center">
                      <span className="text-muted-foreground">Total working hours: </span>
                      <span className="font-bold text-lg">{todayAttendance.workingHours.toFixed(1)}h</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-accent" />
                Location Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationStatus === "loading" && (
                <div className="flex items-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Getting your location...
                </div>
              )}

              {locationStatus === "error" && (
                <div className="flex items-center text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Could not get location. Please enable location services.
                </div>
              )}

              {locationStatus === "success" && location && (
                <div className="space-y-3">
                  <div className="flex items-center text-success">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Location detected: {formatCoordinates(location.lat, location.lng)}
                  </div>

                  {geoCheckResult && (
                    <div className={`p-3 rounded-lg ${geoCheckResult.isWithin ? 'bg-success/10' : 'bg-warning/10'}`}>
                      {geoCheckResult.isWithin ? (
                        <div className="flex items-center text-success">
                          <Building2 className="h-4 w-4 mr-2" />
                          You are {geoCheckResult.distance}m from office (within {geoCheckResult.allowedRadius}m radius)
                        </div>
                      ) : (
                        <div className="flex items-center text-warning">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          You are {geoCheckResult.distance}m from office (outside {geoCheckResult.allowedRadius}m radius)
                        </div>
                      )}
                    </div>
                  )}

                  <a
                    href={getGoogleMapsUrl(location.lat, location.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Type Selection */}
          {!todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Attendance Type
                </CardTitle>
                <CardDescription>
                  Select how you're working today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={attendanceType}
                  onValueChange={(value) => setAttendanceType(value as "office" | "wfh")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${attendanceType === "office" ? "border-primary bg-primary/5" : "border-muted"
                    } ${!geoCheckResult?.isWithin ? "opacity-50" : ""}`}>
                    <RadioGroupItem value="office" id="office" disabled={!geoCheckResult?.isWithin} />
                    <Label htmlFor="office" className="flex items-center cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Office</p>
                        <p className="text-xs text-muted-foreground">Within office premises</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${attendanceType === "wfh" ? "border-primary bg-primary/5" : "border-muted"
                    }`}>
                    <RadioGroupItem value="wfh" id="wfh" />
                    <Label htmlFor="wfh" className="flex items-center cursor-pointer flex-1">
                      <Home className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Work From Home</p>
                        <p className="text-xs text-muted-foreground">Remote work</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {attendanceType === "office" && !geoCheckResult?.isWithin && (
                  <Alert className="border-warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You are outside the office radius. Please move closer to the office or select Work From Home.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || loading}
                  className="w-full gradient-primary text-white"
                  size="lg"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {loading ? "Checking in..." : "Check In"}
                </Button>
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

export default MarkAttendance;