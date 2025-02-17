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
import { useMemo, useRef, useState } from "react";

interface AddColumnSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (columnData: ColumnData) => void;
  canvases: { id: string; name: string }[];
  canvasId: string;
}

export interface ColumnData {
  title: string;
  type: string;
  options?: string[];
  relationCanvas?: string;
  rollupColumn?: string;
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
  "User",
  "Relation",
  "Rollup",
];

export const AddColumnSidebar: React.FC<AddColumnSidebarProps> = ({
  isOpen,
  onClose,
  onAddColumn,
  canvases,
  canvasId,
}) => {
  const [columnData, setColumnData] = useState<ColumnData>({
    title: "",
    type: "Text",
  });
  const [error, setError] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateColumnData()) {
      return;
    }
    onAddColumn(columnData);
    setColumnData({ title: "", type: "Text" });
    setError(null);
    onClose();
  };

  const validateColumnData = (): boolean => {
    if (!columnData.title.trim()) {
      setError("Column title is required");
      return false;
    }

    if (columnData.type === "Relation") {
      if (!columnData.relationCanvas) {
        if (relationCanvases.length === 0) {
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
      (columnData.type === "Select" || columnData.type === "Multiselect") &&
      (!columnData.options || columnData.options.length === 0)
    ) {
      setError("Please add at least one option for Select or Multiselect");
      return false;
    }

    if (columnData.type === "Rollup" && !columnData.rollupColumn) {
      setError("Please specify a rollup column");
      return false;
    }

    setError(null);
    return true;
  };

  const relationCanvases = useMemo(() => {
    return canvases.filter((canvas) => canvas.id !== canvasId);
  }, [canvases, canvasId]);

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
              onChange={(e) =>
                setColumnData({ ...columnData, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="columnType">Validation Type</Label>
            <Select
              value={columnData.type}
              onValueChange={(value) => {
                setColumnData({
                  ...columnData,
                  type: value,
                  options: undefined,
                  relationCanvas: undefined,
                  rollupColumn: undefined,
                });
                setError(null);
              }}
            >
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
          {(columnData.type === "Select" ||
            columnData.type === "Multiselect") && (
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
          {columnData.type === "Relation" && (
            <div>
              <Label htmlFor="relationCanvas">Related Canvas</Label>
              {canvases.length > 0 ? (
                <Select
                  value={columnData.relationCanvas || ""}
                  onValueChange={(value) =>
                    setColumnData({ ...columnData, relationCanvas: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related canvas" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationCanvases.map((canvas) => (
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
          {columnData.type === "Rollup" && (
            <div>
              <Label htmlFor="rollupColumn">Rollup Column</Label>
              <Input
                id="rollupColumn"
                value={columnData.rollupColumn || ""}
                onChange={(e) =>
                  setColumnData({ ...columnData, rollupColumn: e.target.value })
                }
              />
            </div>
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
