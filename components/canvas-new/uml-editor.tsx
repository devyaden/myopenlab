"use client";

import { useCallback } from "react";
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
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { GenericNode } from "./nodes/generic-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { UMLToolbar } from "./uml-toolbar";

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

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes).map((node) => {
        if (node.parentNode) {
          const parent = getNode(node.parentNode);
          if (parent && node.position) {
            const isOutsideParent =
              node.position.x < 0 ||
              node.position.y < 0 ||
              node.position.x > (parent.width || 0) - 100 ||
              node.position.y > (parent.height || 0) - 40;

            if (isOutsideParent) {
              return {
                ...node,
                position: {
                  x: Math.max(
                    0,
                    Math.min(node.position.x, (parent.width || 0) - 100)
                  ),
                  y: Math.max(
                    0,
                    Math.min(node.position.y, (parent.height || 0) - 40)
                  ),
                },
              };
            }
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);

      const selectChange = changes.find((change) => change.type === "select");
      if (selectChange) {
        // @ts-ignore
        onNodeSelect(selectChange?.selected ? selectChange.id : null);
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
              n.position.x > swimlaneRect.left &&
              n.position.x < swimlaneRect.right &&
              n.position.y > swimlaneRect.top &&
              n.position.y < swimlaneRect.bottom
            );
          });

          if (parentSwimlane) {
            return {
              ...n,
              parentNode: parentSwimlane.id,
              extent: "parent",
              position: {
                x: n.position.x - parentSwimlane.position.x - 100,
                y: n.position.y - parentSwimlane.position.y,
              },
            };
          } else {
            const { parentNode, extent, ...rest } = n;
            if (parentNode) {
              const parent = getNode(parentNode)!;
              return {
                ...rest,
                position: {
                  x: n.position.x + parent.position.x + 100,
                  y: n.position.y + parent.position.y,
                },
              };
            }
            return rest;
          }
        }
        return n;
      });

      onNodesChange(updatedNodes as Node[]);
    },
    [nodes, onNodesChange, getNode]
  );

  return (
    <div className="w-full h-[calc(100vh-132px)]">
      <UMLToolbar onAddNode={onAddNode} onAddSwimlane={onAddSwimlane} />
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
        // panOnDrag={[1, 2]}
        elementsSelectable={true}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
