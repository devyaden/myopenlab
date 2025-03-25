import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  ChevronDown,
  Circle,
  Clipboard,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Diamond,
  Hexagon,
  Italic,
  Link,
  Lock,
  Minus,
  Plus,
  SendToBack,
  Shapes,
  Square,
  Trash2,
  Triangle,
  Underline,
  User,
} from "lucide-react";
import React from "react";

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
  selectedNode: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onLock: () => void;
  onChangeShape: (
    shape:
      | "rectangle"
      | "rounded"
      | "circle"
      | "diamond"
      | "hexagon"
      | "triangle"
      | "useCase"
      | "actor"
      | "class"
      | "interface"
      | "swimlane"
      | "standing-woman"
  ) => void;
  shape:
    | "rectangle"
    | "rounded"
    | "circle"
    | "diamond"
    | "hexagon"
    | "triangle"
    | "useCase"
    | "actor"
    | "class"
    | "interface"
    | "swimlane"
    | "standing-woman";
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
  viewMode: "canvas" | "table";
  onViewModeChange: (mode: "canvas" | "table") => void;
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
    return (
      <svg width="100" height="20" viewBox="0 0 100 20" className="mr-2">
        {/* Bezier (default) */}
        {style === "default" && (
          <path
            d="M0,10 C30,0 70,20 100,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* Straight */}
        {style === "straight" && (
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* Step */}
        {style === "step" && (
          <path
            d="M0,10 H25 V5 H75 V10 H100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* SmoothStep */}
        {style === "smoothstep" && (
          <path
            d="M0,10 C12.5,10 25,5 50,5 S87.5,0 100,0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* SimpleBezier */}
        {style === "simplebezier" && (
          <path
            d="M0,10 Q50,0 100,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* Dashed */}
        {style === "dashed" && (
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
        )}

        {/* Dotted */}
        {style === "dotted" && (
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2,4"
          />
        )}

        {/* Double */}
        {style === "double" && (
          <>
            <line
              x1="0"
              y1="7"
              x2="100"
              y2="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="0"
              y1="13"
              x2="100"
              y2="13"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>
    );
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

        {/* line height change popover */}
        <Popover>
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
        </Popover>
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* node background color changer */}
      <Input
        type="color"
        value={backgroundColor}
        className="!w-12 h-9 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
        disabled={isStyleDisabled}
        onChange={(e) => setBackgroundColor(e.target.value)}
      />

      {/* Shape change dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-lg  hidden sm:flex"
            variant="outline"
            size="sm"
            disabled={!isNodeSelected}
          >
            {!shape && <Shapes className="h-4 w-4 " />}

            {shape === "rectangle" && <Square className="h-4 w-4 " />}
            {shape === "rounded" && <Square className="h-4 w-4  rounded-sm" />}
            {shape === "circle" && <Circle className="h-4 w-4 " />}
            {shape === "diamond" && <Diamond className="h-4 w-4 " />}
            {shape === "hexagon" && <Hexagon className="h-4 w-4 " />}
            {shape === "triangle" && <Triangle className="h-4 w-4 " />}
            {shape === "useCase" && <Circle className="h-4 w-4 " />}
            {shape === "actor" && <User className="h-4 w-4 " />}
            {shape === "class" && <Box className="h-4 w-4 " />}
            {shape === "interface" && <Box className="h-4 w-4 " />}
            {shape === "swimlane" && <Square className="h-4 w-4 " />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onChangeShape("rectangle")}>
            <Square className="mr-2 h-4 w-4" />
            Rectangle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("rounded")}>
            <Square className="mr-2 h-4 w-4 rounded-sm" />
            Rounded
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("circle")}>
            <Circle className="mr-2 h-4 w-4" />
            Circle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("diamond")}>
            <Diamond className="mr-2 h-4 w-4" />
            Diamond
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("hexagon")}>
            <Hexagon className="mr-2 h-4 w-4" />
            Hexagon
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("triangle")}>
            <Triangle className="mr-2 h-4 w-4" />
            Triangle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("useCase")}>
            <Circle className="mr-2 h-4 w-4" />
            Use Case
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("actor")}>
            <User className="mr-2 h-4 w-4" />
            Actor
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("class")}>
            <Box className="mr-2 h-4 w-4" />
            Class
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("interface")}>
            <Box className="mr-2 h-4 w-4" />
            Interface
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeShape("swimlane")}>
            <Square className="mr-2 h-4 w-4" />
            Swimlane
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg">
        <SendToBack className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      <Input
        type="color"
        value={borderColor}
        className="!w-12 h-9 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
        disabled={isStyleDisabled}
        onChange={(e) => setBorderColor(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={isStyleDisabled || isSwimlane}
            >
              {getBorderStyleIcon(borderStyle)}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[180px]">
            <div className="p-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-2">
                  Border Style
                </div>
                {borderStyles.map((style) => (
                  <DropdownMenuItem
                    key={style.value}
                    className="flex items-center justify-between"
                    onSelect={() => setBorderStyle(style.value)}
                  >
                    <span>{style.name}</span>
                    <div className="w-16 flex items-center justify-center">
                      {getBorderStyleIcon(style.value)}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isStyleDisabled || isSwimlane}
            >
              {borderWidth}px
              <div className=" flex flex-col items-center justify-center">
                <svg
                  width="8"
                  height="14"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.538031 4.19115C0.500131 4.0998 0.490175 3.99926 0.509422 3.90225C0.528668 3.80524 0.576252 3.71612 0.646155 3.64615L3.64616 0.646155C3.69259 0.599667 3.74774 0.562787 3.80844 0.537625C3.86913 0.512463 3.9342 0.499512 3.99991 0.499512C4.06561 0.499512 4.13068 0.512463 4.19138 0.537625C4.25207 0.562787 4.30722 0.599667 4.35366 0.646155L7.35366 3.64615C7.42366 3.71608 7.47134 3.80521 7.49067 3.90225C7.51 3.99929 7.50009 4.09989 7.46222 4.1913C7.42434 4.28271 7.36019 4.36083 7.2779 4.41577C7.1956 4.4707 7.09885 4.49998 6.99991 4.49991H0.999905C0.901015 4.49988 0.804352 4.47054 0.722139 4.41558C0.639926 4.36063 0.575856 4.28253 0.538031 4.19115ZM6.99991 9.4999H0.999905C0.900958 9.49983 0.804212 9.52911 0.721915 9.58404C0.639618 9.63898 0.57547 9.7171 0.537594 9.80851C0.499718 9.89992 0.489816 10.0005 0.509141 10.0976C0.528466 10.1946 0.57615 10.2837 0.646155 10.3537L3.64616 13.3537C3.69259 13.4001 3.74774 13.437 3.80844 13.4622C3.86913 13.4873 3.9342 13.5003 3.99991 13.5003C4.06561 13.5003 4.13068 13.4873 4.19138 13.4622C4.25207 13.437 4.30722 13.4001 4.35366 13.3537L7.35366 10.3537C7.42366 10.2837 7.47134 10.1946 7.49067 10.0976C7.51 10.0005 7.50009 9.89992 7.46222 9.80851C7.42434 9.7171 7.36019 9.63898 7.2779 9.58404C7.1956 9.52911 7.09885 9.49983 6.99991 9.4999Z"
                    fill="#344054"
                  />
                </svg>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[180px]">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6"
                  onClick={() => setBorderWidth(Math.max(1, borderWidth - 1))}
                  disabled={borderWidth <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="w-12 text-center text-sm">{borderWidth}px</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6"
                  onClick={() => setBorderWidth(Math.min(10, borderWidth + 1))}
                  disabled={borderWidth >= 10}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Slider
                className="mt-2"
                value={[borderWidth]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => setBorderWidth(value[0])}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={!selectedEdge}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="text-gray-600"
              >
                {getLineStyleIcon(selectedEdge ? currentEdgeStyle : "default")}
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {lineStyles.map((style) => (
              <DropdownMenuItem
                key={style.value}
                onSelect={() => onChangeEdgeStyle(style.value)}
              >
                {getLineStyleIcon(style.value)}
                {style.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={10}
          value={edgeWidth}
          onChange={(e) => setEdgeWidth(Number(e.target.value))}
          className="w-16"
          disabled={!selectedEdge}
        />
        <div className="relative">
          <Input
            type="color"
            value={edgeColor}
            onChange={(e) => setEdgeColor(e.target.value)}
            className="w-8 h-8 p-0 border-0"
            disabled={!selectedEdge}
          />
          {/* <Pipette className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" /> */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={!selectedEdge}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="text-gray-600"
              >
                {getLineStyleIcon(selectedEdge ? currentEdgeStyle : "default")}
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {lineStyles.map((style) => (
              <DropdownMenuItem
                key={style.value}
                onSelect={() => onChangeEdgeStyle(style.value)}
              >
                {getLineStyleIcon(style.value)}
                {style.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className=" rounded-lg"
          onClick={onCopy}
          disabled={isStyleDisabled}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className=" rounded-lg"
          onClick={onPaste}
        >
          <Clipboard className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onDelete}
          disabled={!selectedNode}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-lg">
          <Link className="h-4 w-4" />
        </Button>
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

      <Switch
        checked={viewMode === "table"}
        onCheckedChange={() =>
          onViewModeChange(viewMode === "canvas" ? "table" : "canvas")
        }
        className="!bg-yadn-primary-green ml-auto"
      />
    </div>
  );
});
