import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

/**
 * The relation cell value picker. Phase 5: this used to be a flat DropdownMenu
 * listing EVERY related row with no search (the ~150-item picker the plan flags).
 * It is now a searchable cmdk Command (filters by label + any visible field),
 * while preserving the exact contract: multi-select add/remove, the {id,label}
 * shape stored on select, and the per-field visibility settings.
 */
const AddTableCellTrigger = ({
  value = [],
  relatedCanvasData,
  onSelectValue,
}: AddTableCellTriggerProps) => {
  const [visibleFields, setVisibleFields] = useState<string[]>(["label"]);
  const [open, setOpen] = useState(false);

  const handleSelectedValue = (column: Column) => {
    if (!column.id || !column.label) {
      console.error("Invalid column data:", column);
      return;
    }
    // Store only the stable contract shape (id + label); the picker keeps open
    // so several items can be linked in one pass.
    const cleanColumn = { id: column.id, label: column.label };
    onSelectValue([...value, cleanColumn]);
  };

  const handleRemoveValue = (column: Column) => {
    onSelectValue(value.filter((val) => val.id !== column.id));
  };

  const dropdownValues = useMemo(() => {
    return (
      relatedCanvasData?.columns?.filter(
        (column) => !value.some((val) => val.id === column.id)
      ) ?? []
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

  const renderFieldValue = (val: any) => {
    if (val === null || val === undefined) return "No value";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return val.toString();
    if (typeof val === "object") {
      try {
        return JSON.stringify(val).substring(0, 20) + "...";
      } catch {
        return "Complex object";
      }
    }
    return "Unknown format";
  };

  // cmdk filters on each item's `value`. Build a searchable string from the
  // visible fields (+ id for uniqueness so same-label rows stay distinct).
  const searchText = (column: Column) =>
    [...visibleFields.map((f) => column[f] ?? ""), column.id].join(" ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="flex items-center gap-2 p-2 w-full">
        {value?.length ? (
          <div className="flex flex-wrap gap-2 w-full cursor-pointer">
            {value.map((val, index) => (
              <div
                key={index}
                className="flex items-center bg-muted rounded-md px-2 py-1"
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
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0">
        <div className="p-2 flex justify-between items-center">
          <p className="font-medium truncate">{relatedCanvasData?.canvasName}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">{value.length} Linked</span>
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

        {value?.length > 0 && (
          <div className="border-t px-1 py-1 max-h-32 overflow-y-auto">
            {value.map((column, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-slate-100"
              >
                <File className="w-4 h-4" />
                <div className="flex-1">
                  {visibleFields.map((field) => (
                    <p
                      key={field}
                      className={
                        field === "label"
                          ? "font-medium text-sm"
                          : "text-muted-foreground text-xs"
                      }
                    >
                      {renderFieldValue(column[field])}
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
              </div>
            ))}
          </div>
        )}

        <Command className="border-t">
          <CommandInput placeholder="Search items to link…" />
          <CommandList>
            <CommandEmpty>No matching items.</CommandEmpty>
            <CommandGroup heading="Link an item">
              {dropdownValues.map((column, index) => (
                <CommandItem
                  key={column.id ?? index}
                  value={searchText(column)}
                  onSelect={() => handleSelectedValue(column)}
                  className="gap-2 cursor-pointer"
                >
                  <File className="w-4 h-4" />
                  <div className="flex-1">
                    {visibleFields.map((field) => (
                      <p
                        key={field}
                        className={
                          field === "label"
                            ? "font-medium"
                            : "text-muted-foreground text-xs"
                        }
                      >
                        {renderFieldValue(column[field])}
                      </p>
                    ))}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AddTableCellTrigger;
