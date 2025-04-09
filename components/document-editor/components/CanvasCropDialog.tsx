"use client";

import type React from "react";

import CustomEdge from "@/components/canvas-new/custom-edge";
import { GenericNode } from "@/components/canvas-new/nodes/generic-node";
import { ImageNode } from "@/components/canvas-new/nodes/image-node";
import { SwimlaneNode } from "@/components/canvas-new/nodes/swimlane-node";
import { TextNode } from "@/components/canvas-new/nodes/text-node";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import type { LexicalEditor } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { INSERT_REACT_FLOW_COMMAND } from "../plugins/ReactflowPlugin";

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface CanvasCropDialogProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
  canvasData: any;
}

function FlowWithCropping({
  canvasData,
  cropArea,
  setCropArea,
  viewportRef,
  onCrop,
}: {
  canvasData: any;
  cropArea: any;
  setCropArea: (area: any) => void;
  viewportRef: React.RefObject<HTMLDivElement>;
  onCrop: (cropArea: any, reactFlowInstance: any) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    canvasData?.flowData?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    canvasData?.flowData?.edges || []
  );
  const reactFlowInstance = useReactFlow();
  const { fitView, getViewport } = reactFlowInstance;
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const [instructionsVisible, setInstructionsVisible] = useState(true);

  // Initialize crop area to fit all nodes
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
        const viewport = getViewport();

        // Initialize crop area to cover the entire visible area
        setCropArea({
          x: 0,
          y: 0,
          width: viewportRef.current?.clientWidth || 500,
          height: viewportRef.current?.clientHeight || 300,
          zoom: viewport.zoom,
        });
      }, 100);
    }
  }, [nodes, fitView, getViewport, setCropArea, viewportRef]);

  // Hide instructions after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setInstructionsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (cropBoxRef.current && cropBoxRef.current.contains(e.target as Node)) {
      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;

        setCropArea((prev: any) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));

        startPosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [setCropArea]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Make the crop function available to the parent
  useEffect(() => {
    if (viewportRef.current) {
      // @ts-ignore
      viewportRef.current.handleCrop = async () => {
        if (flowWrapperRef.current) {
          try {
            // Hide the instructions and crop box before taking the screenshot
            setInstructionsVisible(false);

            // Create a wrapper element to isolate just the content we want to capture
            const wrapperRef = document.createElement("div");
            wrapperRef.style.position = "absolute";
            wrapperRef.style.overflow = "hidden";
            wrapperRef.style.width = `${cropArea.width}px`;
            wrapperRef.style.height = `${cropArea.height}px`;
            wrapperRef.style.top = "0";
            wrapperRef.style.left = "0";

            // Clone the ReactFlow content
            const reactFlowContent =
              flowWrapperRef.current.querySelector(".react-flow");
            if (!reactFlowContent)
              throw new Error("React Flow content not found");

            // Temporarily hide the crop box
            if (cropBoxRef.current) {
              cropBoxRef.current.style.display = "none";
            }

            // Position the content to show only the cropped area
            const clone = reactFlowContent.cloneNode(true) as HTMLElement;
            clone.style.position = "absolute";
            clone.style.top = `-${cropArea.y}px`;
            clone.style.left = `-${cropArea.x}px`;
            clone.style.width = "100%";
            clone.style.height = "100%";

            // Remove UI elements from the clone
            const attributions = clone.querySelectorAll(
              ".react-flow__attribution"
            );
            attributions.forEach((elem) => elem.remove());

            const panels = clone.querySelectorAll(".react-flow__panel");
            panels.forEach((elem) => elem.remove());

            // Add the clone to the wrapper
            wrapperRef.appendChild(clone);
            document.body.appendChild(wrapperRef);

            // Wait a bit for the DOM to update
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Capture the isolated content
            const canvas = await html2canvas(wrapperRef, {
              backgroundColor: null,
              logging: false,
              useCORS: true,
              scale: window.devicePixelRatio || 1, // Use device pixel ratio for better quality
            });

            // Clean up
            document.body.removeChild(wrapperRef);

            // Get the viewport for reference
            const viewport = getViewport();

            // Convert to data URL
            const dataUrl = canvas.toDataURL("image/png");

            onCrop(
              {
                dataUrl,
                dimensions: {
                  width: cropArea.width,
                  height: cropArea.height,
                },
                zoom: viewport.zoom,
              },
              reactFlowInstance
            );

            // Show the crop box again
            if (cropBoxRef.current) {
              cropBoxRef.current.style.display = "block";
            }
          } catch (error) {
            console.error("Error capturing canvas:", error);
            // Show the crop box again in case of error
            if (cropBoxRef.current) {
              cropBoxRef.current.style.display = "block";
            }
          }
        }
      };
    }
  }, [
    cropArea,
    onCrop,
    reactFlowInstance,
    getViewport,
    viewportRef,
    setInstructionsVisible,
  ]);

  return (
    <div
      className="relative h-[500px] border border-gray-200 rounded-md overflow-hidden"
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div ref={flowWrapperRef} style={{ width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={nodes?.map((node) => ({
            ...node,
            data: {
              ...node.data,
              style: {
                ...canvasData.flowData?.styles[node.id],
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
            },
            style: {
              width:
                node.type === "imageNode"
                  ? node.style?.width
                  : node.style?.width || (node.type === "textNode" ? 150 : 100),
              height:
                node.type === "imageNode"
                  ? node.style?.height
                  : node.style?.height || (node.type === "textNode" ? 50 : 100),
            },
            connectable: node.type !== "textNode",
          }))}
          edges={edges?.map((edge) => ({
            ...edge,
            type: "default",
            data: { ...edge.data },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={12} size={1} />
          {instructionsVisible && (
            <Panel position="top-center" className="crop-instructions">
              <div className="bg-white p-2 rounded shadow-sm text-xs">
                Drag the blue box to position the crop area
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Crop selection box */}
      <div
        ref={cropBoxRef}
        className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 cursor-move z-10"
        style={{
          left: `${cropArea.x}px`,
          top: `${cropArea.y}px`,
          width: `${cropArea.width}px`,
          height: `${cropArea.height}px`,
        }}
      >
        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startWidth = cropArea.width;
            const startHeight = cropArea.height;
            const startX = e.clientX;
            const startY = e.clientY;

            const handleResize = (moveEvent: MouseEvent) => {
              const dx = moveEvent.clientX - startX;
              const dy = moveEvent.clientY - startY;
              setCropArea((prev: any) => ({
                ...prev,
                width: Math.max(100, startWidth + dx),
                height: Math.max(100, startHeight + dy),
              }));
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleResize);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleResize);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      </div>
    </div>
  );
}

export default function CanvasCropDialog({
  activeEditor,
  onClose,
  canvasData,
}: CanvasCropDialogProps) {
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 500,
    height: 300,
    zoom: 1,
  });
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleInsert = () => {
    if (!canvasData || !cropArea || !viewportRef.current) return;

    // @ts-ignore - Access the handleCrop function from the ref
    if (viewportRef.current.handleCrop) {
      // @ts-ignore
      viewportRef.current.handleCrop();
    }
  };

  const onCrop = (cropData: any, reactFlowInstance: any) => {
    // Insert the cropped canvas as an image
    activeEditor.dispatchCommand(INSERT_REACT_FLOW_COMMAND, {
      id: canvasData.id,
      title: `${canvasData.title} (Cropped)`,
      flowData: {
        imageData: cropData.dataUrl,
        dimensions: cropData.dimensions,
        originalNodes: canvasData.flowData.nodes,
        originalEdges: canvasData.flowData.edges,
      },
    });

    onClose();
  };

  return (
    <div className="max-w-[90vw] w-[1000px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Crop Canvas</h3>
        <p className="text-sm text-muted-foreground">
          Select the area you want to display
        </p>
      </div>

      <ReactFlowProvider>
        <FlowWithCropping
          canvasData={canvasData}
          cropArea={cropArea}
          setCropArea={setCropArea}
          viewportRef={viewportRef}
          onCrop={onCrop}
        />
      </ReactFlowProvider>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleInsert} className=" bg-yadn-pink">
          Insert Cropped Canvas
        </Button>
      </div>
    </div>
  );
}
