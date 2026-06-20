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

// Add these missing type definitions for filtering functionality
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "true"
  | "false";

export interface Filter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  id: string;
  filters: Filter[];
  conjunction: "AND" | "OR";
}

/**
 * Phase 5c: a named snapshot of the table's presentation (filters / sort /
 * column visibility / freeze). Stored under canvas_settings.table_settings
 * (saved_views[] + active_view_id) so it autosaves + reloads for free.
 * `sortField` is a string because at runtime any column title can be the sort
 * field (the SortField union is only the built-in columns).
 */
export interface SavedView {
  id: string;
  name: string;
  filterGroups: FilterGroup[];
  sortField: string | null;
  sortDirection: SortDirection;
  hiddenColumns: string[];
  columnWidths?: Record<string, number>;
  frozenColumns?: string[];
}
