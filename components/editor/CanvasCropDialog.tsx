"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import html2canvas from "html2canvas";
import { Info, Maximize2, Move } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomEdge from "../canvas-new/custom-edge";
import { GenericNode } from "../canvas-new/nodes/generic-node";
import { ImageNode } from "../canvas-new/nodes/image-node";
import { SwimlaneNode } from "../canvas-new/nodes/swimlane-node";
import { TextNode } from "../canvas-new/nodes/text-node";

interface CanvasCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCroppedCanvas: (croppedData: any) => void;
  canvasData: any;
}

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

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
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onCrop: (cropData: any, reactFlowInstance: any) => void;
}) {
  const { nodes = [], edges = [], styles = {} } = canvasData || {};

  const reactFlowInstance = useReactFlow();
  const { fitView, getViewport } = reactFlowInstance;
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

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
        setIsLoaded(true);
      }, 100);
    } else {
      // If there are no nodes, still set a default crop area
      setCropArea({
        x: 0,
        y: 0,
        width: viewportRef.current?.clientWidth || 500,
        height: viewportRef.current?.clientHeight || 300,
        zoom: 1,
      });
      setIsLoaded(true);
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
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current && !isResizing) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;

        setCropArea((prev: any) => ({
          ...prev,
          x: Math.max(
            0,
            Math.min(
              prev.x + dx,
              viewportRef.current?.clientWidth || 500 - prev.width
            )
          ),
          y: Math.max(
            0,
            Math.min(
              prev.y + dy,
              viewportRef.current?.clientHeight || 300 - prev.height
            )
          ),
        }));

        startPosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [setCropArea, isResizing, viewportRef]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsResizing(false);
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

  const optimizedNodes = useMemo(
    () =>
      nodes?.map((node: any) => {
        const nodeWidth =
          node.width ||
          node.data.width ||
          (node.type === "textNode" ? 150 : 100);
        const nodeHeight =
          node.height ||
          node.data.height ||
          (node.type === "textNode" ? 50 : 100);

        return {
          ...node,
          width: nodeWidth,
          height: nodeHeight,
          data: {
            ...node.data,
            width: nodeWidth,
            height: nodeHeight,
            style: {
              ...styles[node.id],
              width: nodeWidth,
              height: nodeHeight,
            },
          },
          style: {
            ...node.style,
            width: nodeWidth,
            height: nodeHeight,
          },
        };
      }),
    [nodes, styles]
  );

  const optimizedEdges = useMemo(
    () =>
      edges.map((edge: any) => ({
        ...edge,
        type: "custom",
        sourceHandle: edge.sourceHandle || "g",
        targetHandle: edge.targetHandle || "d",
        style: {
          ...(edge.style || {}),
          opacity: edge.style?.opacity ?? 1.0,
          strokeWidth: edge.style?.strokeWidth ?? 2,
        },
        data: edge.data,
      })),
    [edges]
  );

  return (
    <div
      className="relative h-[500px] border border-gray-200 rounded-md overflow-hidden bg-gray-50"
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div ref={flowWrapperRef} style={{ width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={optimizedNodes}
          edges={optimizedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background gap={12} size={1} />
          {instructionsVisible && (
            <Panel position="top-center" className="crop-instructions">
              <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span>Drag the blue box to position the crop area</span>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Crop selection box */}
      <div
        ref={cropBoxRef}
        className="absolute border-2 border-blue-500 bg-blue-100/20 cursor-move z-10 transition-shadow hover:shadow-lg"
        style={{
          left: `${cropArea.x}px`,
          top: `${cropArea.y}px`,
          width: `${cropArea.width}px`,
          height: `${cropArea.height}px`,
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Crop dimensions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Resize handle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 cursor-se-resize flex items-center justify-center text-white rounded-tl"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                  const startWidth = cropArea.width;
                  const startHeight = cropArea.height;
                  const startX = e.clientX;
                  const startY = e.clientY;

                  const handleResize = (moveEvent: MouseEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    setCropArea((prev: any) => ({
                      ...prev,
                      width: Math.max(
                        100,
                        Math.min(
                          startWidth + dx,
                          viewportRef.current?.clientWidth || 500 - prev.x
                        )
                      ),
                      height: Math.max(
                        100,
                        Math.min(
                          startHeight + dy,
                          viewportRef.current?.clientHeight || 300 - prev.y
                        )
                      ),
                    }));
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleResize);
                    document.removeEventListener("mouseup", handleMouseUp);
                    setIsResizing(false);
                  };

                  document.addEventListener("mousemove", handleResize);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Resize crop area</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default function CanvasCropDialog({
  isOpen,
  onClose,
  onInsertCroppedCanvas,
  canvasData,
}: CanvasCropDialogProps) {
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 500,
    height: 300,
    zoom: 1,
  });
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Implementation of the solution from GitHub issue
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // This is the key fix from the GitHub issue
      // We need to manually restore the pointer-events style that Radix UI sets
      document.body.style.pointerEvents = "";
      onClose();
    }
  };

  // Don't render the dialog if canvasData is null
  if (!canvasData && isOpen) {
    console.warn("CanvasCropDialog: canvasData is null or undefined");
    // Close the dialog if it's open but canvasData is null
    setTimeout(() => onClose(), 0);
    return null;
  }

  const handleInsert = () => {
    if (!canvasData || !cropArea || !viewportRef.current) return;

    // Fix pointer events before proceeding
    document.body.style.pointerEvents = "";

    // @ts-ignore - Access the handleCrop function from the ref
    if (viewportRef.current.handleCrop) {
      // @ts-ignore
      viewportRef.current.handleCrop();
    }
  };

  const onCrop = (cropData: any, reactFlowInstance: any) => {
    // Fix pointer events before closing
    document.body.style.pointerEvents = "";

    // Insert the cropped canvas
    onInsertCroppedCanvas({
      id: canvasData.id || `canvas-${Date.now()}`,
      name: `${canvasData.name || "Canvas"} (Cropped)`,
      imageData: cropData.dataUrl,
      dimensions: cropData.dimensions,
      originalNodes: canvasData.nodes || [],
      originalEdges: canvasData.edges || [],
      originalStyles: canvasData.styles || {},
      useRealTimeData: useRealTimeData,
      canvasId: canvasData.id,
    });

    onClose();
  };

  // Only render the dialog if canvasData is available
  if (!canvasData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Canvas</DialogTitle>
          <DialogDescription>
            Select the area you want to display in your document. You can drag
            the blue box to position it and use the handle in the bottom-right
            corner to resize.
          </DialogDescription>
        </DialogHeader>

        <ReactFlowProvider>
          <FlowWithCropping
            canvasData={canvasData}
            cropArea={cropArea}
            setCropArea={setCropArea}
            viewportRef={viewportRef}
            onCrop={onCrop}
          />
        </ReactFlowProvider>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="useRealTimeData"
            checked={useRealTimeData}
            onCheckedChange={(checked) => setUseRealTimeData(checked === true)}
          />
          <Label
            htmlFor="useRealTimeData"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Keep canvas in sync with original (real-time updates)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  When enabled, the canvas will automatically update when the
                  original canvas changes. When disabled, the canvas will remain
                  as a static snapshot.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} className="gap-2">
            <Move className="h-4 w-4" />
            Insert Cropped Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
