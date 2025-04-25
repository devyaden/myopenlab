import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SHAPES } from "@/lib/types/flow-table.types";
import { CANVAS_TYPE } from "@/types/store";
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  Bold,
  ChevronDown,
  Clipboard,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Italic,
  Lock,
  Trash2,
  Underline,
} from "lucide-react";
import React from "react";
import { ViewModeSwitcher } from "./view-mode-switcher";

interface ToolbarProps {
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  isBold: boolean;
  setIsBold: (bold: boolean) => void;
  isItalic: boolean;
  setIsItalic: (italic: boolean) => void;
  isUnderline: boolean;
  setIsUnderline: (underline: boolean) => void;
  textAlign: "left" | "center" | "right" | "justify";
  setTextAlign: (align: "left" | "center" | "right" | "justify") => void;
  verticalAlign: "top" | "middle" | "bottom"; // Add this line
  setVerticalAlign: (align: "top" | "middle" | "bottom") => void;
  selectedNode: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onLock: () => void;
  onChangeShape: (shape: SHAPES) => void;
  shape: SHAPES;
  isLocked: boolean;
  borderStyle: string;
  setBorderStyle: (style: string) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  isSwimlane: boolean;
  onDelete: () => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  borderColor: string;
  setBorderColor: (color: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  selectedEdge: string | null;
  onChangeEdgeStyle: (style: string) => void;
  currentEdgeStyle: string;
  viewMode: "canvas" | "table" | "document";
  onViewModeChange: (mode: "canvas" | "table" | "document") => void;
  edgeWidth: number;
  setEdgeWidth: (width: number) => void;
  edgeColor: string;
  setEdgeColor: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar = React.memo(function Toolbar({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  isBold,
  setIsBold,
  isItalic,
  setIsItalic,
  isUnderline,
  setIsUnderline,
  textAlign,
  setTextAlign,
  verticalAlign,
  setVerticalAlign,
  selectedNode,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onLock,
  onChangeShape,
  shape,
  borderStyle,
  setBorderStyle,
  borderWidth,
  setBorderWidth,
  isSwimlane,
  onDelete,
  backgroundColor,
  setBackgroundColor,
  borderColor,
  setBorderColor,
  textColor,
  setTextColor,
  lineHeight,
  setLineHeight,
  selectedEdge,
  onChangeEdgeStyle,
  currentEdgeStyle,
  viewMode,
  onViewModeChange,
  edgeWidth,
  setEdgeWidth,
  edgeColor,
  setEdgeColor,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const fontFamilies = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Georgia",
    "Palatino",
    "Garamond",
    "Bookman",
    "Comic Sans MS",
    "Trebuchet MS",
    "Arial Black",
  ];

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36];

  const isNodeSelected = !!selectedNode;
  const isStyleDisabled = selectedNode === null;

  const borderStyles = [
    { name: "Solid", value: "solid" },
    { name: "Dashed", value: "dashed" },
    { name: "Dotted", value: "dotted" },
    // { name: "Double", value: "double" },
    // { name: "Groove", value: "groove" },
    // { name: "Ridge", value: "ridge" },
    // { name: "Inset", value: "inset" },
    // { name: "Outset", value: "outset" },
  ];

  const getBorderStyleIcon = (style: string) => {
    switch (style) {
      case "solid":
        return <div className="w-12 h-0.5 bg-current" />;
      case "dashed":
        return (
          <div className="w-12 h-0.5 bg-current border-dashed border-t-2" />
        );
      case "dotted":
        return (
          <div className="w-12 h-0.5 bg-current border-dotted border-t-2" />
        );
      case "double":
        return (
          <div className="w-12 h-1.5 border-t-2 border-b-2 border-current" />
        );
      default:
        return (
          <div className={`w-12 h-2 border-2 border-${style} border-current`} />
        );
    }
  };

  const lineStyles = [
    { name: "Bezier", value: "default" },
    { name: "SimpleBezier", value: "simplebezier" },
    { name: "Straight", value: "straight" },
    { name: "Step", value: "step" },
    { name: "SmoothStep", value: "smoothstep" },
    { name: "Dashed", value: "dashed" },
    { name: "Dotted", value: "dotted" },
    { name: "Double", value: "double" },
  ];

  const getLineStyleIcon = (style: string) => {
    switch (style) {
      case "default":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M5,12 C25,4 75,20 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "simplebezier":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M5,12 Q50,4 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "straight":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <line
              x1="5"
              y1="12"
              x2="95"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "step":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M5,12 H35 V6 H65 V12 H95"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "smoothstep":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M5,12 C20,12 30,4 50,4 S80,4 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "dashed":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <line
              x1="5"
              y1="12"
              x2="95"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="10,6"
            />
          </svg>
        );
      case "dotted":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <line
              x1="5"
              y1="12"
              x2="95"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2,4"
            />
          </svg>
        );
      case "double":
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <line
              x1="5"
              y1="8"
              x2="95"
              y2="8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="5"
              y1="16"
              x2="95"
              y2="16"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
      default:
        return (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M5,12 C25,4 75,20 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
    }
  };
  return (
    <div className="flex items-center gap-2 p-2  overflow-x-auto border-b">
      <div className="flex items-center gap-2 border rounded-lg h-9">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          <CornerUpLeft className="h-3 w-3" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
          <CornerUpRight className="h-3 w-3 " />
        </Button>
      </div>

      {/* font selction dropdown */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 px-3 hidden sm:flex rounded-lg"
              disabled={isStyleDisabled}
            >
              {fontFamily}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontFamilies.map((font) => (
              <DropdownMenuItem key={font} onSelect={() => setFontFamily(font)}>
                {font}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* font size change dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 px-2"
              disabled={isStyleDisabled}
            >
              {fontSize}pt
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontSizes.map((size) => (
              <DropdownMenuItem
                key={size}
                onSelect={() => setFontSize(Number(size))}
              >
                {size}pt
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg"
          onClick={() => setIsBold(!isBold)}
          disabled={isStyleDisabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg"
          onClick={() => setIsItalic(!isItalic)}
          disabled={isStyleDisabled}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg"
          onClick={() => setIsUnderline(!isUnderline)}
          disabled={isStyleDisabled}
        >
          <Underline className="h-4 w-4" />
        </Button>

        {/* text color change */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 relative rounded-lg"
            disabled={isStyleDisabled}
            onClick={() => document?.getElementById("colorPicker")?.click()}
          >
            <span className="text-base font-semibold">A</span>
            <span
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5"
              style={{ backgroundColor: textColor }}
            />
          </Button>
          <Input
            id="colorPicker"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="hidden"
          />
        </div>

        {/* text align dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg"
              disabled={isStyleDisabled}
            >
              {textAlign === "left" && <AlignLeft className="h-4 w-4" />}
              {textAlign === "center" && <AlignCenter className="h-4 w-4" />}
              {textAlign === "right" && <AlignRight className="h-4 w-4" />}
              {textAlign === "justify" && <AlignJustify className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setTextAlign("left")}>
              <AlignLeft className="mr-2 h-4 w-4" />
              Left
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTextAlign("center")}>
              <AlignCenter className="mr-2 h-4 w-4" />
              Center
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTextAlign("right")}>
              <AlignRight className="mr-2 h-4 w-4" />
              Right
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTextAlign("justify")}>
              <AlignJustify className="mr-2 h-4 w-4" />
              Justify
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* vertical align dropdown - add this new dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg"
              disabled={isStyleDisabled}
            >
              {verticalAlign === "top" && (
                <AlignStartVertical className="h-4 w-4" />
              )}
              {verticalAlign === "middle" && (
                <AlignCenterVertical className="h-4 w-4" />
              )}
              {verticalAlign === "bottom" && (
                <AlignEndVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setVerticalAlign("top")}>
              <AlignStartVertical className="h-4 w-4 mr-2" />
              Top
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setVerticalAlign("middle")}>
              <AlignCenterVertical className="h-4 w-4 mr-2" />
              Middle
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setVerticalAlign("bottom")}>
              <AlignEndVertical className="h-4 w-4 mr-2" />
              Bottom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* line height change popover */}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 px-3 rounded-lg"
              disabled={isStyleDisabled}
            >
              <span className="font-bold">T</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Line Height</h4>
                <Slider
                  value={[lineHeight]}
                  min={1}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setLineHeight(value[0])}
                />
                <div className="text-right text-sm text-muted-foreground">
                  {lineHeight.toFixed(1)}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover> */}
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Unified controls for shape/edge properties */}
      <div className="flex items-center gap-2">
        {/* Background color for shapes - only visible when node selected */}
        {!selectedEdge && (
          <div className="flex items-center justify-center h-9 w-10 border rounded-md overflow-hidden">
            <Input
              type="color"
              value={backgroundColor}
              className="!w-full !h-full !p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
              disabled={isStyleDisabled}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
        )}

        {/* Border/Edge color */}
        <div className="flex items-center justify-center h-9 w-10 border rounded-md overflow-hidden">
          <Input
            type="color"
            value={selectedEdge ? edgeColor : borderColor}
            className="!w-full !h-full !p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            disabled={isStyleDisabled && !selectedEdge}
            onChange={(e) => {
              if (selectedEdge) {
                setEdgeColor(e.target.value);
              } else if (selectedNode) {
                setBorderColor(e.target.value);
              }
            }}
          />
        </div>

        {/* Width control */}
        <div className="border rounded-md overflow-hidden">
          <Input
            type="number"
            min={1}
            max={10}
            value={selectedEdge ? edgeWidth : borderWidth}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= 10) {
                if (selectedEdge) {
                  setEdgeWidth(value);
                } else {
                  setBorderWidth(value);
                }
              }
            }}
            className="w-20 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={(isStyleDisabled || isSwimlane) && !selectedEdge}
          />
        </div>

        {/* Edge style dropdown - only visible when edge selected */}
        {selectedEdge && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md px-2 min-w-[90px] overflow-hidden"
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-20 h-6 flex items-center justify-center">
                    {getLineStyleIcon(currentEdgeStyle)}
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[220px] p-0">
              <div className="py-1 px-2">
                <div className="text-sm font-medium py-2 border-b">
                  Edge Style
                </div>
                <div className="py-1">
                  {lineStyles.map((style) => (
                    <DropdownMenuItem
                      key={style.value}
                      className={`flex items-center justify-between px-2 py-3 hover:bg-gray-50 cursor-pointer rounded-sm ${
                        currentEdgeStyle === style.value
                          ? "bg-gray-50 font-medium"
                          : ""
                      }`}
                      onSelect={() => onChangeEdgeStyle(style.value)}
                    >
                      <span className="text-sm">{style.name}</span>
                      <div className="w-32 flex items-center">
                        {getLineStyleIcon(style.value)}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Border style dropdown - only visible when node selected */}
        {!selectedEdge && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md"
                disabled={isStyleDisabled || isSwimlane}
              >
                {getBorderStyleIcon(borderStyle)}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px] p-0">
              <div className="py-1 px-2">
                <div className="text-sm font-medium py-2 border-b">
                  Border Style
                </div>
                <div className="py-1">
                  {borderStyles.map((style) => (
                    <DropdownMenuItem
                      key={style.value}
                      className={`flex items-center justify-between px-2 py-3 hover:bg-gray-50 cursor-pointer rounded-sm ${
                        borderStyle === style.value ? "bg-gray-50" : ""
                      }`}
                      onSelect={() => setBorderStyle(style.value)}
                    >
                      <span className="text-sm">{style.name}</span>
                      <div className="w-16 flex items-center justify-center">
                        {getBorderStyleIcon(style.value)}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onCopy}
          disabled={isStyleDisabled}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onPaste}
        >
          <Clipboard className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onDelete}
          disabled={!selectedNode && !selectedEdge}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <div className="flex items-center gap-2">
        {/* <Button variant="outline" size="sm" className="rounded-lg">
          <Link className="h-4 w-4" />
        </Button> */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onLock}
          disabled={isStyleDisabled}
        >
          <Lock className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto flex items-center">
        <ViewModeSwitcher
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          canvasType={CANVAS_TYPE.HYBRID}
        />
      </div>
    </div>
  );
});
