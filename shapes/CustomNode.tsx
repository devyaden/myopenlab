import { memo } from "react";
import { Handle, NodeResizer, Position } from "reactflow";

export const shapeComponents: any = {
  circle: () => <circle cx="50" cy="50" r="40" />,
  square: () => <rect x="10" y="10" width="80" height="80" />,
  diamond: () => <polygon points="50,10 90,50 50,90 10,50" />,
  cylinder: () => (
    <g>
      <path d="M20,20 h60 v60 h-60 z" />
      <ellipse cx="50" cy="20" rx="30" ry="10" />
      <ellipse cx="50" cy="80" rx="30" ry="10" />
    </g>
  ),
  triangle: () => <polygon points="50,10 90,90 10,90" />,
  parallelogram: () => <polygon points="20,20 80,20 70,80 10,80" />,
  plus: () => (
    <path d="M35,10 h30 v25 h25 v30 h-25 v25 h-30 v-25 h-25 v-30 h25 z" />
  ),
  // BPMN Shapes
  task: () => <rect x="10" y="40" width="80" height="40" rx="10" ry="10" />,
  event: () => <circle cx="50" cy="50" r="40" />,
  gateway: () => <polygon points="50,10 90,50 50,90 10,50" />,
  sequenceFlow: () => <path d="M10,50 L90,50" />,
  association: () => <path d="M10,50 L90,50" strokeDasharray="5,5" />,
  messageFlow: () => <path d="M10,50 L90,50" strokeDasharray="2,2" />,
  lane: () => <rect x="10" y="10" width="80" height="80" fill="none" />,
  pool: () => <rect x="10" y="10" width="80" height="60" fill="none" />,
  annotation: () => <polygon points="10,10 90,10 90,90 10,90" />,
  group: () => <rect x="10" y="10" width="80" height="80" fill="none" />,
};

const CustomNode = memo(({ data, isConnectable }: any) => {
  const ShapeComponent = shapeComponents[data.shape] || shapeComponents.circle;

  return (
    <>
      <NodeResizer
        minWidth={50}
        minHeight={50}
        keepAspectRatio
        lineStyle={{
          border: "none",
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="custom-node">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <g fill="white" stroke="black" strokeWidth="2">
            <ShapeComponent />
          </g>
        </svg>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});

CustomNode.displayName = "customShape";

export default CustomNode;
