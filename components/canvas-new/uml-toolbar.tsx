import { Square, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UMLToolbarProps {
  onAddNode: () => void;
  onAddSwimlane: () => void;
}

export function UMLToolbar({ onAddNode, onAddSwimlane }: UMLToolbarProps) {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-2 z-10">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onAddNode}
        >
          <Square className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onAddSwimlane}
        >
          <Columns className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
