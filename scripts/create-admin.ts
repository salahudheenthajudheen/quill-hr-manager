/**
 * Create Admin User Script
 * Creates an admin user in Appwrite Auth and adds them to the admins collection
 * 
 * Usage: npx tsx scripts/create-admin.ts
 */

import { Client, Databases, Users, ID } from 'node-appwrite';

// ============================================
// CONFIGURATION
// ============================================
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY';

const DATABASE_ID = 'hr_portal_db';

// Admin credentials to create
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'HR Admin';

// ============================================
// Initialize Appwrite Client (Server SDK)
// ============================================
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function createAdmin() {
    console.log('\n🔐 Creating Admin User...\n');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Name: ${ADMIN_NAME}`);

    try {
        // Step 1: Create user in Appwrite Auth
        console.log('\n1. Creating user in Appwrite Auth...');
        const user = await users.create(
            ID.unique(),
            ADMIN_EMAIL,
            undefined, // phone
            ADMIN_PASSWORD,
            ADMIN_NAME
        );
        console.log(`   ✅ User created with ID: ${user.$id}`);

        // Step 2: Create admin document in database
        console.log('\n2. Creating admin document in database...');
        const adminDoc = await databases.createDocument(
            DATABASE_ID,
            'admins',
            ID.unique(),
            {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                role: 'HR Manager',
                authUserId: user.$id,
            }
        );
        console.log(`   ✅ Admin document created with ID: ${adminDoc.$id}`);

        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 Login credentials:');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('\n   Use these at: http://localhost:5173/admin/login');

    } catch (error: any) {
        if (error.code === 409) {
            console.log('\n⚠️  A user with this email already exists.');
            console.log('   If you need to reset, delete the user from Appwrite Console first.');
        } else {
            console.error('\n❌ Error creating admin:', error.message);
        }
        process.exit(1);
    }
}

createAdmin();
