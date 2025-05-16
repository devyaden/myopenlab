"use client";

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
import { Loader2, PlusCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";
import CustomEdge from "../canvas-new/custom-edge";
import { GenericNode } from "../canvas-new/nodes/generic-node";
import { ImageNode } from "../canvas-new/nodes/image-node";
import { SwimlaneNode } from "../canvas-new/nodes/swimlane-node";
import { TextNode } from "../canvas-new/nodes/text-node";

interface CanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCanvas: (canvasData: any) => void;
  canvases?: any[];
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

const CanvasPreview = React.memo(
  ({
    canvas,
    isSelected,
    onSelect,
  }: {
    canvas: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      rootMargin: "100px",
    });

    const { nodes = [], edges = [], styles = {} } = canvas?.flowData?.[0] || {};

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={`border rounded-lg p-4 cursor-pointer transition-all aspect-[4/3] relative group ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary hover:bg-slate-50/50"
              }`}
              onClick={() => onSelect(canvas.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium truncate flex-1">
                  {canvas.name}
                </h3>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary ml-2 mt-1.5" />
                )}
              </div>
              <div className="w-full h-[calc(100%-2rem)] bg-slate-50 rounded-md pointer-events-none overflow-hidden">
                {inView && (
                  <ReactFlow
                    nodes={optimizedNodes}
                    edges={optimizedEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    panOnScroll={false}
                    elementsSelectable={false}
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.5}
                    maxZoom={0.5}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                    style={{ pointerEvents: "none" }}
                  >
                    <Background />
                  </ReactFlow>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to select this canvas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

CanvasPreview.displayName = "CanvasPreview";

export default function CanvasDialog({
  isOpen,
  onClose,
  onInsertCanvas,
  canvases = [],
}: CanvasDialogProps) {
  const [selectedCanvas, setSelectedCanvas] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useRealTimeData, setUseRealTimeData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        document.body.style.pointerEvents = "";
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = useCallback((canvasId: string) => {
    setSelectedCanvas(canvasId);
  }, []);

  const handleInsert = useCallback(() => {
    if (selectedCanvas) {
      const canvas = canvases.find((c) => c.id === selectedCanvas);
      if (canvas) {
        const canvasData = {
          id: canvas.id,
          name: canvas.name,
          flowData: canvas.flowData,
          useRealTimeData: useRealTimeData,
        };

        console.log("🚀 ~ handleInsert ~ canvasData:", canvasData);

        document.body.style.pointerEvents = "";
        onClose();

        setTimeout(() => {
          onInsertCanvas(canvasData);
        }, 10);
      }
    }
  }, [selectedCanvas, canvases, onClose, onInsertCanvas, useRealTimeData]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Insert Canvas</DialogTitle>
          <DialogDescription>
            Select a canvas to insert into your document. You can preview each
            canvas before selecting.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading canvases...
              </p>
            </div>
          ) : canvases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              {canvases.map((canvas) => (
                <CanvasPreview
                  key={canvas.id}
                  canvas={canvas}
                  isSelected={selectedCanvas === canvas.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <PlusCircle className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">No canvases found</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create a new canvas to get started. You can then insert it
                  into your document.
                </p>
              </div>
            </div>
          )}
        </div>

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
                <div className="text-gray-400 cursor-help">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
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

        <DialogFooter className="mt-4 space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedCanvas}
            className="min-w-[100px]"
          >
            {selectedCanvas ? "Insert Canvas" : "Select a Canvas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
