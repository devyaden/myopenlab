"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  ChevronDown,
  Trash2,
  Calendar,
  AlignLeft,
  Type,
  Hash,
  Check,
  Image,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { NodeStyle } from "@/types/store";
import type { Node } from "reactflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface NodePropertiesSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
}

type PropertyType =
  | "text"
  | "longtext"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "color"
  | "url"
  | "image";

interface CustomProperty {
  id: string;
  name: string;
  value: string;
  type: PropertyType;
  options?: string[];
}

export function NodePropertiesSidebar({
  selectedNode,
  onClose,
}: NodePropertiesSidebarProps) {
  const { nodeStyles, updateNodeStyle } = useCanvasStore();
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>(
    []
  );
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  // Load node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      // Load dimensions from node
      setWidth(selectedNode.width?.toString() || "");
      setHeight(selectedNode.height?.toString() || "");

      // Load description and custom properties from node data
      const nodeData = selectedNode.data || {};
      setDescription(nodeData.description || "");

      // Load custom properties from node data or initialize empty array
      setCustomProperties(nodeData.customProperties || []);
    }
  }, [selectedNode]);

  const handleSaveDescription = () => {
    if (!selectedNode) return;

    // Update node data with description
    const updatedData = {
      ...selectedNode.data,
      description,
    };

    // Update node in store
    useCanvasStore
      .getState()
      .setNodes(
        useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          )
      );
  };

  const handleSaveDimensions = () => {
    if (!selectedNode) return;

    // Parse dimensions
    const widthValue = Number.parseInt(width);
    const heightValue = Number.parseInt(height);

    // Update node in store
    useCanvasStore.getState().setNodes(
      useCanvasStore.getState().nodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              width: isNaN(widthValue) ? node.width : widthValue,
              height: isNaN(heightValue) ? node.height : heightValue,
            }
          : node
      )
    );
  };

  const handleAddProperty = () => {
    if (!selectedNode) return;

    const newProperty: CustomProperty = {
      id: `prop-${Date.now()}`,
      name: "New Property",
      value: "",
      type: "text",
    };

    const updatedProperties = [...customProperties, newProperty];
    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

    // Update node in store
    useCanvasStore
      .getState()
      .setNodes(
        useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          )
      );
  };

  const handleUpdateProperty = (
    index: number,
    field: keyof CustomProperty,
    value: any
  ) => {
    if (!selectedNode) return;

    const updatedProperties = [...customProperties];

    // Special handling for checkbox type
    if (field === "value" && updatedProperties[index].type === "checkbox") {
      updatedProperties[index].value = value ? "true" : "false";
    } else {
      updatedProperties[index] = {
        ...updatedProperties[index],
        [field]: value,
      };
    }

    // Reset value when type changes
    if (field === "type") {
      if (value === "checkbox") {
        updatedProperties[index].value = "false";
      } else if (
        value === "date" &&
        !isValidDate(updatedProperties[index].value)
      ) {
        updatedProperties[index].value = format(new Date(), "yyyy-MM-dd");
      } else if (
        value === "number" &&
        isNaN(Number(updatedProperties[index].value))
      ) {
        updatedProperties[index].value = "0";
      } else if (value === "select" && !updatedProperties[index].options) {
        updatedProperties[index].options = ["Option 1", "Option 2"];
        updatedProperties[index].value = "Option 1";
      } else if (
        value !== "select" &&
        value !== "checkbox" &&
        value !== "date" &&
        value !== "number"
      ) {
        if (
          ["select", "checkbox", "date", "number"].includes(
            updatedProperties[index].type
          )
        ) {
          updatedProperties[index].value = "";
        }
      }
    }

    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

    // Update node in store
    useCanvasStore
      .getState()
      .setNodes(
        useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          )
      );
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
    useCanvasStore
      .getState()
      .setNodes(
        useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          )
      );
  };

  const handleAddOption = (propertyIndex: number, option: string) => {
    if (!selectedNode) return;

    const updatedProperties = [...customProperties];
    const property = updatedProperties[propertyIndex];

    if (!property.options) {
      property.options = [];
    }

    property.options.push(option);
    setCustomProperties(updatedProperties);

    // Update node data with custom properties
    const updatedData = {
      ...selectedNode.data,
      customProperties: updatedProperties,
    };

    // Update node in store
    useCanvasStore
      .getState()
      .setNodes(
        useCanvasStore
          .getState()
          .nodes.map((node) =>
            node.id === selectedNode.id ? { ...node, data: updatedData } : node
          )
      );
  };

  const handleRemoveOption = (propertyIndex: number, optionIndex: number) => {
    if (!selectedNode) return;

    const updatedProperties = [...customProperties];
    const property = updatedProperties[propertyIndex];

    if (property.options && property.options.length > optionIndex) {
      property.options.splice(optionIndex, 1);

      // If the selected value was this option, reset to first option or empty
      if (property.value === property.options[optionIndex]) {
        property.value = property.options.length > 0 ? property.options[0] : "";
      }

      setCustomProperties(updatedProperties);

      // Update node data with custom properties
      const updatedData = {
        ...selectedNode.data,
        customProperties: updatedProperties,
      };

      // Update node in store
      useCanvasStore
        .getState()
        .setNodes(
          useCanvasStore
            .getState()
            .nodes.map((node) =>
              node.id === selectedNode.id
                ? { ...node, data: updatedData }
                : node
            )
        );
    }
  };

  // Helper function to check if a string is a valid date
  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Function to render the property input based on type
  const renderPropertyInput = (property: CustomProperty, index: number) => {
    switch (property.type) {
      case "longtext":
        return (
          <Textarea
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="min-h-[100px] text-sm"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="text-sm"
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal text-sm h-9"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {property.value
                  ? format(new Date(property.value), "PPP")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={property.value ? new Date(property.value) : undefined}
                onSelect={(date) =>
                  handleUpdateProperty(
                    index,
                    "value",
                    date ? format(date, "yyyy-MM-dd") : ""
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Select
              value={property.value}
              onValueChange={(value) =>
                handleUpdateProperty(index, "value", value)
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {property.options?.map((option, optIndex) => (
                  <SelectItem key={optIndex} value={option} className="text-sm">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2 border rounded-md p-2 bg-gray-50">
              <p className="text-xs font-medium text-gray-500">Options</p>
              {property.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const updatedProps = [...customProperties];
                      if (updatedProps[index].options) {
                        updatedProps[index].options![optIndex] = e.target.value;

                        // Update selected value if it matches this option
                        if (property.value === property.options?.[optIndex]) {
                          updatedProps[index].value = e.target.value;
                        }

                        setCustomProperties(updatedProps);

                        // Update node data
                        if (selectedNode) {
                          const updatedData = {
                            ...selectedNode.data,
                            customProperties: updatedProps,
                          };

                          useCanvasStore
                            .getState()
                            .setNodes(
                              useCanvasStore
                                .getState()
                                .nodes.map((node) =>
                                  node.id === selectedNode.id
                                    ? { ...node, data: updatedData }
                                    : node
                                )
                            );
                        }
                      }
                    }}
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index, optIndex)}
                    className="h-7 w-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() =>
                  handleAddOption(
                    index,
                    `Option ${(property.options?.length || 0) + 1}`
                  )
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={property.value === "true"}
              onCheckedChange={(checked) =>
                handleUpdateProperty(index, "value", checked)
              }
            />
            <Label className="text-sm">
              {property.value === "true" ? "Yes" : "No"}
            </Label>
          </div>
        );

      case "color":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={property.value || "#000000"}
              onChange={(e) =>
                handleUpdateProperty(index, "value", e.target.value)
              }
              className="w-12 h-9 p-1"
            />
            <Input
              type="text"
              value={property.value || "#000000"}
              onChange={(e) =>
                handleUpdateProperty(index, "value", e.target.value)
              }
              className="flex-1 text-sm"
            />
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="url"
                value={property.value}
                onChange={(e) =>
                  handleUpdateProperty(index, "value", e.target.value)
                }
                className="flex-1 text-sm"
                placeholder="https://example.com"
              />
              {property.value && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => window.open(property.value, "_blank")}
                >
                  <Link className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={property.value}
              onChange={(e) =>
                handleUpdateProperty(index, "value", e.target.value)
              }
              className="text-sm"
              placeholder="Image URL"
            />
            {property.value && (
              <div className="border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center p-2 h-24">
                <img
                  src={property.value || "/placeholder.svg"}
                  alt={property.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder.svg?height=100&width=100";
                  }}
                />
              </div>
            )}
          </div>
        );

      default: // text
        return (
          <Input
            type="text"
            value={property.value}
            onChange={(e) =>
              handleUpdateProperty(index, "value", e.target.value)
            }
            className="text-sm"
          />
        );
    }
  };

  // Get type icon for the property type
  const getTypeIcon = (type: PropertyType) => {
    switch (type) {
      case "longtext":
        return <AlignLeft className="h-4 w-4" />;
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "select":
        return <ChevronDown className="h-4 w-4" />;
      case "checkbox":
        return <Check className="h-4 w-4" />;
      case "color":
        return (
          <div
            className="w-4 h-4 rounded-full border border-gray-400"
            style={{ backgroundColor: "#000" }}
          />
        );
      case "url":
        return <Link className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  if (!selectedNode) return null;

  const nodeStyle = nodeStyles[selectedNode.id] || ({} as NodeStyle);
  const shapeName = nodeStyle.shape || "Rectangle";

  return (
    <div
      className="fixed top-0 right-0 z-50 h-full w-80 
      animate-slide-in-right 
      bg-white border-l border-gray-200 
      overflow-y-auto flex flex-col 
      shadow-lg"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium truncate">
          {shapeName} Shape Properties
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex-1">
              Properties
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="general"
          className="p-4 space-y-6 flex-1 overflow-y-auto"
        >
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add a description..."
              className="resize-none min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Dimensions
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Width</Label>
                <Input
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  onBlur={handleSaveDimensions}
                  placeholder="Width"
                  type="number"
                  min="50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Height</Label>
                <Input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={handleSaveDimensions}
                  placeholder="Height"
                  type="number"
                  min="50"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="properties"
          className="p-0 flex-1 overflow-hidden flex flex-col"
        >
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {customProperties.length > 0 ? (
              <div className="space-y-6">
                {customProperties.map((property, index) => (
                  <div
                    key={property.id}
                    className="border rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(property.type)}
                        <Input
                          value={property.name}
                          onChange={(e) =>
                            handleUpdateProperty(index, "name", e.target.value)
                          }
                          className="h-8 text-sm font-medium border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 w-auto max-w-[150px]"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={property.type}
                          onValueChange={(value) =>
                            handleUpdateProperty(index, "type", value)
                          }
                        >
                          <SelectTrigger className="h-7 w-[110px] text-xs border-none bg-gray-100 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="longtext">Long Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveProperty(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      {renderPropertyInput(property, index)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No custom properties yet</p>
                <p className="text-xs">Add your first property below</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t mt-auto bg-gray-50">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleAddProperty}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
