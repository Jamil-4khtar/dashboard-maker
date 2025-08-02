import Session from "./model/Session";
import Dashboard from "./model/Dashboard";

export default function socketHandler(io) {
  // In-memory store for active connections
  const activeConnections = new Map();
  const dashboardRooms = new Map();

  // Socket.IO Connection Handling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join dashboard room
    socket.on("join-dashboard", async (data) => {
      const { dashboardId, userId, userName } = data;

      try {
        // Join socket room
        socket.join(dashboardId);

        // Store connection info
        activeConnections.set(socket.id, {
          dashboardId,
          userId,
          userName,
          joinedAt: new Date(),
        });

        // Add to dashboard room tracking
        if (!dashboardRooms.has(dashboardId)) {
          dashboardRooms.set(dashboardId, new Set());
        }
        dashboardRooms.get(dashboardId).add(socket.id);

        // Create/update session
        await Session.findOneAndUpdate(
          { sessionId: socket.id },
          {
            sessionId: socket.id,
            dashboardId,
            userId,
            userName,
            lastSeen: new Date(),
          },
          { upsert: true }
        );

        // Get current dashboard data
        const dashboard = await Dashboard.findOne({ id: dashboardId });
        if (dashboard) {
          socket.emit("dashboard-loaded", dashboard);
        }

        // Notify others of new user
        socket.to(dashboardId).emit("user-joined", {
          userId,
          userName,
          socketId: socket.id,
        });

        // Send current active users to new user
        const activeSessions = await Session.find({
          dashboardId,
          lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        });

        socket.emit(
          "active-users",
          activeSessions.map((s) => ({
            userId: s.userId,
            userName: s.userName,
            socketId: s.sessionId,
          }))
        );
      } catch (error) {
        console.error("Error joining dashboard:", error);
        socket.emit("error", { message: "Failed to join dashboard" });
      }
    });

    // Handle widget updates
    socket.on("widget-update", async (data) => {
      const { dashboardId, widget, operation } = data;
      const connection = activeConnections.get(socket.id);

      if (!connection || connection.dashboardId !== dashboardId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      try {
        let dashboard = await Dashboard.findOne({ id: dashboardId });

        if (!dashboard) {
          // Create new dashboard if it doesn't exist
          dashboard = new Dashboard({
            id: dashboardId,
            name: `Dashboard ${dashboardId}`,
            widgets: [],
          });
        }

        // Apply widget operation
        switch (operation) {
          case "add":
            dashboard.widgets.push(widget);
            break;
          case "update":
            const updateIndex = dashboard.widgets.findIndex(
              (w) => w.id === widget.id
            );
            if (updateIndex !== -1) {
              dashboard.widgets[updateIndex] = widget;
            }
            break;
          case "delete":
            dashboard.widgets = dashboard.widgets.filter(
              (w) => w.id !== widget.id
            );
            break;
        }

        dashboard.updatedAt = new Date();
        await dashboard.save();

        // Broadcast to all users in the room except sender
        socket.to(dashboardId).emit("widget-updated", {
          widget,
          operation,
          userId: connection.userId,
        });
      } catch (error) {
        console.error("Error updating widget:", error);
        socket.emit("error", { message: "Failed to update widget" });
      }
    });

    // Handle bulk dashboard updates
    socket.on("dashboard-update", async (data) => {
      const { dashboardId, widgets, theme } = data;
      const connection = activeConnections.get(socket.id);

      if (!connection || connection.dashboardId !== dashboardId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      try {
        const dashboard = await Dashboard.findOneAndUpdate(
          { id: dashboardId },
          {
            widgets,
            theme,
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        // Broadcast to all users in the room except sender
        socket.to(dashboardId).emit("dashboard-synced", {
          widgets,
          theme,
          userId: connection.userId,
        });
      } catch (error) {
        console.error("Error updating dashboard:", error);
        socket.emit("error", { message: "Failed to update dashboard" });
      }
    });

    // Handle cursor movement
    socket.on("cursor-move", async (data) => {
      const { dashboardId, cursor } = data;
      const connection = activeConnections.get(socket.id);

      if (!connection || connection.dashboardId !== dashboardId) {
        return;
      }

      try {
        // Update session cursor
        await Session.findOneAndUpdate(
          { sessionId: socket.id },
          { cursor, lastSeen: new Date() }
        );

        // Broadcast cursor position
        socket.to(dashboardId).emit("cursor-updated", {
          userId: connection.userId,
          userName: connection.userName,
          cursor,
        });
      } catch (error) {
        console.error("Error updating cursor:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      const connection = activeConnections.get(socket.id);
      if (connection) {
        const { dashboardId, userId, userName } = connection;

        // Remove from tracking
        activeConnections.delete(socket.id);
        if (dashboardRooms.has(dashboardId)) {
          dashboardRooms.get(dashboardId).delete(socket.id);
        }

        // Remove session
        await Session.deleteOne({ sessionId: socket.id });

        // Notify others
        socket.to(dashboardId).emit("user-left", {
          userId,
          userName,
          socketId: socket.id,
        });
      }
    });
  });
}


// cleanup inactive sesstion
setInterval(async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Session.deleteMany({ lastSeen: { $lt: fiveMinutesAgo } });
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
  }
}, 60000); // Run every minute