/**
 * Add employeeId attribute to employees collection
 * Run: npx tsx scripts/add-employee-id-attribute.ts
 */

import { Client, Databases } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = 'hr_portal_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function addEmployeeIdAttribute() {
    console.log('\n🔧 Adding employeeId attribute to employees collection...\n');

    try {
        // Add the employeeId attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            'employees',
            'employeeId',
            20,      // max length
            false,   // not required (for backward compatibility)
        );
        console.log('✅ employeeId attribute created');

        // Wait for attribute to be ready
        console.log('⏳ Waiting for attribute to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create unique index on employeeId
        try {
            await databases.createIndex(
                DATABASE_ID,
                'employees',
                'employeeId_unique',
                'unique',
                ['employeeId']
            );
            console.log('✅ Unique index on employeeId created');
        } catch (e: any) {
            if (e.code === 409) {
                console.log('⚠️  Index already exists');
            } else {
                throw e;
            }
        }

        console.log('\n✅ Successfully added employeeId attribute!');
        console.log('\nNext steps:');
        console.log('1. Restart your API server: npm run server');
        console.log('2. New employees will be assigned GW-XXXXXX IDs');
        console.log('3. Existing employees can be updated with IDs via the admin panel\n');

    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  employeeId attribute already exists');
        } else {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
}

addEmployeeIdAttribute();
