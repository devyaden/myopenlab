import { memo } from "react";
import { Handle, Position } from "reactflow";

interface ActivityNodeProps {
  data: {
    label: string;
    style: React.CSSProperties;
  };
}

export const ActivityNode = memo(({ data }: ActivityNodeProps) => {
  return (
    <div
      className="bg-white border-2 border-gray-300 rounded-full p-4 shadow-md flex items-center justify-center"
      style={data.style}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="text-center">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ActivityNode.displayName = "ActivityNode";
