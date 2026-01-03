/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Appwrite Database Setup Script
 * Run this script to automatically create all collections for the HR Portal
 * 
 * Usage: 
 *   1. Update the API_KEY below with your Appwrite API Key (from Appwrite Console > Project Settings > API Keys)
 *   2. Run: npx tsx scripts/setup-appwrite.ts
 */

import { Client, Databases, ID } from 'node-appwrite';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY'; // Get this from Appwrite Console

const DATABASE_ID = 'hr_portal_db';

// ============================================
// Initialize Appwrite Client (Server SDK)
// ============================================
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// ============================================
// Collection Schemas
// ============================================

async function createEmployeesCollection() {
    console.log('Creating employees collection...');

    try {
        await databases.createCollection(
            DATABASE_ID,
            'employees',
            'Employees',
            [
                // Read access for authenticated users, full access for admins would be set via labels
            ]
        );

        // Create attributes
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'name', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'email', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'phone', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'department', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'position', 100, true);
        await databases.createEnumAttribute(DATABASE_ID, 'employees', 'status', ['active', 'inactive', 'on-leave'], false, 'active');
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'joinDate', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'location', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'authUserId', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'employees', 'leaveBalance', 1000, false);

        // Wait for attributes to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create indexes
        await databases.createIndex(DATABASE_ID, 'employees', 'email_unique', 'unique', ['email']);
        await databases.createIndex(DATABASE_ID, 'employees', 'authUserId_idx', 'key', ['authUserId']);
        await databases.createIndex(DATABASE_ID, 'employees', 'status_idx', 'key', ['status']);
        await databases.createIndex(DATABASE_ID, 'employees', 'department_idx', 'key', ['department']);

        console.log('✅ Employees collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Employees collection already exists');
        } else {
            throw error;
        }
    }
}

async function createAdminsCollection() {
    console.log('Creating admins collection...');

    try {
        await databases.createCollection(DATABASE_ID, 'admins', 'Admins');

        await databases.createStringAttribute(DATABASE_ID, 'admins', 'name', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'admins', 'email', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'admins', 'role', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'admins', 'authUserId', 255, true);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await databases.createIndex(DATABASE_ID, 'admins', 'email_unique', 'unique', ['email']);
        await databases.createIndex(DATABASE_ID, 'admins', 'authUserId_idx', 'key', ['authUserId']);

        console.log('✅ Admins collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Admins collection already exists');
        } else {
            throw error;
        }
    }
}

async function createAttendanceCollection() {
    console.log('Creating attendance collection...');

    try {
        await databases.createCollection(DATABASE_ID, 'attendance', 'Attendance');

        await databases.createStringAttribute(DATABASE_ID, 'attendance', 'employeeId', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'attendance', 'employeeName', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'attendance', 'date', 50, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'attendance', 'checkIn', false);
        await databases.createDatetimeAttribute(DATABASE_ID, 'attendance', 'checkOut', false);
        await databases.createStringAttribute(DATABASE_ID, 'attendance', 'checkInLocation', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'attendance', 'checkOutLocation', 500, false);
        await databases.createEnumAttribute(DATABASE_ID, 'attendance', 'status', ['present', 'absent', 'late', 'half-day', 'wfh'], true);
        await databases.createEnumAttribute(DATABASE_ID, 'attendance', 'attendanceType', ['office', 'wfh'], true);
        await databases.createFloatAttribute(DATABASE_ID, 'attendance', 'workingHours', false);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await databases.createIndex(DATABASE_ID, 'attendance', 'employeeId_idx', 'key', ['employeeId']);
        await databases.createIndex(DATABASE_ID, 'attendance', 'date_idx', 'key', ['date']);
        await databases.createIndex(DATABASE_ID, 'attendance', 'status_idx', 'key', ['status']);

        console.log('✅ Attendance collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Attendance collection already exists');
        } else {
            throw error;
        }
    }
}

async function createTasksCollection() {
    console.log('Creating tasks collection...');

    try {
        await databases.createCollection(DATABASE_ID, 'tasks', 'Tasks');

        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'title', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'description', 2000, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedTo', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'employeeName', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedBy', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignerName', 255, false);
        await databases.createEnumAttribute(DATABASE_ID, 'tasks', 'priority', ['low', 'medium', 'high'], false, 'medium');
        await databases.createEnumAttribute(DATABASE_ID, 'tasks', 'status', ['pending', 'in-progress', 'completed', 'accepted', 'rejected'], false, 'pending');
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'dueDate', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedDate', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'completedDate', 50, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'rejectionNote', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'completionNotes', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'referenceLinks', 1000, false);
        await databases.createBooleanAttribute(DATABASE_ID, 'tasks', 'isRecurring', false, false);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await databases.createIndex(DATABASE_ID, 'tasks', 'assignedTo_idx', 'key', ['assignedTo']);
        await databases.createIndex(DATABASE_ID, 'tasks', 'status_idx', 'key', ['status']);
        await databases.createIndex(DATABASE_ID, 'tasks', 'dueDate_idx', 'key', ['dueDate']);
        await databases.createIndex(DATABASE_ID, 'tasks', 'priority_idx', 'key', ['priority']);

        console.log('✅ Tasks collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Tasks collection already exists');
        } else {
            throw error;
        }
    }
}

async function createTaskNotesCollection() {
    console.log('Creating task_notes collection...');

    try {
        await databases.createCollection(DATABASE_ID, 'task_notes', 'Task Notes');

        await databases.createStringAttribute(DATABASE_ID, 'task_notes', 'taskId', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'task_notes', 'employeeId', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'task_notes', 'content', 5000, true);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await databases.createIndex(DATABASE_ID, 'task_notes', 'taskId_idx', 'key', ['taskId']);
        await databases.createIndex(DATABASE_ID, 'task_notes', 'employeeId_idx', 'key', ['employeeId']);

        console.log('✅ Task Notes collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Task Notes collection already exists');
        } else {
            throw error;
        }
    }
}

async function createLeavesCollection() {
    console.log('Creating leaves collection...');

    try {
        await databases.createCollection(DATABASE_ID, 'leaves', 'Leaves');

        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'employeeId', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'employeeName', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'leaveType', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'subject', 500, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'description', 2000, false);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'fromDate', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'toDate', 50, true);
        await databases.createIntegerAttribute(DATABASE_ID, 'leaves', 'days', true);
        await databases.createEnumAttribute(DATABASE_ID, 'leaves', 'status', ['pending', 'approved', 'rejected'], false, 'pending');
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'appliedDate', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'reviewedBy', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'reviewerName', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'reviewedDate', 50, false);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'comments', 2000, false);
        await databases.createStringAttribute(DATABASE_ID, 'leaves', 'documentId', 255, false);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await databases.createIndex(DATABASE_ID, 'leaves', 'employeeId_idx', 'key', ['employeeId']);
        await databases.createIndex(DATABASE_ID, 'leaves', 'status_idx', 'key', ['status']);
        await databases.createIndex(DATABASE_ID, 'leaves', 'fromDate_idx', 'key', ['fromDate']);
        await databases.createIndex(DATABASE_ID, 'leaves', 'leaveType_idx', 'key', ['leaveType']);

        console.log('✅ Leaves collection created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Leaves collection already exists');
        } else {
            throw error;
        }
    }
}

async function createDatabase() {
    console.log('Creating database...');

    try {
        await databases.create(DATABASE_ID, 'HR Portal Database');
        console.log('✅ Database created');
    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Database already exists');
        } else {
            throw error;
        }
    }
}

// ============================================
// Main Setup Function
// ============================================

async function setup() {
    console.log('\n🚀 Starting Appwrite HR Portal Setup...\n');
    console.log(`Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}\n`);

    if (API_KEY === 'YOUR_API_KEY' || APPWRITE_PROJECT_ID === 'YOUR_PROJECT_ID') {
        console.error('❌ Please update the configuration values at the top of this script!');
        console.error('   - APPWRITE_PROJECT_ID: Get from Appwrite Console > Project Settings');
        console.error('   - API_KEY: Create one in Appwrite Console > Project Settings > API Keys');
        console.error('\n   Or set environment variables:');
        console.error('   export VITE_APPWRITE_PROJECT_ID=your_project_id');
        console.error('   export APPWRITE_API_KEY=your_api_key');
        process.exit(1);
    }

    try {
        // Create database
        await createDatabase();

        // Create collections (with delay between each for attribute processing)
        await createEmployeesCollection();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await createAdminsCollection();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await createAttendanceCollection();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await createTasksCollection();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await createTaskNotesCollection();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await createLeavesCollection();

        console.log('\n✅ Setup complete!');
        console.log('\n📋 Next steps:');
        console.log('   1. Go to Appwrite Console > Auth > Users');
        console.log('   2. Create an admin user with email/password');
        console.log('   3. Copy the user ID');
        console.log('   4. Create a document in the "admins" collection with:');
        console.log('      {');
        console.log('        "name": "Admin Name",');
        console.log('        "email": "admin@company.com",');
        console.log('        "role": "HR Manager",');
        console.log('        "authUserId": "<user_id_from_step_3>"');
        console.log('      }');
        console.log('\n   5. Update your .env file with the correct Project ID');
        console.log('   6. Run: npm run dev');

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    }
}

setup();
