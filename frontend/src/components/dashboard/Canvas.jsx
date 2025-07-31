import { useContext } from "react";
import { DashboardContext } from "../../contexts/allContext";
import WidgetContainer from "./WidgetContainer";


export default function Canvas() {
  const { widgets, addWidget, updateWidget, deleteWidget, selectedWidget, setSelectedWidget } = useContext(DashboardContext)

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedWidget(null);
    }
  };

  return (
    <div className="canvas" onClick={handleCanvasClick}>
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
    </div>
  );
}