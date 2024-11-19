import { memo, useCallback, useState } from "react";
import { Handle, NodeResizer, Position } from "reactflow";
import ShapeComponents from "./Shapes";

interface NodeData {
  shape: string;
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  onLabelChange?: (newLabel: string) => void;
  borderStyle?: string;
  borderWidth?: string;
}

interface CustomNodeProps {
  data: NodeData;
  isConnectable: boolean;
  selected?: boolean;
}

const CustomNode = memo(
  ({ data, isConnectable, selected }: CustomNodeProps) => {
    const [dimensions, setDimensions] = useState({ width: 150, height: 150 });
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState(data.label || "");

    const onResize = useCallback(
      (_: any, { width, height }: { width: number; height: number }) => {
        setDimensions({ width, height });
      },
      []
    );

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
        if (e.key === "Enter" && data.onLabelChange) {
          data.onLabelChange(labelText);
        } else {
          setLabelText(data.label || "");
        }
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
      if (data.onLabelChange) {
        data.onLabelChange(labelText);
      }
    };

    const ShapeComponent =
      ShapeComponents[data.shape] || ShapeComponents.circle;
    const backgroundColor = data.backgroundColor || "white";
    const borderColor = data.borderColor || "#1a192b";
    const borderStyle = data.borderStyle || "solid";
    const borderWidth = data.borderWidth || "2px";

    // Common handle styles
    const handleStyle = {
      width: "8px",
      height: "8px",
      background: "#fff",
      backgroundColor: "#1a192b",

      // only viible on hover and selected
      opacity: selected ? 1 : 0,
    };

    return (
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
          zIndex: 99999,
        }}
      >
        <div
          style={{
            touchAction: "none",
            position: "relative",
          }}
        >
          {selected && (
            <NodeResizer
              isVisible={selected}
              onResize={onResize}
              keepAspectRatio={false}
              minWidth={100}
              minHeight={100}
              handleStyle={{ width: "8px", height: "8px" }}
            />
          )}

          {/* Top Handles */}
          <Handle
            type="target"
            position={Position.Top}
            id="top-target"
            style={{ ...handleStyle, left: "50%" }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Top}
            id="top-source"
            style={{ ...handleStyle, left: "50%" }}
            isConnectable={isConnectable}
          />

          {/* Bottom Handles */}
          <Handle
            type="target"
            position={Position.Bottom}
            id="bottom-target"
            style={{ ...handleStyle, left: "50%" }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-source"
            style={{ ...handleStyle, left: "50%" }}
            isConnectable={isConnectable}
          />

          {/* Left Handles */}
          <Handle
            type="target"
            position={Position.Left}
            id="left-target"
            style={{ ...handleStyle, top: "50%" }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left-source"
            style={{ ...handleStyle, top: "50%" }}
            isConnectable={isConnectable}
          />

          {/* Right Handles */}
          <Handle
            type="target"
            position={Position.Right}
            id="right-target"
            style={{ ...handleStyle, top: "50%" }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right-source"
            style={{ ...handleStyle, top: "50%" }}
            isConnectable={isConnectable}
          />

          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            style={{
              cursor: "move",
            }}
          >
            <g
              fill={backgroundColor}
              stroke={borderColor}
              strokeWidth={borderWidth}
              strokeDasharray={
                borderStyle === "dashed"
                  ? "5,5"
                  : borderStyle === "dotted"
                    ? "2,2"
                    : "none"
              }
            >
              <ShapeComponent
                width={dimensions.width}
                height={dimensions.height}
              />
            </g>
          </svg>

          {/* <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "all",
            }}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-transparent text-center border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                autoFocus
                aria-multiline
                style={{
                  minWidth: "50px",
                  maxWidth: `${dimensions.width * 0.8}px`,
                }}
              />
            ) : (
              <span
                style={{
                  minWidth: "50px",
                  maxWidth: `${dimensions.width * 0.8}px`,
                }}
              >
                {labelText || "Double click to edit"}
              </span>
            )}
          </div> */}
        </div>
      </div>
    );
  }
);

CustomNode.displayName = "CustomShape";

export default CustomNode;
