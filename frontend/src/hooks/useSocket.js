import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'


function useSocket(dashboardId, userId, userName) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!dashboardId || !userId) return;

    socketRef.current = io("/socket.io", {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

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
      setError('Failed to connect to server');
      setIsConnected(false);
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
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