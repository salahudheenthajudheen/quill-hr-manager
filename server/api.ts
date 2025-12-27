/**
 * Simple API Server for HR Portal
 * Provides endpoints that require server-side Appwrite access
 * 
 * Start: npm run server
 * Runs on: http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import { Client, Databases, Users, ID } from 'node-appwrite';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create employee with auth account
app.post('/api/employees', async (req, res) => {
    try {
        const { name, email, password, phone, department, position, joinDate, location } = req.body;

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
                leaveBalance: JSON.stringify(defaultBalance),
            }
        );

        res.status(201).json({
            success: true,
            employee: {
                id: employee.$id,
                authUserId: authUser.$id,
                name,
                email,
                department,
                position,
            },
            message: `Employee ${name} created successfully with login credentials`
        });

    } catch (error: any) {
        console.error('Create employee error:', error);

        if (error.code === 409) {
            return res.status(409).json({ error: 'An employee with this email already exists' });
        }

        res.status(500).json({ error: error.message || 'Failed to create employee' });
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

    } catch (error: any) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete employee' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 HR Portal API Server running on http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`   POST   /api/employees   - Create employee with login`);
    console.log(`   DELETE /api/employees/:id - Delete employee`);
    console.log(`   GET    /api/health      - Health check`);
    console.log(`\nMake sure the frontend is configured to use this API.`);
});
