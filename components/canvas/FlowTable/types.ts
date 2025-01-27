// types.ts
import { Node, Edge } from "reactflow";

export interface NodeData {
  label: string;
  shape: string;
}

export interface FlowTableEditorProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  canvasId: number;
  folderId: number;
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddNode: (nodeData: Partial<Node<NodeData>>) => void;
  onUpdateEdge: (changes: {
    id: string;
    source?: string;
    target?: string;
  }) => void;
  onDeleteEdge: (edgeId: string) => void;
  onAddEdge: (edgeData: { source: string; target: string }) => void;
  onCreateRelation: (data: any) => void;
}

export interface NewNodeData {
  label: string;
  shape: NodeData["shape"];
}

export interface NewEdgeData {
  source: string;
  target: string;
}

export interface EditingNodeData extends NodeData {
  id: string;
}

export interface InitialCanvasData {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

// types/index.ts

export interface NodeData {
  label: string;
  shape: string;
  onLabelChange?: (label: string) => void;
  customData?: {
    [key: string]: any;
  };
}

export interface NodeRelation {
  id: number;
  source_canvas_id: number;
  target_canvas_id: number;
  source_node_id: string;
  target_node_id: string;
  folder_id: number;
  created_at?: string;
  updated_at?: string;
  target_canvas?: {
    name: string;
    flow_data: {
      nodes: Array<{
        id: string;
        data: NodeData;
      }>;
    };
  };
}

export interface FlowTableProps extends FlowTableEditorProps {
  canvasId: number;
  folderId: number;
  relations: NodeRelation[];
  onCreateRelation: (
    relation: Omit<NodeRelation, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  onDeleteRelation: (id: number) => Promise<void>;
}

export interface NodeRelationModalProps {
  nodeId: string;
  canvasId: number;
  folderId: number;
  onCreateRelation: (relation: Partial<NodeRelation>) => void;
}
