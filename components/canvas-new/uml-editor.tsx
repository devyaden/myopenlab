"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  type Node as ReactFlowNode,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ColumnData } from "./add-column-sidebar";
import CustomEdge from "./custom-edge";
import { GenericNode } from "./nodes/generic-node";
import { ImageNode } from "./nodes/image-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { TextNode } from "./nodes/text-node";
import TableView from "./table-view";
import { UMLToolbar } from "./uml-toolbar";
import MeasureRuler from "./measure-ruler";

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
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
  onEdgeSelect: (edgeIds: string[]) => void;
  onChangeEdgeLabel: (edgeId: string, label: string) => void;
  onAddImage: (position?: any) => void;
  viewMode: "canvas" | "table";
  onAddColumn: (columnData: ColumnData) => void;
  columns: ColumnData[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnData[]>>;
}

const sortNodes = (node: ReactFlowNode, nodes: ReactFlowNode[]) => {
  nodes = [...nodes].sort((a, b) => {
    if (a.id === node.id) return 1;
    if (b.id === node.id) return -1;
    return 0;
  });
  const children = nodes.filter((n) => n.parentNode === node.id);
  children.forEach((child) => {
    nodes = sortNodes(child, nodes);
  });

  return nodes;
};

const findAbsolutePosition = (
  currentNode: ReactFlowNode,
  allNodes: ReactFlowNode[]
): { x: number; y: number } => {
  if (!currentNode?.parentNode) {
    return { x: currentNode.position.x, y: currentNode.position.y };
  }

  const parentNode = allNodes.find((n) => n.id === currentNode.parentNode);
  if (!parentNode) {
    return { x: currentNode.position.x, y: currentNode.position.y };
  }

  const parentPosition = findAbsolutePosition(parentNode, allNodes);
  return {
    x: parentPosition.x + currentNode.position.x,
    y: parentPosition.y + currentNode.position.y,
  };
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
  onEdgeSelect,
  onChangeEdgeLabel,
  onAddImage,
  viewMode,
  onAddColumn,
  columns,
  setColumns,
}: UMLEditorProps) {
  const { getNode } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [showRulers, setShowRulers] = useState(false);
  const [background, setBackground] = useState<BackgroundVariant>(
    BackgroundVariant.Dots
  );

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitToScreen = useCallback(() => {
    fitView();
  }, [fitView]);

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
        type: "floating",
        data: { type: "default", label: "", onLabelChange: onChangeEdgeLabel },
        markerEnd: { type: MarkerType.Arrow },
      };
      const updatedEdges = addEdge(newEdge, edges);
      onEdgesChange(updatedEdges);

      // Update the nodes to reflect the new connection
      const updatedNodes = nodes.map((node) => {
        if (node.id === params.source) {
          return {
            ...node,
            data: {
              ...node.data,
              to: params.target,
            },
          };
        }
        if (node.id === params.target) {
          return {
            ...node,
            data: {
              ...node.data,
              from: params.source,
            },
          };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    },
    [edges, onEdgesChange, nodes, onNodesChange, onChangeEdgeLabel]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, draggedNode: Node, draggedNodes: Node[]) => {
      const children = nodes.filter((n) => n.parentNode === draggedNode.id);
      let sortedNodes: Node[];
      if (children.length === 0) {
        sortedNodes = [...nodes].sort((a, b) => {
          if (a.id === draggedNode.id) return 1;
          if (b.id === draggedNode.id) return -1;
          return 0;
        });
      } else {
        sortedNodes = sortNodes(draggedNode, nodes);
      }

      const updatedNodes = sortedNodes.map((node) => {
        if (draggedNodes.some((dn) => dn.id === node.id)) {
          const absolutePosition = findAbsolutePosition(node, sortedNodes);
          const intersectingNode = sortedNodes.find(
            (n) =>
              n.id !== node.id &&
              absolutePosition.x >= n.position.x &&
              absolutePosition.x <= n.position.x + (n.width || 0) &&
              absolutePosition.y >= n.position.y &&
              absolutePosition.y <= n.position.y + (n.height || 0)
          );

          if (!intersectingNode) {
            return {
              ...node,
              parentNode: undefined,
              position: absolutePosition,
            };
          } else if (node.id !== intersectingNode.id) {
            const targetAbsolutePosition = findAbsolutePosition(
              intersectingNode,
              sortedNodes
            );
            return {
              ...node,
              parentNode: intersectingNode.id,
              position: {
                x: absolutePosition.x - targetAbsolutePosition.x,
                y: absolutePosition.y - targetAbsolutePosition.y,
              },
            };
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
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
        // Update existing nodes or add new nodes
        const newNodes = updatedNodes.map((updatedNode) => {
          const existingNode = nodes.find((node) => node.id === updatedNode.id);
          if (existingNode) {
            // Update existing node
            return {
              ...existingNode,
              data: {
                ...existingNode.data,
                ...updatedNode.data,
                shape: updatedNode.data.shape || existingNode.data.shape,
              },
              type: updatedNode.type || existingNode.type,
            };
          } else {
            // Add new node
            return {
              ...updatedNode,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
            };
          }
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

      if (type === "image") {
        onAddImage(position);
      } else if (type === "swimlane") {
        onAddSwimlane(position);
      } else {
        onAddNode(type, position);
      }
    },
    [reactFlowInstance, onAddNode, onAddSwimlane, onAddImage]
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

  const handleDeleteNodes = useCallback(
    (nodesToDelete: string[]) => {
      const nodesToDeleteSet = new Set(nodesToDelete);
      const deleteNodeAndChildren = (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          nodesToDeleteSet.add(nodeId);
          nodes.forEach((n) => {
            if (n.parentNode === nodeId) {
              deleteNodeAndChildren(n.id);
            }
          });
        }
      };

      nodesToDelete.forEach((nodeId) => deleteNodeAndChildren(nodeId));

      const updatedNodes = nodes.filter(
        (node) => !nodesToDeleteSet.has(node.id)
      );
      const updatedEdges = edges.filter(
        (edge) =>
          !nodesToDeleteSet.has(edge.source) &&
          !nodesToDeleteSet.has(edge.target)
      );

      onNodesChange(updatedNodes);
      onEdgesChange(updatedEdges);
    },
    [nodes, edges, onNodesChange, onEdgesChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedNodes.length > 0) {
        handleDeleteNodes(selectedNodes);
      }
    },
    [selectedNodes, handleDeleteNodes]
  );

  useEffect(() => {
    document.addEventListener(
      "keydown",
      handleKeyDown as unknown as EventListener
    );
    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown as unknown as EventListener
      );
    };
  }, [handleKeyDown]);

  const handleCreateConnection = useCallback(
    (sourceId: string, targetId: string) => {
      const newEdge = {
        id: `edge-${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: "floating",
        data: { type: "default", label: "", onLabelChange: onChangeEdgeLabel },
        markerEnd: { type: MarkerType.Arrow },
      };
      const updatedEdges = [...edges, newEdge];
      onEdgesChange(updatedEdges);

      // Update the nodes to reflect the new connection
      const updatedNodes = nodes.map((node) => {
        if (node.id === sourceId) {
          return {
            ...node,
            data: {
              ...node.data,
              to: [...(node.data.to || []), targetId],
            },
          };
        }
        if (node.id === targetId) {
          return {
            ...node,
            data: {
              ...node.data,
              from: [...(node.data.from || []), sourceId],
            },
          };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    },
    [edges, onEdgesChange, nodes, onNodesChange, onChangeEdgeLabel]
  );

  const handleDeleteConnection = useCallback(
    (edgeId: string) => {
      const edgeToRemove = edges.find((edge) => edge.id === edgeId);
      if (edgeToRemove) {
        const updatedEdges = edges.filter((edge) => edge.id !== edgeId);
        onEdgesChange(updatedEdges);

        // Update the nodes to reflect the removed connection
        const updatedNodes = nodes.map((node) => {
          if (node.id === edgeToRemove.source) {
            return {
              ...node,
              data: {
                ...node.data,
                to: (node.data.to || []).filter(
                  (id: string) => id !== edgeToRemove.target
                ),
              },
            };
          }
          if (node.id === edgeToRemove.target) {
            return {
              ...node,
              data: {
                ...node.data,
                from: (node.data.from || []).filter(
                  (id: string) => id !== edgeToRemove.source
                ),
              },
            };
          }
          return node;
        });
        onNodesChange(updatedNodes);
      }
    },
    [edges, onEdgesChange, nodes, onNodesChange]
  );

  return (
    <div className="w-full h-[calc(100vh-132px)]" ref={reactFlowWrapper}>
      {viewMode === "canvas" ? (
        <>
          <UMLToolbar
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToScreen={handleFitToScreen}
            onToggleRuler={() => {
              setShowRulers(!showRulers);
            }}
            onChangeBackground={(background: BackgroundVariant) =>
              setBackground(background)
            }
          />
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                style: {
                  ...nodeStyles[node.id],
                  width:
                    node.type === "imageNode"
                      ? node.style?.width
                      : node.style?.width ||
                        (node.type === "textNode" ? 150 : 100),
                  height:
                    node.type === "imageNode"
                      ? node.style?.height
                      : node.style?.height ||
                        (node.type === "textNode" ? 50 : 100),
                },
                onLabelChange:
                  node.type === "swimlaneNode"
                    ? handleSwimlaneUpdate
                    : onLabelChange,
                onAddLane: node.type === "swimlaneNode" ? onAddLane : undefined,
              },
              style: {
                width:
                  node.type === "imageNode"
                    ? node.style?.width
                    : node.style?.width ||
                      (node.type === "textNode" ? 150 : 100),
                height:
                  node.type === "imageNode"
                    ? node.style?.height
                    : node.style?.height ||
                      (node.type === "textNode" ? 50 : 100),
              },
              connectable: node.type !== "textNode",
              selected: selectedNodes.includes(node.id),
            }))}
            edges={edges.map((edge) => ({
              ...edge,
              type: "floating",
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
            edgeTypes={{ floating: CustomEdge }}
            fitView
            className="bg-white"
            multiSelectionKeyCode={["Meta", "Shift"]}
            selectNodesOnDrag={false}
            elementsSelectable={true}
            edgeUpdaterRadius={10}
            onEdgeUpdate={onEdgeUpdate}
            minZoom={0.1}
            maxZoom={4}
            proOptions={{
              hideAttribution: true,
            }}
          >
            <Background variant={background} />
            <Controls showZoom={false} />
            {showRulers && <MeasureRuler />}

            <MiniMap />
          </ReactFlow>
        </>
      ) : (
        <TableView
          nodes={nodes}
          edges={edges}
          onNodesChange={handleTableNodesChange}
          onEdgesChange={handleTableEdgesChange}
          onAddColumn={onAddColumn}
          columns={columns}
          setColumns={setColumns}
          onCreateConnection={handleCreateConnection}
          onDeleteConnection={handleDeleteConnection}
        />
      )}
    </div>
  );
}
