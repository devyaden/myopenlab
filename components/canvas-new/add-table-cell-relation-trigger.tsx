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

  const handleSelectedValue = (column: Column) => {
    onSelectValue([...value, column]);
  };

  const handleRemoveValue = (column: Column) => {
    onSelectValue(value.filter((val) => val.label !== column.label));
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2">
        {value?.length ? (
          value?.map((val, index) => (
            <div key={index} className="flex items-center">
              <File className="w-4 h-4" />
              <div className="flex flex-col">
                {val["label"]}
                {/* {visibleFields.map((field) => (
                  <p key={field} className="mr-2 text-sm">
                    {val[field] || `No ${field}`}
                  </p>
                ))} */}
              </div>
            </div>
          ))
        ) : (
          <Button variant="ghost">
            <Plus className="mr-2" /> Add
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2  justify-between items-center">
          <p>{relatedCanvasData?.canvasName}</p>

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
                  {column[field] || `No ${field}`}
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
                  {column[field] || `No ${field}`}
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
