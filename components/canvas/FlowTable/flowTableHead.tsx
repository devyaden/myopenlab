import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { PlusCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { COLUMN_TYPES } from "./columns";

interface FlowTableHeaderProps {
  customColumns: any[];
  handleDeleteColumn: (id: string) => void;
  setNewColumn: (newColumn: any) => void;
  newColumn: any;
  handleAddColumn: () => void;
  folderId: number;
  canvasId: number;
}

const FlowTableHeader = ({
  customColumns,
  handleDeleteColumn,
  setNewColumn,
  newColumn,
  handleAddColumn,
  folderId,
  canvasId,
}: FlowTableHeaderProps) => {
  const [canvases, setCanvases] = useState<{ id: number; name: string }[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  const fetchFolderCanvases = async () => {
    setLoading(true);
    const { error, data } = await supabase
      .from("canvas")
      .select("*")
      .eq("folder_id", folderId);

    if (error) {
      return toast({
        title: "Error",
        description: error.message || "Failed to fetch canvases",
        variant: "destructive",
      });
    }

    const filteredCanvases = data.filter(
      (canvas: any) => canvas.id !== canvasId
    );
    setCanvases(filteredCanvases);
    setLoading(false);
  };

  const fetchColumns = async () => {
    if (!newColumn.relatedCanvasId) return;
    const { data, error } = await supabase
      .from("custom_columns")
      .select("*")
      .eq("canvas_id", newColumn.relatedCanvasId);

    if (error) {
      return toast({
        title: "Error",
        description: error.message || "Failed to fetch columns",
        variant: "destructive",
      });
    }

    setColumns(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleAddColumn();
  };

  useEffect(() => {
    if (newColumn.relatedCanvasId) {
      fetchColumns();
    }
  }, [newColumn.relatedCanvasId]);

  useEffect(() => {
    if (newColumn.type === "relation") {
      fetchFolderCanvases();
    }
  }, [newColumn.type]);

  useEffect(() => {
    setFormValid(
      newColumn.name.trim() !== "" &&
        newColumn.type !== "" &&
        (newColumn.type !== "relation" ||
          (newColumn.relatedCanvasId !== null &&
            newColumn.relatedColumnId !== null))
    );
  }, [newColumn]);

  return (
    <TableHeader className="bg-gray-100">
      <TableRow>
        <TableHead></TableHead>
        <TableHead>ID</TableHead>
        <TableHead>Label</TableHead>
        <TableHead>Shape</TableHead>
        {/* <TableHead>Relations</TableHead> */}

        <TableHead>Actions</TableHead>
        {customColumns.map((column) => (
          <TableHead key={column.id} className="relative">
            {column.name}
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-0 top-1/2 -translate-y-1/2"
              onClick={() => handleDeleteColumn(column.id)}
            >
              <XCircle className="w-4 h-4 text-red-500" />
            </Button>
          </TableHead>
        ))}

        <TableHead>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost">
                <PlusCircle className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Column Name"
                    value={newColumn.name}
                    onChange={(e) =>
                      setNewColumn((prev: any) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                  <Select
                    value={newColumn.type}
                    onValueChange={(value) =>
                      setNewColumn((prev: any) => ({
                        ...prev,
                        type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(COLUMN_TYPES).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {newColumn.type === "relation" &&
                    (loading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Select
                          value={newColumn.relatedCanvasId?.toString() || ""}
                          onValueChange={(value) =>
                            setNewColumn((prev: any) => ({
                              ...prev,
                              relatedCanvasId: value ? parseInt(value) : null,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select canvas to relate to" />
                          </SelectTrigger>
                          <SelectContent>
                            {canvases.map((canvas) => (
                              <SelectItem
                                key={canvas.id}
                                value={canvas.id.toString()}
                              >
                                {canvas.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={newColumn.relatedColumnId?.toString() || ""}
                          onValueChange={(value) =>
                            setNewColumn((prev: any) => ({
                              ...prev,
                              relatedColumnId: value ? parseInt(value) : null,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column to relate to" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((column) => (
                              <SelectItem
                                key={column.id}
                                value={column.id.toString()}
                              >
                                {column.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ))}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!formValid}
                  className={`${!formValid ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Add Column
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default FlowTableHeader;
