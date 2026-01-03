/**
 * Simple API Server for HR Portal
 * Provides endpoints that require server-side Appwrite access
 * 
 * Start: npm run server
 * Runs on: http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import { Client, Databases, Users, ID, Query } from 'node-appwrite';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Enable XSS filter in browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
});

// Appwrite configuration from environment
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = 'hr_portal_db';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique employee ID with GW prefix
 * Format: GW-XXXXXX (6 digit number)
 */
async function generateEmployeeId(): Promise<string> {
    // Get the highest existing employee ID to increment
    try {
        const employees = await databases.listDocuments(DATABASE_ID, 'employees', [
            Query.orderDesc('$createdAt'),
            Query.limit(100)
        ]);

        let maxNumber = 0;
        for (const emp of employees.documents) {
            if (emp.employeeId && typeof emp.employeeId === 'string') {
                const match = emp.employeeId.match(/^GW-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        }

        const nextNumber = maxNumber + 1;
        return `GW-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
        // Fallback: use timestamp-based ID
        const timestamp = Date.now().toString().slice(-6);
        return `GW-${timestamp}`;
    }
}

/**
 * Validate employee ID format
 * Accepts any alphanumeric string with optional dashes/underscores
 */
function isValidEmployeeId(id: string): boolean {
    return id.length > 0 && id.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// ============================================
// Endpoints
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate a new employee ID (for frontend preview)
app.get('/api/employees/generate-id', async (req, res) => {
    try {
        const employeeId = await generateEmployeeId();
        res.json({ employeeId });
    } catch (error: unknown) {
        res.status(500).json({ error: 'Failed to generate employee ID' });
    }
});

// Create employee with auth account
app.post('/api/employees', async (req, res) => {
    try {
        const { name, email, password, phone, department, position, joinDate, location, employeeId } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !department || !position) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password', 'phone', 'department', 'position']
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Handle employee ID - use provided one or generate new
        let finalEmployeeId: string;
        if (employeeId) {
            // Validate format
            if (!isValidEmployeeId(employeeId)) {
                return res.status(400).json({
                    error: 'Invalid employee ID format. Use alphanumeric characters, dashes, or underscores (max 30 chars)'
                });
            }
            // Check if ID already exists
            const existing = await databases.listDocuments(DATABASE_ID, 'employees', [
                Query.equal('employeeId', employeeId),
                Query.limit(1)
            ]);
            if (existing.total > 0) {
                return res.status(409).json({ error: `Employee ID ${employeeId} already exists` });
            }
            finalEmployeeId = employeeId;
        } else {
            finalEmployeeId = await generateEmployeeId();
        }

        // Step 1: Create auth user
        const authUser = await users.create(
            ID.unique(),
            email,
            undefined, // phone auth
            password,
            name
        );

        // Step 2: Create employee document
        const defaultBalance = { casual: 6, sick: 6, earned: 12 };

        const employee = await databases.createDocument(
            DATABASE_ID,
            'employees',
            ID.unique(),
            {
                name,
                email,
                phone,
                department,
                position,
                status: 'active',
                joinDate: joinDate || new Date().toISOString().split('T')[0],
                location: location || '',
                authUserId: authUser.$id,
                employeeId: finalEmployeeId,
                leaveBalance: JSON.stringify(defaultBalance),
            }
        );

        res.status(201).json({
            success: true,
            employee: {
                id: employee.$id,
                employeeId: finalEmployeeId,
                authUserId: authUser.$id,
                name,
                email,
                department,
                position,
            },
            message: `Employee ${name} (${finalEmployeeId}) created successfully with login credentials`
        });

    } catch (error: unknown) {
        console.error('Create employee error:', error);
        const err = error as { code?: number; message?: string };

        if (err.code === 409) {
            return res.status(409).json({ error: 'An employee with this email already exists' });
        }

        res.status(500).json({ error: err.message || 'Failed to create employee' });
    }
});

// Delete employee (also removes auth user)
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get employee to find auth user ID
        const employee = await databases.getDocument(DATABASE_ID, 'employees', id);

        // Delete employee document
        await databases.deleteDocument(DATABASE_ID, 'employees', id);

        // Delete auth user
        if (employee.authUserId && !employee.authUserId.startsWith('pending-')) {
            try {
                await users.delete(employee.authUserId);
            } catch (e) {
                console.log('Auth user already deleted or not found');
            }
        }

        res.json({ success: true, message: 'Employee deleted successfully' });

    } catch (error: unknown) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to delete employee' });
    }
});

// ============================================
// Admin Management Endpoints
// ============================================

// Get all admins
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await databases.listDocuments(DATABASE_ID, 'admins', [
            Query.limit(100)
        ]);
        res.json({ admins: admins.documents, total: admins.total });
    } catch (error: unknown) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to fetch admins' });
    }
});

// Create new admin
app.post('/api/admins', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password']
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Step 1: Create auth user
        const authUser = await users.create(
            ID.unique(),
            email,
            undefined,
            password,
            name
        );

        // Step 2: Create admin document
        const admin = await databases.createDocument(
            DATABASE_ID,
            'admins',
            ID.unique(),
            {
                name,
                email,
                role: role || 'HR Manager',
                authUserId: authUser.$id,
            }
        );

        res.status(201).json({
            success: true,
            admin: {
                id: admin.$id,
                authUserId: authUser.$id,
                name,
                email,
                role: role || 'HR Manager',
            },
            message: `Admin ${name} created successfully`
        });

    } catch (error: unknown) {
        console.error('Create admin error:', error);
        const err = error as { code?: number; message?: string };

        if (err.code === 409) {
            return res.status(409).json({ error: 'An admin with this email already exists' });
        }

        res.status(500).json({ error: err.message || 'Failed to create admin' });
    }
});

// Delete admin
app.delete('/api/admins/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get admin to find auth user ID
        const admin = await databases.getDocument(DATABASE_ID, 'admins', id);

        // Delete admin document
        await databases.deleteDocument(DATABASE_ID, 'admins', id);

        // Delete auth user
        if (admin.authUserId) {
            try {
                await users.delete(admin.authUserId);
            } catch (e) {
                console.log('Auth user already deleted or not found');
            }
        }

        res.json({ success: true, message: 'Admin deleted successfully' });

    } catch (error: unknown) {
        console.error('Delete admin error:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to delete admin' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 HR Portal API Server running on http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`   GET    /api/employees/generate-id - Generate new employee ID`);
    console.log(`   POST   /api/employees   - Create employee with login`);
    console.log(`   DELETE /api/employees/:id - Delete employee`);
    console.log(`   GET    /api/admins      - List admins`);
    console.log(`   POST   /api/admins      - Create admin with login`);
    console.log(`   DELETE /api/admins/:id  - Delete admin`);
    console.log(`   GET    /api/health      - Health check`);
    console.log(`\nMake sure the frontend is configured to use this API.`);
});
