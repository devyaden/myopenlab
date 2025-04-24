import { Button } from "@/components/ui/button";
import { CANVAS_TYPE } from "@/types/store";
import { ViewMode, VIEW_MODE } from "./table-view/table.types";
import Image from "next/image";

interface ViewModeSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: "canvas" | "table" | "document") => void;
  canvasType: CANVAS_TYPE | null;
}

export function ViewModeSwitcher({
  viewMode,
  onViewModeChange,
  canvasType,
}: ViewModeSwitcherProps) {
  // Only show all options for hybrid canvas
  const isHybrid = canvasType === CANVAS_TYPE.HYBRID;
  const isTable = canvasType === CANVAS_TYPE.TABLE;
  const isDocument = canvasType === CANVAS_TYPE.DOCUMENT;

  return (
    <div className="bg-gray-100 p-1 rounded-lg flex">
      {(isHybrid || isTable) && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 rounded-md ${
            viewMode === VIEW_MODE.table ? "bg-white shadow-sm" : ""
          }`}
          onClick={() => onViewModeChange("table")}
          aria-label="Table view"
        >
          <Image
            src="/assets/canvas/table.svg"
            alt="Table Icon"
            height={10}
            width={10}
            className="h-4 w-4"
          />
        </Button>
      )}
      {isHybrid && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 rounded-md ${
            viewMode === VIEW_MODE.canvas ? "bg-white shadow-sm" : ""
          }`}
          onClick={() => onViewModeChange("canvas")}
          aria-label="Canvas view"
        >
          <Image
            src="/assets/canvas/canvas.svg"
            alt="Canvas Icon"
            height={10}
            width={10}
            className="h-4 w-4"
          />
        </Button>
      )}
      {(isHybrid || isDocument) && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 rounded-md ${
            viewMode === VIEW_MODE.document ? "bg-white shadow-sm" : ""
          }`}
          onClick={() => onViewModeChange("document")}
          aria-label="Document view"
        >
          <Image
            src="/assets/canvas/document.svg"
            alt="Document Icon"
            height={10}
            width={10}
            className="h-4 w-4"
          />
        </Button>
      )}
    </div>
  );
}
