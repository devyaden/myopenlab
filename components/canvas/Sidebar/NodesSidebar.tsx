import React, { useEffect, useRef, useState } from "react";
import { Node } from "reactflow";

interface SidebarProps {
  nodes: Node[];
  handleTransform: (x: number, y: number) => void;
}

const NodesSidebar: React.FC<SidebarProps> = ({ nodes, handleTransform }) => {
  const nodesWithoutText = nodes.filter((node) => node.type !== "text");

  return (
    <>
      <div className="bg-gradient-to-br from-gray-50 to-gray-200 px-2 py-5 rounded-xl shadow-lg h-full w-full overflow-hidden max-w-64">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Nodes</h2>
        <ul className="space-y-3 overflow-y-auto h-full w-full">
          {nodesWithoutText?.map((node) => (
            <li
              key={node.id}
              className="flex flex-col gap-2 bg-white p-3 rounded-lg shadow-md border border-gray-200 cursor-pointer transition transform hover:scale-105 hover:shadow-lg hover:border-gray-300"
              onClick={() =>
                handleTransform(node.position?.x, node.position?.y)
              }
            >
              <h3 className="font-semibold text-gray-700">
                {node?.data?.label}
              </h3>
              <p className="text-sm text-gray-500">ID: {node?.id}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default NodesSidebar;
