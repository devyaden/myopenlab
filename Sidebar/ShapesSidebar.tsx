import React from "react";
import { shapeComponents } from "../shapes/CustomNode";

const categories = {
  "Flow Objects": ["circle", "square", "diamond", "task", "event", "gateway"],
  "Connecting Objects": ["sequenceFlow", "association", "messageFlow"],
  Swimlanes: ["lane", "pool"],
  Artifacts: ["annotation", "group"],
};

const ShapeSidebar = () => {
  const onDragStart = (event: React.DragEvent, shapeType: string) => {
    event.dataTransfer.setData("application/reactflow", shapeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-[250px] h-full bg-gray-800 p-4 overflow-y-auto">
      <div className="text-white mb-4">Drag BPMN shapes to the canvas</div>
      {Object.entries(categories).map(([category, shapes]) => (
        <div key={category}>
          <h4 className="text-gray-300 mb-2">{category}</h4>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {shapes.map((shape) => (
              <div
                key={shape}
                className="w-20 h-20 bg-gray-700 flex items-center justify-center cursor-move"
                onDragStart={(event) => onDragStart(event, shape)}
                draggable
              >
                <svg width="60" height="60" viewBox="0 0 100 100">
                  <g fill="none" stroke="white" strokeWidth="2">
                    {React.createElement(shapeComponents[shape])}
                  </g>
                </svg>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
};

export default ShapeSidebar;
