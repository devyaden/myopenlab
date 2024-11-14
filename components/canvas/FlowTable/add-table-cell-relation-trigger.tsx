import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { File, Minus } from "lucide-react";
import { useMemo } from "react";

interface AddTableCellTriggerProps {
  label: string;
  columns: any[];
  onSelectValue: (selected: { [name: string]: string }[]) => void;
  value: {
    [key: string]: string;
  }[];
}

const AddTableCellTrigger = ({
  value = [],
  label,
  columns,
  onSelectValue,
}: AddTableCellTriggerProps) => {
  const handleSelectedValue = (column: { [key: string]: string }) => {
    onSelectValue([...value, column]);
  };

  const dropdownValues = useMemo(() => {
    // filter the columns values based on the values array
    // return columns.filter(column=>column.)
    return columns.filter(
      (column) => !value.some((val) => val.id === column.id)
    );
  }, [value, columns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2">
        {value?.map((val) => (
          <>
            <File className="w-4 h-4" />
            <p className="mr-2">{val?.title ?? "No Title"}</p>
          </>
        ))}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <div className="p-2">
          <span className="mr-2 text-gray-500 text-sm">
            {value.length} Linked Pages
          </span>
        </div>
        <DropdownMenuSeparator />
        {value?.map((column) => (
          <DropdownMenuItem
            key={column.id}
            className="gap-2 hover:bg-slate-100 cursor-pointer"
          >
            <File className="w-4 h-4" />

            <div>
              <p className="mr-2">{column?.title ?? "No Title"}</p>
              <p className="mr-2 text-gray-500 text-xs">{column?.id}</p>
            </div>

            <Minus className="w-4 h-4" />
          </DropdownMenuItem>
        ))}

        <div className="p-2">
          <span className="mr-2 text-gray-500 text-sm">Link a page</span>
        </div>
        <DropdownMenuSeparator />
        {dropdownValues?.map((column) => (
          <DropdownMenuItem
            key={column.id}
            onClick={() => {
              handleSelectedValue(column);
            }}
            className="gap-2 hover:bg-slate-100 cursor-pointer"
          >
            <File className="w-4 h-4" />

            <div>
              <p className="mr-2">{column?.title ?? "No Title"}</p>
              <p className="mr-2 text-gray-500 text-xs">{column?.id}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddTableCellTrigger;
