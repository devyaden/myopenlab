import {
  Square,
  Columns,
  Circle,
  Diamond,
  Hexagon,
  Triangle,
  User,
  Box,
  Type,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UMLToolbarProps {
  onAddNode: (shape: string) => void;
  onAddSwimlane: () => void;
  onChangeEdgeStyle: (style: string) => void;
  onAddImage: () => void;
}

export function UMLToolbar({
  onAddNode,
  onAddSwimlane,
  onChangeEdgeStyle,
  onAddImage,
}: UMLToolbarProps) {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-2 z-10">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("rectangle")}
        >
          <Square className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("circle")}
        >
          <Circle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("diamond")}
        >
          <Diamond className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("hexagon")}
        >
          <Hexagon className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("triangle")}
        >
          <Triangle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("useCase")}
        >
          <Circle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("actor")}
        >
          <User className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("class")}
        >
          <Box className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("interface")}
        >
          <Box className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onAddSwimlane}
        >
          <Columns className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onAddNode("text")}
        >
          <Type className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onAddImage}
        >
          <Image className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
