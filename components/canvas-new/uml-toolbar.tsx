import { Button } from "@/components/ui/button";
import {
  CircleDotDashed,
  Cross,
  Grid2X2,
  Maximize,
  Ruler,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { BackgroundVariant } from "reactflow";

interface UMLToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleRuler: () => void;
  onChangeBackground: (background: BackgroundVariant) => void;
}

export function UMLToolbar({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onChangeBackground,
  onToggleRuler,
}: UMLToolbarProps) {
  return (
    <div className="absolute top-6 left-6 bg-white rounded-lg shadow-md border border-gray-200 p-2 z-10">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onZoomIn}
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onZoomOut}
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onFitToScreen}
        >
          <Maximize className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onToggleRuler}
        >
          <Ruler className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChangeBackground(BackgroundVariant.Dots)}
        >
          <CircleDotDashed className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChangeBackground(BackgroundVariant.Cross)}
        >
          <Cross className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChangeBackground(BackgroundVariant.Lines)}
        >
          <Grid2X2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
