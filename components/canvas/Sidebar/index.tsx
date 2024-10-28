import React from "react";
import { shapeComponents } from "../shapes/CustomNode";

const categories = {
  "Flow Objects": [
    "circle",
    "square",
    "diamond",

    "triangle",
    "parallelogram",
    "task",
  ],
};

const ShapeSidebar = () => {
  const onDragStart = (event: React.DragEvent, shapeType: string) => {
    event.dataTransfer.setData("application/reactflow", shapeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const renderShape = (shape: string) => {
    const ShapeComponent = shapeComponents[shape];
    if (!ShapeComponent) return null;

    return (
      <div
        key={shape}
        className="flex items-center justify-center cursor-move"
        onDragStart={(event) => onDragStart(event, shape)}
        draggable
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          className="overflow-visible"
        >
          <g
            fill="white"
            stroke="black"
            strokeWidth="2"
            className="transform scale-90"
          >
            <ShapeComponent width={60} height={60} />
          </g>
        </svg>
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white p-4 rounded-lg shadow-lg">
      <div className=" mb-6 text-lg font-semibold">Flow Shapes</div>

      {Object.entries(categories).map(([category, shapes]) => (
        <div key={category} className="mb-8">
          <h4 className="mb-4 font-medium text-sm uppercase tracking-wider">
            {category}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {shapes.map((shape) => renderShape(shape))}
          </div>
        </div>
      ))}
    </aside>
  );
};

export default ShapeSidebar;
