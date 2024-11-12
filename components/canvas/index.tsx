"use client";

import React, { useCallback, useRef, useState } from "react";
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
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FlowTable from "./FlowTable";
import { InitialCanvasData, NodeData } from "./FlowTable/types";
import ShapeSidebar from "./Sidebar";
import CustomNode from "./shapes/CustomNode";
import { nanoid } from "nanoid";

const nodeTypes = {
  custom: CustomNode,
};

interface CanvasProps {
  initialData: InitialCanvasData;
  onCanvasSave: (data: InitialCanvasData) => void;
  canvasId: number;
  folderId: number;
  onCreateRelation: (data: any) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  initialData,
  onCanvasSave,
  canvasId,
  folderId,
  onCreateRelation,
}) => {
  const [nodes, setNodes] = useState<Node[]>(initialData.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialData.edges);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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

        const id = nanoid();

        const newNode: Node = {
          id,
          type: "custom",
          position,
          draggable: true,
          data: {
            shape: shapeType,
            label: `New ${shapeType}`,
            onLabelChange: (newLabel: string) =>
              handleLabelChange(id, newLabel),
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
    console.log("🚀 ~ handleLabelChange ~ nodeId:", nodeId, newLabel);
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
      // remove childresn and their edges

      // First remove any connected edges
      const newEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      setEdges(newEdges);

      // Then remove the node
      setNodes((prevNodes) =>
        prevNodes.filter(
          (node) => node.id !== nodeId || node.parentId === nodeId
        )
      );
    },
    [edges]
  );

  // Handler for adding new nodes
  const onAddNode = useCallback(
    (nodeData: Partial<Node<NodeData>>) => {
      console.log("🚀 ~ nodeData:", nodeData);
      const id = nanoid();
      const newNode: Node = {
        id,
        type: nodeData.type || "custom",
        position: { x: 0, y: 0 }, // Default position
        draggable: true,
        style: nodeData.style || {},
        parentId: nodeData.parentId,
        extent: nodeData.extent,
        data: {
          shape: nodeData.data?.shape || "rectangle",
          label: nodeData.data?.label || `New Node ${nodes.length + 1}`,
          onLabelChange: (newLabel: string) => handleLabelChange(id, newLabel),
          ...nodeData.data,
        },
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
      const flow = rfInstance?.toObject();
      console.log("🚀 ~ onSave ~ flow:", flow);

      onCanvasSave(flow);

      // localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const handleTransform = useCallback(
    (x: number, y: number) => {
      const currentZoom = getZoom();

      setCenter(x, y, { duration: 800, zoom: 1 });
    },
    [setViewport]
  );

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
                    snapToGrid
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
                      <Button onClick={onSave}>save</Button>
                      {/* <button onClick={onRestore}>restore</button> */}
                    </Panel>

                    <Panel
                      position="top-right"
                      className="w-1/6 items-center justify-center flex"
                    >
                      <div className="w-64 bg-white p-4 rounded-lg shadow-lg">
                        <h2 className="mb-6 text-lg font-semibold">Nodes</h2>
                        <ul className="space-y-2">
                          {nodes?.map((node) => (
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
              canvasId={canvasId}
              folderId={folderId}
              onCreateRelation={onCreateRelation}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Canvas;
