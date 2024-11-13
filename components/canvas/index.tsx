"use client";

import useCanvas from "@/hooks/use-canvas";
import React from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FlowTable from "./FlowTable";
import ShapeSidebar from "./Sidebar";
import CustomNode from "./shapes/CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

const Canvas: React.FC<{}> = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    reactFlowWrapper,
    onDragOver,
    onDrop,
    onNodesDelete,
    onConnect,
    handleTransform,
    onSave,
    setRfInstance,
    canvasDetails,
    handleNewColumnCreation,
    handleNodeCustomDataChange,
    onAddNode,
    fetchFolderCanvases,
    relations,
  } = useCanvas();
  console.log("🚀 ~ relations:", relations);

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
              canvasDetails={canvasDetails}
              handleNewColumnCreation={handleNewColumnCreation}
              handleNodeCustomDataChange={handleNodeCustomDataChange}
              onAddNode={onAddNode}
              fetchFolderCanvases={fetchFolderCanvases}
              relations={relations}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Canvas;
