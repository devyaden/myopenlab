"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  Check,
  MoreVertical,
} from "lucide-react";
import type { Node, Edge } from "reactflow"; //This import is likely incorrect.  Reactflow is not a standard library.  The functionality will need to be replaced.
import type React from "react";
import { AddColumnSidebar, type ColumnData } from "./add-column-sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TableViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  columns: ColumnData[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnData[]>>;
  onAddColumn: (columnData: ColumnData) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = "id" | "task" | "type" | null;

interface HierarchyNode extends Node {
  children: HierarchyNode[];
}

const TableView: React.FC<TableViewProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  columns,
  setColumns,
  onAddColumn,
}) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newShapeType, setNewShapeType] = useState("rectangle");
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isAddColumnSidebarOpen, setIsAddColumnSidebarOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<HierarchyNode | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(
    null
  );
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [deleteColumnDialog, setDeleteColumnDialog] = useState<string | null>(
    null
  );
  const [columnWrapping, setColumnWrapping] = useState<Set<string>>(new Set());
  const [frozenColumns, setFrozenColumns] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isHiddenColumnsMenuOpen, setIsHiddenColumnsMenuOpen] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ChevronUp className="h-4 w-4 ml-1" />
      ) : (
        <ChevronDown className="h-4 w-4 ml-1" />
      );
    }
    return (
      <ChevronDown className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  };

  const createHierarchy = (nodes: Node[]): HierarchyNode[] => {
    const nodeMap = new Map<string, HierarchyNode>();
    const rootNodes: HierarchyNode[] = [];

    nodes.forEach((node) => {
      const hierarchyNode: HierarchyNode = { ...node, children: [] };
      nodeMap.set(node.id, hierarchyNode);
    });

    nodes.forEach((node) => {
      if (node.parentNode) {
        const parent = nodeMap.get(node.parentNode);
        if (parent) {
          parent.children.push(nodeMap.get(node.id)!);
        }
      } else {
        rootNodes.push(nodeMap.get(node.id)!);
      }
    });

    return rootNodes;
  };

  const sortedHierarchy = useMemo(() => {
    const hierarchy = createHierarchy(nodes);

    if (!sortField || !sortDirection) return hierarchy;

    const sortNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes
        .sort((a, b) => {
          let aValue: string | number = "";
          let bValue: string | number = "";

          switch (sortField) {
            case "id":
              aValue = a.id;
              bValue = b.id;
              break;
            case "task":
              aValue = a.data.label || "";
              bValue = b.data.label || "";
              break;
            case "type":
              aValue = a.data.shape || a.type || "";
              bValue = b.data.shape || b.type || "";
              break;
          }

          const sortOrder = sortDirection === "asc" ? 1 : -1;
          return aValue > bValue ? sortOrder : -sortOrder;
        })
        .map((node) => ({
          ...node,
          children: sortNodes(node.children),
        }));
    };

    return sortNodes(hierarchy);
  }, [nodes, sortField, sortDirection]); // Removed createHierarchy from dependencies

  const deleteNode = (nodeId: string, deleteChildren = false) => {
    const nodesToDelete = new Set<string>([nodeId]);

    if (deleteChildren) {
      const hierarchy = createHierarchy(nodes);
      const collectChildrenIds = (node: HierarchyNode) => {
        node.children.forEach((child) => {
          nodesToDelete.add(child.id);
          collectChildrenIds(child);
        });
      };
      const nodeToDelete = hierarchy.find((node) => node.id === nodeId);
      if (nodeToDelete) {
        collectChildrenIds(nodeToDelete);
      }
    }

    const updatedNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
    onNodesChange(updatedNodes);
  };

  const addNewRow = () => {
    if (newTaskName.trim() === "") {
      alert("Please enter a task name");
      return;
    }

    const newNode = {
      id: `node-${Date.now()}`,
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: {
        label: newTaskName,
        shape: newShapeType,
      },
      parentNode:
        selectedParentId !== "no-parent" ? selectedParentId : undefined,
    };
    onNodesChange([...nodes, newNode] as Node[]);
    setNewTaskName("");
    setNewShapeType("rectangle");
    setSelectedParentId(null);
    setIsAddingRow(false);

    // Expand the parent node if it exists
    if (newNode.parentNode) {
      setExpandedRows((prev) => new Set(prev).add(newNode.parentNode!));
    }
  };

  const addNewColumn = () => {
    setIsAddColumnSidebarOpen(true);
  };

  const handleAddColumn = (columnData: ColumnData) => {
    onAddColumn(columnData);
  };

  const handleDoubleClick = (nodeId: string) => {
    setEditingRow(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditedValues({
        task: node.data.label,
        type: node.data.shape,
        ...node.data,
      });
    }
  };

  const handleEditChange = (field: string, value: string) => {
    const column = columns.find((col) => col.title === field);
    if (column && validateField(column.type, value)) {
      setEditedValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateField = (type: string, value: string): boolean => {
    switch (type) {
      case "Email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case "Phone Number":
        return /^\+?[\d\s-]{10,}$/.test(value);
      case "URL":
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case "Number":
        return /^-?\d*\.?\d+$/.test(value);
      case "Date":
        return !isNaN(Date.parse(value));
      case "Checkbox":
        return value === "true" || value === "false";
      default:
        return true;
    }
  };

  const handleSaveEdit = () => {
    if (editingRow) {
      const isValid = Object.entries(editedValues).every(([key, value]) => {
        const column = columns.find((col) => col.title === key);
        return column ? validateField(column.type, value as string) : true;
      });

      if (isValid) {
        const updatedNodes = nodes.map((node) => {
          if (node.id === editingRow) {
            const newData = {
              ...node.data,
              ...editedValues,
              label: editedValues.task,
              shape: editedValues.type,
            };
            return { ...node, data: newData };
          }
          return node;
        });
        onNodesChange(updatedNodes);
        setEditingRow(null);
        setEditedValues({});
      } else {
        alert("Please correct the invalid fields before saving.");
      }
    }
  };

  const shapeOptions = [
    "rectangle",
    "rounded",
    "circle",
    "diamond",
    "hexagon",
    "triangle",
    "useCase",
    "actor",
    "class",
    "interface",
  ];

  const toggleRowExpansion = (nodeId: string) => {
    setExpandedRows((prevExpandedRows) => {
      const newExpandedRows = new Set(prevExpandedRows);
      if (newExpandedRows.has(nodeId)) {
        newExpandedRows.delete(nodeId);
      } else {
        // Expand all parent nodes
        let currentNode = nodes.find((n) => n.id === nodeId);
        while (currentNode && currentNode.parentNode) {
          newExpandedRows.add(currentNode.parentNode);
          currentNode = nodes.find((n) => n.id === currentNode?.parentNode);
        }
        newExpandedRows.add(nodeId);
      }
      return newExpandedRows;
    });
  };

  const handleDeleteClick = (node: HierarchyNode) => {
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = (deleteChildren: boolean) => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete.id, deleteChildren);
    }
    setDeleteDialogOpen(false);
    setNodeToDelete(null);
  };

  const isDefaultColumn = (columnTitle: string) => {
    return ["id", "task", "type"].includes(columnTitle);
  };

  const handleColumnTitleEdit = (columnTitle: string, newTitle: string) => {
    if (newTitle.trim() && newTitle !== columnTitle) {
      setColumns(
        columns.map((col) =>
          col.title === columnTitle ? { ...col, title: newTitle } : col
        )
      );
      // Update all nodes to reflect the new column title
      const updatedNodes = nodes.map((node) => {
        const newData = { ...node.data };
        if (newData[columnTitle] !== undefined) {
          newData[newTitle] = newData[columnTitle];
          delete newData[columnTitle];
        }
        return { ...node, data: newData };
      });
      onNodesChange(updatedNodes);
    }
    setEditingColumnTitle(null);
    setNewColumnTitle("");
  };

  const handleDeleteColumn = (columnTitle: string) => {
    setColumns(columns.filter((col) => col.title !== columnTitle));
    // Remove the column data from all nodes
    const updatedNodes = nodes.map((node) => {
      const newData = { ...node.data };
      delete newData[columnTitle];
      return { ...node, data: newData };
    });
    onNodesChange(updatedNodes);
    setDeleteColumnDialog(null);
  };

  const handleDuplicateColumn = (columnTitle: string) => {
    const originalColumn = columns.find((col) => col.title === columnTitle);
    if (originalColumn) {
      let newTitle = `${columnTitle} copy`;
      let counter = 1;
      while (columns.some((col) => col.title === newTitle)) {
        newTitle = `${columnTitle} copy ${counter}`;
        counter++;
      }

      const newColumn = { ...originalColumn, title: newTitle };
      setColumns([...columns, newColumn]);

      // Duplicate the column data for all nodes
      const updatedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          [newTitle]: node.data[columnTitle],
        },
      }));
      onNodesChange(updatedNodes);
    }
  };

  const toggleColumnWrapping = (columnTitle: string) => {
    setColumnWrapping((prev) => {
      const next = new Set(prev);
      if (next.has(columnTitle)) {
        next.delete(columnTitle);
      } else {
        next.add(columnTitle);
      }
      return next;
    });
  };

  const toggleFrozenColumn = (columnTitle: string) => {
    setFrozenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnTitle)) {
        next.delete(columnTitle);
      } else {
        next.add(columnTitle);
      }
      return next;
    });
  };

  const toggleColumnVisibility = (columnTitle: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnTitle)) {
        next.delete(columnTitle);
      } else {
        next.add(columnTitle);
      }
      return next;
    });
  };

  const toggleHiddenColumn = (columnTitle: string) => {
    toggleColumnVisibility(columnTitle);
  };

  const renderHierarchy = (
    nodes: HierarchyNode[],
    level = 0
  ): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const isExpanded = expandedRows.has(node.id);
      const hasChildren = node.children.length > 0;

      return [
        <TableRow
          key={node.id}
          className="hover:bg-gray-50"
          onDoubleClick={() => handleDoubleClick(node.id)}
        >
          {columns
            .filter((column) => !hiddenColumns.has(column.title))
            .map((column, index) => (
              <TableCell
                key={`${node.id}-${column.title}`}
                style={{
                  paddingLeft: index === 0 ? `${level * 20 + 16}px` : undefined,
                  whiteSpace: columnWrapping.has(column.title)
                    ? "normal"
                    : "nowrap",
                }}
                className={
                  frozenColumns.has(column.title)
                    ? "sticky left-0 bg-white z-10"
                    : ""
                }
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
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </span>
                )}
                {editingRow === node.id && column.title !== "id" ? (
                  column.title === "type" ? (
                    <Select
                      value={editedValues.type || node.data.shape}
                      onValueChange={(value) => handleEditChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shape" />
                      </SelectTrigger>
                      <SelectContent>
                        {shapeOptions.map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {shape}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={
                        column.type === "Number"
                          ? "number"
                          : column.type === "Date"
                            ? "date"
                            : "text"
                      }
                      value={editedValues[column.title] || ""}
                      onChange={(e) =>
                        handleEditChange(column.title, e.target.value)
                      }
                      className={
                        !validateField(column.type, editedValues[column.title])
                          ? "border-red-500"
                          : ""
                      }
                    />
                  )
                ) : (
                  <>
                    {column.title === "id" && node.id}
                    {column.title === "task" && node.data.label}
                    {column.title === "type" && (node.data.shape || node.type)}
                    {!["id", "task", "type"].includes(column.title) &&
                      (node.data[column.title] || "—")}
                  </>
                )}
              </TableCell>
            ))}
          <TableCell className="text-right">
            {editingRow === node.id ? (
              <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                <Check className="h-4 w-4" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDeleteClick(node)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TableCell>
        </TableRow>,
        ...(isExpanded && hasChildren
          ? renderHierarchy(node.children, level + 1)
          : []),
      ];
    });
  };

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns
                .filter((column) => !hiddenColumns.has(column.title))
                .map((column) => (
                  <TableHead
                    key={column.title}
                    className={`group ${frozenColumns.has(column.title) ? "sticky left-0 bg-white z-10" : ""}`}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex items-center cursor-pointer">
                          {editingColumnTitle === column.title ? (
                            <Input
                              value={newColumnTitle}
                              onChange={(e) =>
                                setNewColumnTitle(e.target.value)
                              }
                              onBlur={() =>
                                handleColumnTitleEdit(
                                  column.title,
                                  newColumnTitle
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleColumnTitleEdit(
                                    column.title,
                                    newColumnTitle
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="h-7 w-32"
                            />
                          ) : (
                            <>
                              {column.title}
                              {getSortIcon(column.title as SortField)}
                            </>
                          )}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingColumnTitle(column.title);
                            setNewColumnTitle(column.title);
                          }}
                        >
                          Edit property
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Set up AI autofill
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1 rounded">
                            New
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSortField(column.title as SortField);
                            setSortDirection("asc");
                          }}
                        >
                          Sort ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSortField(column.title as SortField);
                            setSortDirection("desc");
                          }}
                        >
                          Sort descending
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Filter</DropdownMenuItem>
                        {!hiddenColumns.has(column.title) && (
                          <DropdownMenuItem
                            onClick={() => toggleHiddenColumn(column.title)}
                          >
                            Hide in view
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => toggleFrozenColumn(column.title)}
                        >
                          {frozenColumns.has(column.title)
                            ? "Unfreeze column"
                            : "Freeze up to column"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateColumn(column.title)}
                        >
                          Duplicate property
                        </DropdownMenuItem>
                        {!isDefaultColumn(column.title) && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteColumnDialog(column.title)}
                          >
                            Delete property
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`wrap-${column.title}`}>
                              Wrap column
                            </Label>
                            <Switch
                              id={`wrap-${column.title}`}
                              checked={columnWrapping.has(column.title)}
                              onCheckedChange={() =>
                                toggleColumnWrapping(column.title)
                              }
                            />
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                ))}
              <TableHead className="w-[100px] text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={addNewColumn}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Column
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsHiddenColumnsMenuOpen(true)}
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show/Hide Columns
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderHierarchy(sortedHierarchy)}</TableBody>
        </Table>
        <div className="p-4 border-t">
          {isAddingRow ? (
            <div className="flex items-center gap-4">
              <Input
                placeholder="Enter task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="flex-grow"
              />
              <Select value={newShapeType} onValueChange={setNewShapeType}>
                <SelectTrigger className="w-[180px]">
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
              <Select
                value={selectedParentId || ""}
                onValueChange={setSelectedParentId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-parent">No parent</SelectItem>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addNewRow}>Add</Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingRow(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-gray-900"
              onClick={() => setIsAddingRow(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Row
            </Button>
          )}
        </div>
      </div>
      <AddColumnSidebar
        isOpen={isAddColumnSidebarOpen}
        onClose={() => setIsAddColumnSidebarOpen(false)}
        onAddColumn={handleAddColumn}
      />
      <AlertDialog
        open={!!deleteColumnDialog}
        onOpenChange={() => setDeleteColumnDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this column? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteColumnDialog && handleDeleteColumn(deleteColumnDialog)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this node
              {nodeToDelete?.children.length ? " and its children" : ""}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteConfirm(false)}
            >
              Delete Node Only
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
      <Dialog
        open={isHiddenColumnsMenuOpen}
        onOpenChange={setIsHiddenColumnsMenuOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Hidden Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {columns.map((column) => (
              <div
                key={column.title}
                className="flex items-center justify-between"
              >
                <span>{column.title}</span>
                <Switch
                  checked={!hiddenColumns.has(column.title)}
                  onCheckedChange={() => toggleColumnVisibility(column.title)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHiddenColumnsMenuOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableView;
