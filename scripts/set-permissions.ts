/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Set Collection Permissions Script
 * Sets proper permissions on collections so users can read/write documents
 * 
 * Usage: npx tsx scripts/set-permissions.ts
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

async function setPermissions() {
    console.log('\n🔐 Setting Collection Permissions...\n');

    const collections = [
        {
            id: 'employees',
            permissions: [
                Permission.read(Role.users()),    // Authenticated users can read
                Permission.create(Role.users()),  // Authenticated users can create (for signup)
                Permission.update(Role.users()),  // Users can update own docs
            ]
        },
        {
            id: 'admins',
            permissions: [
                Permission.read(Role.users()),    // Authenticated users can read
            ]
        },
        {
            id: 'attendance',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
            ]
        },
        {
            id: 'tasks',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
            ]
        },
        {
            id: 'task_notes',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
            ]
        },
        {
            id: 'leaves',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
            ]
        },
    ];

    for (const collection of collections) {
        try {
            console.log(`Setting permissions for ${collection.id}...`);
            await databases.updateCollection(
                DATABASE_ID,
                collection.id,
                collection.id.charAt(0).toUpperCase() + collection.id.slice(1).replace('_', ' '),
                collection.permissions,
                false, // documentSecurity - allow collection-level permissions to apply to all docs
                true   // enabled
            );
            console.log(`   ✅ ${collection.id} permissions set`);
        } catch (error: any) {
            console.error(`   ❌ Error setting ${collection.id}: ${error.message}`);
        }
    }

    console.log('\n✅ Permissions updated!');
    console.log('\nNow try logging in again at http://localhost:8080/admin/login');
}

setPermissions();
