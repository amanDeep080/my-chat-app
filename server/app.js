require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");
const notificationRoutes = require("./routes/notifications");
const dmsRoutes = require("./routes/dms");
const presenceRoutes = require("./routes/presence");
const filesRoutes = require("./routes/files");
const callHistoryRoutes = require("./routes/callHistory");
const adminRoutes = require("./routes/admin");


const { initSocket } = require("./socket/socketHandler");
const { initFirebase } = require("./services/firebase");
const { cleanupInactiveUsers } = require("./services/presence");
const { cleanupExpiredFiles } = require("./services/fileStorage");

const app = express();
const server = http.createServer(app);



// Init Firebase Admin
initFirebase();

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);


// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dms", dmsRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/calls", callHistoryRoutes);
app.use("/api/admin", adminRoutes);


// Health check
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

// Init socket handlers
initSocket(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!", message: err.message });
});

// Cleanup tasks
// Clean up inactive users every 5 minutes
setInterval(() => cleanupInactiveUsers(), 5 * 60 * 1000);
// Clean up expired files every hour
setInterval(() => cleanupExpiredFiles(), 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };
