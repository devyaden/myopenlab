"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
  type Node,
  type Edge,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { GenericNode } from "./nodes/generic-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { UMLToolbar } from "./uml-toolbar";
import TableView from "./table-view";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
};

interface UMLEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  nodeStyles: Record<string, any>;
  onNodeSelect: (nodeId: string | null) => void;
  onAddSwimlane: () => void;
  onLabelChange: (nodeId: string, newLabel: string) => void;
}

export function UMLEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeStyles,
  onNodeSelect,
  onAddSwimlane,
  onLabelChange,
}: UMLEditorProps) {
  const { getNode } = useReactFlow();
  const [viewMode, setViewMode] = useState<"canvas" | "table">("canvas");

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes).map((node) => {
        if (node.parentNode) {
          const parent = getNode(node.parentNode);
          if (parent && node.position) {
            const minY = 48; // Minimum Y position to avoid overlapping with the swimlane header
            const maxX = (parent.width || 0) - (node.width || 0);
            const maxY = (parent.height || 0) - (node.height || 0);

            return {
              ...node,
              position: {
                x: Math.max(0, Math.min(node.position.x, maxX)),
                y: Math.max(minY, Math.min(node.position.y, maxY)),
              },
            };
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);

      const selectChange = changes.find((change) => change.type === "select");
      if (selectChange) {
        onNodeSelect(selectChange.selected ? selectChange.id : null);
      } else if (changes.some((change) => change.type === "remove")) {
        onNodeSelect(null);
      }
    },
    [getNode, onNodesChange, onNodeSelect, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      const updatedEdges = addEdge(params, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );

  const onAddNode = useCallback(() => {
    const newNode = {
      id: `${Date.now()}`,
      type: "genericNode",
      position: { x: 100, y: 100 },
      data: { label: `New Node` },
    };
    onNodesChange([...nodes, newNode]);
  }, [nodes, onNodesChange]);

  const handleSelectionChange = useCallback(
    (elements: { nodes: Node[]; edges: Edge[] }) => {
      if (elements.nodes.length === 1) {
        onNodeSelect(elements.nodes[0].id);
      } else if (elements.nodes.length === 0) {
        onNodeSelect(null);
      }
    },
    [onNodeSelect]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, draggedNode: Node, draggedNodes: Node[]) => {
      const swimlanes = nodes.filter((n) => n.type === "swimlaneNode");
      const updatedNodes = nodes.map((n) => {
        if (draggedNodes.some((dn) => dn.id === n.id)) {
          if (n.type === "swimlaneNode") return n;

          const parentSwimlane = swimlanes.find((swimlane) => {
            const swimlaneRect = {
              left: swimlane.position.x,
              right: swimlane.position.x + (swimlane.width || 0),
              top: swimlane.position.y,
              bottom: swimlane.position.y + (swimlane.height || 0),
            };
            return (
              n.position.x >= swimlaneRect.left &&
              n.position.x < swimlaneRect.right &&
              n.position.y >= swimlaneRect.top &&
              n.position.y < swimlaneRect.bottom
            );
          });

          if (parentSwimlane) {
            // Node is inside a swimlane
            return {
              ...n,
              parentNode: parentSwimlane.id,
              extent: "parent",
              position: {
                x: n.position.x - parentSwimlane.position.x,
                y: Math.max(48, n.position.y - parentSwimlane.position.y),
              },
            };
          } else {
            // Node is outside any swimlane
            const { parentNode, extent, ...rest } = n;
            return {
              ...rest,
              position: n.position,
            };
          }
        }
        return n;
      });

      onNodesChange(updatedNodes as Node[]);
    },
    [nodes, onNodesChange]
  );

  const handleTableNodesChange = useCallback(
    (updatedNodes: Node[]) => {
      // Check if any nodes were deleted
      const deletedNodeIds = nodes
        .filter((node) => !updatedNodes.some((n) => n.id === node.id))
        .map((node) => node.id);

      if (deletedNodeIds.length > 0) {
        // Remove deleted nodes
        const newNodes = nodes.filter(
          (node) => !deletedNodeIds.includes(node.id)
        );
        onNodesChange(newNodes);
      } else {
        // Update existing nodes
        const newNodes = nodes.map((node) => {
          const updatedNode = updatedNodes.find((n) => n.id === node.id);
          return updatedNode
            ? { ...node, data: { ...node.data, ...updatedNode.data } }
            : node;
        });
        onNodesChange(newNodes);
      }
    },
    [nodes, onNodesChange]
  );

  const handleTableEdgesChange = useCallback(
    (updatedEdges: Edge[]) => {
      onEdgesChange(updatedEdges);
    },
    [onEdgesChange]
  );

  return (
    <div className="w-full h-[calc(100vh-132px)]">
      <UMLToolbar onAddNode={onAddNode} onAddSwimlane={onAddSwimlane} />
      <div className="flex justify-end mb-4">
        <Button
          onClick={() =>
            setViewMode(viewMode === "canvas" ? "table" : "canvas")
          }
        >
          Switch to {viewMode === "canvas" ? "Table" : "Canvas"} View
        </Button>
      </div>
      {viewMode === "canvas" ? (
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              style: nodeStyles[node.id],
              onLabelChange: onLabelChange,
            },
            selectable: true,
          }))}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onSelectionChange={handleSelectionChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-white"
          multiSelectionKeyCode={["Meta", "Shift"]}
          selectNodesOnDrag={false}
          panOnDrag={[1, 2]}
          elementsSelectable={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
      ) : (
        <TableView
          nodes={nodes}
          edges={edges}
          onNodesChange={handleTableNodesChange}
          onEdgesChange={handleTableEdgesChange}
        />
      )}
    </div>
  );
}
