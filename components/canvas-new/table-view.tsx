"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type React from "react";
import { MarkerType, Node } from "reactflow";
import type { ColumnData } from "./add-column-sidebar";
import { AddColumnSidebar } from "./add-column-sidebar";
import ManageConnectionsModal from "./manage-connections-modal";

interface TableViewProps {
  nodes: Node[];
  edges: any[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: any[]) => void;
  columns: ColumnData[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnData[]>>;
  onAddColumn: (columnData: ColumnData) => void;
  onCreateConnection: (source: string, target: string) => void;
  onDeleteConnection: (id: string) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = "id" | "task" | "type" | "from" | "to" | null;

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
  onCreateConnection,
  onDeleteConnection,
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
  const [isManageConnectionsOpen, setIsManageConnectionsOpen] = useState(false);
  const [selectedNodeForConnections, setSelectedNodeForConnections] = useState<
    string | null
  >(null);

  const [columnsState, setColumnsState] = useState<ColumnData[]>([
    { title: "task", type: "Text" },
    { title: "type", type: "Select" },
    { title: "from", type: "Text" },
    { title: "to", type: "Text" },
  ]);

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
            case "from":
              aValue = a.data.from || "";
              bValue = b.data.from || "";
              break;
            case "to":
              aValue = a.data.to || "";
              bValue = b.data.to || "";
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
  }, [nodes, sortField, sortDirection]);

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
        from: "",
        to: "",
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
        from: node.data.from,
        to: node.data.to,
        ...node.data,
      });
    }
  };

  const handleEditChange = (field: string, value: string) => {
    const column = columnsState.find((col) => col.title === field);
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
        const column = columnsState.find((col) => col.title === key);
        if (column?.type === "Relation" || column?.type === "Rollup") {
          return true; // These are always valid as they're selected from a list
        }
        return column ? validateField(column.type, value as string) : true;
      });

      if (isValid) {
        const updatedNodes = nodes.map((node) => {
          if (node.id === editingRow) {
            const newData = {
              ...node.data,
              ...editedValues,
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
    return ["task", "type", "from", "to"].includes(columnTitle);
  };

  const handleColumnTitleEdit = (columnTitle: string, newTitle: string) => {
    if (newTitle.trim() && newTitle !== columnTitle) {
      setColumnsState(
        columnsState.map((col) =>
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
    setColumnsState(columnsState.filter((col) => col.title !== columnTitle));
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
    const originalColumn = columnsState.find(
      (col) => col.title === columnTitle
    );
    if (originalColumn) {
      let newTitle = `${columnTitle} copy`;
      let counter = 1;
      while (columnsState.some((col) => col.title === newTitle)) {
        newTitle = `${columnTitle} copy ${counter}`;
        counter++;
      }

      const newColumn = { ...originalColumn, title: newTitle };
      setColumnsState([...columnsState, newColumn]);

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
          {columnsState
            .filter(
              (column) =>
                !hiddenColumns.has(column.title) && column.title !== "id"
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
                {renderCellContent(node, column)}
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
                  <DropdownMenuItem
                    onClick={() => handleManageConnections(node.id)}
                  >
                    Manage Connections
                  </DropdownMenuItem>
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

  const availableCanvases = [
    // Add your available canvases here
    { id: "canvas1", name: "Canvas 1" },
    { id: "canvas2", name: "Canvas 2" },
  ];

  const navigateToCanvas = (canvasId: string) => {
    // Implement navigation logic here
    console.log(`Navigating to canvas: ${canvasId}`);
  };

  const renderCellContent = (node: HierarchyNode, column: ColumnData) => {
    if (editingRow === node.id) {
      if (column.type === "Relation") {
        return (
          <Select
            value={editedValues[column.title] || ""}
            onValueChange={(value) => handleEditChange(column.title, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select related canvas" />
            </SelectTrigger>
            <SelectContent>
              {availableCanvases.map((canvas) => (
                <SelectItem key={canvas.id} value={canvas.id}>
                  {canvas.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (column.type === "Rollup") {
        // Rollup values are calculated, not editable
        return node.data[column.title] || "—";
      } else {
        // Existing input rendering for other types
        return (
          <Input
            type={
              column.type === "Number"
                ? "number"
                : column.type === "Date"
                  ? "date"
                  : "text"
            }
            value={editedValues[column.title] || ""}
            onChange={(e) => handleEditChange(column.title, e.target.value)}
            className={
              !validateField(column.type, editedValues[column.title])
                ? "border-red-500"
                : ""
            }
          />
        );
      }
    }

    switch (column.title) {
      case "task":
        return node.data.label || "—";
      case "type":
        return node.data.shape || node.type || "—";
      case "from":
        return node.data.from || "—";
      case "to":
        return node.data.to || "—";
      case "Relation":
        const relatedCanvas = availableCanvases.find(
          (canvas) => canvas.id === node.data[column.title]
        );
        return relatedCanvas ? (
          <Button
            variant="link"
            onClick={() => navigateToCanvas(relatedCanvas.id)}
          >
            {relatedCanvas.name}
          </Button>
        ) : (
          "—"
        );
      case "Rollup":
        return node.data[column.title] || "—";
      default:
        return node.data[column.title] || "—";
    }
  };

  const handleAddConnection = (nodeId: string) => {
    // Implement the logic to add a connection
    // This could open a modal or inline form to select the connection type and target node
    console.log("Add connection for node:", nodeId);
  };

  const handleRemoveConnection = (nodeId: string) => {
    // Implement the logic to remove a connection
    // This could open a modal to select which connection to remove
    console.log("Remove connection for node:", nodeId);
  };

  const handleTableNodesChange = useCallback(
    (updatedNodes: Node[]) => {
      // Check if any nodes were deleted
      const deletedNodeIds = nodes
        .filter((node) => !updatedNodes.some((n) => n.id === node.id))
        .map((node) => node.id);

      if (deletedNodeIds.length > 0) {
        // Remove deleted nodes
        const newNodes = nodes.filter(
          (node) => !deletedNodeIds.includes(node.id)
        );
        onNodesChange(newNodes);
      } else {
        // Update existing nodes or add new nodes
        const newNodes = updatedNodes.map((updatedNode) => {
          const existingNode = nodes.find((node) => node.id === updatedNode.id);
          if (existingNode) {
            // Update existing node
            return {
              ...existingNode,
              data: {
                ...existingNode.data,
                ...updatedNode.data,
                shape: updatedNode.data.shape || existingNode.data.shape,
                from: updatedNode.data.from || existingNode.data.from,
                to: updatedNode.data.to || existingNode.data.to,
              },
              type: updatedNode.type || existingNode.type,
              parentNode: updatedNode.data.parent || existingNode.parentNode,
            };
          } else {
            // Add new node
            return {
              ...updatedNode,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
            };
          }
        });
        onNodesChange(newNodes);
      }
    },
    [nodes, onNodesChange]
  );

  const handleManageConnections = (nodeId: string) => {
    setSelectedNodeForConnections(nodeId);
    setIsManageConnectionsOpen(true);
  };

  const handleCreateConnection = useCallback(
    (sourceId: string, targetId: string) => {
      const existingConnection = edges.find(
        (edge) => edge.source === sourceId || edge.target === sourceId
      );
      if (existingConnection) {
        // If a connection already exists, don't create a new one
        return;
      }

      const newEdge = {
        id: `edge-${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: "custom",
        data: { type: "default", label: "", onLabelChange: onChangeEdgeLabel },
        markerEnd: { type: MarkerType.Arrow },
      };
      const updatedEdges = [...edges, newEdge];
      onEdgesChange(updatedEdges);

      // Update the nodes to reflect the new connection
      const updatedNodes = nodes.map((node) => {
        if (node.id === sourceId) {
          return {
            ...node,
            data: {
              ...node.data,
              to: targetId,
            },
          };
        }
        if (node.id === targetId) {
          return {
            ...node,
            data: {
              ...node.data,
              from: sourceId,
            },
          };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    },
    [edges, onEdgesChange, nodes, onNodesChange, onChangeEdgeLabel]
  );

  const handleDeleteConnection = useCallback(
    (edgeId: string) => {
      const edgeToRemove = edges.find((edge) => edge.id === edgeId);
      if (edgeToRemove) {
        const updatedEdges = edges.filter((edge) => edge.id !== edgeId);
        onEdgesChange(updatedEdges);

        // Update the nodes to reflect the removed connection
        const updatedNodes = nodes.map((node) => {
          if (node.id === edgeToRemove.source) {
            return {
              ...node,
              data: {
                ...node.data,
                to: null,
              },
            };
          }
          if (node.id === edgeToRemove.target) {
            return {
              ...node,
              data: {
                ...node.data,
                from: null,
              },
            };
          }
          return node;
        });
        onNodesChange(updatedNodes);
      }
    },
    [edges, onEdgesChange, nodes, onNodesChange]
  );

  return (
    <div className="p-4 mx-auto">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columnsState
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
            {columnsState.map((column) => (
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
      {/* ManageConnectionsModal Component */}
      <ManageConnectionsModal
        isOpen={isManageConnectionsOpen}
        onClose={() => setIsManageConnectionsOpen(false)}
        selectedNode={nodes.find(
          (node) => node.id === selectedNodeForConnections
        )}
        nodes={nodes}
        edges={edges}
        onCreateConnection={handleCreateConnection}
        onDeleteConnection={handleDeleteConnection}
      />
    </div>
  );
};

export default TableView;

const onChangeEdgeLabel = (edgeId: string, newLabel: string) => {
  //Implementation for updating edge label
  console.log("Edge label changed:", edgeId, newLabel);
};
