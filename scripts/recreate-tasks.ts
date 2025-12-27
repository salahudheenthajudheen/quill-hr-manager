/**
 * Recreate Tasks Collection
 * Deletes and recreates the tasks collection with optimized attributes
 */

import { Client, Databases, Permission, Role } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY';

const DATABASE_ID = 'hr_portal_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function recreateTasksCollection() {
    console.log('🗑️  Deleting existing tasks collection...');
    try {
        await databases.deleteCollection(DATABASE_ID, 'tasks');
        console.log('   ✅ Deleted');
    } catch (error: any) {
        console.log(`   ⚠️  ${error.message}`);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📦 Creating new tasks collection with optimized attributes...');
    try {
        await databases.createCollection(
            DATABASE_ID,
            'tasks',
            'Tasks',
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
            ]
        );
        console.log('   ✅ Collection created');

        // Add attributes (minimized to fit within limits)
        // Appwrite free tier has ~16KB total attribute size limit
        console.log('   Adding attributes...');
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'title', 200, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'description', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedTo', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'employeeName', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedBy', 50, true);
        await databases.createEnumAttribute(DATABASE_ID, 'tasks', 'priority', ['low', 'medium', 'high'], false, 'medium');
        await databases.createEnumAttribute(DATABASE_ID, 'tasks', 'status', ['pending', 'in-progress', 'completed', 'accepted', 'rejected'], false, 'pending');
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'dueDate', 20, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignedDate', 20, true);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'completedDate', 20, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'rejectionNote', 300, false);
        await databases.createStringAttribute(DATABASE_ID, 'tasks', 'completionNotes', 300, false);

        console.log('   Waiting for attributes to process...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Add indexes
        console.log('   Adding indexes...');
        await databases.createIndex(DATABASE_ID, 'tasks', 'assignedTo_idx', 'key' as any, ['assignedTo']);
        await databases.createIndex(DATABASE_ID, 'tasks', 'status_idx', 'key' as any, ['status']);
        await databases.createIndex(DATABASE_ID, 'tasks', 'dueDate_idx', 'key' as any, ['dueDate']);

        console.log('\n✅ Tasks collection recreated successfully!');
        console.log('   Refresh your browser to test.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

recreateTasksCollection();
