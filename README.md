# Quill HR Manager

A modern, full-featured Human Resources management system built with React, TypeScript, and Appwrite.

## Features

### Employee Management
- **GW-prefixed Employee IDs** - Unique employee identification with auto-generation
- Employee CRUD with profile management
- Department and role assignment
- Status tracking (Active, Inactive, On Leave)

### Admin Panel
- **Admin Management** - Create and manage admin users
- Dashboard with real-time statistics
- Employee, attendance, tasks, and leave management

### Attendance & Time Tracking
- Check-in/Check-out with geofencing
- WFH (Work from Home) support
- Attendance history and reports

### Leave Management
- Leave request submission and approval workflow
- Leave balance tracking (Casual, Sick, Earned)
- Document attachments

### Task Management
- Task assignment with priorities
- Progress tracking
- Completion notes and status updates

### Security
- Role-based access control (Admin/Employee)
- Content Security Policy (CSP) headers
- Secure session management via Appwrite
- Input validation and XSS protection

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Appwrite** | Backend (Auth, Database, Storage) |
| **Express.js** | API server for sensitive operations |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite Cloud account

### Installation

```bash
# Clone the repository
git clone https://github.com/salahudheenthajudheen/quill-hr-manager.git

# Navigate to project
cd quill-hr-manager

# Install dependencies
npm install

# Start development server
npm run start
```

### Environment Setup

Create a `.env` file with:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=hr_portal_db
APPWRITE_API_KEY=your_api_key
```

## Deployment

### Vercel / Netlify
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy

### Manual Build
```bash
npm run build
# Output in dist/ folder
```

## License

MIT License - feel free to use this project for personal or commercial purposes.
