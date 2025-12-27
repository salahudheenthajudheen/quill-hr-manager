/**
 * Admin Service
 * Handles admin management operations
 * - Read operations use client-side Appwrite (user's session)
 * - Create/Delete operations use API server (requires API key)
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

// API server URL for operations requiring server-side access
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Admin {
    $id: string;
    name: string;
    email: string;
    role: string;
    authUserId: string;
    $createdAt: string;
}

export interface CreateAdminData {
    name: string;
    email: string;
    password: string;
    role?: string;
}

class AdminService {
    /**
     * Get all admins using client-side Appwrite (uses logged-in user's session)
     */
    async getAdmins(): Promise<{ admins: Admin[]; total: number }> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ADMINS,
                [Query.limit(100)]
            );

            return {
                admins: response.documents as unknown as Admin[],
                total: response.total,
            };
        } catch (error) {
            console.error('Get admins error:', error);
            throw error;
        }
    }

    /**
     * Create a new admin with login credentials (uses API server)
     */
    async createAdmin(data: CreateAdminData): Promise<Admin> {
        try {
            const response = await fetch(`${API_URL}/api/admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create admin');
            }

            return result.admin as Admin;
        } catch (error) {
            console.error('Create admin error:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('API server not running. Please start it with: npm run server');
            }
            throw error;
        }
    }

    /**
     * Delete an admin (uses API server)
     */
    async deleteAdmin(adminId: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/api/admins/${adminId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Delete admin error:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('API server not running. Please start it with: npm run server');
            }
            throw error;
        }
    }
}

export const adminService = new AdminService();
export default adminService;

