import { useState } from "react";

export default function TextWidget({ widget, onUpdate, isSelected, onSelect }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(widget.config.text);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(widget.id, { ...widget.config, text });
  };

  return (
    <div 
      className={`widget-content ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(widget.id)}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          className="text-editor"
        />
      ) : (
        <div className="text-display" style={{ fontSize: widget.config.fontSize }}>
          {widget.config.text}
        </div>
      )}
    </div>
  );
}