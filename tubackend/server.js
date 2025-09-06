require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, file://)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:5000',
        'null'  // For file:// protocol
      ];
      
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join user's room for private notifications
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${socket.id} joined user room: ${userId}`);
  });

  // Join project room
  socket.on('joinProject', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.id} joined project: ${projectId}`);
    
    // Notify others in the project that a new user joined
    socket.to(`project_${projectId}`).emit('userJoined', {
      userId: socket.id,
      message: 'A new user joined the project',
      timestamp: new Date().toISOString()
    });
  });

  // Handle chat messages
  socket.on('sendMessage', (data) => {
    const { projectId, message, user } = data;
    
    if (!projectId) {
      console.error('No projectId provided in message');
      return;
    }
    
    const roomName = `project_${projectId}`;
    console.log(`Broadcasting message to room: ${roomName}`);
    
    // Broadcast to everyone in the project room including the sender
    io.to(roomName).emit('newMessage', {
      from: socket.id,
      user,
      message,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Message from ${socket.id} (${user}) in project ${projectId}:`, message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Server Error' 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
