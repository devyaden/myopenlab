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
import { PlusCircle, XCircle } from "lucide-react";
import { COLUMN_TYPES } from "./columns";

interface FlowTableHeaderProps {
  customColumns: any[];
  handleDeleteColumn: (id: string) => void;
  setNewColumn: (newColumn: any) => void;
  newColumn: any;
  handleAddColumn: () => void;
}

const FlowTableHeader = ({
  customColumns,
  handleDeleteColumn,
  setNewColumn,
  newColumn,
  handleAddColumn,
}: FlowTableHeaderProps) => {
  return (
    <TableHeader className="bg-gray-100">
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Label</TableHead>
        <TableHead>Shape</TableHead>
        <TableHead>Relations</TableHead>
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
                  />
                  <Select
                    value={newColumn.type}
                    onValueChange={(value) =>
                      setNewColumn((prev: any) => ({ ...prev, type: value }))
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
                </div>
                <Button onClick={handleAddColumn} className="w-full">
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
