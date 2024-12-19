"use client";

import useCanvas from "@/hooks/use-canvas";
import React, { useCallback } from "react";
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
import CustomNode from "./shapes/CustomNode";
import GroupNode from "./shapes/GroupNode";
import HelperLines from "./shapes/HelperLines";
import TextNode from "./shapes/TextNode";
import ShapeSidebar from "./Sidebar";
import NodesSidebar from "./Sidebar/NodesSidebar";

const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
  text: TextNode,
};

const Canvas: React.FC<{}> = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    setNodes,
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
    fetchCanvasDetails,
    handleDeleteColumn,
    helperLineHorizontal,
    helperLineVertical,
    onNodeDrag,
    onNodeDragStart,
    onNodeDragStop,
  } = useCanvas();

  const handleTabChange = useCallback(
    async (value: string) => {
      if (value === "password") {
        // Save before switching to table view
        await onSave();
      }
    },
    [onSave]
  );

  return (
    <>
      <main className="flex-1 overflow-hidden">
        <Tabs
          defaultValue="account"
          className="h-full"
          onValueChange={handleTabChange}
        >
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
                    onNodeDrag={onNodeDrag}
                    // @ts-ignore
                    onDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
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
                    <HelperLines
                      horizontal={helperLineHorizontal}
                      vertical={helperLineVertical}
                    />

                    <Panel position="top-left" className="w-1/6">
                      <ShapeSidebar />
                    </Panel>

                    <Panel position="top-center">
                      <Button onClick={onSave}>save</Button>
                      {/* <button onClick={onRestore}>restore</button> */}
                    </Panel>

                    <Panel
                      position="top-right"
                      className="flex items-center justify-center max-w-64 h-5/6"
                    >
                      <NodesSidebar
                        nodes={nodes}
                        handleTransform={handleTransform}
                      />
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
              fetchCanvasDetails={fetchCanvasDetails}
              handleDeleteColumn={handleDeleteColumn}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Canvas;
