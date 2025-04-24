interface SortableTableRowProps {
  node: HierarchyNode;
  level: number;
  columns: any[];
  editingCell: { nodeId: string; column: string } | null;
  editedValue: string;
  validationError: string | null;
  setEditingCell: (cell: { nodeId: string; column: string }) => void;
  setEditedValue: (value: string) => void;
  setValidationError: (error: string | null) => void;
  handleSave: () => void;
  toggleRowExpansion: () => void;
  handleDeleteClick: () => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  expandedRows: string[];
  hiddenColumns: string[];
  frozenColumns: string[];
  columnWrapping: boolean;
  getRelatedCanvasNodes: (node: HierarchyNode) => HierarchyNode[];
  columnWidths: { [key: string]: number };
  nodeToDelete: HierarchyNode | null;
  handleDeleteConfirm: () => void;
  shapeOptions: ShapeOptions;
  readOnly?: boolean;
}

export const SortableTableRow: React.FC<SortableTableRowProps> = ({
  node,
  level,
  columns,
  editingCell,
  editedValue,
  validationError,
  setEditingCell,
  setEditedValue,
  setValidationError,
  handleSave,
  toggleRowExpansion,
  handleDeleteClick,
  selectedNodes,
  setSelectedNodes,
  expandedRows,
  hiddenColumns,
  frozenColumns,
  columnWrapping,
  getRelatedCanvasNodes,
  columnWidths,
  nodeToDelete,
  handleDeleteConfirm,
  shapeOptions,
  readOnly,
}) => {
  const handleCellClick = (columnTitle: string) => {
    if (readOnly) return;

    if (columnTitle === "task" || columnTitle === "type") {
      setEditingCell({ nodeId: node.id, column: columnTitle });
      setEditedValue(
        columnTitle === "task" ? node.data.label : node.data.shape
      );
    } else {
      setEditingCell({ nodeId: node.id, column: columnTitle });
      setEditedValue(node.data[columnTitle] || "");
    }
  };

  // ... rest of the component code ...
};
