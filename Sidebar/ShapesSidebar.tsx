import React from "react";
import { shapeComponents } from "../shapes/CustomNode";
import { useReactFlow } from "reactflow";
import ShapeComponents from "@/components/canvas/shapes/Shapes";

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

const borderStyles = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
  { label: "Double", value: "double" },
];

const ShapeSidebar = () => {
  const { getNodes, setNodes } = useReactFlow();

  const onDragStart = (event: React.DragEvent, shapeType: string) => {
    event.dataTransfer.setData("application/reactflow", shapeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const updateSelectedNodesStyle = (
    styleUpdate: Partial<{
      backgroundColor: string;
      borderColor: string;
      borderStyle: string;
      borderWidth: string;
    }>
  ) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.selected) {
          return {
            ...node,
            data: {
              ...node.data,
              ...styleUpdate,
            },
          };
        }
        return node;
      })
    );
  };

  const renderShape = (shape: string) => {
    const ShapeComponent = ShapeComponents[shape];
    if (!ShapeComponent) return null;

    return (
      <div
        key={shape}
        className="flex items-center justify-center cursor-move"
        onDragStart={(event) => onDragStart(event, shape)}
        draggable
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 30 30"
          className="overflow-visible"
        >
          <g
            fill="white"
            stroke="black"
            strokeWidth="2"
            className="transform scale-90"
          >
            <ShapeComponent width={30} height={30} />
          </g>
        </svg>
      </div>
    );
  };

  const hasSelectedNodes = getNodes().some((node) => node.selected);

  return (
    <aside className="w-[250px] h-full bg-gray-800 p-4 overflow-y-auto">
      <div className="text-white mb-4">Drag BPMN shapes to the canvas</div>
      {Object.entries(categories).map(([category, shapes]) => (
        <div key={category} className="mb-8">
          <h4 className="mb-4 font-medium text-sm uppercase tracking-wider">
            {category}
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {shapes.map((shape) => renderShape(shape))}
          </div>
        </div>
      ))}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <div className="space-y-4">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Background Color
            </label>
            <input
              type="color"
              className="w-full h-8 rounded cursor-pointer"
              onChange={(e) =>
                updateSelectedNodesStyle({ backgroundColor: e.target.value })
              }
              disabled={!hasSelectedNodes}
            />
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Border Color
            </label>
            <input
              type="color"
              className="w-full h-8 rounded cursor-pointer"
              onChange={(e) =>
                updateSelectedNodesStyle({ borderColor: e.target.value })
              }
              disabled={!hasSelectedNodes}
            />
          </div>

          {/* Border Style */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Border Style
            </label>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                updateSelectedNodesStyle({ borderStyle: e.target.value })
              }
              disabled={!hasSelectedNodes}
            >
              {borderStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Border Width
            </label>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full"
              onChange={(e) =>
                updateSelectedNodesStyle({ borderWidth: `${e.target.value}px` })
              }
              disabled={!hasSelectedNodes}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ShapeSidebar;
