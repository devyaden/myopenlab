import { CANVAS_TYPE, CanvasData, CanvasSettings } from "@/types/store";
import { Edge, Node } from "reactflow";

export interface ColumnData {
  id?: string;
  title: string;
  type: string;
  options?: string[];
  related_canvas?: { canvas_data: CanvasData; name: string };
  rollupRelation?: string;
  rollupColumn?: string;
}

export interface DOCUMENT_TYPE {
  table: "table";
  hybrid: "hybrid";
  document: "document";
}

export const VIEW_MODE = {
  table: "table",
  canvas: "canvas",
  document: "document",
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export interface TableViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  columns: any[];
  setColumns: (columns: ColumnData[]) => void;
  onAddColumn: (columnData: ColumnData) => void;
  currentFolderCanvases: {
    id: string;
    name: string;
    canvas_type: string;
  }[];
  canvasId: string;
  canvasType: CANVAS_TYPE | null;
  canvasSettings: CanvasSettings;
  updateCanvasSettings: (settings: CanvasSettings) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  readOnly?: boolean;
}

export type SortDirection = "asc" | "desc" | null;
export type SortField = "id" | "task" | "type" | null;

export interface HierarchyNode extends Node {
  children: HierarchyNode[];
}
