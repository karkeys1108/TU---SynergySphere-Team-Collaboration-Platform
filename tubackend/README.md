# Project Management Application

A full-stack project management application with real-time collaboration features.

## Project Structure

\`\`\`
├── backend/                 # Node.js/Express API
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Database configuration
│   └── server.js          # Main server file
│
└── frontend/              # Next.js React application
    ├── app/              # Next.js app directory
    ├── components/       # React components
    ├── contexts/         # React contexts
    ├── lib/             # Utility functions
    └── package.json     # Frontend dependencies
\`\`\`

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create `.env` file:
\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectmanager
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME=Project Manager
EMAIL_FROM_ADDRESS=noreply@projectmanager.com
\`\`\`

4. Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### Frontend Setup

1. Navigate to frontend directory:
\`\`\`bash
cd frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create `.env.local` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
\`\`\`

4. Start the frontend development server:
\`\`\`bash
npm run dev
\`\`\`

## Features

- **Authentication**: User registration, login, and JWT-based authentication
- **Project Management**: Create, update, delete projects with team collaboration
- **Task Management**: Kanban-style task boards with drag-and-drop functionality
- **Real-time Messaging**: Project-based chat with replies and reactions
- **Notifications**: Activity tracking and real-time notifications
- **Responsive Design**: Mobile-first design with modern UI components

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Real-time features work automatically via Socket.IO
