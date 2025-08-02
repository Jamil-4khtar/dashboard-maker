import Session from "./model/Session.js";
import Dashboard from "./model/Dashboard.js";

// In-memory store for active connections
const activeConnections = new Map();
const dashboardRooms = new Map();

// Make these variables available globally
global.activeConnections = activeConnections;
global.dashboardRooms = dashboardRooms;

// Track connection attempts with timestamps to detect rapid reconnects
const connectionAttempts = new Map();
const ipConnections = new Map(); // Track connections by IP
const CONNECTION_THROTTLE_MS = 60000; // 60 seconds - increased to prevent reconnection loops
const CONNECTION_CLEANUP_MS = 3600000; // 1 hour
const MAX_CONNECTIONS_PER_IP = 5; // Maximum connections allowed per IP - increased to be more lenient
const SOCKET_DEBUG = true; // Enable detailed socket debugging

// Function to clean up old connection attempts
function cleanupOldConnectionAttempts() {
  const now = Date.now();
  console.log(`Cleaning up old connection attempts (current count: ${connectionAttempts.size})`);
  
  for (const [socketId, timestamp] of connectionAttempts.entries()) {
    if (now - timestamp > CONNECTION_CLEANUP_MS) {
      connectionAttempts.delete(socketId);
    }
  }
  
  console.log(`Cleanup complete (new count: ${connectionAttempts.size})`);
}

// Debug logging function that only logs when SOCKET_DEBUG is true
function debugLog(...args) {
  if (SOCKET_DEBUG) {
    console.log(...args);
  }
}

export default function socketHandler(io) {
  // Socket.IO Connection Handling
  io.on("connection", (socket) => {
    const now = Date.now();
    const lastAttempt = connectionAttempts.get(socket.id);
    const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.address || 
                     'unknown';
    
    debugLog(`Connection attempt from IP: ${clientIp}, Socket ID: ${socket.id}`);
    
    // Track total connections for monitoring
    const totalConnections = activeConnections.size;
    const ipSocketCount = ipConnections.has(clientIp) ? ipConnections.get(clientIp).size : 0;
    
    debugLog(`Current connections - Total: ${totalConnections}, IP ${clientIp}: ${ipSocketCount}`);
    
    // Check if this is a rapid reconnection (potential loop)
    if (lastAttempt && (now - lastAttempt) < CONNECTION_THROTTLE_MS) {
      console.log(`Throttling connection for socket ${socket.id} - too frequent reconnects (${Math.round((now - lastAttempt)/1000)}s < ${CONNECTION_THROTTLE_MS/1000}s)`);
      socket.disconnect();
      return;
    }
    
    // Check if IP has too many connections
    if (!ipConnections.has(clientIp)) {
      ipConnections.set(clientIp, new Set());
    }
    
    const ipSockets = ipConnections.get(clientIp);
    
    // If this IP already has max connections, disconnect
    if (ipSockets.size >= MAX_CONNECTIONS_PER_IP) {
      console.log(`Too many connections from IP ${clientIp} (${ipSockets.size}/${MAX_CONNECTIONS_PER_IP}). Disconnecting.`);
      socket.disconnect();
      return;
    }
    
    // Check if already connected
    if (activeConnections.has(socket.id)) {
      debugLog("Socket already connected:", socket.id);
      return;
    }
    
    // Add this socket to the IP tracking
    ipSockets.add(socket.id);
    
    // Update connection attempt timestamp
    connectionAttempts.set(socket.id, now);
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
    socket.on("disconnect", async (reason) => {
      console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);

      // Keep the connection attempt timestamp for throttling
      // but update it to indicate this was a disconnect, not a connect
      const now = Date.now();
      connectionAttempts.set(socket.id, now);
      
      // Clean up IP connections tracking
      const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                       socket.handshake.address || 
                       'unknown';
      
      if (ipConnections.has(clientIp)) {
        const ipSockets = ipConnections.get(clientIp);
        ipSockets.delete(socket.id);
        debugLog(`Removed socket ${socket.id} from IP ${clientIp}, remaining: ${ipSockets.size}`);
        
        if (ipSockets.size === 0) {
          ipConnections.delete(clientIp);
          debugLog(`Removed IP ${clientIp} from tracking (no more connections)`);
        }
      }
      
      // Clean up old connection attempts more frequently (10% chance on each disconnect)
      if (Math.random() < 0.1) {
        cleanupOldConnectionAttempts();
      }

      const connection = activeConnections.get(socket.id);
      if (connection) {
        const { dashboardId, userId, userName } = connection;

        // Remove from tracking
        activeConnections.delete(socket.id);
        if (dashboardRooms.has(dashboardId)) {
          dashboardRooms.get(dashboardId).delete(socket.id);
          
          // If room is empty, delete it
          if (dashboardRooms.get(dashboardId).size === 0) {
            dashboardRooms.delete(dashboardId);
          }
        }

        try {
          // Remove session
          await Session.deleteOne({ sessionId: socket.id });

          // Notify others
          socket.to(dashboardId).emit("user-left", {
            userId,
            userName,
            socketId: socket.id,
          });
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      }
    });
  });
}


// Cleanup inactive sessions
setInterval(async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deletedSessions = await Session.deleteMany({ lastSeen: { $lt: fiveMinutesAgo } });
    if (deletedSessions.deletedCount > 0) {
      console.log(`Cleaned up ${deletedSessions.deletedCount} inactive sessions`);
    }
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
  }
}, 60000); // Run every minute

// Regularly clean up connection tracking to prevent memory issues
setInterval(() => {
  cleanupOldConnectionAttempts();
  
  // Log connection stats
  console.log(`Connection stats: Active=${activeConnections.size}, Tracked IPs=${ipConnections.size}, Tracked attempts=${connectionAttempts.size}`);
}, 300000); // Run every 5 minutes