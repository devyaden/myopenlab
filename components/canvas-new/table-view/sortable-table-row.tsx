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
      {...attributes}
      className={`group ${isSelected ? "bg-gray-50" : "bg-white"} border-b border-gray-200`}
    >
      <TableCell
        className=" bg-white border-r border-gray-200 p-0"
        style={{
          position: "sticky",
          left: 0,
          zIndex: 20,
          boxShadow: "2px 0 2px -1px rgba(0,0,0,0.1)",
          width: "50px",
          minWidth: "50px",
        }}
      >
        <div
          style={style}
          className={`flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
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
              onClick={() => {
                if (!nonEditableColumns.includes(column.title)) {
                  setEditingCell({ nodeId: node.id, column: column.title });
                  setEditedValue(
                    column.title === "task"
                      ? node.data.label
                      : column.title === "type"
                        ? node.data.shape || node?.type
                        : node.data[column.title] || ""
                  );
                  setValidationError(null);
                }
              }}
            >
              <div className="p-2 h-full">
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
                  <div className="absolute inset-0 z-10 bg-white shadow-sm  border-2 rounded-none">
                    {column?.type === "Select" ? (
                      <Select
                        value={editedValue || ""}
                        onValueChange={(value) => {
                          setEditedValue(value);
                          handleSave(node.id, column.title, value);
                        }}
                      >
                        <SelectTrigger className="w-full h-full border-0 rounded-none !focus:ring-0 focus:border-0 ">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {column.options?.map((option: any) => (
                            <SelectItem
                              key={option}
                              value={option || "default"}
                            >
                              {option || "Default"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : column?.type === "Multiselect" ? (
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
                    ) : column?.type === "Checkbox" ? (
                      <div className="h-full flex items-center justify-center bg-white">
                        <Switch
                          checked={editedValue === true}
                          onCheckedChange={(checked) => {
                            setEditedValue(checked);
                            handleSave(node.id, column.title, checked);
                          }}
                        />
                      </div>
                    ) : column?.type === "Date" ||
                      column?.type === "Created Time" ||
                      column?.type === "Last edited time" ? (
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
                    ) : column?.type === "Long Text" ? (
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
                        className={`w-full h-full border-0 rounded-none focus-visible:ring-0 resize-none ${validationError ? "border-red-500" : ""}`}
                        autoFocus
                      />
                    ) : column?.type === "Relation" ? (
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
                    ) : column?.type === "Rollup" ? (
                      <>
                        {node.data[column.title] ? (
                          <div className="flex flex-wrap gap-1">
                            {node.data[column.title].map(
                              (item: any, index: number) => (
                                <span
                                  key={index}
                                  className="text-sm text-gray-600"
                                >
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
                        type={column?.type === "Number" ? "number" : "text"}
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
                        className={`w-full h-full border-0 rounded-none focus-visible:ring-0 ${validationError ? "border-red-500" : ""}`}
                        autoFocus
                      />
                    )}
                    {validationError && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-1">
                        {validationError}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {column.title === "task" &&
                      (node.data.label || (
                        <span className="text-gray-400"></span>
                      ))}
                    {column.title === "type" &&
                      (node.data.shape || node?.type || (
                        <span className="text-gray-400"></span>
                      ))}
                    {!["task", "type"].includes(column.title) && (
                      <>
                        {column?.type === "Checkbox" ? (
                          <Switch
                            checked={node.data[column.title] === true}
                            disabled
                          />
                        ) : column?.type === "Date" ||
                          column?.type === "Created Time" ||
                          column?.type === "Last edited time" ? (
                          node.data[column.title] &&
                          !isNaN(
                            new Date(node.data[column.title]).getTime()
                          ) ? (
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
                        ) : column?.type === "Relation" ? (
                          <>
                            {node.data[column.title] &&
                            node.data[column.title].length > 0 ? (
                              <div className="flex flex-wrap max-w-full">
                                {node.data[column.title]?.map((item: any) => (
                                  <p className="text-sm text-gray-600 flex mr-3">
                                    <File className="h-4 w-4 mr-1" />{" "}
                                    {item.label}
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
                          node.data[column.title] || (
                            <span className="text-gray-400"></span>
                          )
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
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
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  // onClick={() => handleDeleteClick(node)}
                  onSelect={(e) => e.preventDefault()}
                >
                  Delete
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Node</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this node
                    {nodeToDelete?.children.length ? " and its children" : ""}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogTrigger>
                    <Button
                      variant="outline"
                      // onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteConfirm(false)}
                  >
                    {nodeToDelete?.children.length
                      ? "Delete Node Only"
                      : "Delete Node"}
                  </Button>
                  {nodeToDelete?.children.length ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteConfirm(true)}
                    >
                      Delete Node and Children
                    </Button>
                  ) : null}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default SortableTableRow;
