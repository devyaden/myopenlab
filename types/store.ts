import type { Edge, Node } from "reactflow";

export enum CANVAS_TYPE {
  HYBRID = "hybrid",
  TABLE = "table",
  DOCUMENT = "document",
}

export interface NodeStyle {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  shape:
    | "rectangle"
    | "rounded"
    | "circle"
    | "diamond"
    | "hexagon"
    | "triangle"
    | "useCase"
    | "actor"
    | "class"
    | "interface"
    | "swimlane";
  locked: boolean;
  isVertical?: boolean;
  borderStyle: string;
  borderWidth: number;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  lineHeight: number;
}

export interface CanvasData {
  nodes: Node[];
  edges: Edge[];
  nodeStyles: Record<string, NodeStyle>;
}

export interface ColumnDefinition {
  id?: string;
  title: string;
  type: string;
  required?: boolean;
  related_canvas_id?: string;
  related_canvas?: CanvasData;
  relation_row_ids?: string[];
  rollup_column_id?: string;
  rollup_target_column?: ColumnDefinition;

  options?: string[];
}

export interface FolderCanvas {
  id: string;
  name: string;
  description?: string;
  updated_at: Date | null;
  columns: ColumnDefinition[];
}

export interface CanvasState extends CanvasData {
  id: string;
  name: string;
  user_id: string;
  description?: string;
  folder_id?: string;
  columns: ColumnDefinition[];
  folderCanvases: FolderCanvas[];
  version: number;
  isLoading: boolean;
  saveLoading: boolean;
  error: string | null;
  isDirty: boolean;
  canvas_type: CANVAS_TYPE | null;
  lastSaved: Date | null;
  updated_at: Date | null;
  created_at: Date | null;
}

export interface CanvasActions {
  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;
  setNodeStyles: (nodeStyles: any) => void;
  updateNodeStyle: (nodeId: string, style: any) => void;
  setColumns: (columns: any[]) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setFolderId: (folder_id: string) => void;
  saveCanvas: () => Promise<void>;
  loadFolderCanvases: (folder_id: string) => Promise<void>;
  loadCanvas: (canvasId: string) => Promise<void>;
  syncChanges: () => Promise<void>;
  refreshColumnsData: () => Promise<void>;
  resetState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface UndoableState {
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
  columns: any[];
  name: string;
  description?: string;
  folder_id?: string;
}

export interface HistoryState {
  past: UndoableState[];
  present: UndoableState;
  future: UndoableState[];
}

export type CanvasStore = CanvasState & CanvasActions;
