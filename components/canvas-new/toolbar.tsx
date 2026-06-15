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
import { ColorPickerPopover } from "./color-picker-popover";
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Clipboard,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Group,
  Italic,
  Lock,
  Trash2,
  Underline,
  Unlink,
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
  selectedNodes: string[];
  mixedKeys?: Set<string>;
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
  onDetachNode?: () => void;
  selectedNodeHasParent?: boolean;
  areMultipleSelected?: boolean;
  handleMultiNodeGrouping?: () => void;
  onAlign?: (
    axis:
      | "left"
      | "hcenter"
      | "right"
      | "top"
      | "vcenter"
      | "bottom"
  ) => void;
  onDistribute?: (axis: "h" | "v") => void;
  onZOrder?: (
    direction: "front" | "forward" | "backward" | "back"
  ) => void;
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
  selectedNodes,
  mixedKeys,
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
  selectedNodeHasParent,
  onDetachNode,
  areMultipleSelected,
  handleMultiNodeGrouping,
  onAlign,
  onDistribute,
  onZOrder,
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

  const isStyleDisabled = selectedNodes.length === 0;
  const isMixed = (key: string) => !!mixedKeys?.has(key);

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
    { name: "Animated", value: "animated" },
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
            <path
              d="M5,12 C25,4 75,20 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5,5"
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
            <path
              d="M5,12 C25,4 75,20 95,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="1,5"
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
            <path
              d="M5,10 C25,2 75,18 95,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5,14 C25,6 75,22 95,14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
      case "animated":
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
              strokeDasharray="5,5"
              className="animate-pulse"
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
              {isMixed("fontFamily") ? "Mixed" : fontFamily}
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
              {isMixed("fontSize") ? "Mixed" : `${fontSize}pt`}
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

        {/* text color */}
        <ColorPickerPopover
          slot="text"
          value={textColor}
          onChange={setTextColor}
          mixed={isMixed("textColor")}
          disabled={isStyleDisabled}
          label="Text color"
        />

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
        {/* Background color (fill) — only visible when a node is selected. */}
        {!selectedEdge && (
          <ColorPickerPopover
            slot="fill"
            value={backgroundColor}
            onChange={setBackgroundColor}
            mixed={isMixed("backgroundColor")}
            disabled={isStyleDisabled}
            allowTransparent
            label="Fill"
          />
        )}

        {/* Border (or edge) color */}
        <ColorPickerPopover
          slot={selectedEdge ? "edge" : "border"}
          value={selectedEdge ? edgeColor : borderColor}
          onChange={(c) => {
            if (selectedEdge) {
              setEdgeColor(c);
            } else {
              setBorderColor(c);
            }
          }}
          mixed={!selectedEdge && isMixed("borderColor")}
          disabled={isStyleDisabled && !selectedEdge}
          allowTransparent
          label={selectedEdge ? "Edge color" : "Border color"}
        />

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
          disabled={selectedNodes.length === 0 && !selectedEdge}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Arrange / align / distribute / z-order. Gated on having at least
          one node selected; align needs >=2, distribute needs >=3. */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg gap-1 px-2"
              disabled={isStyleDisabled}
              title="Align & Distribute"
            >
              <AlignStartHorizontal className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px]">
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("left")}
            >
              <AlignLeft className="mr-2 h-4 w-4" />
              Align left
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("hcenter")}
            >
              <AlignCenterVertical className="mr-2 h-4 w-4" />
              Align horizontal centers
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("right")}
            >
              <AlignRight className="mr-2 h-4 w-4" />
              Align right
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("top")}
            >
              <AlignStartHorizontal className="mr-2 h-4 w-4" />
              Align top
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("vcenter")}
            >
              <AlignCenterHorizontal className="mr-2 h-4 w-4" />
              Align vertical centers
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 2}
              onSelect={() => onAlign?.("bottom")}
            >
              <AlignEndHorizontal className="mr-2 h-4 w-4" />
              Align bottom
            </DropdownMenuItem>
            <Separator className="my-1" />
            <DropdownMenuItem
              disabled={selectedNodes.length < 3}
              onSelect={() => onDistribute?.("h")}
            >
              <AlignHorizontalDistributeCenter className="mr-2 h-4 w-4" />
              Distribute horizontally
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedNodes.length < 3}
              onSelect={() => onDistribute?.("v")}
            >
              <AlignVerticalDistributeCenter className="mr-2 h-4 w-4" />
              Distribute vertically
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg gap-1 px-2"
              disabled={isStyleDisabled}
              title="Order"
            >
              <ChevronsUp className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px]">
            <DropdownMenuItem onSelect={() => onZOrder?.("front")}>
              <ArrowUpToLine className="mr-2 h-4 w-4" />
              Bring to front
              <span className="ml-auto text-xs text-muted-foreground">
                ⌘⇧]
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onZOrder?.("forward")}>
              <ChevronsUp className="mr-2 h-4 w-4" />
              Bring forward
              <span className="ml-auto text-xs text-muted-foreground">⌘]</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onZOrder?.("backward")}>
              <ChevronsDown className="mr-2 h-4 w-4" />
              Send backward
              <span className="ml-auto text-xs text-muted-foreground">⌘[</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onZOrder?.("back")}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Send to back
              <span className="ml-auto text-xs text-muted-foreground">
                ⌘⇧[
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

        {selectedNodeHasParent && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-2"
            onClick={onDetachNode}
            disabled={isStyleDisabled}
            title="Detach from parent"
          >
            <Unlink className="h-4 w-4" />
            Detach
          </Button>
        )}

        {areMultipleSelected && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-2"
            onClick={handleMultiNodeGrouping}
            title="Detach from parent"
          >
            <Group className="h-4 w-4" />
            Group
          </Button>
        )}
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
