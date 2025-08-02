import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

// Create a singleton socket instance with connection tracking
let socketInstance = null;
let socketUsers = 0;
let reconnectAttempts = 0;
let lastDisconnectTime = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_COOLDOWN_MS = 10000; // 10 seconds cooldown between reconnection attempts

// Function to properly disconnect the singleton socket
const disconnectSocket = () => {
  if (socketInstance) {
    console.log('Disconnecting singleton socket');
    lastDisconnectTime = Date.now();
    socketInstance.disconnect();
    socketInstance = null;
    socketUsers = 0;
    reconnectAttempts = 0;
  }
};

function useSocket(dashboardId, userId, userName) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);
  const [cursors, setCursors] = useState({});

  // Initialize socket connection
  useEffect(() => {
    if (!dashboardId || !userId) return;
    
    // Check if we're in a reconnection cooldown period
    const now = Date.now();
    const timeSinceLastDisconnect = now - lastDisconnectTime;
    
    if (timeSinceLastDisconnect < RECONNECT_COOLDOWN_MS && lastDisconnectTime > 0) {
      console.log(`In reconnection cooldown (${Math.round((RECONNECT_COOLDOWN_MS - timeSinceLastDisconnect)/1000)}s remaining). Skipping connection.`);
      setError('Connection cooldown active. Please try again in a few seconds.');
      return;
    }
    
    // Use the singleton pattern to ensure only one socket connection exists
    if (!socketInstance) {
      // Check if we've exceeded reconnection attempts
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Waiting for manual refresh.`);
        setError('Connection failed. Please refresh the page to try again.');
        return;
      }
      
      reconnectAttempts++;
      console.log(`Creating new singleton socket connection (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      
      socketInstance = io('/', {
        transports: ['websocket'],
        timeout: 20000,
        reconnection: false, // Disable auto reconnection - we'll handle it manually
        forceNew: true
      });
    }
    
    // Increment user count
    socketUsers++;
    console.log(`Socket users: ${socketUsers}`);
    
    // Set the current socket reference to the singleton
    socketRef.current = socketInstance;

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
      
      // Join the dashboard room
      socket.emit('join-dashboard', {
        dashboardId,
        userId,
        userName
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Failed to connect to server: ${err.message}`);
      setIsConnected(false);
      
      // If we get a connection error, force disconnect and reset the socket
      // This prevents infinite reconnection loops
      if (socketInstance) {
        console.log('Forcing disconnect due to connection error');
        disconnectSocket();
      }
    });

    // Clean up on unmount - manage the singleton lifecycle
    return () => {
      if (socket) {
        console.log('Removing listeners on unmount');
        // Remove all listeners for this component
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('active-users');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('cursor-updated');
        socket.off('widget-updated');
        socket.off('dashboard-synced');
        socket.off('dashboard-loaded');
        
        // Decrement user count
        socketUsers--;
        console.log(`Socket users remaining: ${socketUsers}`);
        
        // If no users left, disconnect the singleton
        if (socketUsers <= 0) {
          disconnectSocket();
        }
        
        // Clear the reference
        socketRef.current = null;
      }
    };
  }, [dashboardId, userId, userName]);

  // User presence handlers
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on('active-users', (users) => {
      setActiveUsers(users.filter(user => user.userId !== userId));
    });

    socket.on('user-joined', (user) => {
      if (user.userId !== userId) {
        setActiveUsers(prev => [...prev.filter(u => u.userId !== user.userId), user]);
      }
    });

    socket.on('user-left', (user) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== user.userId));
    });

    return () => {
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [userId]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleCursorUpdate = (data) => {
      if (data.userId !== userId) {
        setCursors((prev) => ({
          ...prev,
          [data.userId]: {
            ...data,
            lastUpdate: Date.now(),
          },
        }));
      }
    };

    socket.on('cursor-updated', handleCursorUpdate);

    // Cleanup old cursors
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const newCursors = {};
        for (const id in prev) {
          if (now - prev[id].lastUpdate < 10000) { // 10-second timeout
            newCursors[id] = prev[id];
          }
        }
        return newCursors;
      });
    }, 5000);

    return () => {
      socket.off('cursor-updated', handleCursorUpdate);
      clearInterval(interval);
    };
  }, [userId]);

  // Emit widget update
  const emitWidgetUpdate = useCallback((widget, operation) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('widget-update', {
        dashboardId,
        widget,
        operation
      });
    }
  }, [dashboardId, isConnected]);

  // Emit dashboard update
  const emitDashboardUpdate = useCallback((widgets, theme) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('dashboard-update', {
        dashboardId,
        widgets,
        theme
      });
    }
  }, [dashboardId, isConnected]);

  // Emit cursor movement
  const emitCursorMove = useCallback((cursor) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-move', {
        dashboardId,
        cursor
      });
    }
  }, [dashboardId, isConnected]);

  // Subscribe to real-time updates
  const onWidgetUpdate = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('widget-updated', callback);
    
    return () => {
      socketRef.current?.off('widget-updated', callback);
    };
  }, []);

  const onDashboardSync = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('dashboard-synced', callback);
    
    return () => {
      socketRef.current?.off('dashboard-synced', callback);
    };
  }, []);

  const onCursorUpdate = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('cursor-updated', callback);
    
    return () => {
      socketRef.current?.off('cursor-updated', callback);
    };
  }, []);

  const onDashboardLoaded = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('dashboard-loaded', callback);
    
    return () => {
      socketRef.current?.off('dashboard-loaded', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    error,
    cursors,
    emitWidgetUpdate,
    emitDashboardUpdate,
    emitCursorMove,
    onWidgetUpdate,
    onDashboardSync,
    onCursorUpdate,
    onDashboardLoaded
  };
}

export default useSocket  