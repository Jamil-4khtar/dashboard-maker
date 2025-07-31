// src/widgets/ChartWidget/ChartWidget.js
import React from 'react';

export default function ChartWidget({ widget, isSelected, onSelect }) {
  const data = widget.config.data;
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div 
      className={`widget-content chart-widget ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(widget.id)}
    >
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-bar">
            <div 
              className="bar"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}