import { CANVAS_TYPE } from "./store";

export interface Canvas {
  id: string;
  name: string;
  description?: string;
  folderId?: string | null;
  canvas_type: CANVAS_TYPE;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  canvases: Canvas[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SidebarState {
  folders: Folder[];
  selectedFolderId: string | null;
  selectedCanvasId: string | null;
  isLoading: boolean;
  error: string | null;
  folderLoading: boolean;
  canvasLoading: boolean;
  rootCanvases: Canvas[];
}

export interface SidebarActions {
  setFolders: (folders: Folder[]) => void;
  getFolders: (userId: string) => Promise<void>;
  createFolder: (
    name: string,
    userId: string,
    parentId?: string
  ) => Promise<void>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createCanvas: (
    name: string,
    description: string,
    userId: string,
    folderId?: string,
    canvas_type?: CANVAS_TYPE
  ) => Promise<void>;
  updateCanvas: (
    id: string,
    name: string,
    description?: string
  ) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;
  moveCanvas: (canvasId: string, newFolderId: string | null) => Promise<void>;
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedCanvas: (canvasId: string | null) => void;
  fetchRootCanvases: (userId?: string) => Promise<void>;
}

export type SidebarStore = SidebarState & SidebarActions;
