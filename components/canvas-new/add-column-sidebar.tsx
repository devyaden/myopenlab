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
import { AlertCircle, X } from "lucide-react";
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
  const [selectedRelationCanvas, setSelectedRelationCanvas] = useState<
    any | null
  >(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateColumnData()) {
        return;
      }

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
      onClose();
    },
    [columnData, canvasId, canvases, canvasStore, onAddColumn, onClose]
  );

  const validateColumnData = (): boolean => {
    if (!columnData.title.trim()) {
      setError("Column title is required");
      return false;
    }

    // Check for duplicate column titles
    const isDuplicate = columns.some(
      (column) =>
        column.title.toLowerCase() === columnData.title.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError("A column with this title already exists");
      return false;
    }

    if (columnData?.type === "Relation") {
      if (!columnData.related_canvas_id) {
        if (otherCanvases.length === 0) {
          setError(
            "No canvases found. Create a new canvas to create a relation."
          );
        } else {
          setError("Please select a canvas to relate to");
        }
        return false;
      }
    }

    if (
      (columnData?.type === "Select" || columnData?.type === "Multiselect") &&
      (!columnData.options || columnData.options.length === 0)
    ) {
      setError("Please add at least one option for Select or Multiselect");
      return false;
    }

    if (columnData?.type === "Rollup" && !columnData.rollup_column_id) {
      setError("Please specify a rollup column");
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

    if (newTitle.trim()) {
      const isDuplicate = columns.some(
        (column) => column.title.toLowerCase() === newTitle.trim().toLowerCase()
      );

      if (isDuplicate) {
        setError("A column with this title already exists");
      } else {
        setError(null);
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
    setError(null);
  };

  useEffect(() => {
    return () => {
      setSelectedRelationCanvas(null);
      setColumnData({ title: "", type: "Text" });
      setError(null);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl p-4 z-50 border-l border-gray-200"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Add New Column</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="columnTitle">Column Title</Label>
            <Input
              id="columnTitle"
              value={columnData.title}
              onChange={handleTitleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="columnType">Validation Type</Label>
            <Select value={columnData?.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {validationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(columnData?.type === "Select" ||
            columnData?.type === "Multiselect") && (
            <div>
              <Label htmlFor="options">Options (comma-separated)</Label>
              <Input
                id="options"
                value={columnData.options?.join(", ") || ""}
                onChange={(e) =>
                  setColumnData({
                    ...columnData,
                    options: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>
          )}
          {columnData?.type === "Relation" && (
            <div>
              <Label htmlFor="relationCanvas">Related Canvas</Label>
              {otherCanvases.length > 0 ? (
                <Select
                  value={columnData.related_canvas_id || ""}
                  onValueChange={(value) =>
                    setColumnData({ ...columnData, related_canvas_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related canvas" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherCanvases.map((canvas) => (
                      <SelectItem key={canvas.id} value={canvas.id}>
                        {canvas.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          )}
          {columnData?.type === "Rollup" && (
            <>
              <div className="space-y-2">
                <Label>Relation</Label>
                <Select
                  value={columnData.rollup_column_id || ""}
                  onValueChange={handleRollupRelationChange}
                >
                  <SelectTrigger className="w-full bg-background">
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
                        <p className="text-sm p-4 text-red-600 max-w-[200px]">
                          No relation found. Please create a relation first!
                        </p>
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {selectedRelationCanvas && (
                <div className="space-y-2">
                  <Label htmlFor="rollupColumn">Property</Label>
                  <Select
                    value={columnData.rollup_column_id || ""}
                    onValueChange={(value) =>
                      setColumnData({
                        ...columnData,
                        rollup_column_id: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {selectedRelationCanvas?.columns?.map((column: any) => (
                          <SelectItem
                            key={column.id}
                            value={column.id}
                            className="cursor-pointer"
                          >
                            {column.title}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="mt-4 w-full">
          Add Column
        </Button>
      </form>
    </div>
  );
};
