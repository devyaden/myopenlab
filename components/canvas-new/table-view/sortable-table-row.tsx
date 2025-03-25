import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  File,
  GripVertical,
  MoreHorizontal,
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
  hiddenColumns: Set<string>;
  frozenColumns: Set<string>;
  columnWrapping: Set<string>;
  getRelatedCanvasNodes: any;
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
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id });

  const nonEditableColumns = ["id", "parent", "children", "from", "to"];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedRows.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodes.includes(node.id);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`hover:bg-gray-100 ${isSelected ? "bg-gray-50" : "bg-white"} border-b border-gray-200`}
    >
      <TableCell className="p-2 w-16">
        <div className="flex items-center space-x-2">
          <div {...listeners}>
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          </div>
          <Checkbox
            checked={selectedNodes.includes(node.id)}
            className="border-gray-400"
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedNodes([...selectedNodes, node.id]);
              } else {
                setSelectedNodes(selectedNodes.filter((id) => id !== node.id));
              }
            }}
          />
        </div>
      </TableCell>
      {columns
        .filter(
          (column) => !hiddenColumns.has(column.title) && column.title !== "id"
        )
        .map((column, index) => (
          <TableCell
            key={`${node.id}-${column.title}`}
            style={{
              paddingLeft: index === 0 ? `${level * 20 + 16}px` : undefined,
              whiteSpace: columnWrapping.has(column.title)
                ? "normal"
                : "nowrap",
            }}
            className={`p-2 text-gray-700 ${
              frozenColumns.has(column.title)
                ? "sticky left-0 bg-gray-50 z-10"
                : ""
            }`}
            onDoubleClick={() => {
              if (!nonEditableColumns.includes(column.title)) {
                setEditingCell({ nodeId: node.id, column: column.title });
                setEditedValue(
                  column.title === "task"
                    ? node.data.label
                    : column.title === "type"
                      ? node.data.shape || node.type
                      : node.data[column.title] || ""
                );
                setValidationError(null);
              }
            }}
          >
            {index === 0 && (
              <span className="inline-flex items-center mr-2">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpansion(node.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                )}
              </span>
            )}

            {editingCell?.nodeId === node.id &&
            editingCell?.column === column.title ? (
              <div>
                {column.type === "Select" ? (
                  <Select
                    value={editedValue || ""}
                    onValueChange={(value) => {
                      setEditedValue(value);
                      handleSave(node.id, column.title, value);
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {column.options?.map((option: any) => (
                        <SelectItem key={option} value={option || "default"}>
                          {option || "Default"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : column.type === "Multiselect" ? (
                  <MultiSelect
                    options={(column.options || []).map((option: any) => ({
                      label: option,
                      value: option,
                    }))}
                    selected={editedValue || []}
                    onChange={(selected) => {
                      setEditedValue(selected);
                      handleSave(node.id, column.title, selected);
                    }}
                  />
                ) : column.type === "Checkbox" ? (
                  <Switch
                    checked={editedValue === true}
                    onCheckedChange={(checked) => {
                      setEditedValue(checked);
                      handleSave(node.id, column.title, checked);
                    }}
                  />
                ) : column.type === "Date" ||
                  column.type === "Created Time" ||
                  column.type === "Last edited time" ? (
                  <Input
                    type="datetime-local"
                    value={
                      editedValue
                        ? new Date(editedValue).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => setEditedValue(e.target.value)}
                    onBlur={() =>
                      handleSave(node.id, column.title, editedValue)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave(node.id, column.title, editedValue);
                      } else if (e.key === "Escape") {
                        setEditingCell(null);
                        setEditedValue(null);
                        setValidationError(null);
                      }
                    }}
                    className={`border-gray-300 focus-visible:ring-0 ${validationError ? "border-red-500" : ""}`}
                    autoFocus
                  />
                ) : column.type === "Long Text" ? (
                  <Textarea
                    value={editedValue || ""}
                    onChange={(e) => setEditedValue(e.target.value)}
                    onBlur={() =>
                      handleSave(node.id, column.title, editedValue)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditingCell(null);
                        setEditedValue(null);
                        setValidationError(null);
                      }
                    }}
                    className={`border-gray-300 ${validationError ? "border-red-500" : ""}`}
                    autoFocus
                  />
                ) : column.type === "Relation" ? (
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
                ) : column.type === "Rollup" ? (
                  <>
                    {node.data[column.title] ? (
                      <div className="flex flex-wrap gap-1">
                        {node.data[column.title].map(
                          (item: any, index: number) => (
                            <span key={index} className="text-sm text-gray-600">
                              {item.value ?? "undefined"}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </>
                ) : (
                  <Input
                    type={column.type === "Number" ? "number" : "text"}
                    value={editedValue || ""}
                    onChange={(e) => setEditedValue(e.target.value)}
                    onBlur={() =>
                      handleSave(node.id, column.title, editedValue)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave(node.id, column.title, editedValue);
                      } else if (e.key === "Escape") {
                        setEditingCell(null);
                        setEditedValue(null);
                        setValidationError(null);
                      }
                    }}
                    className={`border-gray-300 focus-visible:ring-0 ${validationError ? "border-red-500" : ""}`}
                    autoFocus
                  />
                )}
                {validationError && (
                  <p className="text-red-500 text-xs mt-1">{validationError}</p>
                )}
              </div>
            ) : (
              <>
                {column.title === "task" &&
                  (node.data.label || <span className="text-gray-400"></span>)}
                {column.title === "type" &&
                  (node.data.shape || node.type || (
                    <span className="text-gray-400"></span>
                  ))}
                {!["task", "type"].includes(column.title) && (
                  <>
                    {column.type === "Checkbox" ? (
                      <Switch
                        checked={node.data[column.title] === true}
                        disabled
                      />
                    ) : column.type === "Date" ||
                      column.type === "Created Time" ||
                      column.type === "Last edited time" ? (
                      node.data[column.title] &&
                      !isNaN(new Date(node.data[column.title]).getTime()) ? (
                        new Date(node.data[column.title]).toLocaleString()
                      ) : (
                        <span className="text-gray-400"></span>
                      )
                    ) : column.type === "Long Text" ? (
                      <div className="max-w-[300px] max-h-[4.5em] overflow-hidden">
                        <p className="line-clamp-3">
                          {node.data[column.title] || (
                            <span className="text-gray-400"></span>
                          )}
                        </p>
                      </div>
                    ) : column.type === "Rollup" ? (
                      <>
                        {node.data[column.title] ? (
                          <div className="flex flex-wrap gap-1">
                            {node.data[column.title].map(
                              (item: any, index: number) => (
                                <span
                                  key={index}
                                  className="text-sm text-gray-600"
                                >
                                  {item.value}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400"></span>
                        )}
                      </>
                    ) : column.type === "Relation" ? (
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
                          <span className="text-gray-400"></span>
                        )}
                      </>
                    ) : Array.isArray(node.data[column.title]) ? (
                      node.data[column.title].join(", ")
                    ) : (
                      node.data[column.title] || (
                        <span className="text-gray-400"></span>
                      )
                    )}
                  </>
                )}
              </>
            )}
          </TableCell>
        ))}
      <TableCell className="text-right p-2 sticky right-0 bg-white z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDeleteClick(node)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default SortableTableRow;
