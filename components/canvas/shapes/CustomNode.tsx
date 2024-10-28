import { memo, useCallback, useState } from "react";
import { Handle, NodeResizer, Position } from "reactflow";

// Shape components remain unchanged since they use SVG attributes
export const shapeComponents: Record<string, React.FC<ShapeProps>> = {
  circle: ({ width, height }) => (
    <ellipse
      cx={width / 2}
      cy={height / 2}
      rx={width / 2.2}
      ry={height / 2.2}
    />
  ),
  square: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    return (
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
      />
    );
  },
  diamond: ({ width, height }) => {
    const points = [
      `${width / 2},${height * 0.1}`,
      `${width * 0.9},${height / 2}`,
      `${width / 2},${height * 0.9}`,
      `${width * 0.1},${height / 2}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  cylinder: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const x = padding;
    const y = padding;
    const ellipseHeight = Math.min(h * 0.15, w * 0.3);

    return (
      <g>
        <path
          d={`
            M${x},${y + ellipseHeight}
            v${h - ellipseHeight * 2}
            q0,${ellipseHeight} ${w},${ellipseHeight}
            v-${h - ellipseHeight * 2}
            q0,-${ellipseHeight} -${w},-${ellipseHeight}
            Z
          `}
        />
        <ellipse
          cx={x + w / 2}
          cy={y + ellipseHeight}
          rx={w / 2}
          ry={ellipseHeight}
        />
      </g>
    );
  },
  triangle: ({ width, height }) => {
    const points = [
      `${width / 2},${height * 0.1}`,
      `${width * 0.9},${height * 0.9}`,
      `${width * 0.1},${height * 0.9}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  parallelogram: ({ width, height }) => {
    const skew = width * 0.15;
    const points = [
      `${skew},${height * 0.1}`,
      `${width - 0},${height * 0.1}`,
      `${width - skew},${height * 0.9}`,
      `${0},${height * 0.9}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  task: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    return (
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        rx={10}
        ry={10}
      />
    );
  },
};

interface NodeData {
  shape: string;
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  onLabelChange?: (newLabel: string) => void;
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
      shapeComponents[data.shape] || shapeComponents.circle;
    const backgroundColor = data.backgroundColor || "white";
    const borderColor = data.borderColor || "#1a192b";

    return (
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        <div style={{ touchAction: "none" }}>
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

          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            style={{ cursor: "move" }}
          >
            <g fill={backgroundColor} stroke={borderColor} strokeWidth="2">
              <ShapeComponent
                width={dimensions.width}
                height={dimensions.height}
              />
            </g>
          </svg>

          <div
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
          </div>

          <Handle
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            style={{ width: "8px", height: "8px" }}
          />
          <Handle
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ width: "8px", height: "8px" }}
          />
        </div>
      </div>
    );
  }
);

CustomNode.displayName = "CustomShape";

export default CustomNode;
