/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Delete All Admins Script
 * Removes all admin documents and their auth users
 */

import 'dotenv/config';
import { Client, Databases, Users, Query } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY';

const DATABASE_ID = 'hr_portal_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function deleteAllAdmins() {
    console.log('🗑️  Deleting all admins...\n');

    try {
        // Get all admins
        const admins = await databases.listDocuments(DATABASE_ID, 'admins', [Query.limit(100)]);

        console.log(`Found ${admins.total} admin(s) to delete:\n`);

        for (const admin of admins.documents) {
            console.log(`   Deleting ${admin.name} (${admin.email})...`);

            // Delete the auth user if exists
            if (admin.authUserId) {
                try {
                    await users.delete(admin.authUserId);
                    console.log(`      ✅ Auth user deleted`);
                } catch (e: any) {
                    console.log(`      ⚠️  Auth user not found or already deleted`);
                }
            }

            // Delete the admin document
            await databases.deleteDocument(DATABASE_ID, 'admins', admin.$id);
            console.log(`      ✅ Admin document deleted`);
        }

        console.log(`\n✅ Deleted ${admins.total} admin(s) successfully!`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

deleteAllAdmins();
