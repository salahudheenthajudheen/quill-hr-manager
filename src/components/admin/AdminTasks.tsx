/**
 * Admin Tasks Component
 * Task management with Appwrite integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  CalendarIcon
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { taskService, type Task, type CreateTaskData } from "@/services/task.service";
import { employeeService, type Employee } from "@/services/employee.service";

interface AdminTasksProps {
  onBack: () => void;
}

const AdminTasks = ({ onBack }: AdminTasksProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, accepted: 0, rejected: 0, total: 0 });
  const { toast } = useToast();
  const { user } = useAuth();

  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    assignedTo: string;
    priority: "low" | "medium" | "high";
    dueDate: Date | undefined;
  }>({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: undefined
  });

  // Fetch tasks and employees
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, employeesData, statsData] = await Promise.all([
        taskService.getTasks({ limit: 100 }),
        employeeService.getEmployees({ status: 'active', limit: 100 }),
        taskService.getTaskStats(),
      ]);
      setTasks(tasksData.tasks);
      setEmployees(employeesData.employees);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in title, assignee, and due date",
        variant: "destructive",
      });
      return;
    }

    const selectedEmployee = employees.find(e => e.$id === newTask.assignedTo);
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select a valid employee",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const taskData: CreateTaskData = {
        title: newTask.title,
        description: newTask.description,
        assignedTo: newTask.assignedTo,
        employeeName: selectedEmployee.name,
        assignedBy: user?.profileId || user?.id || '',
        assignerName: user?.name,
        priority: newTask.priority,
        dueDate: format(newTask.dueDate, 'yyyy-MM-dd'),
      };

      await taskService.createTask(taskData);

      toast({
        title: "Task Created",
        description: `Task assigned to ${selectedEmployee.name}`,
      });

      setShowCreateDialog(false);
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        dueDate: undefined
      });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptTask = async (task: Task) => {
    setActionLoading(true);
    try {
      await taskService.acceptTask(task.$id);
      toast({
        title: "Task Accepted",
        description: "The task has been marked as accepted",
      });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept task";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setSelectedTask(null);
    }
  };

  const handleRejectTask = async (task: Task, note: string) => {
    if (!note.trim()) {
      toast({
        title: "Note Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await taskService.rejectTask(task.$id, note);
      toast({
        title: "Task Rejected",
        description: "The task has been rejected and rescheduled",
      });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject task";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setSelectedTask(null);
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading tasks...</p>
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
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Assign and manage employee tasks</p>
          </div>
        </div>
        <Button className="gradient-primary text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold text-success">{stats.accepted}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-destructive mb-2" />
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>{filteredTasks.length} tasks found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No tasks found</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.$id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="gradient-primary text-white text-sm">
                        {task.employeeName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>Assigned to: {task.employeeName}</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {task.status === "completed" && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptTask(task)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {task.status === "rejected" && task.rejectionNote && (
                    <div className="text-right text-sm max-w-[200px]">
                      <p className="text-destructive">Rejected: {task.rejectionNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Assign a task to an employee</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div>
              <Label>Assign To *</Label>
              <Select
                value={newTask.assignedTo}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.$id} value={emp.$id}>
                      {emp.name} - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: "low" | "medium" | "high") => setNewTask(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {newTask.dueDate ? format(newTask.dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate}
                    onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={actionLoading} className="gradient-primary text-white">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Task Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label>Rejection Note *</Label>
            <Textarea
              placeholder="Enter reason for rejection..."
              rows={3}
              onChange={(e) => selectedTask && Object.assign(selectedTask, { _rejectionNote: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const note = (selectedTask as any)?._rejectionNote || '';
                if (selectedTask) handleRejectTask(selectedTask, note);
              }}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasks;