"use client";
import { Button } from "@/components/ui/button";
import { CANVAS_TYPE } from "@/types/store";
import { Image, Shapes } from "lucide-react";

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
    <>
      <div
        className={`w-[72px] border-r border-border flex flex-col items-center py-4 gap-2 ${className} z-30 bg-card`}
      >
        {canvasType === CANVAS_TYPE.HYBRID && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-lg hover:bg-accent border-signal canvas-shapes"
            onClick={onToggleSidebar}
          >
            <Shapes className="!h-6 !w-6 text-signal" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-lg hover:bg-accent cursor-move images-library"
          draggable
          onDragStart={(e) => onDragStart && onDragStart(e, "image")}
          onClick={onOpenImageManager}
        >
          <Image className="!h-6 !w-6" />
        </Button>
      </div>
    </>
  );
}
