/**
 * Authentication Service
 * Handles admin and employee authentication with Appwrite
 */

import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite';
import { Models } from 'appwrite';

export type UserRole = 'admin' | 'employee' | null;

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profileId?: string; // ID in employees or admins collection
}

export interface AdminProfile {
    $id: string;
    name: string;
    email: string;
    role: string;
    authUserId: string;
}

export interface EmployeeProfile {
    $id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    status: 'active' | 'inactive' | 'on-leave';
    joinDate: string;
    location: string;
    authUserId: string;
    leaveBalance?: string; // JSON string stored in Appwrite
}

class AuthService {
    /**
     * Get the current authenticated user session
     */
    async getCurrentSession(): Promise<Models.Session | null> {
        try {
            return await account.getSession('current');
        } catch {
            return null;
        }
    }

    /**
     * Get the current authenticated user
     */
    async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
        try {
            return await account.get();
        } catch {
            return null;
        }
    }

    /**
     * Get the full user profile with role information
     */
    async getAuthUser(): Promise<AuthUser | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            // Check if user is an admin
            const adminProfile = await this.getAdminProfile(user.$id);
            if (adminProfile) {
                return {
                    id: user.$id,
                    email: user.email,
                    name: adminProfile.name,
                    role: 'admin',
                    profileId: adminProfile.$id,
                };
            }

            // Check if user is an employee
            const employeeProfile = await this.getEmployeeProfile(user.$id);
            if (employeeProfile) {
                return {
                    id: user.$id,
                    email: user.email,
                    name: employeeProfile.name,
                    role: 'employee',
                    profileId: employeeProfile.$id,
                };
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Get admin profile by auth user ID
     */
    async getAdminProfile(authUserId: string): Promise<AdminProfile | null> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ADMINS,
                [Query.equal('authUserId', authUserId), Query.limit(1)]
            );
            return response.documents[0] as unknown as AdminProfile || null;
        } catch {
            return null;
        }
    }

    /**
     * Get employee profile by auth user ID
     */
    async getEmployeeProfile(authUserId: string): Promise<EmployeeProfile | null> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.EMPLOYEES,
                [Query.equal('authUserId', authUserId), Query.limit(1)]
            );
            return response.documents[0] as unknown as EmployeeProfile || null;
        } catch {
            return null;
        }
    }

    /**
     * Login as admin
     */
    async loginAdmin(email: string, password: string): Promise<AuthUser> {
        try {
            // Create email session
            await account.createEmailPasswordSession(email, password);

            // Get user and verify admin role
            const user = await account.get();
            const adminProfile = await this.getAdminProfile(user.$id);

            if (!adminProfile) {
                // Not an admin, logout and throw error
                await this.logout();
                throw new Error('Access denied. This account is not registered as an admin.');
            }

            return {
                id: user.$id,
                email: user.email,
                name: adminProfile.name,
                role: 'admin',
                profileId: adminProfile.$id,
            };
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('Access denied')) {
                throw error;
            }
            throw new Error('Invalid email or password');
        }
    }

    /**
     * Login as employee
     */
    async loginEmployee(email: string, password: string): Promise<AuthUser> {
        try {
            // Create email session
            await account.createEmailPasswordSession(email, password);

            // Get user and verify employee role
            const user = await account.get();
            const employeeProfile = await this.getEmployeeProfile(user.$id);

            if (!employeeProfile) {
                // Not an employee, logout and throw error
                await this.logout();
                throw new Error('Access denied. This account is not registered as an employee.');
            }

            // Check if employee is active
            if (employeeProfile.status !== 'active') {
                await this.logout();
                throw new Error('Your account is currently inactive. Please contact HR.');
            }

            return {
                id: user.$id,
                email: user.email,
                name: employeeProfile.name,
                role: 'employee',
                profileId: employeeProfile.$id,
            };
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('Access denied')) {
                throw error;
            }
            if (error instanceof Error && error.message.includes('inactive')) {
                throw error;
            }
            throw new Error('Invalid email or password');
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        try {
            await account.deleteSession('current');
        } catch {
            // Session might already be invalid
        }
    }

    /**
     * Create a new user account (used when adding employees)
     */
    async createUserAccount(email: string, password: string, name: string): Promise<Models.User<Models.Preferences>> {
        return await account.create(ID.unique(), email, password, name);
    }

    /**
     * Check if current session is valid
     */
    async isAuthenticated(): Promise<boolean> {
        const session = await this.getCurrentSession();
        return session !== null;
    }

    /**
     * Get current user's role
     */
    async getUserRole(): Promise<UserRole> {
        const authUser = await this.getAuthUser();
        return authUser?.role || null;
    }
}

export const authService = new AuthService();
export default authService;
