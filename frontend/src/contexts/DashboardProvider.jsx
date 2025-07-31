import { useState } from "react";
import { WIDGET_TYPES } from "../lib/constants";
import { DashboardContext } from "./allContext";



export default function DashboardProvider({ children }) {
  const [widgets, setWidgets] = useState([]);
    const [selectedWidget, setSelectedWidget] = useState(null);
    const [theme, setTheme] = useState('light');
  
    const addWidget = (type) => {
      const newWidget = {
        id: `widget-${Date.now()}`,
        type,
        position: { x: 100, y: 100, w: 300, h: 200 },
        config: { ...WIDGET_TYPES[type].defaultConfig }
      };
      setWidgets([...widgets, newWidget]);
    };
  
    const updateWidget = (id, updatedWidget) => {
      setWidgets(widgets.map(w => w.id === id ? updatedWidget : w));
    };
  
    const deleteWidget = (id) => {
      setWidgets(widgets.filter(w => w.id !== id));
      if (selectedWidget === id) {
        setSelectedWidget(null);
      }
    };
  
    const toggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };
  
    const contextValue = {
      widgets,
      addWidget,
      updateWidget,
      deleteWidget,
      selectedWidget,
      setSelectedWidget,
      toggleTheme,
      theme
    };

    return (
      <DashboardContext.Provider value={contextValue}>
        { children }
      </DashboardContext.Provider>
    )
}