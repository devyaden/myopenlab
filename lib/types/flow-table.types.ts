import { COLUMN_TYPES } from "./column-types.enum";

interface ICreateColumn {
  name: string;
  data_type: COLUMN_TYPES;
  validation?: any;
  order: number;
  key: string;
  target_canvas_id?: number;
  relation_id?: number;
  target_column?: string;
}

type SHAPES =
  | "rectangle"
  | "rounded"
  | "circle"
  | "diamond"
  | "hexagon"
  | "triangle"
  | "actor"
  | "interface"
  | "standing-woman"
  | "sitting"
  | "arms-stretched"
  | "walking-man"
  | "square"
  | "cylinder"
  | "document"
  | "left-arrow"
  | "right-arrow"
  | "top-arrow"
  | "bottom-arrow"
  | "message-bubble"
  | "capsule"
  | "swimlane";

export const ALL_SHAPES: SHAPES[] = [
  "rectangle",
  "rounded",
  "circle",
  "diamond",
  "hexagon",
  "triangle",
  "actor",
  "interface",
  "standing-woman",
  "sitting",
  "arms-stretched",
  "walking-man",
  "square",
  "cylinder",
  "document",
  "left-arrow",
  "right-arrow",
  "top-arrow",
  "bottom-arrow",
  "message-bubble",
  "capsule",
  "swimlane",
];

export type { ICreateColumn, SHAPES };
