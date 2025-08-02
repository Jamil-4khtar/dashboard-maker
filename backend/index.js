import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
require("dotenv").config();
import socketHandler from "./socket.js";
import router from "./route/route.js";
import { dbConnect } from "./config/db.js";
import configurePassport from "./config/passport.js";
import passport from "passport";
import rateLimit from 'express-rate-limit'

const PORT = process.env.PORT || 3000;

// create express app and socket server
const app = express();
const httpServer = http.createServer(app);
const io = new socketIo.Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// middleware
app.use(cors());
app.use(express.json());

// rate limit
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use("/api", limit)
// configuring passport
configurePassport(passport);
app.use(passport.initialize());

dbConnect();
socketHandler(io);

app.get("/", (req, res) => {
  res.send("<h1>Hello Dashboard</h1>");
});

// route
app.use("/api", router);


// health
app.get('/health', (req, res) => {
  // Import the variables from socket.js
  const { activeConnections, dashboardRooms } = global;
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: activeConnections ? activeConnections.size : 0,
    rooms: dashboardRooms ? dashboardRooms.size : 0
  });
});

//error
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});


httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
