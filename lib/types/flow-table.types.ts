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

export type { ICreateColumn };
