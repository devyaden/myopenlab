"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCanvasStore } from "@/lib/store/useCanvas";
import {
  CalendarIcon,
  Check,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  File,
  Flag,
  ListTodo,
  MoreHorizontal,
  Plus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import type { Node } from "reactflow";

// Add import for AlertDialog components
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

// Import DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import Calendar components
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_SHAPES } from "@/lib/types/flow-table.types";
import { format } from "date-fns";

interface NodePropertiesSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
  columns: any[];
  setColumns: (val: any) => void;
  edges: any[];
  nodes: any[];
}

type PropertyType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "color"
  | "url"
  | "longtext"
  | "multiselect"
  | "email"
  | "relation"
  | "rollup";

interface Property {
  name: string;
  value: any;
  type: PropertyType;
  options?: string[];
  isEditable?: boolean;
  dataKey?: string;
  columnType?: string; // Store the original column type
}

// Helper functions for column data mapping (same as table)
const getDataKey = (column: any): string => {
  return column.dataKey || column.title;
};

const isSpecialColumn = (column: any): boolean => {
  const dataKey = getDataKey(column);
  return ["label", "shape", "id"].includes(dataKey);
};

const getNodeValue = (node: Node, column: any): any => {
  const dataKey = getDataKey(column);

  switch (dataKey) {
    case "label":
      return node.data?.label;
    case "shape":
      return node.data?.shape;
    case "id":
      return node.id;
    default:
      return node.data?.[column.title];
  }
};

const updateNodeValue = (node: Node, column: any, value: any): any => {
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
      // ID should not be editable
      break;
    default:
      updatedData[column.title] = value;
  }

  return updatedData;
};

// List of system properties that should not be editable
// Note: Relation and Rollup properties are also made non-editable via type check
const NON_EDITABLE_PROPERTIES = ["id"];

// Shape options for the type property
const SHAPE_OPTIONS = ALL_SHAPES.filter((shape) => shape !== "swimlane");

// Get icon for property type
const getPropertyIcon = (propertyName: string, propertyType: PropertyType) => {
  const name = propertyName.toLowerCase();

  if (name === "status" || name.includes("status"))
    return <ListTodo className="h-4 w-4 text-gray-500" />;
  if (name === "priority" || name.includes("priority"))
    return <Flag className="h-4 w-4 text-gray-500" />;
  if (name === "assign" || name.includes("assign") || name === "assignee")
    return <Users className="h-4 w-4 text-gray-500" />;
  if (name === "date" || name.includes("date") || name === "due")
    return <CalendarIcon className="h-4 w-4 text-gray-500" />;
  if (name === "created" || name.includes("created"))
    return <Clock className="h-4 w-4 text-gray-500" />;
  if (name === "sprint" || name.includes("sprint"))
    return <ListTodo className="h-4 w-4 text-gray-500" />;
  if (name === "day" || name.includes("day"))
    return <CalendarIcon className="h-4 w-4 text-gray-500" />;

  // Default icons based on type
  switch (propertyType) {
    case "date":
      return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    case "checkbox":
      return <Check className="h-4 w-4 text-gray-500" />;
    case "select":
    case "multiselect":
      return <ListTodo className="h-4 w-4 text-gray-500" />;
    case "relation":
      return <Users className="h-4 w-4 text-gray-500" />;
    case "rollup":
      return <ListTodo className="h-4 w-4 text-gray-500" />;
    default:
      return <ListTodo className="h-4 w-4 text-gray-500" />;
  }
};

// Get background color for property value based on property name and value
const getPropertyValueStyle = (propertyName: string, value: any) => {
  const name = propertyName.toLowerCase();

  // Status
  if (name === "status" || name.includes("status")) {
    if (typeof value === "string") {
      const valueLower = value.toLowerCase();
      if (valueLower.includes("not") || valueLower.includes("todo"))
        return {
          backgroundColor: "#fecaca",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
      if (valueLower.includes("progress") || valueLower.includes("doing"))
        return {
          backgroundColor: "#bfdbfe",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
      if (valueLower.includes("complete") || valueLower.includes("done"))
        return {
          backgroundColor: "#bbf7d0",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
      if (valueLower.includes("block") || valueLower.includes("hold"))
        return {
          backgroundColor: "#fed7aa",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
    }
  }

  // Priority
  if (name === "priority" || name.includes("priority")) {
    if (typeof value === "string") {
      const valueLower = value.toLowerCase();
      if (valueLower.includes("low"))
        return {
          backgroundColor: "#dbeafe",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
      if (valueLower.includes("medium") || valueLower.includes("med"))
        return {
          backgroundColor: "#fef3c7",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
      if (valueLower.includes("high"))
        return {
          backgroundColor: "#fee2e2",
          borderRadius: "1rem",
          padding: "2px 8px",
          display: "inline-block",
        };
    }
  }

  // Sprint or tags
  if (
    name === "sprint" ||
    name.includes("sprint") ||
    name === "tag" ||
    name.includes("tag")
  ) {
    return {
      backgroundColor: "#e5e7eb",
      borderRadius: "1rem",
      padding: "2px 8px",
      display: "inline-block",
    };
  }

  // Day
  if (name === "day" || name.includes("day")) {
    return {
      backgroundColor: "#fef3c7",
      borderRadius: "1rem",
      padding: "2px 8px",
      display: "inline-block",
    };
  }

  return {};
};

export function NodePropertiesSidebar({
  selectedNode,
  onClose,
  columns,
  setColumns,
  edges,
  nodes,
}: NodePropertiesSidebarProps) {
  const [title, setTitle] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [editingOptions, setEditingOptions] = useState<{
    propertyName: string;
    options: string[];
  } | null>(null);
  const [newOption, setNewOption] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [editingPropertyName, setEditingPropertyName] = useState<number | null>(
    null
  );

  const [editingPropertyValue, setEditingPropertyValue] = useState<
    number | null
  >(null);

  const [tempPropertyName, setTempPropertyName] = useState("");
  const [tempPropertyValue, setTempPropertyValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // State for new property options
  const [newPropertyOptions, setNewPropertyOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    propertyIndex: number;
    propertyName: string;
  } | null>(null);

  // Refs for handling click outside
  const propertyNameInputRef = useRef<HTMLInputElement>(null);
  const propertyValueInputRef = useRef<HTMLInputElement>(null);

  // Get canvas store for accessing canvasSettings and updateCanvasSettings
  const { canvasSettings, updateCanvasSettings } = useCanvasStore();

  // Get hidden columns from canvas settings (same logic as table) - memoized to prevent infinite re-renders
  const hiddenColumns = useMemo(() => {
    return canvasSettings?.table_settings?.hiddenColumns || [];
  }, [canvasSettings?.table_settings?.hiddenColumns]);

  // Add cache for rollup and relation data (same as table view)
  const [rollupCache, setRollupCache] = useState<{ [key: string]: any }>({});
  const [relationCache, setRelationCache] = useState<{ [key: string]: any }>(
    {}
  );

  // Function to populate from and to connections (same as table view)
  const populateFromAndTo = () => {
    if (!selectedNode) {
      return { fromLabels: [], toLabels: [] };
    }

    const from = edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => edge.source);

    const to = edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => edge.target);

    const fromLabels = from.map((id) => {
      const node = nodes.find((node) => node.id === id);
      return node
        ? { id: node.id, label: node.data.label || node.id }
        : { id, label: id };
    });

    const toLabels = to.map((id) => {
      const node = nodes.find((node) => node.id === id);
      return node
        ? { id: node.id, label: node.data.label || node.id }
        : { id, label: id };
    });

    return {
      fromLabels: fromLabels || [],
      toLabels: toLabels || [],
    };
  };

  // Update rollup cache when relevant data changes (EXACT same logic as table view)
  useEffect(() => {
    console.log("Building rollup cache...", {
      selectedNode: selectedNode?.id,
      columnsCount: columns?.length,
    });

    const newRollupCache: Record<string, any> = {};
    const newRelationCache: Record<string, any> = {};

    // Process rollup columns
    const rollupColumns = columns?.filter((col) => col?.type === "Rollup");
    console.log(
      "Found rollup columns:",
      rollupColumns?.map((c) => c.title)
    );

    if (rollupColumns?.length) {
      // Create a map of relation columns to easily lookup by related canvas ID
      const relationColumns = columns?.filter(
        (col) => col?.type === "Relation" && col.related_canvas_id
      );

      const relationColumnMap = new Map(
        relationColumns.map((col) => [col.related_canvas_id, col])
      );

      nodes.forEach((node) => {
        relationColumns.forEach((column) => {
          const relationData = node.data[column.title];

          if (relationData) {
            const relationArray = Array.isArray(relationData)
              ? relationData
              : [relationData];
            newRelationCache[`${node.id}-${column.title}`] = relationArray;
          } else {
            newRelationCache[`${node.id}-${column.title}`] = [];
          }
        });

        rollupColumns.forEach((column) => {
          const relatedCanvasId = column?.rollup_column?.canvas?.id;

          if (!relatedCanvasId) {
            console.log(
              `No related canvas ID for rollup column ${column.title}`
            );
            return;
          }

          const relationColumn = relationColumnMap.get(relatedCanvasId);

          if (!relationColumn) {
            console.log(
              `No relation column found for canvas ${relatedCanvasId}`
            );
            return;
          }

          // Get relation data from the node
          const relationData = node.data[relationColumn.title];

          if (
            !relationData ||
            !Array.isArray(relationData) ||
            relationData.length === 0
          ) {
            newRollupCache[`${node.id}-${column.title}`] = [];
            return;
          }

          // Get the target column to rollup
          const rollupColumnTargetTitle = column?.rollup_column?.title;

          if (!rollupColumnTargetTitle) {
            console.log(`No target column title for rollup ${column.title}`);
            return;
          }

          // Get the related canvas data from the relation column
          const relatedCanvas = relationColumn.related_canvas;

          const relatedCanvasNodes =
            relatedCanvas?.canvas_data?.[0]?.nodes ??
            relatedCanvas?.canvas_data?.nodes ??
            [];

          // Extract IDs from relation data
          const relationIds = relationData.map((item) => item.id);

          // Create a set for faster lookups
          const relationIdSet = new Set(relationIds);

          // Filter related nodes that match the relation IDs
          const matchingRelatedNodes = relatedCanvasNodes.filter(
            (relNode: Node) => relationIdSet.has(relNode.id)
          );

          const rollupData = matchingRelatedNodes.map((relNode: Node) => {
            if (rollupColumnTargetTitle === "type") {
              return {
                label: relNode.data.shape || relNode.id,
                value: relNode.data.shape || relNode.id,
                sourceId: relNode.id,
              };
            }

            if (rollupColumnTargetTitle === "task") {
              return {
                label: relNode.data.label || relNode.id,
                value: relNode.data.label || relNode.id,
                sourceId: relNode.id,
              };
            }

            const value = relNode.data[rollupColumnTargetTitle];

            return {
              label: relNode.data.label || relNode.id,
              value: value,
              sourceId: relNode.id,
            };
          });

          // Store in cache
          console.log(
            `Setting rollup data for ${node.id}-${column.title}:`,
            rollupData
          );
          newRollupCache[`${node.id}-${column.title}`] = rollupData;
        });
      });
    }

    // Set both caches with the new data
    console.log("Final rollup cache:", newRollupCache);
    setRollupCache(newRollupCache);
    setRelationCache(newRelationCache);
  }, [nodes, columns]);

  // Helper function to map column types to property types
  const mapColumnTypeToPropertyType = (columnType: string): PropertyType => {
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

  // Helper function to map property types to column types
  const mapPropertyTypeToColumnType = (propType: PropertyType): string => {
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

  // Find the task column (used for title)
  const getTaskColumn = () => {
    return (
      columns.find((col) => getDataKey(col) === "label") ||
      columns.find((col) => col.title === "task")
    );
  };

  // Load node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      // Get title from task column (same logic as table)
      const taskColumn = getTaskColumn();
      const taskValue = taskColumn
        ? getNodeValue(selectedNode, taskColumn)
        : selectedNode.data?.label;
      setTitle(taskValue || "");

      const nodeProperties: Property[] = [];

      // Get all columns except "id" and the task column (to avoid duplication with title)
      const availableColumns = columns.filter(
        (column) =>
          column.title !== "id" && // Exclude id column
          !(taskColumn && column.title === taskColumn.title) // Exclude task column since it's shown as title
      );

      // Add properties based on all available columns
      availableColumns.forEach((column) => {
        // Get the actual value using dataKey mapping and cache data
        let actualValue = getNodeValue(selectedNode, column);

        // Override with cache data for rollup and relation columns
        if (column.type === "Rollup") {
          const rollupKey = `${selectedNode.id}-${column.title}`;
          actualValue = rollupCache[rollupKey] || [];
          // Debug: Log rollup data
          console.log(
            `Rollup data for ${column.title}:`,
            actualValue,
            "Cache key:",
            rollupKey,
            "Full cache:",
            rollupCache
          );
        } else if (column.type === "Relation") {
          actualValue =
            relationCache[`${selectedNode.id}-${column.title}`] ||
            selectedNode.data[column.title] ||
            [];
        }

        // Determine if property is editable
        // Exclude: system properties (id), relation columns, and rollup columns
        const isEditable =
          !NON_EDITABLE_PROPERTIES.includes(column.title) &&
          column.type !== "Relation" &&
          column.type !== "Rollup";

        // Determine property type
        let propertyType: PropertyType = mapColumnTypeToPropertyType(
          column.type || "Text"
        );

        // Special handling for shape column (type)
        if (getDataKey(column) === "shape") {
          propertyType = "select";
        }

        // Add the property
        nodeProperties.push({
          name: column.title,
          value: actualValue,
          type: propertyType,
          options:
            column.type === "Select" && getDataKey(column) === "shape"
              ? SHAPE_OPTIONS
              : column.options,
          isEditable,
          dataKey: getDataKey(column),
          columnType: column.type,
        });
      });

      // Add connection-based properties (from/to) - same as table view
      const { fromLabels, toLabels } = populateFromAndTo();

      // Add "from" property if there are incoming connections
      if (
        fromLabels.length > 0 ||
        columns.some((col) => col.title === "from")
      ) {
        nodeProperties.push({
          name: "from",
          value: fromLabels,
          type: "relation",
          isEditable: false,
          dataKey: "from",
          columnType: "Relation",
        });
      }

      // Add "to" property if there are outgoing connections
      if (toLabels.length > 0 || columns.some((col) => col.title === "to")) {
        nodeProperties.push({
          name: "to",
          value: toLabels,
          type: "relation",
          isEditable: false,
          dataKey: "to",
          columnType: "Relation",
        });
      }

      setProperties(nodeProperties);
    }
  }, [
    selectedNode,
    columns,
    hiddenColumns,
    rollupCache,
    relationCache,
    edges,
    nodes,
  ]);

  // Handle click outside for property name editing
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        editingPropertyName !== null &&
        propertyNameInputRef.current &&
        !propertyNameInputRef.current.contains(event.target as any)
      ) {
        handleUpdatePropertyName(editingPropertyName, tempPropertyName);
        setEditingPropertyName(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingPropertyName, tempPropertyName]);

  // Handle click outside for property value editing
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editingPropertyValue !== null) {
        const property = properties[editingPropertyValue];

        // Skip click outside for multiselect and color - they have their own save buttons
        if (property?.type === "multiselect" || property?.type === "color") {
          return;
        }

        if (
          propertyValueInputRef.current &&
          !propertyValueInputRef.current.contains(event.target as any)
        ) {
          if (
            property?.type === "text" ||
            property?.type === "longtext" ||
            property?.type === "url" ||
            property?.type === "email" ||
            property?.type === "number"
          ) {
            handleUpdatePropertyValue(
              editingPropertyValue,
              property?.type === "number"
                ? Number(tempPropertyValue)
                : tempPropertyValue
            );
          }
          setEditingPropertyValue(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingPropertyValue, tempPropertyValue, properties]);

  // Validate property value based on type
  const validatePropertyValue = (
    value: any,
    type: PropertyType
  ): string | null => {
    if (value === undefined || value === null || value === "") {
      return null; // Empty values are allowed
    }

    switch (type) {
      case "number":
        if (isNaN(Number(value))) {
          return "Must be a valid number";
        }
        break;
      case "url":
        try {
          new URL(value);
        } catch (e) {
          return "Must be a valid URL";
        }
        break;
      case "date":
        if (isNaN(Date.parse(value))) {
          return "Must be a valid date";
        }
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) {
          return "Must be a valid email";
        }
        break;
    }
    return null;
  };

  const handleSaveTitle = () => {
    if (!selectedNode) return;

    const taskColumn = getTaskColumn();
    if (taskColumn) {
      // Update node data with new title using the task column
      const updatedData = updateNodeValue(selectedNode, taskColumn, title);

      // Update node in store
      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    }
  };

  const handleAddProperty = () => {
    if (!selectedNode || !newPropertyName.trim()) return;

    // Check for duplicate property name
    if (properties.some((prop) => prop.name === newPropertyName)) {
      setValidationErrors({
        ...validationErrors,
        newProperty: "A property with this name already exists",
      });
      return;
    }

    // Clear validation error if it exists
    if (validationErrors.newProperty) {
      const { newProperty, ...rest } = validationErrors;
      setValidationErrors(rest);
    }

    // Create default value based on type
    let defaultValue: any = "";
    switch (newPropertyType) {
      case "checkbox":
        defaultValue = false;
        break;
      case "number":
        defaultValue = 0;
        break;
      case "multiselect":
        defaultValue = [];
        break;
      case "date":
        defaultValue = new Date().toISOString();
        break;
      default:
        defaultValue = "";
    }

    // Create new property with dataKey
    const newProperty: Property = {
      name: newPropertyName,
      value: defaultValue,
      type: newPropertyType,
      options:
        newPropertyType === "select" || newPropertyType === "multiselect"
          ? [...newPropertyOptions]
          : undefined,
      isEditable: true,
      dataKey: newPropertyName,
      columnType: mapPropertyTypeToColumnType(newPropertyType),
    };

    // Update properties state
    const updatedProperties = [...properties, newProperty];
    setProperties(updatedProperties);

    // Find matching column
    const matchingColumn = columns.find(
      (col) => col.title === newProperty.name
    );

    if (matchingColumn) {
      // Update existing column data
      const updatedData = updateNodeValue(
        selectedNode,
        matchingColumn,
        newProperty.value
      );

      // Update node in store
      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    } else {
      // Add new column to table columns
      const newColumn = {
        title: newProperty.name,
        type: mapPropertyTypeToColumnType(newPropertyType),
        options: newProperty.options,
        dataKey: newProperty.name,
      };

      setColumns([...columns, newColumn]);

      // Update node data
      const updatedData = { ...selectedNode.data };
      updatedData[newProperty.name] = newProperty.value;

      // Update node in store
      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    }

    // Reset form
    setNewPropertyName("");
    setShowPropertyTypeSelect(false);
    setNewPropertyOptions([]);
    setNewOptionInput("");
  };

  const handleUpdatePropertyName = (index: number, newName: string) => {
    if (!selectedNode) return;

    const property = properties[index];
    const oldName = property.name;

    // Don't update if name hasn't changed
    if (oldName === newName) return;

    // Check for duplicate property name
    if (properties.some((prop) => prop.name === newName)) {
      setValidationErrors({
        ...validationErrors,
        [oldName]: "A property with this name already exists",
      });
      return;
    }

    // Clear validation error if it exists
    if (validationErrors[oldName]) {
      const { [oldName]: _, ...rest } = validationErrors;
      setValidationErrors(rest);
    }

    // Update properties state
    const updatedProperties = [...properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      name: newName,
    };
    setProperties(updatedProperties);

    // Find the column for this property
    const matchingColumn = columns.find((col) => col.title === oldName);

    if (matchingColumn) {
      // Update column title
      const updatedColumns = columns.map((col) =>
        col.title === oldName
          ? {
              ...col,
              title: newName,
              dataKey: isSpecialColumn(col) ? col.dataKey : newName,
            }
          : col
      );
      setColumns(updatedColumns);

      // For regular properties (not special ones), update node data
      if (!isSpecialColumn(matchingColumn)) {
        const updatedData = { ...selectedNode.data };
        updatedData[newName] = updatedData[oldName];
        delete updatedData[oldName];

        // Update node in store
        const updatedNodes = useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          );

        useCanvasStore.getState().setNodes(updatedNodes);
      }
    }

    // Update hidden columns if needed
    if (hiddenColumns.includes(oldName)) {
      const updatedHiddenColumns = hiddenColumns.filter(
        (col: string) => col !== oldName
      );
      updatedHiddenColumns.push(newName);

      updateCanvasSettings({
        ...canvasSettings,
        table_settings: {
          ...canvasSettings.table_settings,
          hiddenColumns: updatedHiddenColumns,
        },
      });
    }
  };

  const handleUpdatePropertyValue = (index: number, value: any) => {
    if (!selectedNode) return;

    const property = properties[index];

    // Validate the value
    const error = validatePropertyValue(value, property?.type);
    if (error) {
      setValidationErrors({
        ...validationErrors,
        [property.name]: error,
      });
      return;
    }

    // Clear validation error if it exists
    if (validationErrors[property.name]) {
      const { [property.name]: _, ...rest } = validationErrors;
      setValidationErrors(rest);
    }

    // Update properties state
    const updatedProperties = [...properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      value,
    };
    setProperties(updatedProperties);

    // Find the matching column
    const matchingColumn = columns.find((col) => col.title === property.name);

    if (matchingColumn) {
      // Update node data using column
      const updatedData = updateNodeValue(selectedNode, matchingColumn, value);

      // Update node in store
      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    }
  };

  const handleRemoveProperty = (index: number) => {
    const propertyToRemove = properties[index];

    // Check if property is deletable
    if (!propertyToRemove.isEditable) {
      return;
    }

    // Open confirmation dialog
    setDeleteConfirmation({
      open: true,
      propertyIndex: index,
      propertyName: propertyToRemove.name,
    });
  };

  const confirmDeleteProperty = () => {
    if (!deleteConfirmation || !selectedNode) return;

    const propertyName = deleteConfirmation.propertyName;
    const index = deleteConfirmation.propertyIndex;

    // Update properties state
    const updatedProperties = properties.filter((_, i) => i !== index);
    setProperties(updatedProperties);

    // Remove from columns array
    const updatedColumns = columns.filter((col) => col.title !== propertyName);
    setColumns(updatedColumns);

    // Update all nodes in the store to remove this property
    const allNodes = useCanvasStore.getState().nodes;
    const updatedNodes = allNodes.map((node) => {
      const updatedData = { ...node.data };
      delete updatedData[propertyName];
      return { ...node, data: updatedData };
    });

    useCanvasStore.getState().setNodes(updatedNodes);

    // Remove property from hiddenColumns if it exists
    if (hiddenColumns.includes(propertyName)) {
      const updatedHiddenColumns = hiddenColumns.filter(
        (col: string) => col !== propertyName
      );

      updateCanvasSettings({
        ...canvasSettings,
        table_settings: {
          ...canvasSettings.table_settings,
          hiddenColumns: updatedHiddenColumns,
        },
      });
    }

    setDeleteConfirmation(null);
  };

  const handleToggleVisibility = (index: number) => {
    if (!selectedNode) return;

    const property = properties[index];
    const isCurrentlyHidden = hiddenColumns.includes(
      property.dataKey || property.name
    );

    // Update hiddenColumns array
    let updatedHiddenColumns;
    if (isCurrentlyHidden) {
      // Show the column by removing it from hiddenColumns
      updatedHiddenColumns = hiddenColumns.filter(
        (col: string) => col !== (property.dataKey || property.name)
      );
    } else {
      // Hide the column by adding it to hiddenColumns
      updatedHiddenColumns = [
        ...hiddenColumns,
        property.dataKey || property.name,
      ];
    }

    updateCanvasSettings({
      ...canvasSettings,
      table_settings: {
        ...canvasSettings.table_settings,
        hiddenColumns: updatedHiddenColumns,
      },
    });
  };

  const handleAddOption = () => {
    if (!editingOptions || !newOption.trim()) return;

    const updatedOptions = [...editingOptions.options, newOption.trim()];
    setNewOption("");

    // Update the property with new options
    const propertyIndex = properties.findIndex(
      (p) => p.name === editingOptions.propertyName
    );
    if (propertyIndex === -1) return;

    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...updatedProperties[propertyIndex],
      options: updatedOptions,
    };
    setProperties(updatedProperties);
    setEditingOptions({ ...editingOptions, options: updatedOptions });

    // Update column options
    const columnIndex = columns.findIndex(
      (col) => col.title === editingOptions.propertyName
    );
    if (columnIndex !== -1) {
      const updatedColumns = [...columns];
      updatedColumns[columnIndex] = {
        ...updatedColumns[columnIndex],
        options: updatedOptions,
      };
      setColumns(updatedColumns);
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (!editingOptions) return;

    const updatedOptions = editingOptions.options.filter(
      (_, i) => i !== optionIndex
    );
    setEditingOptions({ ...editingOptions, options: updatedOptions });

    // Update the property with new options
    const propertyIndex = properties.findIndex(
      (p) => p.name === editingOptions.propertyName
    );
    if (propertyIndex === -1) return;

    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...updatedProperties[propertyIndex],
      options: updatedOptions,
    };
    setProperties(updatedProperties);

    // Update column options
    const columnIndex = columns.findIndex(
      (col) => col.title === editingOptions.propertyName
    );
    if (columnIndex !== -1) {
      const updatedColumns = [...columns];
      updatedColumns[columnIndex] = {
        ...updatedColumns[columnIndex],
        options: updatedOptions,
      };
      setColumns(updatedColumns);
    }
  };

  const handleDuplicateProperty = (index: number) => {
    if (!selectedNode) return;

    const propertyToDuplicate = properties[index];

    // Only allow duplication of editable properties
    if (!propertyToDuplicate.isEditable) {
      return;
    }

    const newName = `${propertyToDuplicate.name} copy`;

    // Check for duplicate property name
    if (properties.some((prop) => prop.name === newName)) {
      setValidationErrors({
        ...validationErrors,
        [propertyToDuplicate.name]: "A property with this name already exists",
      });
      return;
    }

    // Create new property
    const newProperty: Property = {
      ...propertyToDuplicate,
      name: newName,
      dataKey: newName,
    };

    // Update properties state
    const updatedProperties = [...properties];
    updatedProperties.splice(index + 1, 0, newProperty);
    setProperties(updatedProperties);

    // Add new column to table columns
    const newColumn = {
      title: newProperty.name,
      type:
        newProperty.columnType || mapPropertyTypeToColumnType(newProperty.type),
      options: newProperty.options,
      dataKey: newProperty.name,
    };

    setColumns([...columns, newColumn]);

    // Update node data
    const originalValue = newProperty.value;
    const updatedData = { ...selectedNode.data };
    updatedData[newProperty.name] = originalValue;

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
  };

  const startEditingPropertyName = (index: number) => {
    setEditingPropertyName(index);
    setTempPropertyName(properties[index].name);
  };

  const startEditingPropertyValue = (index: number) => {
    if (!properties[index].isEditable) return;

    setEditingPropertyValue(index);

    const property = properties[index];

    switch (property?.type) {
      case "text":
      case "url":
      case "email":
        setTempPropertyValue(
          property.value !== undefined && property.value !== null
            ? String(property.value)
            : ""
        );
        break;
      case "longtext":
        setTempPropertyValue(
          property.value !== undefined && property.value !== null
            ? String(property.value)
            : ""
        );
        break;
      case "number":
        setTempPropertyValue(
          property.value !== undefined && property.value !== null
            ? String(property.value)
            : "0"
        );
        break;
      case "date":
        if (property.value) {
          setSelectedDate(new Date(property.value));
        } else {
          setSelectedDate(new Date());
        }
        break;
      case "color":
        setTempPropertyValue(property.value || "#09BC8A");
        break;
    }
  };

  // Helper function to check if a property is hidden
  const isPropertyHidden = (property: Property): boolean => {
    return hiddenColumns.includes(property.dataKey || property.name);
  };

  // Render property value with inline editing
  const renderPropertyValue = (property: Property, index: number) => {
    const valueStyle = getPropertyValueStyle(property.name, property.value);

    // If property is not editable, just display the value with special styling
    if (!property.isEditable) {
      return (
        <div className="px-2 py-1 text-gray-500 italic bg-gray-50 rounded border-l-2 border-gray-300">
          {property.type === "rollup" ? (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(property.value) && property.value.length > 0 ? (
                property.value.map((item: any, itemIndex: number) => (
                  <span
                    key={itemIndex}
                    className="text-xs text-gray-600 bg-gray-200 rounded-md px-2 py-1"
                    title={`From: ${item.label || "Unknown source"}`}
                  >
                    {typeof item === "object" && item !== null
                      ? item.value !== undefined
                        ? String(item.value)
                        : item.label || String(item)
                      : String(item)}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No rollup data</span>
              )}
            </div>
          ) : property.type === "relation" ? (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(property.value) && property.value.length > 0 ? (
                property.value.map((item: any, itemIndex: number) => (
                  <span
                    key={itemIndex}
                    className="text-xs text-gray-600 bg-blue-100 rounded-md px-2 py-1 flex items-center gap-1"
                  >
                    <File className="h-3 w-3" />
                    {item.label || item.id || String(item)}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No relations</span>
              )}
            </div>
          ) : (
            <span style={valueStyle} className="text-sm">
              {Array.isArray(property.value)
                ? property.value.join(", ")
                : property.value !== undefined && property.value !== null
                  ? String(property.value)
                  : "—"}
            </span>
          )}
          <div className="text-xs text-gray-400 mt-1">Read-only</div>
        </div>
      );
    }

    // If currently editing this property value
    if (editingPropertyValue === index) {
      switch (property?.type) {
        case "text":
        case "longtext":
          return (
            <textarea
              ref={propertyValueInputRef as any}
              value={tempPropertyValue}
              onChange={(e) => setTempPropertyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                } else if (e.key === "Escape") {
                  setEditingPropertyValue(null);
                }
              }}
              className="min-h-[80px] px-2 py-1 text-sm border border-gray-300 rounded-md focus:border-[#09BC8A] focus:ring-[#09BC8A]/20 focus:outline-none resize-y"
              placeholder="Enter long text... (Ctrl+Enter to save)"
              autoFocus
            />
          );
        case "url":
          return (
            <Input
              ref={propertyValueInputRef}
              type="url"
              value={tempPropertyValue}
              onChange={(e) => setTempPropertyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                } else if (e.key === "Escape") {
                  setEditingPropertyValue(null);
                }
              }}
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
              placeholder="https://example.com"
              autoFocus
            />
          );
          return (
            <Input
              ref={propertyValueInputRef}
              value={tempPropertyValue}
              onChange={(e) => setTempPropertyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                } else if (e.key === "Escape") {
                  setEditingPropertyValue(null);
                }
              }}
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
              autoFocus
            />
          );
        case "email":
          return (
            <Input
              ref={propertyValueInputRef}
              type="email"
              value={tempPropertyValue}
              onChange={(e) => setTempPropertyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                } else if (e.key === "Escape") {
                  setEditingPropertyValue(null);
                }
              }}
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
              autoFocus
            />
          );
        case "number":
          return (
            <Input
              ref={propertyValueInputRef}
              type="number"
              value={tempPropertyValue}
              onChange={(e) => setTempPropertyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdatePropertyValue(index, Number(tempPropertyValue));
                  setEditingPropertyValue(null);
                } else if (e.key === "Escape") {
                  setEditingPropertyValue(null);
                }
              }}
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
              autoFocus
            />
          );
        case "date":
          return (
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-8 hover:border-[#09BC8A] focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
                  >
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        handleUpdatePropertyValue(index, date.toISOString());
                      }
                      setEditingPropertyValue(null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        case "color":
          return (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tempPropertyValue}
                onChange={(e) => {
                  setTempPropertyValue(e.target.value);
                  handleUpdatePropertyValue(index, e.target.value);
                }}
                className="w-8 h-8 p-0 border rounded cursor-pointer"
              />
              <Input
                value={tempPropertyValue}
                onChange={(e) => setTempPropertyValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdatePropertyValue(index, tempPropertyValue);
                    setEditingPropertyValue(null);
                  } else if (e.key === "Escape") {
                    setEditingPropertyValue(null);
                  }
                }}
                onBlur={() => {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                }}
                className="h-8 px-2 py-1 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
                placeholder="#09BC8A"
              />
            </div>
          );
        default:
          return null;
      }
    }

    switch (property?.type) {
      case "checkbox":
        return (
          <div className="flex items-center">
            <Switch
              checked={property.value === true}
              onCheckedChange={(checked) =>
                handleUpdatePropertyValue(index, checked)
              }
              className="data-[state=checked]:bg-[#09BC8A]"
            />
          </div>
        );
      case "date":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full transition-colors"
            onClick={() => startEditingPropertyValue(index)}
          >
            <span className="text-sm text-gray-700">
              {property.value
                ? format(new Date(property.value), "PPP")
                : "Click to set date"}
            </span>
          </div>
        );
      case "url":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full transition-colors"
            onClick={() => startEditingPropertyValue(index)}
          >
            {property.value ? (
              <a
                href={property.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5DA9E9] hover:text-[#003F91] underline text-sm break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {property.value}
              </a>
            ) : (
              <span className="text-gray-400 text-sm">Click to add URL</span>
            )}
          </div>
        );
      case "longtext":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full transition-colors"
            onClick={() => startEditingPropertyValue(index)}
          >
            <div className="text-sm text-gray-700 max-h-20 overflow-y-auto">
              {property.value ? (
                <div className="whitespace-pre-wrap break-words">
                  {String(property.value).length > 100
                    ? `${String(property.value).substring(0, 100)}...`
                    : String(property.value)}
                </div>
              ) : (
                <span className="text-gray-400">Click to add long text</span>
              )}
            </div>
          </div>
        );
      case "select":
        return (
          <Select
            value={String(property.value)}
            onValueChange={(value) => handleUpdatePropertyValue(index, value)}
          >
            <SelectTrigger className="h-8 min-w-[120px] border-none bg-transparent hover:bg-gray-50 focus:ring-0 px-2 focus:border-[#09BC8A]">
              <span style={valueStyle}>
                {property.value || "Select an option"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {(property.options || []).map((option, i) => (
                <SelectItem key={i} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="w-full">
            {editingPropertyValue === index ? (
              <div className="space-y-2 p-3 border border-[#09BC8A] rounded-md bg-gray-50">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Select multiple options:
                </div>
                {property.options && property.options.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {property.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(property.value) &&
                            property.value.includes(option)
                          }
                          onChange={(e) => {
                            const currentValues = Array.isArray(property.value)
                              ? property.value
                              : [];
                            let newValues;
                            if (e.target.checked) {
                              newValues = [...currentValues, option];
                            } else {
                              newValues = currentValues.filter(
                                (v) => v !== option
                              );
                            }
                            // Update immediately without saving
                            const updatedProperties = [...properties];
                            updatedProperties[index] = {
                              ...updatedProperties[index],
                              value: newValues,
                            };
                            setProperties(updatedProperties);
                          }}
                          className="rounded border-gray-300 text-[#09BC8A] focus:ring-[#09BC8A]/20"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No options available. Add options first in the column
                    settings.
                  </div>
                )}
                <div className="flex gap-2 mt-3 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPropertyValue(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdatePropertyValue(index, property.value);
                      setEditingPropertyValue(null);
                    }}
                    className="bg-[#09BC8A] hover:bg-[#08a378] text-white border-0 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full transition-colors min-h-[32px] items-center"
                onClick={() => startEditingPropertyValue(index)}
              >
                {Array.isArray(property.value) && property.value.length > 0 ? (
                  property.value.map((val, i) => (
                    <span
                      key={i}
                      className="text-xs bg-[#FFF0EA] text-[#FF4A1C] rounded-md px-2 py-1 border border-[#FF4A1C]/20"
                    >
                      {val}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">
                    {property.options && property.options.length > 0
                      ? "Click to select options"
                      : "No options available"}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      case "color":
        return (
          <div className="flex items-center gap-2 w-full">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm cursor-pointer"
              style={{ backgroundColor: property.value || "#09BC8A" }}
              onClick={() => startEditingPropertyValue(index)}
            ></div>
            <div
              className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-grow transition-colors"
              onClick={() => startEditingPropertyValue(index)}
            >
              <span className="text-sm text-gray-700 font-mono">
                {property.value || "#09BC8A"}
              </span>
            </div>
          </div>
        );
      case "email":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full transition-colors"
            onClick={() => startEditingPropertyValue(index)}
          >
            {property.value ? (
              <a
                href={`mailto:${property.value}`}
                className="text-[#5DA9E9] hover:text-[#003F91] underline text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {property.value}
              </a>
            ) : (
              <span className="text-gray-400 text-sm">Click to add email</span>
            )}
          </div>
        );
      case "relation":
        return (
          <div className="w-full">
            <div className="flex flex-wrap gap-1 p-1 max-w-full">
              {Array.isArray(property.value) && property.value.length > 0
                ? property.value.map((item: any, itemIndex: number) => (
                    <span
                      key={itemIndex}
                      className="text-xs text-[#003F91] bg-[#5DA9E9]/10 rounded-md px-2 py-1 border border-[#5DA9E9]/20 flex items-center gap-1 group"
                    >
                      <File className="h-3 w-3" />
                      {item.label || item.id || String(item)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValue = property.value.filter(
                            (_: any, i: number) => i !== itemIndex
                          );
                          handleUpdatePropertyValue(index, newValue);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                : null}
              <button
                onClick={() => {
                  // Placeholder for relation picker
                  alert(
                    "Relation picker would open here. This requires the relation picker component to be implemented."
                  );
                }}
                className="text-gray-400 hover:text-[#09BC8A] flex items-center text-xs px-2 py-1 border border-dashed border-gray-300 hover:border-[#09BC8A]/50 rounded-md transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add relation
              </button>
            </div>
          </div>
        );
      case "rollup":
        return (
          <div className="flex flex-wrap gap-1 p-1">
            {Array.isArray(property.value) && property.value.length > 0 ? (
              property.value.map((item: any, itemIndex: number) => (
                <span
                  key={itemIndex}
                  className="text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 border transition-colors cursor-default"
                  title={`From: ${item.label || "Unknown source"}`}
                >
                  {typeof item === "object" && item !== null
                    ? item.value !== undefined
                      ? String(item.value)
                      : item.label || String(item)
                    : String(item)}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm px-1 italic">
                No rollup data available
              </span>
            )}
          </div>
        );
      default:
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full overflow-hidden text-ellipsis transition-colors"
            onClick={() => startEditingPropertyValue(index)}
          >
            <span
              style={valueStyle}
              className="block truncate text-sm text-gray-700"
            >
              {Array.isArray(property.value) ? (
                property.value.join(", ")
              ) : property.value !== undefined && property.value !== null ? (
                String(property.value)
              ) : (
                <span className="text-gray-400">Click to edit</span>
              )}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed right-0 top-[calc(4vh+84px)] bottom-0 z-50 w-96
      animate-slide-in-right 
      bg-white border-l border-gray-200 
      flex flex-col 
      shadow-lg"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
          className="!text-3xl !font-bold border-none focus-visible:ring-0 px-0 h-auto focus:border-[#09BC8A] placeholder:text-gray-300"
          placeholder="Untitled"
        />
      </div>

      <div className="px-4 space-y-4 flex-1 overflow-y-auto pb-20">
        {/* Properties */}
        <div className="space-y-3">
          {properties.map((property, index) => (
            <div
              key={`${property.name}-${index}`}
              className={`flex items-center gap-4 py-1.5 hover:bg-gray-50 rounded-md group relative ${
                isPropertyHidden(property) ? "opacity-40" : ""
              }`}
            >
              {/* Property name with inline editing */}
              <div className="flex items-center gap-2 text-gray-500 min-w-[120px] w-[120px] max-w-[120px] overflow-hidden">
                {getPropertyIcon(property.name, property?.type)}

                {editingPropertyName === index ? (
                  <Input
                    ref={propertyNameInputRef}
                    value={tempPropertyName}
                    onChange={(e) => setTempPropertyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdatePropertyName(index, tempPropertyName);
                        setEditingPropertyName(null);
                      }
                    }}
                    className="h-7 px-1 py-0 text-sm focus-visible:ring-1 focus:border-[#09BC8A] focus:ring-[#09BC8A]/20"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-gray-600 truncate block ${
                      property.isEditable
                        ? "cursor-pointer hover:text-[#09BC8A] hover:underline transition-colors"
                        : "cursor-default italic opacity-75"
                    }`}
                    onClick={() =>
                      property.isEditable && startEditingPropertyName(index)
                    }
                    title={`${property.name}${!property.isEditable ? " (Read-only)" : ""}`}
                  >
                    {property.name}
                    {!property.isEditable && (
                      <span className="text-xs text-gray-400 ml-1">
                        (Read-only)
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Property value with appropriate styling and inline editing */}
              <div className="flex-grow overflow-hidden">
                {renderPropertyValue(property, index)}
                {validationErrors[property.name] && (
                  <div className="text-xs text-red-500 mt-1 px-2">
                    {validationErrors[property.name]}
                  </div>
                )}
              </div>

              {/* Actions menu (only visible on hover) */}
              <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-[#09BC8A]/10 hover:text-[#09BC8A]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {property.isEditable && (
                      <DropdownMenuItem
                        onClick={() => startEditingPropertyName(index)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    )}

                    {property.isEditable &&
                      (property?.type === "select" ||
                        property?.type === "multiselect") && (
                        <DropdownMenuItem
                          onClick={() =>
                            setEditingOptions({
                              propertyName: property.name,
                              options: property.options || [],
                            })
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit options
                        </DropdownMenuItem>
                      )}

                    <DropdownMenuItem
                      onClick={() => handleToggleVisibility(index)}
                    >
                      {isPropertyHidden(property) ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          <span>Show in table</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          <span>Hide from table</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    {property.isEditable && (
                      <DropdownMenuItem
                        onClick={() => handleDuplicateProperty(index)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate property
                      </DropdownMenuItem>
                    )}

                    {property.isEditable && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveProperty(index)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Delete property
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Add New Property Button */}
          <button
            className="flex items-center gap-2 text-gray-400 hover:text-[#09BC8A] py-3 w-full mt-4 transition-colors duration-200 border-2 border-dashed border-gray-200 hover:border-[#09BC8A]/30 rounded-lg justify-center bg-gray-50/50 hover:bg-[#09BC8A]/5"
            onClick={() => setShowPropertyTypeSelect(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Add a property</span>
          </button>
        </div>

        {/* Add Property Form */}
        {showPropertyTypeSelect && (
          <div className="bg-white rounded-lg border-2 border-[#09BC8A]/20 p-4 mt-4 shadow-sm">
            <div className="mb-3">
              <Input
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder="Property name"
                className={`w-full focus:border-[#09BC8A] focus:ring-[#09BC8A]/20 ${validationErrors.newProperty ? "border-red-500" : ""}`}
              />
              {validationErrors.newProperty && (
                <div className="text-xs text-red-500 mt-1">
                  {validationErrors.newProperty}
                </div>
              )}
            </div>

            <Select
              value={newPropertyType}
              onValueChange={(value: PropertyType) => setNewPropertyType(value)}
            >
              <SelectTrigger className="bg-white border-gray-300 mb-3 focus:outline-none focus:border-[#09BC8A] focus:ring-[#09BC8A]/20">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="multiselect">Multiselect</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="color">Color</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="longtext">Long Text</SelectItem>
              </SelectContent>
            </Select>

            {/* Show options editor when select type is chosen */}
            {(newPropertyType === "select" ||
              newPropertyType === "multiselect") && (
              <div className="mt-3 mb-3 border rounded-md p-2 bg-gray-50">
                <div className="text-sm font-medium mb-2">Define options</div>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {newPropertyOptions.map((option, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updatedOptions = [...newPropertyOptions];
                          updatedOptions[i] = e.target.value;
                          setNewPropertyOptions(updatedOptions);
                        }}
                        className="flex-1 h-8 text-sm focus-visible:ring-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const filteredOptions = newPropertyOptions.filter(
                            (_, index) => index !== i
                          );
                          setNewPropertyOptions(filteredOptions);
                        }}
                        className="h-7 w-7"
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add option"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="flex-1 h-8 text-sm focus-visible:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newOptionInput.trim()) {
                        e.preventDefault();
                        setNewPropertyOptions([
                          ...newPropertyOptions,
                          newOptionInput.trim(),
                        ]);
                        setNewOptionInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newOptionInput.trim()) {
                        setNewPropertyOptions([
                          ...newPropertyOptions,
                          newOptionInput.trim(),
                        ]);
                        setNewOptionInput("");
                      }
                    }}
                    disabled={!newOptionInput.trim()}
                    className="h-8 bg-[#09BC8A] hover:bg-[#08a378] text-white border-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPropertyTypeSelect(false);
                  setNewPropertyName("");
                  setNewPropertyOptions([]);
                  setNewOptionInput("");
                  if (validationErrors.newProperty) {
                    const { newProperty, ...rest } = validationErrors;
                    setValidationErrors(rest);
                  }
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddProperty}
                disabled={
                  !newPropertyName.trim() ||
                  ((newPropertyType === "select" ||
                    newPropertyType === "multiselect") &&
                    newPropertyOptions.length === 0)
                }
                className="bg-[#09BC8A] hover:bg-[#08a378] text-white border-0"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Options Editor Dialog */}
        {editingOptions && (
          <div className="bg-white rounded-lg border-2 border-[#5DA9E9]/20 p-4 mt-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="font-medium text-[#003F91]">
                Edit {editingOptions.propertyName} options
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingOptions(null)}
                className="hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {editingOptions.options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editingOptions.options];
                      newOptions[i] = e.target.value;
                      setEditingOptions({
                        ...editingOptions,
                        options: newOptions,
                      });

                      // Update the property
                      const propertyIndex = properties.findIndex(
                        (p) => p.name === editingOptions.propertyName
                      );
                      if (propertyIndex !== -1) {
                        const updatedProperties = [...properties];
                        updatedProperties[propertyIndex] = {
                          ...updatedProperties[propertyIndex],
                          options: newOptions,
                        };
                        setProperties(updatedProperties);

                        // Update column options
                        const columnIndex = columns.findIndex(
                          (col) => col.title === editingOptions.propertyName
                        );
                        if (columnIndex !== -1) {
                          const updatedColumns = [...columns];
                          updatedColumns[columnIndex] = {
                            ...updatedColumns[columnIndex],
                            options: newOptions,
                          };
                          setColumns(updatedColumns);
                        }
                      }
                    }}
                    className="flex-1 focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(i)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="New option"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="flex-1 focus-visible:ring-0"
              />
              <Button
                size="sm"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
                className="bg-[#09BC8A] hover:bg-[#08a378] text-white border-0"
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmation && (
        <AlertDialog
          open={deleteConfirmation.open}
          onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the property "
                {deleteConfirmation.propertyName}"? This will remove it from all
                nodes and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteProperty}
                className="bg-[#FF4A1C] hover:bg-[#e6421a] text-white border-0"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
