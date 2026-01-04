/**
 * Simple API Server for HR Portal
 * Deploy this to Railway, Render, or any Node.js hosting
 */

import express from 'express';
import cors from 'cors';
import { Client, Databases, Users, ID, Query } from 'node-appwrite';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: true,  // Allow all origins (configure for production)
    credentials: true
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Appwrite configuration from environment
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = 'hr_portal_db';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

// Generate employee ID
async function generateEmployeeId() {
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
        const timestamp = Date.now().toString().slice(-6);
        return `GW-${timestamp}`;
    }
}

function isValidEmployeeId(id) {
    return id.length > 0 && id.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate employee ID
app.get('/api/employees/generate-id', async (req, res) => {
    try {
        const employeeId = await generateEmployeeId();
        res.json({ employeeId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate employee ID' });
    }
});

// Create employee
app.post('/api/employees', async (req, res) => {
    try {
        const { name, email, password, phone, department, position, joinDate, location, employeeId } = req.body;

        if (!name || !email || !password || !phone || !department || !position) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password', 'phone', 'department', 'position']
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        let finalEmployeeId;
        if (employeeId) {
            if (!isValidEmployeeId(employeeId)) {
                return res.status(400).json({ error: 'Invalid employee ID format' });
            }
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

        // Create auth user
        const authUser = await users.create(ID.unique(), email, undefined, password, name);

        // Create employee document
        const defaultBalance = { casual: 6, sick: 6, earned: 12 };
        const employee = await databases.createDocument(
            DATABASE_ID,
            'employees',
            ID.unique(),
            {
                name, email, phone, department, position,
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
                name, email, department, position,
            },
            message: `Employee ${name} (${finalEmployeeId}) created successfully`
        });

    } catch (error) {
        console.error('Create employee error:', error);
        if (error.code === 409) {
            return res.status(409).json({ error: 'An employee with this email already exists' });
        }
        res.status(500).json({ error: error.message || 'Failed to create employee' });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await databases.getDocument(DATABASE_ID, 'employees', id);
        await databases.deleteDocument(DATABASE_ID, 'employees', id);

        if (employee.authUserId && !employee.authUserId.startsWith('pending-')) {
            try {
                await users.delete(employee.authUserId);
            } catch (e) {
                console.log('Auth user already deleted');
            }
        }

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to delete employee' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 HR Portal API running on port ${PORT}`);
});
