/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fix Collections Script
 * Adds missing attributes to existing collections
 */

import { Client, Databases } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY';

const DATABASE_ID = 'hr_portal_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function addAttributeSafe(collectionId: string, attributeType: string, key: string, ...args: any[]) {
    try {
        switch (attributeType) {
            case 'string':
                await databases.createStringAttribute(DATABASE_ID, collectionId, key, args[0], args[1], args[2]);
                break;
            case 'enum':
                await databases.createEnumAttribute(DATABASE_ID, collectionId, key, args[0], args[1], args[2]);
                break;
            case 'integer':
                await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, args[0], args[1], args[2], args[3]);
                break;
            case 'float':
                await databases.createFloatAttribute(DATABASE_ID, collectionId, key, args[0], args[1], args[2], args[3]);
                break;
            case 'boolean':
                await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, args[0], args[1]);
                break;
            case 'datetime':
                await databases.createDatetimeAttribute(DATABASE_ID, collectionId, key, args[0], args[1]);
                break;
        }
        console.log(`   ✅ Added ${key} to ${collectionId}`);
        return true;
    } catch (error: any) {
        if (error.code === 409) {
            console.log(`   ⚠️  ${key} already exists in ${collectionId}`);
        } else {
            console.log(`   ❌ Failed to add ${key}: ${error.message}`);
        }
        return false;
    }
}

async function addIndexSafe(collectionId: string, indexKey: string, indexType: string, attributes: string[]) {
    try {
        await databases.createIndex(DATABASE_ID, collectionId, indexKey, indexType as any, attributes);
        console.log(`   ✅ Added index ${indexKey}`);
    } catch (error: any) {
        if (error.code === 409) {
            console.log(`   ⚠️  Index ${indexKey} already exists`);
        } else {
            console.log(`   ❌ Failed to add index ${indexKey}: ${error.message}`);
        }
    }
}

async function fixEmployeesCollection() {
    console.log('\n📦 Fixing employees collection...');

    // Add missing attributes
    await addAttributeSafe('employees', 'string', 'name', 255, true);
    await addAttributeSafe('employees', 'string', 'email', 255, true);
    await addAttributeSafe('employees', 'string', 'phone', 50, true);
    await addAttributeSafe('employees', 'string', 'department', 100, true);
    await addAttributeSafe('employees', 'string', 'position', 100, true);
    await addAttributeSafe('employees', 'enum', 'status', ['active', 'inactive', 'on-leave'], false, 'active');
    await addAttributeSafe('employees', 'string', 'joinDate', 50, true);
    await addAttributeSafe('employees', 'string', 'location', 255, false);
    await addAttributeSafe('employees', 'string', 'authUserId', 255, true);
    await addAttributeSafe('employees', 'string', 'leaveBalance', 1000, false);

    // Wait for attributes to process
    console.log('   Waiting for attributes to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add indexes
    await addIndexSafe('employees', 'email_unique', 'unique', ['email']);
    await addIndexSafe('employees', 'authUserId_idx', 'key', ['authUserId']);
    await addIndexSafe('employees', 'status_idx', 'key', ['status']);
    await addIndexSafe('employees', 'department_idx', 'key', ['department']);
}

async function fixTasksCollection() {
    console.log('\n📦 Fixing tasks collection...');

    await addAttributeSafe('tasks', 'string', 'title', 255, true);
    await addAttributeSafe('tasks', 'string', 'description', 2000, false);
    await addAttributeSafe('tasks', 'string', 'assignedTo', 255, true);
    await addAttributeSafe('tasks', 'string', 'employeeName', 255, true);
    await addAttributeSafe('tasks', 'string', 'assignedBy', 255, true);
    await addAttributeSafe('tasks', 'string', 'assignerName', 255, false);
    await addAttributeSafe('tasks', 'enum', 'priority', ['low', 'medium', 'high'], false, 'medium');
    await addAttributeSafe('tasks', 'enum', 'status', ['pending', 'in-progress', 'completed', 'accepted', 'rejected'], false, 'pending');
    await addAttributeSafe('tasks', 'string', 'dueDate', 50, true);
    await addAttributeSafe('tasks', 'string', 'assignedDate', 50, true);
    await addAttributeSafe('tasks', 'string', 'completedDate', 50, false);
    await addAttributeSafe('tasks', 'string', 'rejectionNote', 500, false);
    await addAttributeSafe('tasks', 'string', 'completionNotes', 500, false);
    await addAttributeSafe('tasks', 'string', 'referenceLinks', 1000, false);
    await addAttributeSafe('tasks', 'boolean', 'isRecurring', false, false);

    console.log('   Waiting for attributes to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await addIndexSafe('tasks', 'assignedTo_idx', 'key', ['assignedTo']);
    await addIndexSafe('tasks', 'status_idx', 'key', ['status']);
    await addIndexSafe('tasks', 'dueDate_idx', 'key', ['dueDate']);
    await addIndexSafe('tasks', 'priority_idx', 'key', ['priority']);
}

async function main() {
    console.log('🔧 Fixing Appwrite Collections...\n');
    console.log(`Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`Project: ${APPWRITE_PROJECT_ID}`);

    await fixEmployeesCollection();
    await fixTasksCollection();

    console.log('\n✅ Done! Refresh your browser to see changes.');
}

main().catch(console.error);
