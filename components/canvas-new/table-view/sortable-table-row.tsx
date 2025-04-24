import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  File,
  GripVertical,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import type React from "react";
import { Checkbox } from "../../ui/checkbox";
import AddTableCellTrigger from "../add-table-cell-relation-trigger";
import { HierarchyNode } from "./table.types";

// Component for sortable table rows (for row reordering)
const SortableTableRow: React.FC<{
  node: HierarchyNode;
  level: number;
  columns: any[];
  editingCell: { nodeId: string; column: string } | null;
  editedValue: any;
  validationError: string | null;
  setEditingCell: (cell: { nodeId: string; column: string } | null) => void;
  setEditedValue: (value: any) => void;
  setValidationError: (error: string | null) => void;
  handleSave: (nodeId: string, column: string, value: any) => void;
  toggleRowExpansion: (nodeId: string) => void;
  handleDeleteClick: (node: HierarchyNode) => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  expandedRows: Set<string>;
  hiddenColumns: string[];
  frozenColumns: Set<string>;
  columnWrapping: Set<string>;
  getRelatedCanvasNodes: any;
  columnWidths: Record<string, number>;
  handleDeleteConfirm: (deleteChildren: boolean) => void;
  nodeToDelete: any;
  shapeOptions: string[];
  readOnly?: boolean;
}> = ({
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
  handleDeleteConfirm,
  nodeToDelete,
  shapeOptions,
  readOnly,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id });

  const nonEditableColumns = ["id", "parent", "children", "from", "to"];

  // Expand nonEditableColumns to include any column with Rollup type
  const nonEditableItems = [
    ...nonEditableColumns,
    ...columns.filter((col) => col.type === "Rollup").map((col) => col.title),
    // disbale editing of Last edited time and Last edited by
    ...columns
      .filter(
        (col) =>
          col.type === "Last edited time" || col.type === "Last edited by"
      )
      .map((col) => col.title),
  ];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedNodes.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedRows.has(node.id);

  const renderCellContent = (column: any) => {
    if (
      editingCell?.nodeId === node.id &&
      editingCell?.column === column.title
    ) {
      switch (column.type) {
        case "Relation":
          return (
            <AddTableCellTrigger
              value={editedValue || []}
              label="Testing"
              relatedCanvasData={getRelatedCanvasNodes({
                ...column.related_canvas?.canvas_data,
                name: column.related_canvas?.name,
              })}
              onSelectValue={(value) => {
                setEditedValue(value);
                handleSave(node.id, column.title, value);
              }}
            />
          );
        case "Select":
          return (
            <Select
              value={editedValue}
              onValueChange={(value) => {
                setEditedValue(value);
                handleSave(node.id, column.title, value);
              }}
            >
              <SelectTrigger className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 p-0">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "Number":
          return (
            <Input
              type="number"
              value={editedValue}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and decimal point
                if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                  setEditedValue(value);
                }
              }}
              onBlur={() => handleSave(node.id, column.title, editedValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(node.id, column.title, editedValue);
                }
              }}
              autoFocus
              className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 p-0"
            />
          );
        case "Date":
        case "Created Time":
        case "Last edited time":
          return (
            <Input
              type="datetime-local"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={() => handleSave(node.id, column.title, editedValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(node.id, column.title, editedValue);
                }
              }}
              autoFocus
              className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 p-0"
            />
          );
        case "Checkbox":
          return (
            <div className="flex items-center justify-center h-full w-full min-h-[40px]">
              <div className="flex items-center justify-center w-[42px]">
                <Switch
                  checked={editedValue === true}
                  onCheckedChange={(checked) => {
                    setEditedValue(checked);
                    handleSave(node.id, column.title, checked);
                  }}
                />
              </div>
            </div>
          );
        case "type":
          return (
            <Select
              value={editedValue}
              onValueChange={(value) => {
                setEditedValue(value);
                handleSave(node.id, column.title, value);
              }}
            >
              <SelectTrigger className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 p-0">
                <SelectValue placeholder="Select shape type" />
              </SelectTrigger>
              <SelectContent>
                {shapeOptions.map((shape) => (
                  <SelectItem key={shape} value={shape}>
                    {shape}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        default:
          return (
            <Input
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={() => handleSave(node.id, column.title, editedValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(node.id, column.title, editedValue);
                }
              }}
              autoFocus
              className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 p-0"
            />
          );
      }
    }

    const cellValue = node.data[column.title];

    if (column?.type === "Rollup") {
      return (
        <div className="p-2 flex flex-wrap gap-1">
          {Array.isArray(cellValue) && cellValue.length > 0 ? (
            cellValue.map((item: any, index: number) => (
              <span
                key={index}
                className="text-sm text-gray-600 bg-gray-100 rounded-md px-2 py-1"
              >
                {typeof item.value !== "undefined"
                  ? typeof item.value === "object"
                    ? JSON.stringify(item.value).substring(0, 30)
                    : String(item.value)
                  : "—"}
              </span>
            ))
          ) : (
            <span className="text-gray-400 px-1">—</span>
          )}
        </div>
      );
    }

    if (column?.type === "Relation") {
      return (
        <div className="flex flex-wrap max-w-full">
          {Array.isArray(cellValue) && cellValue.length > 0 ? (
            cellValue.map((item: any, index: number) => (
              <p key={index} className="text-sm text-gray-600 flex mr-3">
                <File className="h-4 w-4 mr-1" /> {item.label}
              </p>
            ))
          ) : (
            <span className="text-gray-400 flex items-center">
              <Plus className="h-4 w-4 mr-1" /> Add
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="p-2 h-full">
        {column.title === "task" && (
          <div className="flex items-center">
            {hasChildren && (
              <div
                className="mr-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </div>
            )}
            {node.data.label || <span className="text-gray-400"></span>}
          </div>
        )}
        {column.title === "type" &&
          (node.data.shape || node?.type || (
            <span className="text-gray-400"></span>
          ))}
        {!["task", "type"].includes(column.title) && (
          <>
            {column?.type === "Checkbox" ? (
              <div className="flex items-center justify-center h-full w-full min-h-[40px]">
                <div className="flex items-center justify-center w-[42px]">
                  <Switch
                    checked={cellValue === true}
                    onCheckedChange={(checked) => {
                      handleSave(node.id, column.title, checked);
                    }}
                  />
                </div>
              </div>
            ) : column?.type === "Relation" ? (
              <div className="flex flex-wrap max-w-full">
                {Array.isArray(cellValue) && cellValue.length > 0 ? (
                  <div className="flex flex-wrap max-w-full">
                    {cellValue.map((item: any, index: number) => (
                      <p
                        key={index}
                        className="text-sm text-gray-600 flex mr-3"
                      >
                        <File className="h-4 w-4 mr-1" /> {item.label}
                      </p>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </span>
                )}
              </div>
            ) : column?.type === "Date" ||
              column?.type === "Created Time" ||
              column?.type === "Last edited time" ? (
              cellValue && !isNaN(new Date(cellValue).getTime()) ? (
                new Date(cellValue).toLocaleString()
              ) : (
                <span className="text-gray-400"></span>
              )
            ) : column?.type === "Long Text" ? (
              <div
                className="max-w-[300px] max-h-[8em] overflow-auto"
                style={{
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <p className="line-clamp-3">
                  {cellValue || <span className="text-gray-400"></span>}
                </p>
              </div>
            ) : column?.type === "Rollup" ? (
              <>
                {node.data[column.title] &&
                Array.isArray(node.data[column.title]) &&
                node.data[column.title].length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {node.data[column.title].map((item: any, index: number) => (
                      <span
                        key={index}
                        className="text-sm text-gray-600 bg-slate-100 rounded-md px-2 py-1 m-1"
                      >
                        {typeof item.value !== "undefined"
                          ? typeof item.value === "object"
                            ? JSON.stringify(item.value).substring(0, 30)
                            : String(item.value)
                          : "—"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </>
            ) : Array.isArray(node.data[column.title]) ? (
              node.data[column.title].join(", ")
            ) : (
              cellValue || <span className="text-gray-400"></span>
            )}
          </>
        )}
      </div>
    );
  };

  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      setSelectedNodes(selectedNodes.filter((id) => id !== node.id));
    } else {
      setSelectedNodes([...selectedNodes, node.id]);
    }
  };

  const handleExpandCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRowExpansion(node.id);
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group hover:bg-gray-50 ${isSelected ? "bg-gray-50" : "bg-white"} border-b border-gray-200`}
    >
      <TableCell className="sticky left-0 bg-gray-50 z-10 p-0 border-r border-gray-200 w-10">
        <div className="flex">
          {!readOnly && (
            <>
              <div className="flex items-center">
                <div
                  className={`p-2 ${!isSelected && "opacity-0 group-hover:opacity-100 transition-opacity"}`}
                  onClick={handleToggleSelect}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onClick={handleToggleSelect}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div
                {...listeners}
                {...attributes}
                className="cursor-move h-full hover:bg-gray-100 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
            </>
          )}
        </div>
      </TableCell>
      {columns
        .filter(
          (column) =>
            !hiddenColumns?.includes(column.title) && column.title !== "id"
        )
        .map((column, index) => {
          return (
            <TableCell
              key={`${node.id}-${column.title}`}
              style={{
                whiteSpace: columnWrapping.has(column.title)
                  ? "normal"
                  : "nowrap",
                width: `${columnWidths[column.title] || 200}px`,
                minWidth: `${columnWidths[column.title] || 200}px`,
                maxWidth: `${columnWidths[column.title] || 200}px`,
              }}
              className={`relative p-0 text-gray-700 overflow-hidden border-r border-gray-200 ${
                frozenColumns.has(column.title)
                  ? "sticky left-0 bg-gray-50 z-10"
                  : nonEditableItems.includes(column.title)
                    ? "cursor-not-allowed"
                    : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                // Skip editing in readonly mode
                if (readOnly) return;

                // Only skip edit mode for Checkbox type
                if (column.type === "Checkbox") {
                  return;
                }
                if (!nonEditableItems.includes(column.title)) {
                  setEditingCell({ nodeId: node.id, column: column.title });

                  if (column.type === "Relation") {
                    const relationData = node.data[column.title];
                    setEditedValue(
                      Array.isArray(relationData) ? relationData : []
                    );
                  } else if (column.title === "task") {
                    setEditedValue(node.data.label);
                  } else if (column.title === "type") {
                    setEditedValue(node.data.shape || node?.type);
                  } else {
                    setEditedValue(node.data[column.title] || "");
                  }

                  setValidationError(null);
                }
              }}
            >
              {/* Add indentation for hierarchical display on the first column */}
              {index === 0 && level > 0 ? (
                <div
                  style={{
                    display: "flex",
                    paddingLeft: `${level * 16}px`,
                  }}
                >
                  {renderCellContent(column)}
                </div>
              ) : (
                renderCellContent(column)
              )}
            </TableCell>
          );
        })}

      <TableCell
        className="p-2 bg-white border-l border-gray-200 "
        style={{
          position: "sticky",
          right: 0,
          zIndex: 20,
          backgroundColor: isSelected ? "#f9fafb" : "#fff",
          boxShadow: "-2px 0 2px -1px rgba(0,0,0,0.1)",
        }}
      >
        {!readOnly && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 h-full w-full flex items-center justify-center hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(node)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default SortableTableRow;
