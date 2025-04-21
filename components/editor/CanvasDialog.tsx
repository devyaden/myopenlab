"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";

// Fallback canvas options if no canvases are provided
const FALLBACK_CANVAS_OPTIONS = [
  {
    id: "flowchart-1",
    name: "Basic Flowchart",
    flowData: {
      nodes: [
        {
          id: "1",
          type: "input",
          data: { label: "Start" },
          position: { x: 100, y: 50 },
        },
        {
          id: "2",
          data: { label: "Process" },
          position: { x: 100, y: 150 },
        },
        {
          id: "3",
          type: "output",
          data: { label: "End" },
          position: { x: 100, y: 250 },
        },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
      ],
    },
  },
  {
    id: "mindmap-1",
    name: "Mind Map",
    flowData: {
      nodes: [
        {
          id: "1",
          data: { label: "Main Idea" },
          position: { x: 150, y: 100 },
        },
        {
          id: "2",
          data: { label: "Concept 1" },
          position: { x: 50, y: 200 },
        },
        {
          id: "3",
          data: { label: "Concept 2" },
          position: { x: 150, y: 200 },
        },
        {
          id: "4",
          data: { label: "Concept 3" },
          position: { x: 250, y: 200 },
        },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e1-3", source: "1", target: "3" },
        { id: "e1-4", source: "1", target: "4" },
      ],
    },
  },
  {
    id: "process-1",
    name: "Process Diagram",
    flowData: {
      nodes: [
        {
          id: "1",
          data: { label: "Input" },
          position: { x: 50, y: 100 },
        },
        {
          id: "2",
          data: { label: "Process 1" },
          position: { x: 200, y: 50 },
        },
        {
          id: "3",
          data: { label: "Process 2" },
          position: { x: 200, y: 150 },
        },
        {
          id: "4",
          data: { label: "Output" },
          position: { x: 350, y: 100 },
        },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e1-3", source: "1", target: "3" },
        { id: "e2-4", source: "2", target: "4" },
        { id: "e3-4", source: "3", target: "4" },
      ],
    },
  },
];

interface CanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCanvas: (canvasData: any) => void;
  canvases?: any[]; // Add this prop for external canvases
}

export default function CanvasDialog({
  isOpen,
  onClose,
  onInsertCanvas,
  canvases = [],
}: CanvasDialogProps) {
  const [selectedCanvas, setSelectedCanvas] = useState<string | null>(null);

  // Use provided canvases or fallback to default options
  const displayCanvases =
    canvases.length > 0 ? canvases : FALLBACK_CANVAS_OPTIONS;

  // Implementation of the solution from GitHub issue
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // This is the key fix from the GitHub issue
      // We need to manually restore the pointer-events style that Radix UI sets
      document.body.style.pointerEvents = "";
      onClose();
    }
  };

  const handleSelect = (canvasId: string) => {
    setSelectedCanvas(canvasId);
  };

  const handleInsert = () => {
    if (selectedCanvas) {
      const canvas = displayCanvases.find((c) => c.id === selectedCanvas);
      if (canvas) {
        // Create a clean copy of the canvas data
        const canvasData = {
          id: canvas.id,
          name: canvas.name,
          flowData: canvas.flowData,
        };

        // Fix pointer events before closing
        document.body.style.pointerEvents = "";

        // Close the dialog and insert canvas
        onClose();

        // Small delay to ensure dialog is fully closed
        setTimeout(() => {
          onInsertCanvas(canvasData);
        }, 10);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Insert Canvas</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {displayCanvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`border rounded-md p-2 cursor-pointer transition-all h-[180px] ${
                selectedCanvas === canvas.id
                  ? "ring-2 ring-primary"
                  : "hover:border-primary"
              }`}
              onClick={() => handleSelect(canvas.id)}
            >
              <h3 className="text-sm font-medium mb-2">{canvas.name}</h3>
              <div className="w-full h-[130px] bg-slate-50 rounded">
                <ReactFlow
                  nodes={canvas.flowData?.nodes || []}
                  edges={canvas.flowData?.edges || []}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  panOnScroll={false}
                  elementsSelectable={false}
                >
                  <Background />
                </ReactFlow>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!selectedCanvas}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
