import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";

export type FallbackReason =
  | "claude-error"
  | "no-tool-call"
  | "no-tool-input"
  | "invalid-structure"
  | "processing-error";

export interface CanvasMeta {
  fallback?: boolean;
  reason?: FallbackReason;
}

export interface CanvasData {
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
  diagramType: DiagramType;
  industry: IndustryType;
  language: LanguageType;
  meta?: CanvasMeta;
}

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    shape: string;
  };
  width: number;
  height: number;
  className?: string;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    [key: string]: any;
  };
}
