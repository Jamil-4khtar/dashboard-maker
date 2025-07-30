import { createRequire } from "module";
const require = createRequire(import.meta.url)
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io")
require("dotenv").config();
import socketHandler from "./socket.js";
import router from "./route/route.js";
import { dbConnect } from "./config/db.js";
import configurePassport from "./config/passport.js";
import passport from "passport";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

configurePassport(passport)
app.use(passport.initialize())

const httpServer = http.createServer(app);

const io = new socketIo.Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

dbConnect()
socketHandler(io);

app.get("/", (req, res) => {
  res.send("<h1>Hello Dashboard</h1>")
})

app.use("/api", router)

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));




