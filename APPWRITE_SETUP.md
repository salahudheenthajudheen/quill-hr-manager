# Appwrite Database Setup Guide

This guide explains how to set up the Appwrite database collections for the HR Portal.

## Prerequisites

1. Create an Appwrite account at [cloud.appwrite.io](https://cloud.appwrite.io) or set up a self-hosted instance
2. Create a new project
3. Note your **Project ID** and **Endpoint URL**

## Step 1: Update Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_OFFICE_LATITUDE=your_office_latitude
VITE_OFFICE_LONGITUDE=your_office_longitude
VITE_GEOFENCE_RADIUS_METERS=100
```

## Step 2: Create Database

1. Go to Appwrite Console → Databases
2. Create a new database with ID: `hr_portal_db`

## Step 3: Create Collections

### Collection: `employees`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `name` | string (255) | Yes | No | - |
| `email` | string (255) | Yes | No | - |
| `phone` | string (50) | Yes | No | - |
| `department` | string (100) | Yes | No | - |
| `position` | string (100) | Yes | No | - |
| `status` | enum [`active`, `inactive`, `on-leave`] | Yes | No | `active` |
| `joinDate` | string (50) | Yes | No | - |
| `location` | string (255) | No | No | - |
| `authUserId` | string (255) | Yes | No | - |
| `leaveBalance` | string (1000) | No | No | - |

**Indexes:**
- `email` (unique)
- `authUserId` (key)
- `status` (key)
- `department` (key)
- `name` (fulltext)

**Permissions:**
- Users: Read (own documents based on authUserId)
- Admins: All operations

---

### Collection: `admins`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `name` | string (255) | Yes | No | - |
| `email` | string (255) | Yes | No | - |
| `role` | string (100) | Yes | No | - |
| `authUserId` | string (255) | Yes | No | - |

**Indexes:**
- `email` (unique)
- `authUserId` (key)

**Permissions:**
- Admins: All operations

---

### Collection: `attendance`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `employeeId` | string (255) | Yes | No | - |
| `employeeName` | string (255) | Yes | No | - |
| `date` | string (50) | Yes | No | - |
| `checkIn` | datetime | No | No | - |
| `checkOut` | datetime | No | No | - |
| `checkInLocation` | string (500) | No | No | - |
| `checkOutLocation` | string (500) | No | No | - |
| `status` | enum [`present`, `absent`, `late`, `half-day`, `wfh`] | Yes | No | - |
| `attendanceType` | enum [`office`, `wfh`] | Yes | No | - |
| `workingHours` | float | No | No | - |

**Indexes:**
- `employeeId` (key)
- `date` (key)
- `status` (key)
- Composite: `employeeId` + `date`

**Permissions:**
- Employees: Read/Create (own documents)
- Admins: All operations

---

### Collection: `tasks`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `title` | string (255) | Yes | No | - |
| `description` | string (5000) | No | No | - |
| `assignedTo` | string (255) | Yes | No | - |
| `employeeName` | string (255) | Yes | No | - |
| `assignedBy` | string (255) | Yes | No | - |
| `assignerName` | string (255) | No | No | - |
| `priority` | enum [`low`, `medium`, `high`] | Yes | No | `medium` |
| `status` | enum [`pending`, `in-progress`, `completed`, `accepted`, `rejected`] | Yes | No | `pending` |
| `dueDate` | string (50) | Yes | No | - |
| `assignedDate` | string (50) | Yes | No | - |
| `completedDate` | string (50) | No | No | - |
| `rejectionNote` | string (2000) | No | No | - |
| `completionNotes` | string (2000) | No | No | - |
| `referenceLinks` | string (5000) | No | No | - |
| `attachments` | string (5000) | No | No | - |
| `isRecurring` | boolean | No | No | `false` |
| `deliveryMethod` | string (255) | No | No | - |

**Indexes:**
- `assignedTo` (key)
- `status` (key)
- `dueDate` (key)
- `priority` (key)
- `title` (fulltext)

**Permissions:**
- Employees: Read/Update (own assigned tasks)
- Admins: All operations

---

### Collection: `task_notes`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `taskId` | string (255) | Yes | No | - |
| `employeeId` | string (255) | Yes | No | - |
| `content` | string (5000) | Yes | No | - |

**Indexes:**
- `taskId` (key)
- `employeeId` (key)

**Permissions:**
- Employees: Read/Create (own notes)
- Admins: All operations

---

### Collection: `leaves`

| Attribute | Type | Required | Array | Default |
|-----------|------|----------|-------|---------|
| `employeeId` | string (255) | Yes | No | - |
| `employeeName` | string (255) | Yes | No | - |
| `leaveType` | string (100) | Yes | No | - |
| `subject` | string (500) | Yes | No | - |
| `description` | string (2000) | No | No | - |
| `fromDate` | string (50) | Yes | No | - |
| `toDate` | string (50) | Yes | No | - |
| `days` | integer | Yes | No | - |
| `status` | enum [`pending`, `approved`, `rejected`] | Yes | No | `pending` |
| `appliedDate` | string (50) | Yes | No | - |
| `reviewedBy` | string (255) | No | No | - |
| `reviewerName` | string (255) | No | No | - |
| `reviewedDate` | string (50) | No | No | - |
| `comments` | string (2000) | No | No | - |
| `documentId` | string (255) | No | No | - |

**Indexes:**
- `employeeId` (key)
- `status` (key)
- `fromDate` (key)
- `leaveType` (key)

**Permissions:**
- Employees: Read/Create (own leave requests)
- Admins: All operations

---

## Step 4: Create Storage Buckets

1. Go to Appwrite Console → Storage
2. Create the following buckets:

| Bucket ID | Name | Max File Size | Allowed Extensions |
|-----------|------|---------------|-------------------|
| `task-attachments` | Task Attachments | 10MB | pdf, doc, docx, jpg, jpeg, png, gif |
| `leave-documents` | Leave Documents | 10MB | pdf, doc, docx, jpg, jpeg, png |
| `employee-avatars` | Employee Avatars | 2MB | jpg, jpeg, png, gif, webp |

**Permissions for all buckets:**
- Authenticated users: Create, Read
- Admins: All operations

---

## Step 5: Create Admin User

1. Go to Appwrite Console → Auth → Users
2. Create a new user with admin email/password
3. Note the user's ID
4. Go to Databases → hr_portal_db → admins
5. Create a new document:
   ```json
   {
     "name": "Admin User",
     "email": "admin@company.com",
     "role": "HR Manager",
     "authUserId": "<user_id_from_step_3>"
   }
   ```

---

## Step 6: Configure Auth Settings

1. Go to Appwrite Console → Auth → Settings
2. Enable "Email/Password" authentication
3. Configure password requirements:
   - Minimum length: 8
   - Require letters: Yes
   - Require numbers: Recommended

---

## Step 7: Test the Setup

1. Run the development server: `npm run dev`
2. Navigate to `/admin/login`
3. Login with the admin credentials you created
4. Test adding an employee
5. Login as the employee at `/login`
6. Test attendance marking

---

## Troubleshooting

### "Project not found" error
- Verify your Project ID in `.env`
- Ensure the endpoint URL is correct

### "Collection not found" error
- Make sure you created the database with ID `hr_portal_db`
- Verify collection IDs match the environment variables

### "Unauthorized" error
- Check that permissions are set correctly on collections
- Ensure the user has the appropriate role

### Geolocation not working
- Ensure you're testing on a secure origin (localhost or HTTPS)
- Check browser permissions for location access
- Verify office coordinates in `.env`

---

## Production Deployment

1. Set up proper API keys with limited permissions
2. Enable rate limiting in Appwrite Console
3. Configure CORS for your production domain
4. Set up proper backup procedures
5. Monitor usage and scale as needed
