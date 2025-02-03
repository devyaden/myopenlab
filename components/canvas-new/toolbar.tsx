import React from "react";
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  Copy,
  Italic,
  Lock,
  MessageCircleQuestionIcon as QuestionCircle,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCcw,
  Link,
  Square,
  Circle,
  RotateCw,
  FlagIcon as BorderAll,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

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
    shape: "rectangle" | "rounded" | "circle" | "swimlane"
  ) => void;
  onRotateSwimlane: () => void;
  shape: "rectangle" | "rounded" | "circle" | "swimlane";
  isLocked: boolean;
  isSwimlaneVertical: boolean;
  borderStyle: string;
  setBorderStyle: (style: string) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  isSwimlane: boolean;
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
  onRotateSwimlane,
  shape,
  isLocked,
  isSwimlaneVertical,
  borderStyle,
  setBorderStyle,
  borderWidth,
  setBorderWidth,
  isSwimlane,
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
    { name: "Double", value: "double" },
    { name: "Groove", value: "groove" },
    { name: "Ridge", value: "ridge" },
    { name: "Inset", value: "inset" },
    { name: "Outset", value: "outset" },
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

  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-200 overflow-x-auto">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRedo}
        >
          <RotateCcw className="h-4 w-4 rotate-180" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <QuestionCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-3 hidden sm:flex"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
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
              <DropdownMenuItem key={size} onSelect={() => setFontSize(size)}>
                {size}pt
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant={isBold ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsBold(!isBold)}
          disabled={isStyleDisabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsItalic(!isItalic)}
          disabled={isStyleDisabled}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsUnderline(!isUnderline)}
          disabled={isStyleDisabled}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-8 w-8 rounded-sm bg-[#8b3dff] hover:bg-[#8b3dff]/90 hidden sm:flex"
            disabled={!isNodeSelected}
          >
            {shape === "rectangle" && <Square className="h-4 w-4 text-white" />}
            {shape === "rounded" && (
              <Square className="h-4 w-4 text-white rounded-sm" />
            )}
            {shape === "circle" && <Circle className="h-4 w-4 text-white" />}
            {shape === "swimlane" && <Square className="h-4 w-4 text-white" />}
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
          <DropdownMenuItem onSelect={() => onChangeShape("swimlane")}>
            <Square className="mr-2 h-4 w-4" />
            Swimlane
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {shape === "swimlane" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRotateSwimlane}
          disabled={isStyleDisabled}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCopy}
          disabled={isStyleDisabled}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPaste}
        >
          <Copy className="h-4 w-4 rotate-90" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <div className="flex items-center gap-1 hidden sm:flex">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current rounded-sm" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant={isLocked ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={onLock}
          disabled={isStyleDisabled}
        >
          <Lock className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1 hidden sm:flex">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current rotate-45" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isStyleDisabled || isSwimlane}
            >
              <BorderAll className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[180px]">
            <div className="p-2">
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Border Width
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setBorderWidth(Math.max(1, borderWidth - 1))}
                    disabled={borderWidth <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-12 text-center text-sm">
                    {borderWidth}px
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      setBorderWidth(Math.min(10, borderWidth + 1))
                    }
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
    </div>
  );
});
