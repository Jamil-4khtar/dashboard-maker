import { useState, useEffect, useRef } from "react";
import { WIDGET_TYPES } from "../../lib/constants";
import { Move, X } from "lucide-react";

export default function WidgetContainer({ widget, onUpdate, onDelete, isSelected, onSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef();

  const WidgetComponent = WIDGET_TYPES[widget.type].component;

  const handleMouseDown = (e) => {
    if (e.target.closest('.widget-content')) return; // Don't drag when interacting with content
    setIsDragging(true);
    setDragStart({
      x: e.clientX - widget.position.x,
      y: e.clientY - widget.position.y
    });
    onSelect(widget.id);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, e.clientX - dragStart.x);
    const newY = Math.max(0, e.clientY - dragStart.y);
    
    onUpdate(widget.id, {
      ...widget,
      position: { ...widget.position, x: newX, y: newY }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      ref={widgetRef}
      className={`widget ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.w,
        height: widget.position.h
      }}
      onMouseDown={handleMouseDown}
    >
      {isSelected && (
        <div className="widget-controls">
          <button 
            className="control-btn delete-btn"
            onClick={() => onDelete(widget.id)}
          >
            <X size={14} />
          </button>
          <div className="drag-handle">
            <Move size={14} />
          </div>
        </div>
      )}
      <WidgetComponent 
        widget={widget}
        onUpdate={(id, config) => onUpdate(id, { ...widget, config })}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </div>
  );
}