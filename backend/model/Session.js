import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  dashboardId: String,
  userId: String,
  userName: String,
  cursor: {
    x: Number,
    y: Number
  },
  lastSeen: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session