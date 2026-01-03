/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Delete All Employees Script
 * Removes all employee documents and their auth users
 */

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

async function deleteAllEmployees() {
    console.log('🗑️  Deleting all employees...\n');

    try {
        // Get all employees
        const employees = await databases.listDocuments(DATABASE_ID, 'employees', [Query.limit(100)]);

        console.log(`Found ${employees.total} employee(s) to delete:\n`);

        for (const employee of employees.documents) {
            console.log(`   Deleting ${employee.name} (${employee.email})...`);

            // Delete the auth user if exists
            if (employee.authUserId && !employee.authUserId.startsWith('pending-')) {
                try {
                    await users.delete(employee.authUserId);
                    console.log(`      ✅ Auth user deleted`);
                } catch (e: any) {
                    console.log(`      ⚠️  Auth user not found or already deleted`);
                }
            }

            // Delete the employee document
            await databases.deleteDocument(DATABASE_ID, 'employees', employee.$id);
            console.log(`      ✅ Employee document deleted`);
        }

        console.log(`\n✅ Deleted ${employees.total} employee(s) successfully!`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

deleteAllEmployees();
