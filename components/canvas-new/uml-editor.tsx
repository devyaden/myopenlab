"use client";

import { useCallback, useState, useRef } from "react";
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
  type ReactFlowInstance,
  MarkerType,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { GenericNode } from "./nodes/generic-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { UMLToolbar } from "./uml-toolbar";
import TableView from "./table-view";
import { Button } from "@/components/ui/button";
import { TextNode } from "./nodes/text-node";

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
};

interface UMLEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  nodeStyles: Record<string, any>;
  selectedNodes: string[];
  onNodeSelect: (nodeIds: string[]) => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onAddSwimlane: (position: { x: number; y: number }) => void;
  onLabelChange: (nodeId: string, newLabel: string) => void;
  onAddLane: (swimlaneId: string) => void;
  onDelete: () => void;
  selectedEdge: string | null;
  onEdgeSelect: (edgeIds: string[]) => void;
  onChangeEdgeStyle: (style: string) => void;
  onChangeEdgeLabel: (edgeId: string, label: string) => void;
}

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || "");

  const edgeType = data?.type || "default";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let strokeDasharray;
  switch (edgeType) {
    case "dashed":
      strokeDasharray = "5,5";
      break;
    case "dotted":
      strokeDasharray = "1,5";
      break;
  }

  const handleDoubleClick = (
    event: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    event.preventDefault();
    setIsEditing(true);
  };

  const handleLabelChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setLabelText(event.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, labelText);
    }
  };

  return (
    <>
      <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        stroke="#000"
        style={style}
        markerEnd={markerEnd}
      />
      {edgeType === "double" && (
        <path
          d={edgePath}
          className="react-flow__edge-path"
          strokeWidth={2}
          stroke="#000"
          style={{ ...style, transform: "translate(0, 3px)" }}
        />
      )}
      {isEditing ? (
        <foreignObject
          width={100}
          height={40}
          x={labelX - 50}
          y={labelY - 20}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <input
            type="text"
            value={labelText}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            className="nodrag nopan"
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              textAlign: "center",
            }}
            autoFocus
          />
        </foreignObject>
      ) : (
        labelText && (
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="central"
            className="react-flow__edge-text"
            onDoubleClick={handleDoubleClick}
          >
            {labelText}
          </text>
        )
      )}
    </>
  );
};

export function UMLEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeStyles,
  selectedNodes,
  onNodeSelect,
  onAddNode,
  onAddSwimlane,
  onLabelChange,
  onAddLane,
  onDelete,
  selectedEdge,
  onEdgeSelect,
  onChangeEdgeStyle,
  onChangeEdgeLabel,
}: UMLEditorProps) {
  const { getNode, project } = useReactFlow();
  const [viewMode, setViewMode] = useState<"canvas" | "table">("canvas");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes).map((node) => {
        if (node.parentNode) {
          const parent = getNode(node.parentNode);
          if (parent && node.position) {
            const minX = 10; // Minimum X position to avoid overlapping with the vertical swimlane header
            const maxX = (parent.width || 0) - (node.width || 0);
            const maxY = (parent.height || 0) - (node.height || 0);

            return {
              ...node,
              position: {
                x: Math.max(minX, Math.min(node.position.x, maxX)),
                y: Math.max(0, Math.min(node.position.y, maxY)),
              },
            };
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);

      const selectChange = changes.find((change) => change.type === "select");
      if (selectChange) {
        const selectedNodeIds = updatedNodes
          .filter((node) => node.selected)
          .map((node) => node.id);
        onNodeSelect(selectedNodeIds);
      }
    },
    [getNode, onNodesChange, onNodeSelect, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(updatedEdges);

      const selectChange = changes.find((change) => change.type === "select");
      if (selectChange) {
        const selectedEdgeIds = updatedEdges
          .filter((edge) => edge.selected)
          .map((edge) => edge.id);
        onEdgeSelect(selectedEdgeIds);
      }
    },
    [edges, onEdgesChange, onEdgeSelect]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "custom",
        data: { type: "default", label: "", onLabelChange: onChangeEdgeLabel },
        markerEnd: { type: MarkerType.Arrow },
      };
      const updatedEdges = addEdge(newEdge, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange, onChangeEdgeLabel]
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

  const handleSwimlaneUpdate = useCallback(
    (nodeId: string, newLabel: string) => {
      onLabelChange(nodeId, newLabel);
    },
    [onLabelChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (type === "swimlane") {
        onAddSwimlane(position);
      } else {
        onAddNode(type, position);
      }
    },
    [reactFlowInstance, onAddNode, onAddSwimlane]
  );

  const handleAddNode = useCallback(
    (shape: string) => {
      if (reactFlowInstance) {
        const position = reactFlowInstance.project({
          x: Math.random() * 500,
          y: Math.random() * 500,
        });
        onAddNode(shape, position);
      }
    },
    [reactFlowInstance, onAddNode]
  );

  const handleAddSwimlane = useCallback(() => {
    if (reactFlowInstance) {
      const position = reactFlowInstance.project({
        x: Math.random() * 500,
        y: Math.random() * 500,
      });
      onAddSwimlane(position);
    }
  }, [reactFlowInstance, onAddSwimlane]);

  const applyEdgeStyle = useCallback(
    (style: string) => {
      const updatedEdges = edges.map((edge) => {
        if (edge.id === selectedEdge) {
          return {
            ...edge,
            type: "custom",
            data: { ...edge.data, type: style },
          };
        }
        return edge;
      });
      onEdgesChange(updatedEdges);
    },
    [edges, selectedEdge, onEdgesChange]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const updatedEdges = edges.map((e) =>
        e.id === oldEdge.id ? { ...e, ...newConnection } : e
      );
      onEdgesChange(updatedEdges as Edge[]);
    },
    [edges, onEdgesChange]
  );

  return (
    <div className="w-full h-[calc(100vh-132px)]" ref={reactFlowWrapper}>
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
        <>
          <UMLToolbar
            onAddNode={handleAddNode}
            onAddSwimlane={handleAddSwimlane}
            onChangeEdgeStyle={applyEdgeStyle}
          />
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                style: {
                  ...nodeStyles[node.id],
                  width:
                    node.style?.width || (node.type === "textNode" ? 150 : 100),
                  height:
                    node.style?.height || (node.type === "textNode" ? 50 : 100),
                },
                onLabelChange:
                  node.type === "swimlaneNode"
                    ? handleSwimlaneUpdate
                    : onLabelChange,
                onAddLane: node.type === "swimlaneNode" ? onAddLane : undefined,
              },
              style: {
                width:
                  node.style?.width || (node.type === "textNode" ? 150 : 100),
                height:
                  node.style?.height || (node.type === "textNode" ? 50 : 100),
              },
              connectable: node.type !== "textNode",
              selected: selectedNodes.includes(node.id),
            }))}
            edges={edges.map((edge) => ({
              ...edge,
              data: { ...edge.data, onLabelChange: onChangeEdgeLabel },
            }))}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={{ custom: CustomEdge }}
            fitView
            className="bg-white"
            multiSelectionKeyCode={["Meta", "Shift"]}
            selectNodesOnDrag={false}
            elementsSelectable={true}
            edgeUpdaterRadius={10}
            onEdgeUpdate={onEdgeUpdate}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </>
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
