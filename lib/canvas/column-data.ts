import type { Node } from "reactflow";
import type { ColumnDefinition } from "@/types/store";

// Single source of truth for how a canvas column maps to node data, shared by
// the table view, the node-properties side panel, and the add-column sidebar so
// they can never diverge on where a value is read from or written to.

export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date"
  | "color"
  | "url"
  | "longtext"
  | "email"
  | "relation"
  | "rollup";

// Derived/computed keys that are never real, editable columns. They are
// recomputed from edges / parent-child relationships at render time and must
// never be persisted into node.data or shown as editable properties.
export const CONNECTION_KEYS = [
  "from",
  "to",
  "parent",
  "children",
  "incoming",
  "outgoing",
] as const;

// The storage key for a column: explicit dataKey, otherwise the title.
export const getDataKey = (column: { dataKey?: string; title: string }): string =>
  column.dataKey || column.title;

// Special columns map to first-class node fields rather than node.data[key].
export const isSpecialColumn = (column: {
  dataKey?: string;
  title: string;
}): boolean => ["label", "shape", "id"].includes(getDataKey(column));

// Read a node's value for a column. The default branch is keyed on getDataKey
// (not title) so renamed/relation columns resolve identically to the table.
export const getNodeValue = (node: Node, column: ColumnDefinition): any => {
  const dataKey = getDataKey(column);
  switch (dataKey) {
    case "label":
      return node.data?.label;
    case "shape":
      return node.data?.shape;
    case "id":
      return node.id;
    default:
      return node.data?.[dataKey];
  }
};

// Return a new node.data object with the column's value updated. ID is
// read-only. Default branch writes to getDataKey(column) to match the table.
export const updateNodeValue = (
  node: Node,
  column: ColumnDefinition,
  value: any
): any => {
  const dataKey = getDataKey(column);
  const updatedData = { ...node.data };
  switch (dataKey) {
    case "label":
      updatedData.label = value;
      break;
    case "shape":
      updatedData.shape = value;
      break;
    case "id":
      break; // ID is not editable
    default:
      updatedData[dataKey] = value;
  }
  return updatedData;
};

export const mapColumnTypeToPropertyType = (
  columnType: string
): PropertyType => {
  const typeMap: Record<string, PropertyType> = {
    Text: "text",
    Number: "number",
    Select: "select",
    Multiselect: "multiselect",
    Checkbox: "checkbox",
    Date: "date",
    "Created Time": "date",
    "Last edited time": "date",
    "Long Text": "longtext",
    URL: "url",
    Email: "email",
    Relation: "relation",
    Rollup: "rollup",
  };
  return typeMap[columnType] || "text";
};

export const mapPropertyTypeToColumnType = (propType: PropertyType): string => {
  const typeMap: Record<PropertyType, string> = {
    text: "Text",
    number: "Number",
    select: "Select",
    multiselect: "Multiselect",
    checkbox: "Checkbox",
    date: "Date",
    color: "Text",
    url: "URL",
    longtext: "Long Text",
    email: "Email",
    relation: "Relation",
    rollup: "Rollup",
  };
  return typeMap[propType] || "Text";
};

// Default node-data value for a freshly added column of a given property type.
export const defaultForType = (propType: PropertyType): any => {
  switch (propType) {
    case "checkbox":
      return false;
    case "number":
      return 0;
    case "multiselect":
      return [];
    case "date":
      return new Date().toISOString();
    default:
      return "";
  }
};

// Strip derived connection keys from a node.data object so they are never
// persisted (they are recomputed from edges / parentNode at render time).
export const stripConnectionKeys = <T extends Record<string, any>>(
  data: T
): T => {
  const cleaned = { ...data };
  for (const key of CONNECTION_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
};

// ---- Column mutations -------------------------------------------------------
// These are pure: they take the current columns + nodes and return new arrays.
// Callers pass the results to setNodes() then setColumns() (in that order so the
// columns refetch sees consistent node data).

export interface ColumnMutationResult {
  columns: ColumnDefinition[];
  nodes: Node[];
}

// Append a new column AND seed node.data[dataKey] on EVERY node so the column
// exists consistently across all rows (not just the selected node). Special
// columns (label/shape/id) and relation/rollup columns are not seeded: the
// former map to first-class fields, the latter are array/computed and render
// fine from undefined.
export const addColumn = (
  columns: ColumnDefinition[],
  nodes: Node[],
  newColumn: ColumnDefinition,
  propType: PropertyType
): ColumnMutationResult => {
  const dataKey = getDataKey(newColumn);
  const skipSeed =
    isSpecialColumn(newColumn) ||
    propType === "relation" ||
    propType === "rollup";
  const seeded = skipSeed
    ? nodes
    : nodes.map((node) => {
        if (node.data?.[dataKey] !== undefined) return node;
        return {
          ...node,
          data: { ...node.data, [dataKey]: defaultForType(propType) },
        };
      });
  return { columns: [...columns, newColumn], nodes: seeded };
};

// Rename a column's title (preserving dataKey for special columns) and migrate
// node.data[old] -> node.data[new] on ALL nodes for non-special columns.
export const renameColumn = (
  columns: ColumnDefinition[],
  nodes: Node[],
  oldTitle: string,
  newTitle: string
): ColumnMutationResult => {
  const target = columns.find((col) => col.title === oldTitle);
  const nextColumns = columns.map((col) =>
    col.title === oldTitle
      ? {
          ...col,
          title: newTitle,
          dataKey: isSpecialColumn(col) ? col.dataKey : newTitle,
        }
      : col
  );

  if (!target || isSpecialColumn(target)) {
    return { columns: nextColumns, nodes };
  }

  const oldKey = getDataKey(target);
  const nextNodes = nodes.map((node) => {
    if (node.data?.[oldKey] === undefined) return node;
    const newData = { ...node.data };
    newData[newTitle] = newData[oldKey];
    delete newData[oldKey];
    return { ...node, data: newData };
  });
  return { columns: nextColumns, nodes: nextNodes };
};

// Delete a column and remove its key from EVERY node's data.
export const deleteColumn = (
  columns: ColumnDefinition[],
  nodes: Node[],
  title: string
): ColumnMutationResult => {
  const target = columns.find((col) => col.title === title);
  const key = target ? getDataKey(target) : title;
  const nextColumns = columns.filter((col) => col.title !== title);
  const nextNodes =
    target && isSpecialColumn(target)
      ? nodes
      : nodes.map((node) => {
          if (node.data?.[key] === undefined) return node;
          const newData = { ...node.data };
          delete newData[key];
          return { ...node, data: newData };
        });
  return { columns: nextColumns, nodes: nextNodes };
};

// Replace the options list for a select/multiselect column.
export const setColumnOptions = (
  columns: ColumnDefinition[],
  title: string,
  options: string[]
): ColumnDefinition[] =>
  columns.map((col) => (col.title === title ? { ...col, options } : col));
