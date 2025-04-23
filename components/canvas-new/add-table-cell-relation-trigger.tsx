import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { File, Minus, Plus, Settings } from "lucide-react";
import { useMemo, useState } from "react";

interface Column {
  [key: string]: string;
}

interface RelatedCanvasData {
  canvasName: string;
  columns: Column[];
}

interface AddTableCellTriggerProps {
  label: string;
  relatedCanvasData: RelatedCanvasData | null;
  onSelectValue: (selected: Column[]) => void;
  value: Column[];
}

const AddTableCellTrigger = ({
  value = [],
  label,
  relatedCanvasData,
  onSelectValue,
}: AddTableCellTriggerProps) => {
  const [visibleFields, setVisibleFields] = useState<string[]>(["label"]);
  const [open, setOpen] = useState(false);

  const handleSelectedValue = (column: Column) => {
    // Ensure column has all required properties
    if (!column.id || !column.label) {
      console.error("Invalid column data:", column);
      return;
    }

    // Create a clean object with just the needed properties
    const cleanColumn = {
      id: column.id,
      label: column.label,
    };

    const newValue = [...value, cleanColumn];
    console.log("New relation values:", newValue);

    // Close dropdown and update value
    setTimeout(() => {
      onSelectValue(newValue);
    }, 0);
  };

  const handleRemoveValue = (column: Column) => {
    console.log("Removing relation value:", column);
    const newValue = value.filter((val) => val.id !== column.id);
    console.log("Updated relation values after removal:", newValue);
    onSelectValue(newValue);
  };

  const dropdownValues = useMemo(() => {
    return relatedCanvasData?.columns?.filter(
      (column) => !value.some((val) => val.id === column.id)
    );
  }, [value, relatedCanvasData]);

  const availableFields = useMemo(() => {
    if (!relatedCanvasData?.columns?.[0]) return [];
    return Object.keys(relatedCanvasData.columns[0]);
  }, [relatedCanvasData]);

  const toggleFieldVisibility = (field: string) => {
    setVisibleFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined) {
      return "No value";
    } else if (typeof value === "string") {
      return value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    } else if (typeof value === "object") {
      try {
        // For objects, try to convert to JSON string
        return JSON.stringify(value).substring(0, 20) + "...";
      } catch (e) {
        return "Complex object";
      }
    } else {
      return "Unknown format";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className="flex items-center gap-2 p-2 w-full"
      >
        {value?.length ? (
          <div className="flex flex-wrap gap-2 w-full">
            {value.map((val, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-md px-2 py-1"
              >
                <File className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {typeof val.label === "string" ? val.label : "Item"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Button variant="ghost" className="w-full flex justify-start">
            <Plus className="mr-2" /> Add
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2 flex justify-between items-center">
          <p className="font-medium">{relatedCanvasData?.canvasName}</p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-sm">
              {value.length} Linked Items
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {availableFields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field}
                    checked={visibleFields.includes(field)}
                    onCheckedChange={() => toggleFieldVisibility(field)}
                  >
                    {field}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DropdownMenuSeparator />

        {value?.map((column, index) => (
          <DropdownMenuItem
            key={index}
            className="gap-2 hover:bg-slate-100 cursor-pointer"
          >
            <File className="w-4 h-4" />
            <div className="flex-1">
              {visibleFields.map((field) => (
                <p
                  key={field}
                  className={
                    field === "label" ? "font-medium" : "text-gray-500 text-xs"
                  }
                >
                  {field}: {renderFieldValue(column[field])}
                </p>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveValue(column);
              }}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </DropdownMenuItem>
        ))}

        <div className="p-2">
          <span className="text-gray-500 text-sm">Link an item</span>
        </div>

        <DropdownMenuSeparator />

        {dropdownValues?.map((column, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleSelectedValue(column)}
            className="gap-2 hover:bg-slate-100 cursor-pointer"
          >
            <File className="w-4 h-4" />
            <div>
              {visibleFields.map((field) => (
                <p
                  key={field}
                  className={
                    field === "label" ? "font-medium" : "text-gray-500 text-xs"
                  }
                >
                  {field}: {renderFieldValue(column[field])}
                </p>
              ))}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddTableCellTrigger;
