"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Node } from "reactflow";

interface NodePropertiesSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
}

type PropertyType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "color"
  | "url";

interface CustomProperty {
  id: string;
  name: string;
  value: string;
  type: PropertyType;
  options?: string[]; // Add options array for select type
}

export function NodePropertiesSidebar({
  selectedNode,
  onClose,
}: NodePropertiesSidebarProps) {
  const [title, setTitle] = useState("");
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>(
    []
  );
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [editingOptions, setEditingOptions] = useState<{
    index: number;
    options: string[];
  } | null>(null);
  const [newOption, setNewOption] = useState("");

  // First, modify the state to include options for new properties
  const [newPropertyOptions, setNewPropertyOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Load node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      // Load title from node data
      setTitle(selectedNode.data?.label || "");

      // Load custom properties from node data or initialize empty array
      setCustomProperties(selectedNode.data?.customProperties || []);
    }
  }, [selectedNode]);

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

  // Then, update the handleAddProperty function to include options
  const handleAddProperty = () => {
    if (!selectedNode) return;

    const newProperty: CustomProperty = {
      id: `prop-${Date.now()}`,
      name: "New Property",
      value: "",
      type: newPropertyType,
      options:
        newPropertyType === "select" ? [...newPropertyOptions] : undefined,
    };

    const updatedProperties = [...customProperties, newProperty];
    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
    setShowPropertyTypeSelect(false);
    setNewPropertyOptions([]);
    setNewOptionInput("");
  };

  const handleUpdateProperty = (
    index: number,
    field: keyof CustomProperty,
    value: any
  ) => {
    if (!selectedNode) return;

    const updatedProperties = [...customProperties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      [field]: value,
    };

    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

    // Update node in store
    const updatedNodes = useCanvasStore
      .getState()
      .nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: updatedData } : node
      );

    useCanvasStore.getState().setNodes(updatedNodes);
  };

  const handleRemoveProperty = (index: number) => {
    if (!selectedNode) return;

    const updatedProperties = customProperties.filter((_, i) => i !== index);
    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

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
    const updatedProperties = [...customProperties];
    updatedProperties[editingOptions.index] = {
      ...updatedProperties[editingOptions.index],
      options: updatedOptions,
    };

    setCustomProperties(updatedProperties);

    // Update node data
    if (selectedNode) {
      const updatedData = {
        ...selectedNode.data,
        customProperties: updatedProperties,
      };

      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    }
  };

  // Add function to handle removing an option
  const handleRemoveOption = (optionIndex: number) => {
    if (!editingOptions) return;

    const updatedOptions = editingOptions.options.filter(
      (_, i) => i !== optionIndex
    );
    setEditingOptions({ ...editingOptions, options: updatedOptions });

    // Update the property with new options
    const updatedProperties = [...customProperties];
    updatedProperties[editingOptions.index] = {
      ...updatedProperties[editingOptions.index],
      options: updatedOptions,
    };

    setCustomProperties(updatedProperties);

    // Update node data
    if (selectedNode) {
      const updatedData = {
        ...selectedNode.data,
        customProperties: updatedProperties,
      };

      const updatedNodes = useCanvasStore
        .getState()
        .nodes.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        );

      useCanvasStore.getState().setNodes(updatedNodes);
    }
  };

  // Render the appropriate input based on property type
  const renderPropertyValueInput = (
    property: CustomProperty,
    index: number
  ) => {
    switch (property.type) {
      case "checkbox":
        return (
          <div className="flex items-center justify-center h-10 px-3 border rounded-md bg-white w-full">
            <Checkbox
              checked={property.value === "true"}
              onCheckedChange={(checked) =>
                handleUpdateProperty(index, "value", checked ? "true" : "false")
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
              onChange={(e) =>
                handleUpdateProperty(index, "value", e.target.value)
              }
              className="w-10 h-8 p-1"
            />
            <Input
              type="text"
              value={property.value || "#000000"}
              onChange={(e) =>
                handleUpdateProperty(index, "value", e.target.value)
              }
              className="flex-1 border-0 p-0 h-8"
            />
          </div>
        );
      case "number":
        return (
          <Input
            type="number"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="h-10 w-full"
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="h-10 w-full"
          />
        );
      case "url":
        return (
          <Input
            type="url"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            placeholder="https://example.com"
            className="h-10 w-full"
          />
        );
      case "select":
        return (
          <div className="w-full">
            <Select
              value={property.value}
              onValueChange={(value) =>
                handleUpdateProperty(index, "value", value)
              }
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
      default:
        return (
          <Input
            type="text"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="h-10 w-full focus-visible:ring-0"
          />
        );
    }
  };

  if (!selectedNode) return null;

  return (
    <div
      className="fixed top-0 right-0 z-50 h-full w-80 
      animate-slide-in-right 
      bg-white border-l border-gray-200 
      overflow-y-auto flex flex-col 
      shadow-lg"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium truncate">Properties</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
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

        {/* Custom Properties */}
        <div className="space-y-3">
          {customProperties.map((property, index) => (
            <div key={property.id} className="flex items-center gap-2">
              <div className="flex items-center w-full">
                <div className="w-[130px] flex-shrink-0">
                  <Input
                    value={property.name}
                    onChange={(e) =>
                      handleUpdateProperty(index, "name", e.target.value)
                    }
                    placeholder="Property"
                    className="bg-gray-50 border-gray-200 h-10 focus-visible:ring-0"
                  />
                </div>
                <div className="mx-2 flex-shrink-0">:</div>
                <div className="flex-1">
                  {renderPropertyValueInput(property, index)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveProperty(index)}
                  className="ml-1 h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
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
                        const updatedProperties = [...customProperties];
                        updatedProperties[editingOptions.index] = {
                          ...updatedProperties[editingOptions.index],
                          options: newOptions,
                        };
                        setCustomProperties(updatedProperties);

                        // Update node data
                        if (selectedNode) {
                          const updatedData = {
                            ...selectedNode.data,
                            customProperties: updatedProperties,
                          };

                          const updatedNodes = useCanvasStore
                            .getState()
                            .nodes.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: updatedData }
                                : node
                            );

                          useCanvasStore.getState().setNodes(updatedNodes);
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

          {/* Add New Column Section */}
          {showPropertyTypeSelect ? (
            <div className="bg-white rounded-lg border p-3 mt-2">
              <Label className="mb-2 block">Select property type</Label>
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
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>

              {/* Show options editor when select type is chosen */}
              {newPropertyType === "select" && (
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
                    setNewPropertyOptions([]);
                    setNewOptionInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddProperty}
                  disabled={
                    newPropertyType === "select" &&
                    newPropertyOptions.length === 0
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
    </div>
  );
}
