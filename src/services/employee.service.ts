/**
 * Employee Service
 * Handles all employee-related CRUD operations with Appwrite
 */

import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, ID, Query } from '@/lib/appwrite';
import type { EmployeeProfile } from './auth.service';

// API server URL for operations requiring server-side access
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Appwrite Cloud Function URL (fallback when local server not available)
const FUNCTION_URL = import.meta.env.VITE_CREATE_EMPLOYEE_FUNCTION_URL || '';

// Check if running in production (deployed site)
const isProduction = import.meta.env.PROD;

export interface CreateEmployeeData {
    name: string;
    email: string;
    password: string;  // Required for login credentials
    phone: string;
    department: string;
    position: string;
    joinDate: string;
    location?: string;
    employeeId?: string;  // Custom GW-prefixed ID, auto-generated if not provided
}

export interface UpdateEmployeeData {
    name?: string;
    phone?: string;
    department?: string;
    position?: string;
    status?: 'active' | 'inactive' | 'on-leave';
    location?: string;
    leaveBalance?: string;
}

export interface EmployeeFilters {
    status?: 'active' | 'inactive' | 'on-leave';
    department?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface LeaveBalance {
    casual: number;
    sick: number;
    earned: number;
}

export interface Employee extends EmployeeProfile {
    avatar?: string;
    leaveBalance?: string;
    employeeId?: string;  // GW-prefixed employee ID
}

class EmployeeService {
    /**
     * Generate a new employee ID from the API server or Cloud Function
     */
    async generateEmployeeId(): Promise<string> {
        try {
            // In production, use Cloud Function if available
            if (isProduction && FUNCTION_URL) {
                const response = await fetch(FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'generate-id' }),
                });
                const result = await response.json();
                if (result.success) {
                    return result.employeeId;
                }
                throw new Error(result.error || 'Failed to generate ID');
            }

            // Use local API server
            const response = await fetch(`${API_URL}/api/employees/generate-id`);
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate ID');
            }
            return result.employeeId;
        } catch (error) {
            console.error('Generate employee ID error:', error);
            // Fallback: generate locally
            const timestamp = Date.now().toString().slice(-6);
            return `GW-${timestamp}`;
        }
    }

    /**
     * Create a new employee with login credentials
     * Uses the API server or Appwrite Cloud Function
     */
    async createEmployee(data: CreateEmployeeData): Promise<Employee> {
        try {
            let response: Response;
            let result: { success?: boolean; error?: string; employee?: { id: string } };

            // In production with Cloud Function configured, use it
            if (isProduction && FUNCTION_URL) {
                response = await fetch(FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'create', ...data }),
                });
                result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to create employee');
                }
            } else {
                // Use local API server
                response = await fetch(`${API_URL}/api/employees`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to create employee');
                }
            }

            // Refresh the employee from database
            const employee = await this.getEmployee(result.employee!.id);
            if (!employee) {
                throw new Error('Employee created but not found');
            }

            return employee;
        } catch (error: unknown) {
            console.error('Create employee error:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                if (isProduction) {
                    throw new Error('Employee creation service unavailable. Please contact administrator.');
                }
                throw new Error('API server not running. Please start it with: npm run server');
            }
            throw error;
        }
    }

    /**
     * Create employee document for testing (without auth)
     * Use this when you want to add employees manually
     */
    async createEmployeeDocument(data: {
        name: string;
        email: string;
        phone: string;
        department: string;
        position: string;
        joinDate: string;
        location?: string;
        authUserId?: string;
    }): Promise<Employee> {
        const defaultBalance: LeaveBalance = { casual: 6, sick: 6, earned: 12 };

        const employee = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.EMPLOYEES,
            ID.unique(),
            {
                name: data.name,
                email: data.email,
                phone: data.phone,
                department: data.department,
                position: data.position,
                status: 'active',
                joinDate: data.joinDate,
                location: data.location || '',
                authUserId: data.authUserId || 'pending-' + ID.unique(),
                leaveBalance: JSON.stringify(defaultBalance),
            }
        );

        return employee as unknown as Employee;
    }

    /**
     * Get all employees with optional filters
     */
    async getEmployees(filters?: EmployeeFilters): Promise<{
        employees: Employee[];
        total: number;
    }> {
        const queries: string[] = [];

        if (filters?.status) {
            queries.push(Query.equal('status', filters.status));
        }

        if (filters?.department) {
            queries.push(Query.equal('department', filters.department));
        }

        queries.push(Query.orderDesc('$createdAt'));
        queries.push(Query.limit(filters?.limit || 50));

        if (filters?.offset) {
            queries.push(Query.offset(filters.offset));
        }

        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.EMPLOYEES,
                queries
            );

            return {
                employees: response.documents as unknown as Employee[],
                total: response.total,
            };
        } catch (error) {
            console.error('Get employees error:', error);
            return { employees: [], total: 0 };
        }
    }

    /**
     * Get a single employee by ID
     */
    async getEmployee(employeeId: string): Promise<Employee | null> {
        try {
            const employee = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.EMPLOYEES,
                employeeId
            );
            return employee as unknown as Employee;
        } catch {
            return null;
        }
    }

    /**
     * Get employee by auth user ID
     */
    async getEmployeeByAuthId(authUserId: string): Promise<Employee | null> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.EMPLOYEES,
                [Query.equal('authUserId', authUserId), Query.limit(1)]
            );
            return response.documents[0] as unknown as Employee || null;
        } catch {
            return null;
        }
    }

    /**
     * Update an employee
     */
    async updateEmployee(employeeId: string, data: UpdateEmployeeData): Promise<Employee> {
        const employee = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EMPLOYEES,
            employeeId,
            data
        );
        return employee as unknown as Employee;
    }

    /**
     * Soft delete an employee (set status to inactive)
     */
    async deactivateEmployee(employeeId: string): Promise<Employee> {
        return this.updateEmployee(employeeId, { status: 'inactive' });
    }

    /**
     * Permanently delete an employee
     */
    async deleteEmployee(employeeId: string): Promise<void> {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.EMPLOYEES,
            employeeId
        );
    }

    /**
     * Get unique departments
     */
    async getDepartments(): Promise<string[]> {
        const { employees } = await this.getEmployees({ limit: 1000 });
        const departments = [...new Set(employees.map(e => e.department))];
        return departments.sort();
    }

    /**
     * Get employee avatar URL
     */
    getAvatarUrl(fileId: string): string {
        return storage.getFileView(BUCKETS.EMPLOYEE_AVATARS, fileId).toString();
    }

    /**
     * Get employee statistics
     */
    async getEmployeeStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        onLeave: number;
    }> {
        try {
            const [total, active, inactive, onLeave] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.EMPLOYEES, [Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.EMPLOYEES, [
                    Query.equal('status', 'active'),
                    Query.limit(1),
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.EMPLOYEES, [
                    Query.equal('status', 'inactive'),
                    Query.limit(1),
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.EMPLOYEES, [
                    Query.equal('status', 'on-leave'),
                    Query.limit(1),
                ]),
            ]);

            return {
                total: total.total,
                active: active.total,
                inactive: inactive.total,
                onLeave: onLeave.total,
            };
        } catch (error) {
            console.error('Get employee stats error:', error);
            return { total: 0, active: 0, inactive: 0, onLeave: 0 };
        }
    }

    /**
     * Get leave balance for an employee
     */
    async getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
        const employee = await this.getEmployee(employeeId);
        if (!employee) {
            return { casual: 0, sick: 0, earned: 0 };
        }

        try {
            return JSON.parse(employee.leaveBalance || '{"casual":6,"sick":6,"earned":12}');
        } catch {
            return { casual: 6, sick: 6, earned: 12 };
        }
    }

    /**
     * Update leave balance
     */
    async updateLeaveBalance(
        employeeId: string,
        leaveType: 'casual' | 'sick' | 'earned',
        amount: number
    ): Promise<Employee> {
        const balance = await this.getLeaveBalance(employeeId);
        balance[leaveType] = Math.max(0, balance[leaveType] + amount);

        return this.updateEmployee(employeeId, {
            leaveBalance: JSON.stringify(balance)
        });
    }
}

export const employeeService = new EmployeeService();
export default employeeService;
