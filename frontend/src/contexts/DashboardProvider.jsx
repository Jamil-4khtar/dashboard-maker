import React, { useState, useEffect, useCallback, useRef } from "react";
import { WIDGET_TYPES } from "../lib/constants";
import { DashboardContext } from "./allContext";
import useSocket from "../hooks/useSocket";
import { v4 as uuidv4 } from 'uuid';

export default function DashboardProvider({ children, dashboardId = 'demo-dashboard' }) {
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);
  
  // Generate persistent user data for this session
  const userIdRef = useRef('user-' + Math.random().toString(36).substr(2, 9));
  const userNameRef = useRef('User ' + Math.floor(Math.random() * 1000));
  const userId = userIdRef.current;
  const userName = userNameRef.current;
  
  // Initialize socket connection
  const {
    socket,
    isConnected,
    activeUsers,
    cursors,
    error: socketError,
    emitWidgetUpdate,
    emitDashboardUpdate,
    emitCursorMove,
    onWidgetUpdate,
    onDashboardSync,
    onCursorUpdate,
    onDashboardLoaded
  } = useSocket(dashboardId, userId, userName);

  // Update error state when socket error changes
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Listen for initial dashboard data
  useEffect(() => {
    if (!isConnected || initialLoadRef.current) return;

    const cleanup = onDashboardLoaded((data) => {
      console.log('Dashboard loaded:', data);
      if (data.widgets) {
        setWidgets(data.widgets);
      }
      if (data.theme) {
        setTheme(data.theme);
      }
      setIsLoading(false);
      initialLoadRef.current = true;
    });

    // If we're connected but don't receive data within 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log('Dashboard load timeout - creating new dashboard');
      }
    }, 5000);

    return () => {
      cleanup && cleanup();
      clearTimeout(timeout);
    };
  }, [isConnected, onDashboardLoaded, isLoading]);

  // Handle real-time updates from other users
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup1 = onWidgetUpdate((data) => {
      const { widget, operation, userId: senderUserId } = data;
      
      if (senderUserId === userId) return; // Ignore own updates
      
      switch (operation) {
        case 'add':
          setWidgets(prev => [...prev.filter(w => w.id !== widget.id), widget]);
          break;
        case 'update':
          setWidgets(prev => prev.map(w => w.id === widget.id ? widget : w));
          break;
        case 'delete':
          setWidgets(prev => prev.filter(w => w.id !== widget.id));
          if (selectedWidget === widget.id) {
            setSelectedWidget(null);
          }
          break;
      }
    });

    const cleanup2 = onDashboardSync((data) => {
      const { widgets: newWidgets, theme: newTheme, userId: senderUserId } = data;
      
      if (senderUserId === userId) return;
      
      console.log('Dashboard synced:', data);
      setWidgets(newWidgets || []);
      setTheme(newTheme || 'light');
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, [onWidgetUpdate, onDashboardSync, userId, isConnected, selectedWidget]);

  const addWidget = useCallback((type) => {
    const newWidget = {
      id: uuidv4(),
      type,
      position: { x: 100, y: 100, w: 300, h: 200 },
      config: { ...WIDGET_TYPES[type].defaultConfig }
    };
    setWidgets(prev => [...prev, newWidget]);
    emitWidgetUpdate(newWidget, 'add');
    return newWidget;
  }, [emitWidgetUpdate]);

  const updateWidget = useCallback((id, updatedWidget) => {
    setWidgets(prev => prev.map(w => w.id === id ? updatedWidget : w));
    emitWidgetUpdate(updatedWidget, 'update');
  }, [emitWidgetUpdate]);

  const deleteWidget = useCallback((id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidget === id) {
      setSelectedWidget(null);
    }
    emitWidgetUpdate({ id }, 'delete');
  }, [emitWidgetUpdate, selectedWidget]);

  const handleCursorMove = useCallback((e) => {
    if (!isConnected) return;
    
    const cursor = {
      x: e.clientX,
      y: e.clientY,
      userId,
      userName
    };
    emitCursorMove(cursor);
  }, [userId, userName, emitCursorMove, isConnected]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      emitDashboardUpdate(widgets, newTheme);
      return newTheme;
    });
  }, [widgets, emitDashboardUpdate]);

  const handleSave = useCallback(async () => {
    if (!isConnected) {
      setError('Cannot save: Not connected to server');
      return;
    }
    
    setIsSaving(true);
    // Emit dashboard update to ensure all clients are in sync
    emitDashboardUpdate(widgets, theme);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In real implementation: await dashboardAPI.saveDashboard(dashboardId, { widgets, theme });
  }, [widgets, theme, isConnected, emitDashboardUpdate]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/dashboard/${dashboardId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Share link copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy link:', err);
        setError('Failed to copy link to clipboard');
      });
  }, [dashboardId]);

  // Clear error message
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = {
    widgets,
    addWidget,
    updateWidget,
    deleteWidget,
    selectedWidget,
    setSelectedWidget,
    cursors,
    activeUsers,
    userId,
    userName,
    emitWidgetUpdate,
    emitDashboardUpdate,
    emitCursorMove,
    handleCursorMove,
    toggleTheme,
    theme,
    isConnected,
    isLoading,
    error,
    clearError,
    isSaving,
    handleSave,
    handleShare,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}