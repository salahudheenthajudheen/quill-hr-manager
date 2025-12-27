/**
 * Leave Service
 * Handles leave application, approval, and balance management
 */

import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, ID, Query } from '@/lib/appwrite';
import { employeeService } from './employee.service';

export interface LeaveRequest {
    $id: string;
    employeeId: string;
    employeeName: string;
    leaveType: 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Maternity Leave' | 'Parent Leave' | 'Optional Leave';
    subject: string;
    description?: string;
    fromDate: string;
    toDate: string;
    days: number;
    status: 'pending' | 'approved' | 'rejected';
    appliedDate: string;
    reviewedBy?: string;
    reviewerName?: string;
    reviewedDate?: string;
    comments?: string;
    documentId?: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface ApplyLeaveData {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveRequest['leaveType'];
    subject: string;
    description?: string;
    fromDate: string;
    toDate: string;
}

export interface LeaveFilters {
    employeeId?: string;
    status?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

class LeaveService {
    /**
     * Calculate number of days between two dates
     */
    private calculateDays(fromDate: string, toDate: string): number {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    /**
     * Apply for leave
     */
    async applyLeave(data: ApplyLeaveData): Promise<LeaveRequest> {
        const days = this.calculateDays(data.fromDate, data.toDate);

        // Check if employee has sufficient leave balance
        const employee = await employeeService.getEmployee(data.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        const leaveTypeMap: Record<string, 'earned' | 'sick' | 'casual'> = {
            'Annual Leave': 'earned',
            'Sick Leave': 'sick',
            'Casual Leave': 'casual',
        };

        const balanceKey = leaveTypeMap[data.leaveType];
        if (balanceKey && employee.leaveBalance) {
            const balance = employee.leaveBalance[balanceKey] || 0;
            if (balance < days) {
                throw new Error(
                    `Insufficient leave balance. You have ${balance} days of ${data.leaveType} remaining, but requested ${days} days.`
                );
            }
        }

        // Check for overlapping leave requests
        const existingLeaves = await this.getEmployeeLeaves(data.employeeId);
        const hasOverlap = existingLeaves.some(leave => {
            if (leave.status === 'rejected') return false;
            const leaveFrom = new Date(leave.fromDate);
            const leaveTo = new Date(leave.toDate);
            const requestFrom = new Date(data.fromDate);
            const requestTo = new Date(data.toDate);
            return (
                (requestFrom >= leaveFrom && requestFrom <= leaveTo) ||
                (requestTo >= leaveFrom && requestTo <= leaveTo) ||
                (requestFrom <= leaveFrom && requestTo >= leaveTo)
            );
        });

        if (hasOverlap) {
            throw new Error('You already have a leave request for overlapping dates.');
        }

        const leaveRequest = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.LEAVES,
            ID.unique(),
            {
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                leaveType: data.leaveType,
                subject: data.subject,
                description: data.description,
                fromDate: data.fromDate,
                toDate: data.toDate,
                days,
                status: 'pending',
                appliedDate: new Date().toISOString().split('T')[0],
            }
        );

        return leaveRequest as unknown as LeaveRequest;
    }

    /**
     * Get leave requests with filters
     */
    async getLeaveRequests(filters?: LeaveFilters): Promise<{
        requests: LeaveRequest[];
        total: number;
    }> {
        const queries: string[] = [];

        if (filters?.employeeId) {
            queries.push(Query.equal('employeeId', filters.employeeId));
        }

        if (filters?.status) {
            queries.push(Query.equal('status', filters.status));
        }

        if (filters?.leaveType) {
            queries.push(Query.equal('leaveType', filters.leaveType));
        }

        if (filters?.startDate && filters?.endDate) {
            queries.push(Query.greaterThanEqual('fromDate', filters.startDate));
            queries.push(Query.lessThanEqual('toDate', filters.endDate));
        }

        queries.push(Query.orderDesc('$createdAt'));
        queries.push(Query.limit(filters?.limit || 50));

        if (filters?.offset) {
            queries.push(Query.offset(filters.offset));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.LEAVES,
            queries
        );

        return {
            requests: response.documents as unknown as LeaveRequest[],
            total: response.total,
        };
    }

    /**
     * Get leave request by ID
     */
    async getLeaveById(leaveId: string): Promise<LeaveRequest | null> {
        try {
            const leave = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.LEAVES,
                leaveId
            );
            return leave as unknown as LeaveRequest;
        } catch {
            return null;
        }
    }

    /**
     * Get leaves for a specific employee
     */
    async getEmployeeLeaves(employeeId: string): Promise<LeaveRequest[]> {
        const { requests } = await this.getLeaveRequests({ employeeId, limit: 100 });
        return requests;
    }

    /**
     * Get pending leave requests
     */
    async getPendingRequests(): Promise<LeaveRequest[]> {
        const { requests } = await this.getLeaveRequests({ status: 'pending' });
        return requests;
    }

    /**
     * Approve leave request
     */
    async approveLeave(
        leaveId: string,
        reviewedBy: string,
        reviewerName: string,
        comments?: string
    ): Promise<LeaveRequest> {
        const leave = await this.getLeaveById(leaveId);
        if (!leave) {
            throw new Error('Leave request not found');
        }

        if (leave.status !== 'pending') {
            throw new Error('This leave request has already been processed');
        }

        // Deduct leave balance
        const leaveTypeMap: Record<string, 'earned' | 'sick' | 'casual'> = {
            'Annual Leave': 'earned',
            'Sick Leave': 'sick',
            'Casual Leave': 'casual',
        };

        const balanceKey = leaveTypeMap[leave.leaveType];
        if (balanceKey) {
            await employeeService.updateLeaveBalance(
                leave.employeeId,
                balanceKey,
                -leave.days
            );
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.LEAVES,
            leaveId,
            {
                status: 'approved',
                reviewedBy,
                reviewerName,
                reviewedDate: new Date().toISOString().split('T')[0],
                comments: comments || 'Leave request approved.',
            }
        );

        return updated as unknown as LeaveRequest;
    }

    /**
     * Reject leave request
     */
    async rejectLeave(
        leaveId: string,
        reviewedBy: string,
        reviewerName: string,
        comments: string
    ): Promise<LeaveRequest> {
        if (!comments) {
            throw new Error('Please provide a reason for rejection');
        }

        const leave = await this.getLeaveById(leaveId);
        if (!leave) {
            throw new Error('Leave request not found');
        }

        if (leave.status !== 'pending') {
            throw new Error('This leave request has already been processed');
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.LEAVES,
            leaveId,
            {
                status: 'rejected',
                reviewedBy,
                reviewerName,
                reviewedDate: new Date().toISOString().split('T')[0],
                comments,
            }
        );

        return updated as unknown as LeaveRequest;
    }

    /**
     * Update leave request (admin can edit even after approval)
     */
    async updateLeave(
        leaveId: string,
        data: Partial<LeaveRequest>
    ): Promise<LeaveRequest> {
        // Recalculate days if dates changed
        if (data.fromDate && data.toDate) {
            data.days = this.calculateDays(data.fromDate, data.toDate);
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.LEAVES,
            leaveId,
            data
        );

        return updated as unknown as LeaveRequest;
    }

    /**
     * Delete leave request
     */
    async deleteLeave(leaveId: string): Promise<void> {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.LEAVES, leaveId);
    }

    /**
     * Upload supporting document
     */
    async uploadDocument(leaveId: string, file: File): Promise<string> {
        const result = await storage.createFile(
            BUCKETS.LEAVE_DOCUMENTS,
            ID.unique(),
            file
        );

        // Update leave with document ID
        await this.updateLeave(leaveId, { documentId: result.$id });

        return result.$id;
    }

    /**
     * Get document URL
     */
    getDocumentUrl(fileId: string): string {
        return storage.getFileView(BUCKETS.LEAVE_DOCUMENTS, fileId).toString();
    }

    /**
     * Get leave balance for an employee
     */
    async getLeaveBalance(employeeId: string): Promise<{
        earned: number;
        sick: number;
        casual: number;
        total: number;
    }> {
        const employee = await employeeService.getEmployee(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Parse leave balance from JSON string
        let balance = { earned: 12, sick: 6, casual: 6 };
        if (employee.leaveBalance) {
            try {
                const parsed = typeof employee.leaveBalance === 'string'
                    ? JSON.parse(employee.leaveBalance)
                    : employee.leaveBalance;
                balance = {
                    earned: parsed.earned ?? 12,
                    sick: parsed.sick ?? 6,
                    casual: parsed.casual ?? 6,
                };
            } catch {
                // Use defaults if parsing fails
            }
        }

        return {
            ...balance,
            total: balance.earned + balance.sick + balance.casual,
        };
    }

    /**
     * Get leave statistics
     */
    async getLeaveStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }> {
        const { requests } = await this.getLeaveRequests({ limit: 500 });

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: requests.length,
        };

        requests.forEach(request => {
            switch (request.status) {
                case 'pending':
                    stats.pending++;
                    break;
                case 'approved':
                    stats.approved++;
                    break;
                case 'rejected':
                    stats.rejected++;
                    break;
            }
        });

        return stats;
    }

    /**
     * Get employees on leave today
     */
    async getEmployeesOnLeaveToday(): Promise<LeaveRequest[]> {
        const today = new Date().toISOString().split('T')[0];
        const { requests } = await this.getLeaveRequests({
            status: 'approved',
            limit: 100,
        });

        return requests.filter(request => {
            const from = new Date(request.fromDate);
            const to = new Date(request.toDate);
            const todayDate = new Date(today);
            return todayDate >= from && todayDate <= to;
        });
    }
}

export const leaveService = new LeaveService();
export default leaveService;
