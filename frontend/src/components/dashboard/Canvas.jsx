import { useContext, useRef } from "react";
import { DashboardContext } from "../../contexts/allContext";
import WidgetContainer from "./WidgetContainer";
import UserCursor from "./UserCursor";


export default function Canvas() {
  const { 
    widgets, 
    addWidget, 
    updateWidget, 
    deleteWidget, 
    selectedWidget, 
    setSelectedWidget,
    cursors,
    activeUsers,
    emitCursorMove
  } = useContext(DashboardContext);

  const canvasRef = useRef();

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedWidget(null);
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cursor = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    emitCursorMove(cursor);
  };

  return (
    <div 
      ref={canvasRef}
      className="canvas" 
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      {widgets.map(widget => (
        <WidgetContainer
          key={widget.id}
          widget={widget}
          onUpdate={updateWidget}
          onDelete={deleteWidget}
          isSelected={selectedWidget === widget.id}
          onSelect={setSelectedWidget}
        />
      ))}
      
      {/* Render other users' cursors */}
      {Object.entries(cursors || {}).map(([userId, cursorData]) => (
        <UserCursor
          key={userId}
          user={activeUsers.find(u => u.userId === userId)}
          cursor={cursorData.cursor}
        />
      ))}
    </div>
  );
}