/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test Appwrite Connection
 * Verifies that the Appwrite backend is properly configured and accessible
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

async function testConnection() {
    console.log('🔍 Testing Appwrite Connection...\n');
    console.log(`Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`Project: ${APPWRITE_PROJECT_ID}`);
    console.log(`Database: ${DATABASE_ID}\n`);

    let allPassed = true;

    // Test 1: Check database exists
    console.log('1️⃣  Testing database access...');
    try {
        const db = await databases.get(DATABASE_ID);
        console.log(`   ✅ Database "${db.name}" exists\n`);
    } catch (error: any) {
        console.log(`   ❌ Database error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 2: Check collections
    const collections = ['employees', 'admins', 'attendance', 'tasks', 'task_notes', 'leaves'];
    console.log('2️⃣  Testing collections...');

    for (const collectionId of collections) {
        try {
            const collection = await databases.getCollection(DATABASE_ID, collectionId);
            const docs = await databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(1)]);
            console.log(`   ✅ ${collectionId}: ${docs.total} documents, ${collection.attributes.length} attributes`);
        } catch (error: any) {
            console.log(`   ❌ ${collectionId}: ${error.message}`);
            allPassed = false;
        }
    }

    // Test 3: Check auth users
    console.log('\n3️⃣  Testing auth users...');
    try {
        const usersList = await users.list([Query.limit(10)]);
        console.log(`   ✅ ${usersList.total} auth users found`);
        if (usersList.users.length > 0) {
            console.log('   Users:');
            usersList.users.forEach(u => {
                console.log(`      - ${u.name} (${u.email})`);
            });
        }
    } catch (error: any) {
        console.log(`   ❌ Auth error: ${error.message}`);
        allPassed = false;
    }

    // Test 4: Check admin user exists
    console.log('\n4️⃣  Testing admin document...');
    try {
        const admins = await databases.listDocuments(DATABASE_ID, 'admins', [Query.limit(5)]);
        if (admins.total > 0) {
            console.log(`   ✅ ${admins.total} admin(s) found`);
            admins.documents.forEach((admin: any) => {
                console.log(`      - ${admin.name} (${admin.email}) - ${admin.role}`);
            });
        } else {
            console.log('   ⚠️  No admin documents found. Create one to login.');
            allPassed = false;
        }
    } catch (error: any) {
        console.log(`   ❌ Admin error: ${error.message}`);
        allPassed = false;
    }

    // Test 5: Check employees exist
    console.log('\n5️⃣  Testing employees...');
    try {
        const employees = await databases.listDocuments(DATABASE_ID, 'employees', [Query.limit(5)]);
        if (employees.total > 0) {
            console.log(`   ✅ ${employees.total} employee(s) found`);
            employees.documents.forEach((emp: any) => {
                console.log(`      - ${emp.name} (${emp.email}) - ${emp.department} - Status: ${emp.status || 'N/A'}`);
            });
        } else {
            console.log('   ℹ️  No employees yet. Add some from the admin dashboard.');
        }
    } catch (error: any) {
        console.log(`   ❌ Employee error: ${error.message}`);
        allPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('✅ All tests passed! Appwrite backend is working correctly.');
        console.log('\n📌 Next steps:');
        console.log('   1. Start the dev server: npm run dev');
        console.log('   2. Login at: http://localhost:8080/admin/login');
        console.log('   3. Credentials: admin@company.com / Admin@123');
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.');
    }
}

testConnection().catch(console.error);
