/**
 * Task Service
 * Handles task management including creation, assignment, completion, and review
 */

import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, ID, Query } from '@/lib/appwrite';

export interface Task {
    $id: string;
    title: string;
    description: string;
    assignedTo: string;
    employeeName: string;
    assignedBy: string;
    assignerName?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed' | 'accepted' | 'rejected';
    dueDate: string;
    assignedDate: string;
    completedDate?: string;
    rejectionNote?: string;
    completionNotes?: string;
    referenceLinks?: string[];
    attachments?: string[];
    isRecurring?: boolean;
    deliveryMethod?: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface TaskNote {
    $id: string;
    taskId: string;
    employeeId: string;
    content: string;
    $createdAt: string;
}

export interface CreateTaskData {
    title: string;
    description: string;
    assignedTo: string;
    employeeName: string;
    assignedBy: string;
    assignerName?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    referenceLinks?: string[];
    deliveryMethod?: string;
    isRecurring?: boolean;
}

export interface TaskFilters {
    assignedTo?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

class TaskService {
    /**
     * Create a new task
     */
    async createTask(data: CreateTaskData): Promise<Task> {
        const task = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            ID.unique(),
            {
                title: data.title,
                description: data.description || '',
                assignedTo: data.assignedTo,
                employeeName: data.employeeName,
                assignedBy: data.assignedBy,
                priority: data.priority,
                status: 'pending',
                dueDate: data.dueDate,
                assignedDate: new Date().toISOString().split('T')[0],
            }
        );

        return task as unknown as Task;
    }

    /**
     * Get tasks with filters
     */
    async getTasks(filters?: TaskFilters): Promise<{
        tasks: Task[];
        total: number;
    }> {
        const queries: string[] = [];

        if (filters?.assignedTo) {
            queries.push(Query.equal('assignedTo', filters.assignedTo));
        }

        if (filters?.status) {
            queries.push(Query.equal('status', filters.status));
        }

        if (filters?.priority) {
            queries.push(Query.equal('priority', filters.priority));
        }

        if (filters?.dueDate) {
            queries.push(Query.equal('dueDate', filters.dueDate));
        }

        if (filters?.startDate && filters?.endDate) {
            queries.push(Query.greaterThanEqual('dueDate', filters.startDate));
            queries.push(Query.lessThanEqual('dueDate', filters.endDate));
        }

        if (filters?.search) {
            queries.push(Query.search('title', filters.search));
        }

        queries.push(Query.orderDesc('$createdAt'));
        queries.push(Query.limit(filters?.limit || 50));

        if (filters?.offset) {
            queries.push(Query.offset(filters.offset));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            queries
        );

        return {
            tasks: response.documents as unknown as Task[],
            total: response.total,
        };
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId: string): Promise<Task | null> {
        try {
            const task = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.TASKS,
                taskId
            );
            return task as unknown as Task;
        } catch {
            return null;
        }
    }

    /**
     * Get tasks for a specific employee
     */
    async getEmployeeTasks(employeeId: string): Promise<Task[]> {
        const { tasks } = await this.getTasks({ assignedTo: employeeId, limit: 100 });
        return tasks;
    }

    /**
     * Get today's tasks for an employee
     */
    async getTodaysTasks(employeeId: string): Promise<Task[]> {
        const today = new Date().toISOString().split('T')[0];
        const { tasks } = await this.getTasks({
            assignedTo: employeeId,
            dueDate: today,
        });
        return tasks;
    }

    /**
     * Get pending tasks for an employee
     */
    async getPendingTasks(employeeId: string): Promise<Task[]> {
        const { tasks } = await this.getTasks({
            assignedTo: employeeId,
            status: 'pending',
        });
        return tasks;
    }

    /**
     * Update task status (employee action)
     */
    async updateTaskStatus(
        taskId: string,
        status: 'pending' | 'in-progress' | 'completed',
        notes?: string
    ): Promise<Task> {
        const updateData: Record<string, unknown> = { status };

        if (status === 'completed') {
            updateData.completedDate = new Date().toISOString().split('T')[0];
            if (notes) {
                updateData.completionNotes = notes;
            }
        }

        const task = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            taskId,
            updateData
        );

        return task as unknown as Task;
    }

    /**
     * Approve task (admin action)
     */
    async approveTask(taskId: string, notes?: string): Promise<Task> {
        const updateData: Record<string, unknown> = { status: 'accepted' };
        if (notes) {
            updateData.completionNotes = notes;
        }

        const task = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            taskId,
            updateData
        );

        return task as unknown as Task;
    }

    /**
     * Reject task with auto-reassignment to next day
     */
    async rejectTask(taskId: string, rejectionNote: string): Promise<Task> {
        // Calculate next working day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Skip weekends
        while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
        const newDueDate = tomorrow.toISOString().split('T')[0];

        const task = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            taskId,
            {
                status: 'rejected',
                rejectionNote,
                dueDate: newDueDate,
            }
        );

        return task as unknown as Task;
    }

    /**
     * Update task details (admin action)
     */
    async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
        const task = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.TASKS,
            taskId,
            data
        );
        return task as unknown as Task;
    }

    /**
     * Delete task
     */
    async deleteTask(taskId: string): Promise<void> {
        // First delete all notes for this task
        const notes = await this.getTaskNotes(taskId);
        await Promise.all(
            notes.map(note =>
                databases.deleteDocument(DATABASE_ID, COLLECTIONS.TASK_NOTES, note.$id)
            )
        );

        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TASKS, taskId);
    }

    /**
     * Add note to task
     */
    async addTaskNote(taskId: string, employeeId: string, content: string): Promise<TaskNote> {
        const note = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.TASK_NOTES,
            ID.unique(),
            {
                taskId,
                employeeId,
                content,
            }
        );
        return note as unknown as TaskNote;
    }

    /**
     * Get notes for a task
     */
    async getTaskNotes(taskId: string): Promise<TaskNote[]> {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.TASK_NOTES,
            [
                Query.equal('taskId', taskId),
                Query.orderDesc('$createdAt'),
            ]
        );
        return response.documents as unknown as TaskNote[];
    }

    /**
     * Upload task attachment
     */
    async uploadAttachment(taskId: string, file: File): Promise<string> {
        const result = await storage.createFile(
            BUCKETS.TASK_ATTACHMENTS,
            ID.unique(),
            file
        );

        // Update task with new attachment
        const task = await this.getTaskById(taskId);
        if (task) {
            const attachments = [...(task.attachments || []), result.$id];
            await this.updateTask(taskId, { attachments } as Partial<Task>);
        }

        return result.$id;
    }

    /**
     * Get attachment URL
     */
    getAttachmentUrl(fileId: string): string {
        return storage.getFileView(BUCKETS.TASK_ATTACHMENTS, fileId).toString();
    }

    /**
     * Get task statistics
     */
    async getTaskStats(employeeId?: string): Promise<{
        pending: number;
        inProgress: number;
        completed: number;
        accepted: number;
        rejected: number;
        total: number;
    }> {
        const baseFilters: TaskFilters = employeeId ? { assignedTo: employeeId, limit: 500 } : { limit: 500 };
        const { tasks } = await this.getTasks(baseFilters);

        const stats = {
            pending: 0,
            inProgress: 0,
            completed: 0,
            accepted: 0,
            rejected: 0,
            total: tasks.length,
        };

        tasks.forEach(task => {
            switch (task.status) {
                case 'pending':
                    stats.pending++;
                    break;
                case 'in-progress':
                    stats.inProgress++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
                case 'accepted':
                    stats.accepted++;
                    break;
                case 'rejected':
                    stats.rejected++;
                    break;
            }
        });

        return stats;
    }

    /**
     * Get tasks for calendar view (grouped by date)
     */
    async getTasksForCalendar(
        startDate: string,
        endDate: string,
        employeeId?: string
    ): Promise<Record<string, Task[]>> {
        const filters: TaskFilters = {
            startDate,
            endDate,
            limit: 500,
        };

        if (employeeId) {
            filters.assignedTo = employeeId;
        }

        const { tasks } = await this.getTasks(filters);

        const grouped: Record<string, Task[]> = {};
        tasks.forEach(task => {
            const date = task.dueDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(task);
        });

        return grouped;
    }
}

export const taskService = new TaskService();
export default taskService;
