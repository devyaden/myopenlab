"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FlowTable from "./FlowTable";
import { NodeData } from "./FlowTable/types";
import ShapeSidebar from "./Sidebar";
import CustomNode from "./shapes/CustomNode";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

const nodeTypes = {
  custom: CustomNode,
};

const flowKey: string = "example-flow";

interface CanvasProps {
  userId: string | null;
  title: string;
  onCanvasCreated: (id: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({ userId, title, onCanvasCreated }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const { screenToFlowPosition, setViewport, setCenter, getZoom } =
    useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper?.current) return;

      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const shapeType = event.dataTransfer.getData("application/reactflow");

      // Only create new node if we have a shape type (meaning it came from the sidebar)
      if (shapeType) {
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node = {
          id: `${shapeType}-${nodes.length + 1}`,
          type: "custom",
          position,
          draggable: true,
          data: {
            shape: shapeType,
            label: `New ${shapeType}`,
            onLabelChange: (newLabel: string) =>
              handleLabelChange(`${shapeType}-${nodes.length + 1}`, newLabel),
          },
        };

        setNodes([...nodes, newNode]);
      }
    },
    [nodes, setNodes]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const newEdges = edges.filter(
        (edge) =>
          !deleted.some(
            (node) => node.id === edge.source || node.id === edge.target
          )
      );
      setEdges(newEdges);
    },
    [edges, setEdges]
  );

  // table handler functions

  const onUpdateNode = useCallback(
    (nodeId: string, newData: Partial<NodeData>) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                },
              }
            : node
        )
      );
    },
    []
  );

  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, []);

  // Handler for deleting nodes
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      // First remove any connected edges
      const newEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      setEdges(newEdges);

      // Then remove the node
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    },
    [edges]
  );

  // Handler for adding new nodes
  const onAddNode = useCallback(
    (nodeData: Partial<Node<NodeData>>) => {
      const newNode: Node = {
        id: `node-${nodes.length + 1}`,
        type: "custom",
        position: { x: 0, y: 0 }, // Default position
        draggable: true,

        data: {
          shape: nodeData.data?.shape || "rectangle",
          label: nodeData.data?.label || `New Node ${nodes.length + 1}`,
          ...nodeData.data,
        },
        ...nodeData,
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
    },
    [nodes]
  );

  // Handler for updating edges
  const onUpdateEdge = useCallback(
    (changes: { id: string; source?: string; target?: string }) => {
      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.id === changes.id
            ? {
                ...edge,
                source: changes.source || edge.source,
                target: changes.target || edge.target,
              }
            : edge
        )
      );
    },
    []
  );

  // Handler for deleting edges
  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== edgeId));
  }, []);

  // Handler for adding new edges
  const onAddEdge = useCallback((edge: Partial<Edge>) => {
    const newEdge: Edge = {
      id: `e${edge.source}-${edge.target}`,
      source: edge.source!,
      target: edge.target!,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      ...edge,
    };
    setEdges((prevEdges) => [...prevEdges, newEdge]);
  }, []);

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      console.log("🚀 ~ onSave ~ flow:", flow);
      localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey));

      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setViewport({ x, y, zoom });
      }
    };

    restoreFlow();
  }, [setNodes, setViewport]);

  const handleTransform = useCallback(
    (x: number, y: number) => {
      const currentZoom = getZoom();
      setCenter(x, y, { duration: 800, zoom: currentZoom });
    },
    [setViewport]
  );

  useEffect(() => {
    const createCanvas = async () => {
      if (!userId) return;

      try {
        // Create initial flow data object
        const initialFlowData = {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        };

        // Insert new canvas with proper casing for the table name
        const { data, error } = await supabase
          .from("Canvas") // Use lowercase 'canvas' to match your schema
          .insert({
            name: title,
            user_id: userId,
            description: "", // Add empty description to avoid null
            flow_data: initialFlowData,
            version: 1,
            is_published: false,
            workspace_id: null, // Set to null explicitly
            parent_id: null, // Set to null explicitly
          })
          .select()
          .single();

        if (error) {
          console.error("Canvas creation error:", error);
          toast({
            title: "Error",
            description: `Failed to create canvas: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setCanvasId(data.id);
          onCanvasCreated(data.id);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred while creating the canvas",
          variant: "destructive",
        });
      }
    };

    createCanvas();
  }, [userId]);

  return (
    <>
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="account" className="h-full">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="account">Canvas</TabsTrigger>
              <TabsTrigger value="password">Table</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="account" className="h-full">
            <div className="h-full w-full">
              <div className="flex flex-col h-[95%] mb-44">
                <div className="h-full" ref={reactFlowWrapper}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodesDraggable={true}
                    nodesConnectable={true}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    fitView
                    defaultEdgeOptions={{
                      type: "smoothstep",
                      markerEnd: { type: MarkerType.ArrowClosed },
                    }}
                    proOptions={{ hideAttribution: true }}
                    deleteKeyCode={["Backspace", "Delete"]}
                    onInit={setRfInstance}
                  >
                    <Background variant={BackgroundVariant.Dots} />
                    <Controls />

                    <Panel position="top-left" className="w-1/6">
                      <ShapeSidebar />
                    </Panel>

                    <Panel position="top-center">
                      <button onClick={onSave}>save</button>
                      <button onClick={onRestore}>restore</button>
                      {/* <button onClick={onAdd}>add node</button> */}
                    </Panel>

                    <Panel
                      position="top-right"
                      className="w-1/6 items-center justify-center flex"
                    >
                      <div className="w-64 bg-white p-4 rounded-lg shadow-lg">
                        <h2 className="mb-6 text-lg font-semibold">Nodes</h2>
                        <ul className="space-y-2">
                          {nodes.map((node) => (
                            <li
                              key={node.id}
                              className="bg-white p-2 rounded shadow cursor-pointer"
                              onClick={() =>
                                handleTransform(
                                  node.position.x,
                                  node.position.y
                                )
                              }
                            >
                              <h3 className="font-semibold">
                                {node.data.label}
                              </h3>
                              <p className="text-sm text-gray-600">
                                ID: {node.id}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Panel>
                  </ReactFlow>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="password">
            <FlowTable
              nodes={nodes}
              edges={edges}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
              onAddNode={onAddNode}
              onUpdateEdge={onUpdateEdge}
              onDeleteEdge={onDeleteEdge}
              onAddEdge={onAddEdge}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Canvas;
