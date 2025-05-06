import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";

export interface CanvasData {
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
  diagramType: DiagramType;
  industry: IndustryType;
  language: LanguageType;
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
