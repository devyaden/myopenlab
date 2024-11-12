import { COLUMN_TYPES } from "./column-types.enum";

interface ICreateColumn {
  name: string;
  data_type: COLUMN_TYPES;
  validation?: any;
  order: number;
  key: string;
}

export type { ICreateColumn };
