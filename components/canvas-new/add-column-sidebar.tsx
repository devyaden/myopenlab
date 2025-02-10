import type React from "react";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
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

interface AddColumnSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (columnData: ColumnData) => void;
}

export interface ColumnData {
  title: string;
  type: string;
  options?: string[];
  relationDiagram?: string;
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
}) => {
  const [columnData, setColumnData] = useState<ColumnData>({
    title: "",
    type: "Text",
  });
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddColumn(columnData);
    setColumnData({ title: "", type: "Text" });
    onClose();
  };

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
              onValueChange={(value) =>
                setColumnData({ ...columnData, type: value })
              }
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
          {columnData.type === "Select" || columnData.type === "Multiselect" ? (
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
          ) : null}
          {columnData.type === "Relation" ? (
            <div>
              <Label htmlFor="relationDiagram">Relation Diagram</Label>
              <Input
                id="relationDiagram"
                value={columnData.relationDiagram || ""}
                onChange={(e) =>
                  setColumnData({
                    ...columnData,
                    relationDiagram: e.target.value,
                  })
                }
              />
            </div>
          ) : null}
          {columnData.type === "Rollup" ? (
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
          ) : null}
        </div>
        <Button type="submit" className="mt-4 w-full">
          Add Column
        </Button>
      </form>
    </div>
  );
};
