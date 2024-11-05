// types.ts
import { Node, Edge } from "reactflow";

export interface NodeData {
  label: string;
  shape: "rectangle" | "circle" | "diamond";
}

export interface FlowTableEditorProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddNode: (nodeData: Partial<Node<NodeData>>) => void;
  onUpdateEdge: (changes: Edge[]) => void;
  onDeleteEdge: (edgeId: string) => void;
  onAddEdge: (edgeData: { source: string; target: string }) => void;
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
