const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/db")
const { errorHandler } = require("./middleware/error")
const http = require("http")
const socketIo = require("socket.io")

// Load env vars
dotenv.config()

// Connect to database
connectDB()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Body parser
app.use(express.json())

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Mount routers
app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/projects", require("./routes/projectRoutes"))
app.use("/api/tasks", require("./routes/taskRoutes"))
app.use("/api/messages", require("./routes/messageRoutes"))
app.use("/api/notifications", require("./routes/notificationRoutes"))

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-project", (projectId) => {
    socket.join(projectId)
    console.log(`User ${socket.id} joined project ${projectId}`)
  })

  socket.on("leave-project", (projectId) => {
    socket.leave(projectId)
    console.log(`User ${socket.id} left project ${projectId}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to routes
app.set("io", io)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})
