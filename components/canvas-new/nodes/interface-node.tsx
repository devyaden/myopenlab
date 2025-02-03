import { memo } from "react";
import { Handle, Position } from "reactflow";

interface InterfaceNodeProps {
  data: {
    name: string;
    methods: string[];
    style: React.CSSProperties;
  };
}

export const InterfaceNode = memo(({ data }: InterfaceNodeProps) => {
  return (
    <div
      className="bg-white border-2 border-gray-300 rounded p-2 shadow-md"
      style={data.style}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="font-bold text-center border-b border-gray-300 pb-2 mb-2">
        &lt;&lt;interface&gt;&gt;
        <br />
        {data.name}
      </div>
      <div className="text-sm">
        {data.methods.map((method, index) => (
          <div key={index}>{method}</div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

InterfaceNode.displayName = "InterfaceNode";
