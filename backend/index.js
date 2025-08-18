const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const path = require("path");
const fs = require("fs");


// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// create uploads/avatars folder if not exists
const avatarsDir = path.join(__dirname, "uploads", "avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use("/api/users", require("./routes/userRoutes.js"));
app.use("/api/messages", require("./routes/messageRoutes.js"));

app.get('/', (req, res) => {
  res.send('Hello from your simple Express API!');
});

// Create HTTP server & Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory map of userId -> socket.id
const onlineUsers = new Map();

// Expose io and onlineUsers for controllers via req.app
app.set('io', io);
app.set('onlineUsers', onlineUsers);

io.on("connection", (socket) => {
  // Register user socket
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // Listen for outgoing messages and forward
  socket.on("send_message", ({ senderId, receiverId, message }) => {
    const toSocketId = onlineUsers.get(receiverId);
    if (toSocketId) {
      io.to(toSocketId).emit("receive_message", {
        senderId,
        message,
        timestamp: new Date(),
      });
    }
  });

  //relay typing indicator
  socket.on("typing", ({senderId, receiverId, })=>{
    const toSocketId = onlineUsers.get(receiverId)
    if(toSocketId){
      io.to(toSocketId).emit("typing", {senderId})
    }
  })

  // Clean up on disconnect
  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server & Socket.IO running on http://localhost:${PORT}`);
});