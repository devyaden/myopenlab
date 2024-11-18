import { useReactFlow } from "reactflow";
import ShapeComponents from "../shapes/Shapes";

const categories = {
  "الكائنات التدفقية": [
    "circle",
    "square",
    "diamond",
    "triangle",
    "parallelogram",
    "task",
  ],
  "Group Shapes": ["group"],
  "Text Shapes": ["text"],
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
    if (shape === "text") {
      return (
        <div
          key={shape}
          className="flex items-center justify-center cursor-move"
          onDragStart={(event) => onDragStart(event, shape)}
          draggable
        >
          <div className="w-8 h-8 border-2 border-dashed border-gray-500 flex items-center justify-center">
            <span className="text-xs">T</span>
          </div>
        </div>
      );
    }

    if (shape === "group") {
      return (
        <div
          key={shape}
          className="flex items-center justify-center cursor-move"
          onDragStart={(event) => onDragStart(event, shape)}
          draggable
        >
          <div className="w-8 h-8 border-2 border-dashed border-gray-500 flex items-center justify-center">
            <span className="text-xs">G</span>
          </div>
        </div>
      );
    }

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
    <aside className="w-64 bg-white p-4 rounded-lg shadow-lg">
      <div className="mb-6 text-lg font-semibold">أشكال التدفق</div>

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
        <h3 className="text-lg font-semibold mb-4">النمط</h3>
        <div className="space-y-4">
          {/* لون الخلفية */}
          <div>
            <label className="block text-sm font-medium mb-1">
              لون الخلفية
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

          {/* لون الحدود */}
          <div>
            <label className="block text-sm font-medium mb-1">لون الحدود</label>
            <input
              type="color"
              className="w-full h-8 rounded cursor-pointer"
              onChange={(e) =>
                updateSelectedNodesStyle({ borderColor: e.target.value })
              }
              disabled={!hasSelectedNodes}
            />
          </div>

          {/* نمط الحدود */}
          <div>
            <label className="block text-sm font-medium mb-1">نمط الحدود</label>
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

          {/* عرض الحدود */}
          <div>
            <label className="block text-sm font-medium mb-1">عرض الحدود</label>
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
