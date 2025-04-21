import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id });

  const nonEditableColumns = ["id", "parent", "children", "from", "to"];

  // Expand nonEditableColumns to include any column with Rollup type
  const nonEditableItems = [
    ...nonEditableColumns,
    ...columns.filter((col) => col.type === "Rollup").map((col) => col.title),
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
      return column?.type === "Relation" ? (
        <AddTableCellTrigger
          value={editedValue || []}
          label="Testing"
          relatedCanvasData={getRelatedCanvasNodes({
            ...column.related_canvas?.canvas_data,
            name: column.related_canvas?.name,
          })}
          onSelectValue={(value) => {
            console.log("Relation value selected in SortableTableRow:", value);
            // First update the edited value state
            setEditedValue(value);
            // Then immediately trigger save to persist the data
            handleSave(node.id, column.title, value);
          }}
        />
      ) : (
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
          className="h-8"
        />
      );
    }

    const cellValue = node.data[column.title];

    if (column?.type === "Rollup") {
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(cellValue) && cellValue.length > 0 ? (
            cellValue.map((item: any, index: number) => (
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
            ))
          ) : (
            <span className="text-gray-400">—</span>
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
              <Switch checked={node.data[column.title] === true} disabled />
            ) : column?.type === "Date" ||
              column?.type === "Created Time" ||
              column?.type === "Last edited time" ? (
              node.data[column.title] &&
              !isNaN(new Date(node.data[column.title]).getTime()) ? (
                new Date(node.data[column.title]).toLocaleString()
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
                  {node.data[column.title] || (
                    <span className="text-gray-400"></span>
                  )}
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
            ) : column?.type === "Relation" ? (
              <>
                {node.data[column.title] &&
                node.data[column.title].length > 0 ? (
                  <div className="flex flex-wrap max-w-full">
                    {node.data[column.title]?.map((item: any) => (
                      <p className="text-sm text-gray-600 flex mr-3">
                        <File className="h-4 w-4 mr-1" /> {item.label}
                      </p>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </span>
                )}
              </>
            ) : Array.isArray(node.data[column.title]) ? (
              node.data[column.title].join(", ")
            ) : (
              node.data[column.title] || <span className="text-gray-400"></span>
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
      className={`group ${isSelected ? "bg-gray-50" : "bg-white"} border-b border-gray-200`}
    >
      <TableCell className="sticky left-0 bg-gray-50 z-10 p-0 border-r border-gray-200 w-10">
        <div className="flex">
          <div
            {...listeners}
            {...attributes}
            className="cursor-move h-full hover:bg-gray-100 p-2"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center">
            <div
              className="p-2"
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
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!nonEditableItems.includes(column.title)) {
                  setEditingCell({ nodeId: node.id, column: column.title });

                  // For relation columns, make sure we set the correct initial value
                  if (column.type === "Relation") {
                    console.log("Clicked relation column:", column.title);
                    console.log(
                      "Node data for relation:",
                      node.data[column.title]
                    );

                    // Ensure we set a properly formatted array for relation data
                    const relationData = node.data[column.title];
                    if (Array.isArray(relationData)) {
                      setEditedValue(relationData);
                    } else if (relationData) {
                      // Try to handle non-array data gracefully
                      try {
                        const formattedData =
                          typeof relationData === "object"
                            ? [relationData]
                            : [];
                        setEditedValue(formattedData);
                      } catch (e) {
                        console.error("Error formatting relation data:", e);
                        setEditedValue([]);
                      }
                    } else {
                      setEditedValue([]);
                    }
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
      </TableCell>
    </TableRow>
  );
};

export default SortableTableRow;
