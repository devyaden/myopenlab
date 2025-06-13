import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AlertCircle, X, Plus, Info } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ColumnDefinition } from "@/types/store";
import { useCanvasStore } from "@/lib/store/useCanvas";

interface AddColumnSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (columnData: ColumnDefinition) => void;
  canvases: { id: string; name: string; canvas_type: string }[];
  canvasId: string;
  relationCanvases: any[];
  columns: any[];
}

const validationTypes = [
  "Email",
  "Phone Number",
  "URL",
  "Number",
  "Date",
  "Text",
  "Long Text",
  "Select",
  "Multiselect",
  "Created Time",
  "Created by",
  "Last edited time",
  "Last edited by",
  "Checkbox",
  "Relation",
  "Rollup",
];

// Enhanced OptionsManager component
const OptionsManager: React.FC<{
  options: string[];
  onChange: (options: string[]) => void;
  placeholder?: string;
}> = ({ options, onChange, placeholder = "Add an option" }) => {
  const [newOption, setNewOption] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      onChange([...options, newOption.trim()]);
      setNewOption("");
      setIsAddingOption(false);
    }
  };

  const removeOption = (indexToRemove: number) => {
    onChange(options.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    } else if (e.key === "Escape") {
      setNewOption("");
      setIsAddingOption(false);
    }
  };

  useEffect(() => {
    if (isAddingOption && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingOption]);

  return (
    <div className="space-y-3">
      {/* Display existing options as chips */}
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg text-sm border border-green-200 hover:bg-green-100 transition-colors"
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#bbf7d0",
                color: "#15803d",
              }}
            >
              <span className="font-medium">{option}</span>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="hover:bg-green-200 rounded-full p-0.5 transition-colors group"
                aria-label={`Remove ${option}`}
                style={{ "--tw-hover-bg-opacity": "1" } as React.CSSProperties}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#dcfce7")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X className="h-3 w-3 group-hover:text-green-800" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Info className="h-4 w-4 mx-auto mb-1 text-gray-400" />
          No options added yet
        </div>
      )}

      {/* Add new option */}
      {isAddingOption ? (
        <div className="relative">
          <Input
            ref={inputRef}
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`${placeholder} (Press Enter to save)`}
            className="pr-8"
            style={
              {
                "--tw-ring-color": "#09BC8A",
                borderColor: "#09BC8A",
              } as React.CSSProperties
            }
            onFocus={(e) => {
              e.target.style.borderColor = "#09BC8A";
              e.target.style.boxShadow = "0 0 0 2px rgba(9, 188, 138, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => {
              setNewOption("");
              setIsAddingOption(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1 transition-colors"
            aria-label="Cancel adding option"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingOption(true)}
          className="w-full justify-start text-gray-600 border-dashed border-gray-300 transition-colors"
          style={
            {
              "--tw-hover-border-color": "#09BC8A",
              "--tw-hover-text-color": "#09BC8A",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#09BC8A";
            e.currentTarget.style.color = "#09BC8A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.color = "#4b5563";
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add an option
        </Button>
      )}
    </div>
  );
};

// Form Section Component for better organization
const FormSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {title && <h3 className="text-sm font-medium text-gray-900">{title}</h3>}
    {children}
  </div>
);

export const AddColumnSidebar: React.FC<AddColumnSidebarProps> = ({
  isOpen,
  onClose,
  onAddColumn,
  canvases,
  canvasId,
  relationCanvases,
  columns,
}) => {
  const [columnData, setColumnData] = useState<ColumnDefinition>({
    title: "",
    type: "Text",
  });

  const canvasStore = useCanvasStore();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedRelationCanvas, setSelectedRelationCanvas] = useState<
    any | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      if (!validateColumnData()) {
        setIsSubmitting(false);
        return;
      }

      try {
        // Prepare column data with dataKey
        const finalColumnData = {
          ...columnData,
          // For new columns, dataKey defaults to the title unless it's a special type
          dataKey: columnData.dataKey || columnData.title,
        };

        // Add the column to the current canvas
        onAddColumn(finalColumnData);

        // If this is a relation column, create a reciprocal relation in the related canvas
        if (columnData.type === "Relation" && columnData.related_canvas_id) {
          try {
            // Find the related canvas name
            const relatedCanvas = canvases.find(
              (canvas) => canvas.id === columnData.related_canvas_id
            );

            if (relatedCanvas) {
              // Create reciprocal relation column data
              const reciprocalColumnData = {
                title: `${canvasStore.name} - ${columnData.title}`, // Name it as "SourceCanvas - ColumnName"
                type: "Relation",
                related_canvas_id: canvasId, // Point back to the current canvas
                required: columnData.required || false,
                dataKey: `${canvasStore.name} - ${columnData.title}`, // Set dataKey for reciprocal column
              };

              // Create the reciprocal column in the related canvas
              await canvasStore.createColumnInCanvas(
                columnData.related_canvas_id,
                reciprocalColumnData
              );
            }
          } catch (error) {
            console.error("Error creating reciprocal relation:", error);
            // Continue with normal flow even if reciprocal creation fails
          }
        }

        // Reset state and close sidebar
        setColumnData({ title: "", type: "Text" });
        setSelectedRelationCanvas(null);
        setError(null);
        setFieldErrors({});
        onClose();
      } catch (error) {
        console.error("Error creating column:", error);
        setError("Failed to create column. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [columnData, canvasId, canvases, canvasStore, onAddColumn, onClose]
  );

  const validateColumnData = (): boolean => {
    const newFieldErrors: Record<string, string> = {};

    if (!columnData.title.trim()) {
      newFieldErrors.title = "Column title is required";
    }

    // Check for duplicate column titles
    const isDuplicate = columns.some(
      (column) =>
        column.title.toLowerCase() === columnData.title.trim().toLowerCase()
    );

    if (isDuplicate) {
      newFieldErrors.title = "A column with this title already exists";
    }

    if (columnData?.type === "Relation") {
      if (!columnData.related_canvas_id) {
        if (otherCanvases.length === 0) {
          newFieldErrors.relation =
            "No canvases found. Create a new canvas to create a relation.";
        } else {
          newFieldErrors.relation = "Please select a canvas to relate to";
        }
      }
    }

    if (
      (columnData?.type === "Select" || columnData?.type === "Multiselect") &&
      (!columnData.options || columnData.options.length === 0)
    ) {
      newFieldErrors.options =
        "Please add at least one option for Select or Multiselect";
    }

    if (columnData?.type === "Rollup" && !columnData.rollup_column_id) {
      newFieldErrors.rollup = "Please specify a rollup column";
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setError("Please fix the errors above");
      return false;
    }

    setError(null);
    return true;
  };

  // Real-time validation as user types
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setColumnData({
      ...columnData,
      title: newTitle,
      // Update dataKey when title changes for new columns
      dataKey: newTitle,
    });

    // Clear previous title errors
    if (fieldErrors.title) {
      setFieldErrors((prev) => ({ ...prev, title: "" }));
    }

    if (newTitle.trim()) {
      const isDuplicate = columns.some(
        (column) => column.title.toLowerCase() === newTitle.trim().toLowerCase()
      );

      if (isDuplicate) {
        setFieldErrors((prev) => ({
          ...prev,
          title: "A column with this title already exists",
        }));
      }
    }
  };

  const otherCanvases = useMemo(() => {
    return canvases.filter((canvas) => canvas.id !== canvasId);
  }, [canvases, canvasId]);

  const handleRollupRelationChange = (value: string) => {
    if (!value) return;

    const selectedCanvas = relationCanvases.find((c) => c.id === value);
    if (!selectedCanvas) return;

    setSelectedRelationCanvas(selectedCanvas);

    setColumnData((prevData) => ({
      ...prevData,
      rollupRelation: value,
      rollupRelationName: selectedCanvas.canvasName,
      rollupColumn: undefined,
    }));

    // Clear rollup errors
    if (fieldErrors.rollup) {
      setFieldErrors((prev) => ({ ...prev, rollup: "" }));
    }
  };

  const handleTypeChange = (value: string) => {
    setColumnData({
      ...columnData,
      type: value,
      options: undefined,
      related_canvas_id: undefined,
      rollup_target_column: undefined,
      // Keep dataKey as is, since it's based on title
    });

    // Clear type-specific errors
    setFieldErrors({});
    setError(null);
  };

  useEffect(() => {
    return () => {
      setSelectedRelationCanvas(null);
      setColumnData({ title: "", type: "Text" });
      setError(null);
      setFieldErrors({});
    };
  }, []);

  if (!isOpen) return null;

  const isFormValid =
    columnData.title.trim() && Object.keys(fieldErrors).length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Add New Column
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <FormSection>
              <div className="space-y-2">
                <Label
                  htmlFor="columnTitle"
                  className="text-sm font-medium text-gray-700"
                >
                  Column Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="columnTitle"
                  value={columnData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter column name"
                  className={`transition-colors ${
                    fieldErrors.title
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  required
                />
                {fieldErrors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="columnType"
                  className="text-sm font-medium text-gray-700"
                >
                  Column Type
                </Label>
                <Select
                  value={columnData?.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger
                    className="transition-colors"
                    style={
                      {
                        "--tw-ring-color": "#09BC8A",
                      } as React.CSSProperties
                    }
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#09BC8A";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(9, 188, 138, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {validationTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="cursor-pointer"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            {/* Type-specific configurations */}
            {(columnData?.type === "Select" ||
              columnData?.type === "Multiselect") && (
              <FormSection title="Configure Options">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Options <span className="text-red-500">*</span>
                  </Label>
                  <OptionsManager
                    options={columnData.options || []}
                    onChange={(options) =>
                      setColumnData({
                        ...columnData,
                        options,
                      })
                    }
                    placeholder="Enter option name"
                  />
                  {fieldErrors.options && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.options}
                    </p>
                  )}
                </div>
              </FormSection>
            )}

            {columnData?.type === "Relation" && (
              <FormSection title="Relation Settings">
                <div className="space-y-2">
                  <Label
                    htmlFor="relationCanvas"
                    className="text-sm font-medium text-gray-700"
                  >
                    Related Canvas <span className="text-red-500">*</span>
                  </Label>
                  {otherCanvases.length > 0 ? (
                    <>
                      <Select
                        value={columnData.related_canvas_id || ""}
                        onValueChange={(value) => {
                          setColumnData({
                            ...columnData,
                            related_canvas_id: value,
                          });
                          if (fieldErrors.relation) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              relation: "",
                            }));
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`transition-colors ${
                            fieldErrors.relation ? "border-red-300" : ""
                          }`}
                          style={
                            {
                              "--tw-ring-color": fieldErrors.relation
                                ? "#ef4444"
                                : "#09BC8A",
                            } as React.CSSProperties
                          }
                          onFocus={(e) => {
                            if (!fieldErrors.relation) {
                              e.currentTarget.style.borderColor = "#09BC8A";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 2px rgba(9, 188, 138, 0.2)";
                            } else {
                              e.currentTarget.style.borderColor = "#ef4444";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 2px rgba(239, 68, 68, 0.2)";
                            }
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              fieldErrors.relation ? "#fca5a5" : "#d1d5db";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <SelectValue placeholder="Select related canvas" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherCanvases.map((canvas) => (
                            <SelectItem
                              key={canvas.id}
                              value={canvas.id}
                              className="cursor-pointer"
                            >
                              {canvas.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.relation && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.relation}
                        </p>
                      )}
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No canvases available</AlertTitle>
                      <AlertDescription>
                        Create a new canvas in this folder to create a relation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </FormSection>
            )}

            {columnData?.type === "Rollup" && (
              <FormSection title="Rollup Configuration">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Relation
                    </Label>
                    <Select
                      value={columnData.rollup_column_id || ""}
                      onValueChange={handleRollupRelationChange}
                    >
                      <SelectTrigger
                        className="transition-colors"
                        style={
                          {
                            "--tw-ring-color": "#09BC8A",
                          } as React.CSSProperties
                        }
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#09BC8A";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 2px rgba(9, 188, 138, 0.2)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#d1d5db";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <SelectValue placeholder="Select relation">
                          {/* @ts-ignore */}
                          {columnData.rollupRelationName || "Select relation"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {Boolean(relationCanvases.length) ? (
                            relationCanvases?.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                                className="cursor-pointer"
                              >
                                {option.canvasName}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="text-sm p-4 text-gray-500 text-center">
                              <Info className="h-4 w-4 mx-auto mb-2" />
                              No relations found. Create a relation first!
                            </div>
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRelationCanvas && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="rollupColumn"
                        className="text-sm font-medium text-gray-700"
                      >
                        Property <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={columnData.rollup_column_id || ""}
                        onValueChange={(value) => {
                          setColumnData({
                            ...columnData,
                            rollup_column_id: value,
                          });
                          if (fieldErrors.rollup) {
                            setFieldErrors((prev) => ({ ...prev, rollup: "" }));
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`transition-colors ${
                            fieldErrors.rollup
                              ? "border-red-300 focus:ring-red-500"
                              : "focus:ring-blue-500"
                          }`}
                        >
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {selectedRelationCanvas?.columns?.map(
                              (column: any) => (
                                <SelectItem
                                  key={column.id}
                                  value={column.id}
                                  className="cursor-pointer"
                                >
                                  {column.title}
                                </SelectItem>
                              )
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      {fieldErrors.rollup && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.rollup}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </FormSection>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleSubmit}
            className={`w-full transition-all ${
              !isFormValid || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : ""
            }`}
            style={
              {
                backgroundColor:
                  isFormValid && !isSubmitting ? "#09BC8A" : undefined,
                "--tw-hover-bg": "#059669",
                "--tw-ring-color": "#09BC8A",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (isFormValid && !isSubmitting) {
                e.currentTarget.style.backgroundColor = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (isFormValid && !isSubmitting) {
                e.currentTarget.style.backgroundColor = "#09BC8A";
              }
            }}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Column...
              </>
            ) : (
              "Add Column"
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
