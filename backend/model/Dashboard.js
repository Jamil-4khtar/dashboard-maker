import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  widgets: [
    {
      id: String,
      type: String,
      position: {
        x: Number,
        y: Number,
        w: Number,
        h: Number,
      },
      config: mongoose.Schema.Types.Mixed,
    },
  ],
  theme: { type: String, default: "light" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  collaborators: [
    {
      userId: String,
      permission: {
        type: String,
        enum: ["view", "edit", "admin"],
        default: "edit",
      },
    },
  ],
});

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
export default Dashboard
