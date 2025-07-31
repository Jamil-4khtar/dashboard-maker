import { WIDGET_TYPES } from "../../lib/constants";

export default function Sidebar({ onAddWidget }) {
  return (
    <div className="sidebar">
      <h3>Widgets</h3>
      <div className="widget-library">
        {Object.entries(WIDGET_TYPES).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={type}
              className="widget-btn"
              onClick={() => onAddWidget(type)}
            >
              <Icon size={20} />
              <span>{config.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}