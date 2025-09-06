# SynergySphere Backend

A robust backend for the SynergySphere team collaboration platform, built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- **User Authentication**: JWT-based authentication with email/password
- **Project Management**: Create, read, update, and delete projects with member management
- **Task Management**: Full CRUD operations for tasks with status tracking and assignment
- **Real-time Communication**: Threaded discussions with real-time updates
- **Notifications**: Real-time notifications for important events
- **Role-based Access Control**: Fine-grained permissions for project members
- **File Uploads**: Support for file attachments in messages

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Validation**: Express Validator
- **Logging**: Morgan

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/synergysphere-backend.git
   cd synergysphere-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/synergysphere
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   
   # Client URL for CORS
   CLIENT_URL=http://localhost:3000
   
   # Email Configuration (for password reset)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USERNAME=your_smtp_username
   SMTP_PASSWORD=your_smtp_password
   EMAIL_FROM=noreply@synergysphere.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/register | Register a new user |
| POST   | /api/auth/login | Login user |
| GET    | /api/auth/me | Get current user |
| PUT    | /api/auth/updatedetails | Update user details |
| PUT    | /api/auth/updatepassword | Update password |
| POST   | /api/auth/forgotpassword | Forgot password |
| PUT    | /api/auth/resetpassword/:resettoken | Reset password |
| GET    | /api/auth/logout | Logout user |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/projects | Get all projects for the current user |
| POST   | /api/projects | Create a new project |
| GET    | /api/projects/:id | Get a single project |
| PUT    | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project |
| GET    | /api/projects/:id/members | Get project members |
| POST   | /api/projects/:projectId/members/:userId | Add member to project |
| PUT    | /api/projects/:projectId/members/:userId | Update member role |
| DELETE | /api/projects/:projectId/members/:userId | Remove member from project |
| GET    | /api/projects/:id/stats | Get project statistics |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/tasks | Get all tasks for a project |
| POST   | /api/tasks | Create a new task |
| GET    | /api/tasks/:id | Get a single task |
| PUT    | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
| POST   | /api/tasks/:id/assign | Assign task to user |
| POST   | /api/tasks/:id/unassign | Unassign task from user |
| PUT    | /api/tasks/:id/status | Update task status |
| GET    | /api/tasks/:id/comments | Get task comments |
| POST   | /api/tasks/:id/comments | Add comment to task |
| GET    | /api/tasks/search | Search tasks |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/messages | Get all messages for a project |
| POST   | /api/messages | Create a new message |
| GET    | /api/messages/:id | Get a single message |
| PUT    | /api/messages/:id | Update a message |
| DELETE | /api/messages/:id | Delete a message |
| POST   | /api/messages/:id/like | Like a message |
| POST   | /api/messages/:id/unlike | Unlike a message |
| GET    | /api/messages/:id/replies | Get message replies |
| POST   | /api/messages/:id/replies | Reply to a message |
| GET    | /api/messages/search | Search messages |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/notifications | Get all notifications for the current user |
| PUT    | /api/notifications/:id | Mark notification as read |
| DELETE | /api/notifications/:id | Delete a notification |
| PUT    | /api/notifications/mark-all-read | Mark all notifications as read |
| DELETE | /api/notifications | Clear all notifications |
| GET    | /api/notifications/unread-count | Get unread notifications count |

## Real-time Events

The backend uses Socket.IO for real-time functionality. The following events are available:

### Project Events
- `project:created` - Emitted when a new project is created
- `project:updated` - Emitted when a project is updated
- `project:deleted` - Emitted when a project is deleted

### Task Events
- `task:created` - Emitted when a new task is created
- `task:updated` - Emitted when a task is updated
- `task:deleted` - Emitted when a task is deleted

### Message Events
- `message:created` - Emitted when a new message is created
- `message:updated` - Emitted when a message is updated
- `message:deleted` - Emitted when a message is deleted
- `message:reply:added` - Emitted when a reply is added to a message

### Notification Events
- `notification:new` - Emitted when a new notification is created
- `notification:read` - Emitted when a notification is marked as read
- `notification:deleted` - Emitted when a notification is deleted
- `notifications:allRead` - Emitted when all notifications are marked as read
- `notifications:cleared` - Emitted when all notifications are cleared

## Error Handling

The API returns the following HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request was successful |
| 201 | Created - Resource was successfully created |
| 400 | Bad Request - The request was invalid |
| 401 | Unauthorized - Authentication is required |
| 403 | Forbidden - User does not have permission |
| 404 | Not Found - The requested resource was not found |
| 500 | Internal Server Error - Something went wrong on the server |

## Testing

To run tests:

```bash
npm test
# or
yarn test
```

## Deployment

### Production

1. Set `NODE_ENV=production` in your `.env` file
2. Update the `MONGODB_URI` to point to your production database
3. Update the `JWT_SECRET` to a secure random string
4. Configure your web server (Nginx, Apache) to proxy requests to your Node.js application
5. Use PM2 or similar process manager to keep the application running

```bash
# Install PM2 globally
npm install -g pm2

# Start the application in production mode
pm2 start server.js --name "synergysphere-backend"

# Save the PM2 process list
pm2 save

# Set up PM2 to start on system boot
pm2 startup

# Start PM2 on system boot
pm2 save
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/)
- [JWT](https://jwt.io/)
