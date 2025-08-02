import React, { useContext } from "react";
import "./styles/App.css";
import { DashboardContext } from "./contexts/allContext";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Canvas from "./components/dashboard/Canvas";
import ActiveUsersPanel from "./components/dashboard/ActiveUsersPanel";

function App() {
  const {
    theme,
    toggleTheme,
    addWidget,
    handleSave,
    isSaving,
    handleShare,
    isConnected,
    activeUsers
  } = useContext(DashboardContext);

  return (
    <div className={`app ${theme}`}>
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onSave={handleSave}
        onShare={handleShare}
        isSaving={isSaving}
      />

      <div className="main-content">
        <Sidebar onAddWidget={addWidget} />
        <div className="canvas-container">
          <ActiveUsersPanel users={activeUsers} isConnected={isConnected} />
          <Canvas />
        </div>
      </div>
    </div>
  );
}

export default App;
