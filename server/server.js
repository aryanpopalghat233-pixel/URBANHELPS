// ============================================
// URBANHELPS BACKEND SERVER WITH MONGODB
// ============================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

// Import database connection
const connectDB = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const workerRoutes = require("./routes/workers");
const adminRoutes = require("./routes/admin");
const serviceRoutes = require("./routes/services");

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../client")));

// PORT Configuration
const PORT = process.env.PORT || 5000;

// ============================================
// SOCKET.IO CONNECTION MANAGEMENT
// ============================================
const activeWorkers = new Map(); // Store worker location data

io.on("connection", (socket) => {
  console.log(`📱 New client connected: ${socket.id}`);

  // Worker shares live location
  socket.on("share-location", (data) => {
    const { workerId, latitude, longitude, status } = data;

    // Store worker location
    activeWorkers.set(workerId, {
      socketId: socket.id,
      latitude,
      longitude,
      status,
      timestamp: Date.now()
    });

    console.log(`📍 Worker ${workerId} location: ${latitude}, ${longitude}`);

    // Broadcast location to all connected clients
    io.emit("worker-location-update", {
      workerId,
      latitude,
      longitude,
      status,
      timestamp: Date.now()
    });
  });

  // Customer requests to track worker
  socket.on("request-tracking", (data) => {
    const { customerId, workerId, bookingId } = data;

    console.log(`👁️  Customer ${customerId} tracking Worker ${workerId}`);

    // Send current worker location if available
    if (activeWorkers.has(workerId)) {
      const workerData = activeWorkers.get(workerId);
      socket.emit("initial-location", workerData);
    }
  });

  // Worker updates job status
  socket.on("update-status", (data) => {
    const { workerId, bookingId, status } = data;

    console.log(`✅ Worker ${workerId} status: ${status}`);

    // Broadcast status update
    io.emit("job-status-update", {
      workerId,
      bookingId,
      status,
      timestamp: Date.now()
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);

    // Remove worker from active list
    for (let [workerId, data] of activeWorkers.entries()) {
      if (data.socketId === socket.id) {
        activeWorkers.delete(workerId);
        console.log(`👋 Worker ${workerId} offline`);
        io.emit("worker-offline", { workerId });
      }
    }
  });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server running ✅",
    timestamp: new Date(),
    database: "MongoDB Atlas Connected"
  });
});

// Serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error"
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    🏠 URBANHELPS SERVER STARTED 🏠    ║
║    Server: http://localhost:${PORT}       ║
║    Database: MongoDB Atlas Connected    ║
║    Real-time: Socket.io Active         ║
║    Ready for connections...            ║
╚════════════════════════════════════════╝
  `);
});

module.exports = { io, activeWorkers };
