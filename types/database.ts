export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  canvases?: Canvas[];
}

export interface Canvas {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  data?: CanvasData;
  settings?: CanvasSettings;
  columns?: ColumnDefinition[];
}

export interface CanvasData {
  id: string;
  canvasId: string;
  nodes: any[];
  edges: any[];
  styles: Record<string, any>;
  version: number;
  updatedAt: Date;
}

export interface CanvasHistory {
  id: string;
  canvasId: string;
  data: any;
  version: number;
  createdAt: Date;
}

export interface ColumnDefinition {
  id: string;
  canvasId: string;
  title: string;
  type: string;
  options: any | null;
  required: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasSettings {
  id: string;
  canvasId: string;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  theme: string | null;
  updatedAt: Date;
}

export interface CanvasShare {
  id: string;
  canvasId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
