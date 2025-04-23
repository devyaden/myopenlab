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
  Flag,
  ListTodo,
  MoreHorizontal,
  Plus,
  Users,
  X,
  File,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { format } from "date-fns";
import { ALL_SHAPES } from "@/lib/types/flow-table.types";

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
  hidden?: boolean;
  isEditable?: boolean;
}

// List of non-editable properties
const NON_EDITABLE_PROPERTIES = ["id", "from", "to", "parent", "children"];
// Properties to exclude from the sidebar
const EXCLUDED_PROPERTIES = [
  "id",
  "label",
  "shape",
  "hidden",
  "type",
  "task",
  "lanes",
];

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

  const populateFromAndTo = () => {
    const from = edges
      .filter((edge) => edge.target === selectedNode?.id)
      .map((edge) => edge.source);

    const to = edges
      .filter((edge) => edge.source === selectedNode?.id)
      .map((edge) => edge.target);

    const fromLabels = from.map((id) => {
      const node = nodes.find((node) => node.id === id);
      return node ? node.data.label : "";
    });

    const toLabels = to.map((id) => {
      const node = nodes.find((node) => node.id === id);
      return node ? node.data.label : "";
    });

    return {
      fromLabels: fromLabels || [],
      toLabels: toLabels || [],
    };
  };

  // Load node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const { fromLabels, toLabels } = populateFromAndTo();
      // Load title from node data
      setTitle(selectedNode.data?.label || "");

      // Initialize properties from node data
      const nodeData = selectedNode.data
        ? { ...selectedNode.data, from: fromLabels, to: toLabels }
        : {};
      const nodeProperties: Property[] = [];

      // Add type property (using shape or node type)
      nodeProperties.push({
        name: "type",
        value: nodeData.shape || selectedNode?.type || "",
        type: "select",
        options: SHAPE_OPTIONS,
        hidden: nodeData.hidden?.type || false,
        isEditable: true,
      });

      // Then add all other properties
      Object.entries(nodeData).forEach(([key, value]) => {
        // Skip excluded properties and already added special properties
        if (
          !EXCLUDED_PROPERTIES.includes(key) &&
          !["task", "type"].includes(key)
        ) {
          // Find matching column to determine type
          const matchingColumn = columns.find((col) => col.title === key);
          const isEditable = !NON_EDITABLE_PROPERTIES.includes(key);

          let propertyType: PropertyType = "text";
          if (matchingColumn) {
            propertyType = mapColumnTypeToPropertyType(matchingColumn?.type);
          } else if (typeof value === "number") {
            propertyType = "number";
          } else if (typeof value === "boolean") {
            propertyType = "checkbox";
          } else if (value instanceof Date) {
            propertyType = "date";
          } else if (typeof value === "string" && value.includes("@")) {
            propertyType = "email";
          }

          // Include relation and rollup types
          nodeProperties.push({
            name: key,
            value: value,
            type: propertyType,
            options: matchingColumn?.options,
            hidden: nodeData.hidden?.[key] || false,
            isEditable,
          });
        }
      });

      setProperties(nodeProperties);
    }
  }, [selectedNode, columns]);

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
      if (
        editingPropertyValue !== null &&
        propertyValueInputRef.current &&
        !propertyValueInputRef.current.contains(event.target as any)
      ) {
        if (properties[editingPropertyValue]?.type === "text") {
          handleUpdatePropertyValue(editingPropertyValue, tempPropertyValue);
        }
        setEditingPropertyValue(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingPropertyValue, tempPropertyValue, properties]);

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

    // Update node data with new title
    const updatedData = {
      ...selectedNode.data,
      label: title,
    };

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
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

    // Create new property
    const newProperty: Property = {
      name: newPropertyName,
      value: defaultValue,
      type: newPropertyType,
      options:
        newPropertyType === "select" || newPropertyType === "multiselect"
          ? [...newPropertyOptions]
          : undefined,
      hidden: false,
      isEditable: true,
    };

    // Update properties state
    const updatedProperties = [...properties, newProperty];
    setProperties(updatedProperties);

    // Update node data directly
    const updatedData = { ...selectedNode.data };
    updatedData[newProperty.name] = newProperty.value;

    // Track hidden state
    if (!updatedData.hidden) {
      updatedData.hidden = {};
    }
    updatedData.hidden[newProperty.name] = false;

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);

    // Add new column to table columns
    const newColumn = {
      title: newProperty.name,
      type: mapPropertyTypeToColumnType(newPropertyType),
      options: newProperty.options,
    };

    // Check if column already exists
    if (!columns.some((col) => col.title === newProperty.name)) {
      setColumns([...columns, newColumn]);
    }

    // Reset form
    setNewPropertyName("");
    setShowPropertyTypeSelect(false);
    setNewPropertyOptions([]);
    setNewOptionInput("");
  };

  const handleUpdatePropertyName = (index: number, newName: string) => {
    if (!selectedNode) return;

    const oldName = properties[index].name;

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

    // Update node data directly
    const updatedData = { ...selectedNode.data };
    updatedData[newName] = updatedData[oldName];
    delete updatedData[oldName];

    // Update hidden state if it exists
    if (updatedData.hidden && updatedData.hidden[oldName] !== undefined) {
      updatedData.hidden[newName] = updatedData.hidden[oldName];
      delete updatedData.hidden[oldName];
    }

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);

    // Update column title if it exists
    if (columns.some((col) => col.title === oldName)) {
      const updatedColumns = columns.map((col) =>
        col.title === oldName ? { ...col, title: newName } : col
      );
      setColumns(updatedColumns);
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

    // Update node data directly
    const updatedData = { ...selectedNode.data };

    // Special handling for task and type
    if (property.name === "task") {
      updatedData.label = value;
    } else if (property.name === "type") {
      updatedData.shape = value;
    } else {
      updatedData[property.name] = value;
    }

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
  };

  const handleRemoveProperty = (index: number) => {
    const propertyToRemove = properties[index];

    // Check if property is deletable
    if (NON_EDITABLE_PROPERTIES.includes(propertyToRemove.name)) {
      return; // Don't allow deletion of non-editable properties
    }

    // Open confirmation dialog
    setDeleteConfirmation({
      open: true,
      propertyIndex: index,
      propertyName: propertyToRemove.name,
    });
  };

  // Add this new function to handle the actual deletion after confirmation
  const confirmDeleteProperty = () => {
    if (!deleteConfirmation || !selectedNode) return;

    const propertyName = deleteConfirmation.propertyName;
    const index = deleteConfirmation.propertyIndex;

    // Update properties state
    const updatedProperties = properties.filter((_, i) => i !== index);
    setProperties(updatedProperties);

    // Update all nodes in the store to remove this property
    const allNodes = useCanvasStore.getState().nodes;
    const updatedNodes = allNodes.map((node) => {
      // Skip nodes that don't have this property
      if (!node.data || node.data[propertyName] === undefined) {
        return node;
      }

      // Create a new data object without the property
      const updatedData = { ...node.data };
      delete updatedData[propertyName];

      // Remove from hidden state if it exists
      if (
        updatedData.hidden &&
        updatedData.hidden[propertyName] !== undefined
      ) {
        delete updatedData.hidden[propertyName];
      }

      return { ...node, data: updatedData };
    });

    // Update nodes in store
    useCanvasStore.getState().setNodes(updatedNodes);

    // Remove from columns array
    const updatedColumns = columns.filter((col) => col.title !== propertyName);
    setColumns(updatedColumns);

    // Close the confirmation dialog
    setDeleteConfirmation(null);
  };

  const handleToggleVisibility = (index: number) => {
    if (!selectedNode) return;

    const property = properties[index];
    const isHidden = !property.hidden;

    // Update properties state
    const updatedProperties = [...properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      hidden: isHidden,
    };
    setProperties(updatedProperties);

    // Update node data directly
    const updatedData = { ...selectedNode.data };
    if (!updatedData.hidden) {
      updatedData.hidden = {};
    }
    updatedData.hidden[property.name] = isHidden;

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
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

    // Update node data
    if (selectedNode) {
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
    };

    // Update properties state
    const updatedProperties = [...properties];
    updatedProperties.splice(index + 1, 0, newProperty);
    setProperties(updatedProperties);

    // Update node data directly
    const updatedData = { ...selectedNode.data };
    updatedData[newProperty.name] = updatedData[propertyToDuplicate.name];

    // Track hidden state
    if (!updatedData.hidden) {
      updatedData.hidden = {};
    }
    updatedData.hidden[newProperty.name] = propertyToDuplicate.hidden || false;

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);

    // Add new column to table columns
    const newColumn = {
      title: newProperty.name,
      type: mapPropertyTypeToColumnType(newProperty?.type),
      options: newProperty.options,
    };

    // Check if column already exists
    if (!columns.some((col) => col.title === newProperty.name)) {
      setColumns([...columns, newColumn]);
    }
  };

  const startEditingPropertyName = (index: number) => {
    setEditingPropertyName(index);
    setTempPropertyName(properties[index].name);
  };

  // Update the startEditingPropertyValue function to handle different property types
  const startEditingPropertyValue = (index: number) => {
    if (!properties[index].isEditable) return;

    setEditingPropertyValue(index);

    const property = properties[index];

    switch (property?.type) {
      case "text":
      case "longtext":
      case "url":
      case "email":
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
        // For date, we'll set the selected date for the date picker
        if (property.value) {
          setSelectedDate(new Date(property.value));
        } else {
          setSelectedDate(new Date());
        }
        break;
      case "color":
        // For color, we might want to open a color picker
        setTempPropertyValue(property.value || "#ffffff");
        break;
      // Other types are handled directly by their components
    }
  };

  // Render property value with inline editing
  const renderPropertyValue = (property: Property, index: number) => {
    const valueStyle = getPropertyValueStyle(property.name, property.value);

    // If property is not editable, just display the value
    if (!property.isEditable) {
      return (
        <div className="px-2 py-1 text-gray-500 italic">
          <span style={valueStyle}>
            {Array.isArray(property.value)
              ? property.value.join(", ")
              : property.value !== undefined && property.value !== null
                ? String(property.value)
                : ""}
          </span>
        </div>
      );
    }

    // If currently editing this property value
    if (editingPropertyValue === index) {
      switch (property?.type) {
        case "text":
        case "longtext":
        case "url":
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
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1"
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
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1"
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
              className="h-8 px-2 py-1 text-sm focus-visible:ring-1"
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
                    className="w-full justify-start text-left font-normal h-8"
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
                className="w-8 h-8 p-0 border rounded"
              />
              <Input
                value={tempPropertyValue}
                onChange={(e) => setTempPropertyValue(e.target.value)}
                onBlur={() => {
                  handleUpdatePropertyValue(index, tempPropertyValue);
                  setEditingPropertyValue(null);
                }}
                className="h-8 px-2 py-1 text-sm focus-visible:ring-1"
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
            />
          </div>
        );
      case "date":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full"
            onClick={() => startEditingPropertyValue(index)}
          >
            {property.value
              ? format(new Date(property.value), "PPP")
              : "Click to set date"}
          </div>
        );
      case "select":
        return (
          <Select
            value={String(property.value)}
            onValueChange={(value) => handleUpdatePropertyValue(index, value)}
          >
            <SelectTrigger className="h-8 min-w-[120px] border-none bg-transparent hover:bg-gray-50 focus:ring-0 px-2">
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
          <div
            className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full"
            onClick={() => {
              // Here you would open a multiselect dropdown
              // For now, we'll just show a placeholder
              alert("Multiselect editing would open here");
            }}
          >
            {Array.isArray(property.value) && property.value.length > 0 ? (
              property.value.map((val, i) => (
                <div key={i} style={valueStyle}>
                  {val}
                </div>
              ))
            ) : (
              <span className="text-gray-400">Click to select options</span>
            )}
          </div>
        );
      case "color":
        return (
          <div className="flex items-center gap-2 w-full">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: property.value || "#ffffff" }}
            ></div>
            <div
              className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-grow"
              onClick={() => startEditingPropertyValue(index)}
            >
              {property.value || "Click to set color"}
            </div>
          </div>
        );
      case "email":
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full"
            onClick={() => startEditingPropertyValue(index)}
          >
            <span style={valueStyle}>
              {property.value || "Click to add email"}
            </span>
          </div>
        );
      case "relation":
        return (
          <div className="flex flex-wrap max-w-full">
            {Array.isArray(property.value) && property.value.length > 0 ? (
              property.value.map((item: any, index: number) => (
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
      case "rollup":
        return (
          <div className="p-2 flex flex-wrap gap-1">
            {Array.isArray(property.value) && property.value.length > 0 ? (
              property.value.map((item: any, index: number) => (
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
      default:
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded w-full overflow-hidden text-ellipsis"
            onClick={() => startEditingPropertyValue(index)}
          >
            <span style={valueStyle} className="block truncate">
              {Array.isArray(property.value)
                ? property.value.join(", ")
                : property.value !== undefined && property.value !== null
                  ? String(property.value)
                  : "Click to edit"}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed right-0 top-[calc(4vh+105px)] bottom-0 z-50 w-96
      animate-slide-in-right 
      bg-white border-l border-gray-200 
      flex flex-col 
      shadow-lg"
    >
      <div className="flex items-center justify-between p-4 ">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
          className="!text-3xl !font-bold border-none focus-visible:ring-0 px-0 h-auto"
          placeholder="Untitled"
        />
      </div>

      <div className="px-4 space-y-4 flex-1 overflow-y-auto pb-20">
        {/* Properties */}
        <div className="space-y-3">
          {properties.map((property, index) => (
            <div
              key={`${property.name}-${index}`}
              className="flex items-center gap-4 py-1.5 hover:bg-gray-50 rounded-md group relative"
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
                    className="h-7 px-1 py-0 text-sm focus-visible:ring-1"
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-gray-500 cursor-pointer hover:underline truncate block"
                    onClick={() =>
                      property.isEditable && startEditingPropertyName(index)
                    }
                    title={property.name}
                  >
                    {property.name}
                  </span>
                )}
              </div>

              {/* Property value with appropriate styling and inline editing */}
              <div className="flex-grow overflow-hidden">
                {renderPropertyValue(property, index)}
              </div>

              {/* Actions menu (only visible on hover) */}
              <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => startEditingPropertyName(index)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>

                    {(property?.type === "select" ||
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
                      {property.hidden ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          <span>Show property</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          <span>Hide property</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleDuplicateProperty(index)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate property
                    </DropdownMenuItem>

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
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 py-2 w-full mt-2"
            onClick={() => setShowPropertyTypeSelect(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add a property</span>
          </button>
        </div>

        {/* Add Property Form */}
        {showPropertyTypeSelect && (
          <div className="bg-white rounded-lg border p-3 mt-2">
            <div className="mb-3">
              <Input
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder="Property name"
                className={`w-full ${validationErrors.newProperty ? "border-red-500" : ""}`}
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
              <SelectTrigger className="bg-white border-gray-300 mb-3 focus:outline-none">
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
                    className="h-8"
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
                  // Clear validation errors
                  if (validationErrors.newProperty) {
                    const { newProperty, ...rest } = validationErrors;
                    setValidationErrors(rest);
                  }
                }}
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
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Options Editor Dialog */}
        {editingOptions && (
          <div className="bg-white rounded-lg border p-3 mt-2">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">
                Edit {editingOptions.propertyName} options
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingOptions(null)}
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
                className="bg-red-500 hover:bg-red-600"
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
