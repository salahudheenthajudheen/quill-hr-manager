import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// Initialize Appwrite Client
const client = new Client();

// Fallback values for production (when env vars aren't available)
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

if (!PROJECT_ID) {
  console.error('VITE_APPWRITE_PROJECT_ID is not set. Please configure environment variables.');
}

client
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

// Initialize Services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
  EMPLOYEES: import.meta.env.VITE_COLLECTION_EMPLOYEES,
  ADMINS: import.meta.env.VITE_COLLECTION_ADMINS,
  ATTENDANCE: import.meta.env.VITE_COLLECTION_ATTENDANCE,
  TASKS: import.meta.env.VITE_COLLECTION_TASKS,
  TASK_NOTES: import.meta.env.VITE_COLLECTION_TASK_NOTES,
  LEAVES: import.meta.env.VITE_COLLECTION_LEAVES,
};

// Storage Bucket IDs
export const BUCKETS = {
  TASK_ATTACHMENTS: import.meta.env.VITE_BUCKET_TASK_ATTACHMENTS,
  LEAVE_DOCUMENTS: import.meta.env.VITE_BUCKET_LEAVE_DOCUMENTS,
  EMPLOYEE_AVATARS: import.meta.env.VITE_BUCKET_EMPLOYEE_AVATARS,
};

// Office Location for Geofencing
export const OFFICE_LOCATION = {
  latitude: parseFloat(import.meta.env.VITE_OFFICE_LATITUDE) || 19.0760,
  longitude: parseFloat(import.meta.env.VITE_OFFICE_LONGITUDE) || 72.8777,
  radiusMeters: parseFloat(import.meta.env.VITE_GEOFENCE_RADIUS_METERS) || 100,
};

// Re-export utilities
export { ID, Query };

export default client;
