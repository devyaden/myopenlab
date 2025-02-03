import { memo } from "react";
import { Handle, Position } from "reactflow";

interface ClassNodeProps {
  data: {
    name: string;
    attributes: string[];
    methods: string[];
    style: React.CSSProperties;
  };
}

export const ClassNode = memo(({ data }: ClassNodeProps) => {
  return (
    <div
      className="bg-white border-2 border-gray-300 rounded p-2 shadow-md"
      style={data.style}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="font-bold text-center border-b border-gray-300 pb-2 mb-2">
        {data.name}
      </div>
      <div className="text-sm">
        <div className="border-b border-gray-300 pb-2 mb-2">
          {data.attributes.map((attr, index) => (
            <div key={index}>{attr}</div>
          ))}
        </div>
        <div>
          {data.methods.map((method, index) => (
            <div key={index}>{method}</div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ClassNode.displayName = "ClassNode";
