"use client";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlignLeft,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Database,
  File,
  FileText,
  Globe,
  Hash,
  Link,
  List,
  Mail,
  MoreHorizontal,
  MoreVertical,
  Phone,
  Plus,
  Type,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import * as z from "zod";
import AddTableCellTrigger from "../canvas/FlowTable/add-table-cell-relation-trigger";
import { AddColumnSidebar, type ColumnData } from "./add-column-sidebar";

const getColumnIcon = (columnType: string) => {
  switch (columnType) {
    case "Text":
      return <Type className="h-4 w-4 mr-2" />;
    case "Long Text":
      return <AlignLeft className="h-4 w-4 mr-2" />;
    case "Number":
      return <Hash className="h-4 w-4 mr-2" />;
    case "Date":
    case "Created Time":
    case "Last edited time":
      return <Calendar className="h-4 w-4 mr-2" />;
    case "Checkbox":
      return <CheckSquare className="h-4 w-4 mr-2" />;
    case "Select":
      return <List className="h-4 w-4 mr-2" />;
    case "Multiselect":
      return <List className="h-4 w-4 mr-2" />;
    case "Email":
      return <Mail className="h-4 w-4 mr-2" />;
    case "Phone Number":
      return <Phone className="h-4 w-4 mr-2" />;
    case "URL":
      return <Globe className="h-4 w-4 mr-2" />;
    case "User":
      return <User className="h-4 w-4 mr-2" />;
    case "Relation":
      return <Link className="h-4 w-4 mr-2" />;
    case "Rollup":
      return <Database className="h-4 w-4 mr-2" />;
    case "Created by":
    case "Last edited by":
      return <User className="h-4 w-4 mr-2" />;
    default:
      return <FileText className="h-4 w-4 mr-2" />;
  }
};

interface TableViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  columns: ColumnData[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnData[]>>;
  onAddColumn: (columnData: ColumnData) => void;
  currentFolderCanvases: { id: string; name: string }[];
  canvasId: string;
  onSave: () => void;
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
  currentFolderCanvases,
  canvasId,
  onSave,
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
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | null>
  >({});

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

  const insertRollupDataIntoNodes = (nodes: Node[]): Node[] => {
    // Early return if no nodes or columns
    if (!nodes.length || !columns.length) return nodes;

    // Filter rollup columns once
    const rollupColumns = columns.filter((col) => col.type === "Rollup");
    if (!rollupColumns.length) return nodes;

    // Get all canvas data in one go and handle potential errors
    const rollupCanvases = rollupColumns
      .map((col) => {
        try {
          const canvas = localStorage.getItem(`canvas_${col.rollupRelation}`);
          if (!canvas) return null;

          const parsedCanvas = JSON.parse(canvas);

          return {
            ...parsedCanvas,
            id: col.rollupRelation,
          };
        } catch (error) {
          console.error(
            `Error processing canvas for column ${col.title}:`,
            error
          );
          return null;
        }
      })
      .filter(Boolean); // Remove null entries

    // If no valid canvases found, return original nodes
    if (!rollupCanvases.length) return nodes;

    // Process all rollup columns in a single pass
    return nodes.map((node, nodeIndex) => {
      const newData = { ...node.data };

      rollupColumns.forEach((column) => {
        const columnCanvas = rollupCanvases.find(
          (canvas) => canvas.id === column.rollupRelation
        );

        if (columnCanvas?.currentState?.nodes?.[nodeIndex]?.data) {
          newData[column.title] =
            columnCanvas.currentState.nodes[nodeIndex].data[
              column.rollupColumn as string
            ];
        }
      });

      return {
        ...node,
        data: newData,
      };
    });
  };

  const sortedHierarchy = useMemo(() => {
    const updatedNodes = insertRollupDataIntoNodes(nodes);

    const hierarchy = createHierarchy(updatedNodes);

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
    onSave();
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
    onSave();
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
      const initialValues = columns.reduce(
        (acc, column) => {
          if (column.title === "task") {
            acc[column.title] = node.data.label;
          } else if (column.title === "type") {
            acc[column.title] = node.data.shape || node.type;
          } else {
            acc[column.title] = node.data[column.title] || "";
          }
          return acc;
        },
        {} as Record<string, any>
      );
      setEditedValues(initialValues);
    }
  };

  const validationSchemas = {
    Email: z.string().email("Invalid email address"),
    "Phone Number": z
      .string()
      .regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number"),
    URL: z.string().url("Invalid URL"),
    Number: z.number().or(z.string().regex(/^-?\d*\.?\d+$/, "Invalid number")),
    Date: z
      .string()
      .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
    Checkbox: z.boolean(),
    Text: z.string(),
    "Long Text": z.string(),
    Select: z.string(),
    Multiselect: z
      .array(z.string())
      .min(1, "At least one option must be selected"),
    "Created Time": z
      .string()
      .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
    "Created by": z.string(),
    "Last edited time": z
      .string()
      .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
    "Last edited by": z.string(),
    User: z.string(),
    Relation: z.array(z.record(z.any())),
    Rollup: z.string().nullable(),
  };

  const validateField = (
    type: string,
    value: any
  ): { isValid: boolean; errorMessage: string | null } => {
    const schema =
      validationSchemas[type as keyof typeof validationSchemas] || z.string();
    let result;
    if (type === "Multiselect") {
      result = schema.safeParse(
        Array.isArray(value) ? value : [value].filter(Boolean)
      );
    } else if (type === "Checkbox") {
      result = schema.safeParse(value === true);
    } else if (
      type === "Date" ||
      type === "Created Time" ||
      type === "Last edited time"
    ) {
      // Improved date and time validation
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, errorMessage: "Invalid date or time" };
      }
      result = schema.safeParse(dateValue.toISOString());
    } else {
      result = schema.safeParse(value);
    }
    return {
      isValid: result.success,
      errorMessage: result.success ? null : result.error.errors[0].message,
    };
  };

  const handleEditChange = (field: string, value: string | any[]) => {
    const column = columns.find((col) => col.title === field);
    if (column) {
      const { isValid, errorMessage } = validateField(column.type, value);
      setEditedValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      setValidationErrors((prev) => ({
        ...prev,
        [field]: errorMessage,
      }));
    }
  };

  const handleSaveEdit = () => {
    if (editingRow) {
      const isValid = Object.entries(editedValues).every(([key, value]) => {
        const column = columns.find((col) => col.title === key);
        return column ? validateField(column.type, value).isValid : true;
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
        setValidationErrors({});
        onSave();
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
    return ["task", "type"].includes(columnTitle);
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
    onSave();
  };

  const handleDeleteColumn = (columnTitle: string) => {
    setColumns(columns.filter((col) => col.title !== columnTitle));
    const updatedNodes = nodes.map((node) => {
      const newData = { ...node.data };
      delete newData[columnTitle];
      return { ...node, data: newData };
    });
    onNodesChange(updatedNodes);
    setDeleteColumnDialog(null);
    onSave();
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
      onSave();
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

  const getRelatedCanvasNodes = (canvasId: string) => {
    const savedCanvas = localStorage.getItem(`canvas_${canvasId}`);

    if (savedCanvas) {
      const canvasData = JSON.parse(savedCanvas);

      const columnsData = canvasData?.currentState?.nodes?.map((node: Node) => {
        return { ...node.data, id: node.id };
      });

      const canvasDetails = {
        canvasName: canvasData?.projectName,
        columns: columnsData,
      };

      return canvasDetails;
    }

    return null;
  };

  const getRelatedCanvasesWithColumns = useCallback(() => {
    const currentCanvasDetails = localStorage.getItem(`canvas_${canvasId}`);
    if (!currentCanvasDetails) return [];

    const { columns = [] } = JSON.parse(currentCanvasDetails);
    const relationColumns = columns.filter(
      (col: any) => col.type === "Relation"
    );

    const uniqueCanvasIds = new Set(
      relationColumns.map(({ relationCanvas }: any) => relationCanvas)
    );

    return Array.from(uniqueCanvasIds).flatMap((relationCanvas) => {
      const canvasDetails = localStorage.getItem(`canvas_${relationCanvas}`);
      if (!canvasDetails) return [];

      const { projectName, columns } = JSON.parse(canvasDetails);

      return { canvasName: projectName, columns, id: relationCanvas };
    });
  }, [canvasId]);

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

                {editingRow === node.id && column.title !== "id" ? (
                  <div>
                    {column.type === "Select" ? (
                      <Select
                        value={editedValues[column.title] || "default"}
                        onValueChange={(value) =>
                          handleEditChange(column.title, value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {column.options?.map((option) => (
                            <SelectItem
                              key={option}
                              value={option || "default"}
                            >
                              {option || "Default"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : column.type === "Multiselect" ? (
                      <MultiSelect
                        options={(column.options || []).map((option) => ({
                          label: option,
                          value: option,
                        }))}
                        selected={editedValues[column.title] || []}
                        onChange={(selected) =>
                          handleEditChange(column.title, selected)
                        }
                      />
                    ) : column.type === "Checkbox" ? (
                      <Switch
                        checked={editedValues[column.title] === true}
                        onCheckedChange={(checked) => {
                          // @ts-ignore
                          handleEditChange(column.title, checked);
                        }}
                      />
                    ) : column.type === "Date" ||
                      column.type === "Created Time" ||
                      column.type === "Last edited time" ? (
                      <Input
                        type="datetime-local"
                        value={
                          editedValues[column.title]
                            ? new Date(editedValues[column.title])
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          handleEditChange(column.title, e.target.value)
                        }
                        className={
                          validationErrors[column.title] ? "border-red-500" : ""
                        }
                      />
                    ) : column.type === "Long Text" ? (
                      <Textarea
                        value={editedValues[column.title] || ""}
                        onChange={(e) =>
                          handleEditChange(column.title, e.target.value)
                        }
                        className={
                          validationErrors[column.title] ? "border-red-500" : ""
                        }
                      />
                    ) : column.type === "Relation" ? (
                      <>
                        {" "}
                        <AddTableCellTrigger
                          value={
                            Array.isArray(editedValues[column.title])
                              ? editedValues[column.title]
                              : []
                          }
                          label="Testing"
                          relatedCanvasData={getRelatedCanvasNodes(
                            column?.relationCanvas as string
                          )}
                          onSelectValue={(value) => {
                            handleEditChange(column.title, value);
                          }}
                        />
                      </>
                    ) : (
                      <Input
                        type={column.type === "Number" ? "number" : "text"}
                        value={editedValues[column.title] || ""}
                        onChange={(e) =>
                          handleEditChange(column.title, e.target.value)
                        }
                        className={
                          validationErrors[column.title] ? "border-red-500" : ""
                        }
                      />
                    )}
                    {validationErrors[column.title] && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors[column.title]}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {column.title === "task" && node.data.label}
                    {column.title === "type" && (node.data.shape || node.type)}
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
                          !isNaN(
                            new Date(node.data[column.title]).getTime()
                          ) ? (
                            new Date(node.data[column.title]).toLocaleString()
                          ) : (
                            "—"
                          )
                        ) : column.type === "Long Text" ? (
                          <div className="max-w-[300px] max-h-[4.5em] overflow-hidden">
                            <p className="line-clamp-3">
                              {node.data[column.title] || "—"}
                            </p>
                          </div>
                        ) : column.type === "Relation" ? (
                          <>
                            {node.data[column.title] &&
                            node.data[column.title].length > 0 ? (
                              <div className="flex flex-wrap max-w-full">
                                {node.data[column.title]?.map((item: any) => (
                                  <p className="text-sm text-gray-600 flex mr-3 ">
                                    <File className="h-4 w-4" /> {item.label}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </>
                        ) : Array.isArray(node.data[column.title]) ? (
                          node.data[column.title].join(", ")
                        ) : (
                          node.data[column.title] || "—"
                        )}
                      </>
                    )}
                  </>
                )}
              </TableCell>
            ))}
          <TableCell className="text-right sticky right-0 bg-white z-10">
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

  const startEditingColumnTitle = (columnTitle: string) => {
    setEditingColumnTitle(columnTitle);
    setNewColumnTitle(columnTitle);
  };

  return (
    <div className="p-4 mx-auto">
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns
                    .filter(
                      (column) =>
                        !hiddenColumns.has(column.title) &&
                        column.title !== "id"
                    )
                    .map((column) => (
                      <TableHead
                        key={column.title}
                        className={`group ${frozenColumns.has(column.title) ? "sticky left-0 bg-white z-10" : ""}`}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            disabled={editingColumnTitle === column.title}
                          >
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={(e) => {
                                if (editingColumnTitle === column.title) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            >
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
                                <div className="flex items-center">
                                  {getColumnIcon(column.type)}
                                  <span>{column.title}</span>
                                  {getSortIcon(column.title as SortField)}
                                </div>
                              )}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem
                              onSelect={() =>
                                startEditingColumnTitle(column.title)
                              }
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
                              onClick={() =>
                                handleDuplicateColumn(column.title)
                              }
                            >
                              Duplicate property
                            </DropdownMenuItem>
                            {!isDefaultColumn(column.title) && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setDeleteColumnDialog(column.title)
                                }
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
                  <TableHead className="w-[100px] text-right sticky right-0 bg-white z-10">
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
          </div>
        </div>
        <div className="p-4 border-t sticky bottom-0 bg-white">
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
                    <SelectItem key={shape} value={shape || "default"}>
                      {shape || "Default"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedParentId || "no-parent"}
                onValueChange={setSelectedParentId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-parent">No parent</SelectItem>
                  {nodes.map((node) => (
                    <SelectItem
                      key={node.id}
                      value={node.id || `node-${node.id}`}
                    >
                      {node.data.label || `Node ${node.id}`}
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
        canvases={currentFolderCanvases}
        canvasId={canvasId}
        relationCanvases={getRelatedCanvasesWithColumns()}
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
