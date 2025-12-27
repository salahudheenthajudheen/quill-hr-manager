/**
 * Employee Tasks Component
 * View and manage assigned tasks with Appwrite integration
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  MessageSquare
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { taskService, type Task } from "@/services/task.service";

interface EmployeeTasksProps {
  onNavigate?: (page: "home" | "attendance" | "report" | "leave" | "tasks") => void;
}

const EmployeeTasks = ({ onNavigate }: EmployeeTasksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, accepted: 0, rejected: 0, total: 0 });

  const fetchTasks = async () => {
    if (!user?.profileId) return;

    try {
      setLoading(true);
      const [tasksData, statsData] = await Promise.all([
        taskService.getEmployeeTasks(user.profileId),
        taskService.getTaskStats(user.profileId),
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.profileId]);

  const filteredTasks = tasks.filter(task =>
    statusFilter === "all" || task.status === statusFilter
  );

  const handleStartTask = async (task: Task) => {
    setActionLoading(true);
    try {
      await taskService.updateTaskStatus(task.$id, 'in-progress');
      toast({
        title: "Task Started",
        description: "Task marked as in progress",
      });
      fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start task";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    setActionLoading(true);
    try {
      await taskService.completeTask(selectedTask.$id, completionNotes);
      toast({
        title: "Task Completed",
        description: "Task marked as completed and submitted for review",
      });
      setSelectedTask(null);
      setCompletionNotes("");
      fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to complete task";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted": return "bg-success/10 text-success border-success/20";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/20";
      case "in-progress": return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-muted text-muted-foreground";
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
          <p className="text-muted-foreground">Loading tasks...</p>
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
            <h1 className="text-3xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">
              {user?.name} • View and manage your assigned tasks
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.accepted}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-muted-foreground">
                  {statusFilter === "all"
                    ? "You don't have any assigned tasks yet"
                    : `No ${statusFilter.replace('-', ' ')} tasks`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.$id} className={`transition-all ${expandedTask === task.$id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedTask(expandedTask === task.$id ? null : task.$id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription>
                          Due: {task.dueDate} • Assigned: {task.assignedDate}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task);
                          }}
                          disabled={actionLoading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {task.status === "in-progress" && (
                        <Button
                          size="sm"
                          className="gradient-primary text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setCompletionNotes("");
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {expandedTask === task.$id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedTask === task.$id && (
                  <CardContent className="pt-0">
                    <div className="space-y-4 border-t pt-4">
                      {task.description && (
                        <div>
                          <h4 className="font-medium mb-1">Description</h4>
                          <p className="text-muted-foreground">{task.description}</p>
                        </div>
                      )}

                      {task.assignerName && (
                        <div>
                          <h4 className="font-medium mb-1">Assigned By</h4>
                          <p className="text-muted-foreground">{task.assignerName}</p>
                        </div>
                      )}

                      {task.rejectionNote && (
                        <div className="p-3 bg-destructive/10 rounded-lg">
                          <h4 className="font-medium text-destructive mb-1">Rejection Note</h4>
                          <p className="text-sm">{task.rejectionNote}</p>
                        </div>
                      )}

                      {task.completionNotes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-medium mb-1">Completion Notes</h4>
                          <p className="text-sm">{task.completionNotes}</p>
                        </div>
                      )}

                      {task.referenceLinks && (
                        <div>
                          <h4 className="font-medium mb-1">Reference Links</h4>
                          <p className="text-sm text-primary hover:underline cursor-pointer">
                            {task.referenceLinks}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Complete Task Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark "{selectedTask?.title}" as completed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Completion Notes</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completed work..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTask}
              disabled={actionLoading}
              className="gradient-primary text-white"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTasks;