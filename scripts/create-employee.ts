/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create Employee Script
 * Creates an employee with both auth account and database document
 * 
 * Usage: 
 *   npx tsx scripts/create-employee.ts <email> <password> <name> <phone> <department> <position>
 * 
 * Example:
 *   npx tsx scripts/create-employee.ts john@company.com Password123 "John Doe" "+1234567890" "Engineering" "Developer"
 */

import { Client, Databases, Users, ID } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY';

const DATABASE_ID = 'hr_portal_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

interface EmployeeData {
    email: string;
    password: string;
    name: string;
    phone: string;
    department: string;
    position: string;
}

async function createEmployee(data: EmployeeData) {
    console.log('\n👤 Creating Employee...\n');
    console.log(`Name: ${data.name}`);
    console.log(`Email: ${data.email}`);
    console.log(`Department: ${data.department}`);
    console.log(`Position: ${data.position}`);

    try {
        // Step 1: Create auth user
        console.log('\n1. Creating auth user...');
        const authUser = await users.create(
            ID.unique(),
            data.email,
            undefined, // phone
            data.password,
            data.name
        );
        console.log(`   ✅ Auth user created: ${authUser.$id}`);

        // Step 2: Create employee document
        console.log('\n2. Creating employee document...');
        const defaultBalance = { casual: 6, sick: 6, earned: 12 };

        const employee = await databases.createDocument(
            DATABASE_ID,
            'employees',
            ID.unique(),
            {
                name: data.name,
                email: data.email,
                phone: data.phone,
                department: data.department,
                position: data.position,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
                location: '',
                authUserId: authUser.$id,
                leaveBalance: JSON.stringify(defaultBalance),
            }
        );
        console.log(`   ✅ Employee document created: ${employee.$id}`);

        console.log('\n✅ Employee created successfully!');
        console.log('\n📋 Login credentials:');
        console.log(`   Email: ${data.email}`);
        console.log(`   Password: ${data.password}`);
        console.log(`   Login URL: http://localhost:8080/login`);

    } catch (error: any) {
        if (error.code === 409) {
            console.log('\n❌ Error: A user with this email already exists.');
        } else {
            console.error('\n❌ Error:', error.message);
        }
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 6) {
    console.log('Usage: npx tsx scripts/create-employee.ts <email> <password> <name> <phone> <department> <position>');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/create-employee.ts john@company.com Password123 "John Doe" "+1234567890" "Engineering" "Developer"');
    process.exit(1);
}

createEmployee({
    email: args[0],
    password: args[1],
    name: args[2],
    phone: args[3],
    department: args[4],
    position: args[5],
});
