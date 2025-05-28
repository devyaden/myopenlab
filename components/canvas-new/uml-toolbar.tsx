import { Button } from "@/components/ui/button";
import {
  CircleDotDashed,
  Cross,
  Grid2X2,
  Maximize,
  Palette,
  Ruler,
  ZoomIn,
  ZoomOut,
  Map,
} from "lucide-react";
import { useState } from "react";
import { BackgroundVariant } from "reactflow";

interface UMLToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleRuler: () => void;
  onChangeBackground: (background: BackgroundVariant) => void;
  onChangeBackgroundColor: (color: string) => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: (show: boolean) => void;
  readOnly?: boolean;
}

export function UMLToolbar({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onChangeBackground,
  onToggleRuler,
  onChangeBackgroundColor,
  showMiniMap = true,
  onToggleMiniMap,
  readOnly,
}: UMLToolbarProps) {
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // Accent colors for background
  const backgroundColors = [
    { name: "white", color: "#ffffff" },
    { name: "light", color: "#f8f9fa" },
    { name: "blue", color: "#eef6ff" },
    { name: "green", color: "#f0fdf4" },
    { name: "purple", color: "#faf5ff" },
    { name: "yellow", color: "#fffbeb" },
    { name: "pink", color: "#fdf2f8" },
    { name: "teal", color: "#ecfeff" },
    { name: "orange", color: "#fff7ed" },
    { name: "indigo", color: "#eef2ff" },
    { name: "slate", color: "#f8fafc" },
    { name: "rose", color: "#fff1f2" },
  ];

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

        {onToggleMiniMap && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${!showMiniMap ? "opacity-50" : ""}`}
            onClick={() => onToggleMiniMap(!showMiniMap)}
          >
            <Map className="h-5 w-5" />
          </Button>
        )}

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

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            disabled={readOnly}
          >
            <Palette className="h-5 w-5" />
          </Button>

          {showColorDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-md border border-gray-200 p-2 z-20 min-w-40">
              <div className="grid grid-cols-4 gap-2 ">
                {backgroundColors.map((bgColor) => (
                  <button
                    key={bgColor.color}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                    style={{ backgroundColor: bgColor.color }}
                    onClick={() => {
                      onChangeBackgroundColor(bgColor.color);
                      setShowColorDropdown(false);
                    }}
                    title={`${bgColor.name} background`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
