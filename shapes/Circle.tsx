import React from "react";
import { Handle, Position } from "reactflow";

const CircleNode = ({ data }) => {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: "50%",
        border: "1px solid #1a192b",
        backgroundColor: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "grab",
      }}
    >
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ bottom: 0 }} />
      <Handle type="target" position={Position.Top} style={{ top: 0 }} />
    </div>
  );
};

export default CircleNode;
