import { Button } from "@/components/ui/button";
import { CANVAS_TYPE } from "@/types/store";
import { Image, Printer, Shapes } from "lucide-react";

interface VerticalNavProps {
  className?: string;
  onToggleSidebar: () => void;
  canvasType: CANVAS_TYPE | null;
  onDragStart?: (event: React.DragEvent, shapeType: string) => void;
  onOpenImageManager?: () => void;
}

export function VerticalNav({
  className,
  onToggleSidebar,
  canvasType,
  onDragStart,
  onOpenImageManager,
}: VerticalNavProps) {
  return (
    <div
      className={`w-[72px] border-r border-gray-200 flex flex-col items-center py-4 gap-2 ${className} z-30 bg-white`}
    >
      {canvasType === CANVAS_TYPE.HYBRID && (
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-lg hover:bg-gray-100 border-yadn-accent-green"
          onClick={onToggleSidebar}
        >
          <Shapes className="!h-6 !w-6 text-yadn-accent-green" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Printer className="!h-6 !w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100 cursor-move"
        draggable
        onDragStart={(e) => onDragStart && onDragStart(e, "image")}
        onClick={onOpenImageManager}
      >
        <Image className="!h-6 !w-6" />
      </Button>
    </div>
  );
}
