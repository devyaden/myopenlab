"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Node } from "reactflow";

// Import the DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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

interface NodePropertiesSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
  columns: any[];
  setColumns: (val: any) => void;
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
  | "multiselect";

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
const EXCLUDED_PROPERTIES = ["id", "label", "shape", "hidden", "type"];

// Shape options for the type property
const SHAPE_OPTIONS = [
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

export function NodePropertiesSidebar({
  selectedNode,
  onClose,
  columns,
  setColumns,
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

  // State for new property options
  const [newPropertyOptions, setNewPropertyOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    propertyIndex: number;
    propertyName: string;
  } | null>(null);

  // Load node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      // Load title from node data
      setTitle(selectedNode.data?.label || "");

      // Initialize properties from node data
      const nodeData = selectedNode.data || {};
      const nodeProperties: Property[] = [];

      // First add special properties (task and type)
      // Add task property (using label)
      nodeProperties.push({
        name: "task",
        value: nodeData.label || "",
        type: "text",
        hidden: nodeData.hidden?.task || false,
        isEditable: true,
      });

      // Add type property (using shape or node type)
      nodeProperties.push({
        name: "type",
        value: nodeData.shape || selectedNode.type || "",
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
            propertyType = mapColumnTypeToPropertyType(matchingColumn.type);
          } else if (typeof value === "number") {
            propertyType = "number";
          } else if (typeof value === "boolean") {
            propertyType = "checkbox";
          } else if (value instanceof Date) {
            propertyType = "date";
          }

          // @ts-ignore
          if (propertyType !== "relation" && propertyType !== "rollup") {
            nodeProperties.push({
              name: key,
              value: value,
              type: propertyType,
              options: matchingColumn?.options,
              hidden: nodeData.hidden?.[key] || false,
              isEditable,
            });
          }
        }
      });

      setProperties(nodeProperties);
    }
  }, [selectedNode, columns]);

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
      Color: "color",
      URL: "url",
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
    const error = validatePropertyValue(value, property.type);
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

  // Improve the renderReadOnlyProperty function to better handle long text values
  const renderReadOnlyProperty = (property: Property) => {
    switch (property.type) {
      case "checkbox":
        return (
          <div className="flex items-center justify-center h-10 px-3 border rounded-md bg-gray-50 w-full">
            <Switch checked={property.value === true} disabled />
          </div>
        );
      case "date":
        // Special handling for date values to ensure they don't overflow
        return (
          <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50 w-full overflow-hidden">
            <span className="text-gray-600 text-sm truncate w-full">
              {property.value ? new Date(property.value).toLocaleString() : ""}
            </span>
          </div>
        );
      default:
        // Check if this is a node ID or other long text that needs special handling
        const isLongText =
          typeof property.value === "string" &&
          (property.value.length > 15 ||
            property.name === "from" ||
            property.name === "to");

        return (
          <div className="relative group w-full">
            <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50 w-full overflow-hidden">
              <span className="text-gray-600 text-sm truncate w-full">
                {Array.isArray(property.value)
                  ? property.value.join(", ")
                  : property.value !== undefined && property.value !== null
                    ? String(property.value)
                    : ""}
              </span>
            </div>

            {/* Show tooltip on hover for long text */}
            {isLongText && (
              <div className="absolute z-50 left-0 top-full mt-1 bg-black text-white text-xs rounded py-1 px-2 max-w-[200px] break-all opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {property.value}
              </div>
            )}
          </div>
        );
    }
  };

  // Also update the date input to ensure it displays properly
  const renderPropertyValueInput = (property: Property, index: number) => {
    // If property is not editable, render a read-only view
    if (!property.isEditable) {
      return renderReadOnlyProperty(property);
    }

    const hasError = !!validationErrors[property.name];

    switch (property.type) {
      case "checkbox":
        return (
          <div className="flex items-center justify-center h-10 px-3 border rounded-md bg-white w-full">
            <Switch
              checked={property.value === true}
              onCheckedChange={(checked) =>
                handleUpdatePropertyValue(index, checked)
              }
            />
          </div>
        );
      case "color":
        return (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-white w-full">
            <Input
              type="color"
              value={property.value || "#000000"}
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              className="w-10 h-8 p-1"
            />
            <Input
              type="text"
              value={property.value || "#000000"}
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              className={`flex-1 border-0 p-0 h-8 ${hasError ? "text-red-500" : ""}`}
            />
          </div>
        );
      case "number":
        return (
          <div className="relative w-full">
            <Input
              type="number"
              value={property.value}
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              className={`h-10 w-full ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <div className="text-xs text-red-500 mt-1 absolute">
                {validationErrors[property.name]}
              </div>
            )}
          </div>
        );
      case "date":
        return (
          <div className="relative w-full">
            <Input
              type="datetime-local"
              value={
                property.value
                  ? new Date(property.value).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              className={`h-10 w-full text-sm ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <div className="text-xs text-red-500 mt-1 absolute">
                {validationErrors[property.name]}
              </div>
            )}
          </div>
        );
      case "url":
        return (
          <div className="relative w-full">
            <Input
              type="url"
              value={property.value}
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              placeholder="https://example.com"
              className={`h-10 w-full ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <div className="text-xs text-red-500 mt-1 absolute">
                {validationErrors[property.name]}
              </div>
            )}
          </div>
        );
      case "longtext":
        return (
          <Textarea
            value={property.value || ""}
            onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
            className={`min-h-[80px] w-full ${hasError ? "border-red-500" : ""}`}
          />
        );
      case "select":
        return (
          <div className="w-full">
            <Select
              value={property.value}
              onValueChange={(value) => handleUpdatePropertyValue(index, value)}
            >
              <SelectTrigger className="w-full h-10 focus:outline-none">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {(property.options || []).length > 0 ? (
                  property.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-options" disabled>
                    No options available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        );
      case "multiselect":
        return (
          <div className="w-full">
            <Select
              value={
                Array.isArray(property.value) && property.value.length > 0
                  ? property.value[0]
                  : undefined
              }
              onValueChange={(value) => {
                const currentValues = Array.isArray(property.value)
                  ? property.value
                  : [];
                if (currentValues.includes(value)) {
                  handleUpdatePropertyValue(
                    index,
                    currentValues.filter((v) => v !== value)
                  );
                } else {
                  handleUpdatePropertyValue(index, [...currentValues, value]);
                }
              }}
            >
              <SelectTrigger className="w-full h-10 focus:outline-none">
                <SelectValue
                  placeholder={
                    Array.isArray(property.value) && property.value.length > 0
                      ? `${property.value.length} selected`
                      : "Select options"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(property.options || []).length > 0 ? (
                  property.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>
                      <div className="flex items-center">
                        <div className="mr-2">
                          <Switch
                            checked={
                              Array.isArray(property.value) &&
                              property.value.includes(option)
                            }
                            onCheckedChange={(checked) => {
                              const currentValues = Array.isArray(
                                property.value
                              )
                                ? property.value
                                : [];
                              if (checked) {
                                handleUpdatePropertyValue(index, [
                                  ...currentValues,
                                  option,
                                ]);
                              } else {
                                handleUpdatePropertyValue(
                                  index,
                                  currentValues.filter((v) => v !== option)
                                );
                              }
                            }}
                          />
                        </div>
                        {option}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-options" disabled>
                    No options available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {Array.isArray(property.value) && property.value.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {property.value.map((val, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-md px-2 py-1 text-xs flex items-center"
                  >
                    {val}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() => {
                        handleUpdatePropertyValue(
                          index,
                          property.value.filter((_: any, idx: any) => idx !== i)
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="relative w-full">
            <Input
              type="text"
              value={property.value}
              onChange={(e) => handleUpdatePropertyValue(index, e.target.value)}
              className={`h-10 w-full focus-visible:ring-0 ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <div className="text-xs text-red-500 mt-1 absolute">
                {validationErrors[property.name]}
              </div>
            )}
          </div>
        );
    }
  };

  // Render read-only view for non-editable properties
  // Update the property row layout to ensure better spacing
  return (
    <div
      className="fixed right-0 z-50 h-full 
    animate-slide-in-right 
    bg-white border-l border-gray-200 
    overflow-y-auto flex flex-col 
    shadow-lg"
    >
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-lg font-medium truncate"></h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 space-y-4 flex-1 overflow-y-auto">
        {/* Title Field */}
        <div className="mb-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            placeholder="Title Here"
            className="bg-gray-50 border-gray-200 focus-visible:ring-0"
          />
        </div>

        {/* Properties */}
        <div className="space-y-3">
          {properties.map((property, index) => (
            <div
              key={`${property.name}-${index}`}
              className="flex items-start gap-2 mb-4"
            >
              <div className="flex items-start w-full">
                <div className="w-[120px] flex-shrink-0">
                  <div className="relative">
                    <Input
                      value={property.name}
                      onChange={(e) =>
                        handleUpdatePropertyName(index, e.target.value)
                      }
                      placeholder="Property"
                      className={`bg-gray-50 border-gray-200 h-10 focus-visible:ring-0 text-sm ${
                        validationErrors[property.name] ? "border-red-500" : ""
                      }`}
                      disabled={!property.isEditable}
                    />
                    {validationErrors[property.name] &&
                      validationErrors[property.name].includes("name") && (
                        <div className="text-xs text-red-500 mt-1 absolute">
                          {validationErrors[property.name]}
                        </div>
                      )}
                  </div>
                </div>
                <div className="mx-2 flex-shrink-0 mt-2.5">:</div>
                <div className="flex-1 relative">
                  {renderPropertyValueInput(property, index)}
                </div>

                {/* Dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-8 w-8 flex-shrink-0 mt-1"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

                    {property.isEditable && (
                      <DropdownMenuItem
                        onClick={() => handleRemoveProperty(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete property</span>
                      </DropdownMenuItem>
                    )}

                    {(property.type === "select" ||
                      property.type === "multiselect") && (
                      <DropdownMenuItem
                        onClick={() =>
                          setEditingOptions({
                            propertyName: property.name,
                            options: property.options || [],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Edit options</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Options Editor Dialog */}
          {editingOptions && (
            <div className="bg-white rounded-lg border p-3 mt-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Edit Select Options</Label>
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
                      <Trash2 className="h-4 w-4 text-gray-400" />
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

          {/* Add New Property Section */}
          {showPropertyTypeSelect ? (
            <div className="bg-white rounded-lg border p-3 mt-2">
              <div className="mb-3">
                <Label className="mb-1 block">Property name</Label>
                <Input
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="Enter property name"
                  className={`w-full ${validationErrors.newProperty ? "border-red-500" : ""}`}
                />
                {validationErrors.newProperty && (
                  <div className="text-xs text-red-500 mt-1">
                    {validationErrors.newProperty}
                  </div>
                )}
              </div>

              <Label className="mb-1 block">Property type</Label>
              <Select
                value={newPropertyType}
                onValueChange={(value: PropertyType) =>
                  setNewPropertyType(value)
                }
              >
                <SelectTrigger className="bg-white border-gray-300 mb-3 focus:outline-none">
                  <SelectValue placeholder="Text" />
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
                  <SelectItem value="longtext">Long Text</SelectItem>
                </SelectContent>
              </Select>

              {/* Show options editor when select type is chosen */}
              {(newPropertyType === "select" ||
                newPropertyType === "multiselect") && (
                <div className="mt-3 mb-3 border rounded-md p-2 bg-gray-50">
                  <Label className="mb-2 block text-sm">
                    Define select options
                  </Label>
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
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
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
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-500 mt-2"
              onClick={() => setShowPropertyTypeSelect(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Column
            </Button>
          )}
        </div>
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
