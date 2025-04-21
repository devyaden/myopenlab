"use client";

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  Plus,
  Minus,
  List,
  ListOrdered,
  ImageIcon,
  Type,
  Columns3,
  ChevronRight,
  FileText,
  Check,
  CheckSquare,
  Square,
  Strikethrough,
  Superscript,
  Subscript,
  Code,
  Palette,
  RotateCcw,
  ListChecks,
  Undo,
  Redo,
  RefreshCw,
  Layers,
  Table,
  ChevronLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PAPER_SIZE_GROUPS,
  COMMON_PAPER_SIZES,
  PAPER_ORIENTATIONS,
} from "@/utils/paper-sizes";

interface EditorToolbarProps {
  editorState: {
    fontFamily?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    alignment?: "left" | "center" | "right" | "justify";
  };
  onFormatText: (format: string) => void;
  onSetFontFamily: (font: string) => void;
  onSetFontSize: (size: string) => void;
  onSetTextColor: (color: string) => void;
  onSetHighlightColor: (color: string) => void;
  onSetAlignment: (alignment: string) => void;
  onFormatBlock: (blockType: string) => void;
  onInsert: (type: string) => void;
  pageSize: string;
  orientation: string;
  onPageSizeChange: (size: string) => void;
  onOrientationChange: (orientation: string) => void;
  showPageMargins: boolean;
  onTogglePageMargins: () => void;
  paginationSettings: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  };
  setPaginationSettings: (settings: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  }) => void;
  editor: any;
  zoom: string;
  onZoomChange: (zoom: string) => void;
  isPartOfCanvas?: boolean;
  onBackToBoard?: () => void;
}

export default function EditorToolbar({
  editorState,
  onFormatText,
  onSetFontFamily,
  onSetFontSize,
  onSetTextColor,
  onSetHighlightColor,
  onSetAlignment,
  onFormatBlock,
  onInsert,
  pageSize,
  orientation,
  onPageSizeChange,
  onOrientationChange,
  showPageMargins,
  onTogglePageMargins,
  paginationSettings,
  setPaginationSettings,
  editor,
  zoom,
  onZoomChange,
  isPartOfCanvas,
  onBackToBoard,
}: EditorToolbarProps) {
  const [fontSize, setFontSize] = useState("15");
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showTextCaseMenu, setShowTextCaseMenu] = useState(false);
  const [showPageSettingsMenu, setShowPageSettingsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("common");

  const insertMenuRef = useRef<HTMLDivElement | null>(null);
  const insertButtonRef = useRef<HTMLButtonElement | null>(null);
  const textCaseMenuRef = useRef<HTMLDivElement | null>(null);
  const textCaseButtonRef = useRef<HTMLButtonElement | null>(null);
  const pageSettingsMenuRef = useRef<HTMLDivElement | null>(null);
  const pageSettingsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Color palettes
  const textColors = [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#b7b7b7",
    "#cccccc",
    "#d9d9d9",
    "#efefef",
    "#f3f3f3",
    "#ffffff",
    "#980000",
    "#ff0000",
    "#ff9900",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#4a86e8",
    "#0000ff",
    "#9900ff",
    "#ff00ff",
    "#e6b8af",
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#c9daf8",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ];

  const highlightColors = [
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#00ff00",
    "#ff9900",
    "#ff0000",
    "#0000ff",
    "#9900ff",
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#c9daf8",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ];

  // Font family options
  const fontFamilyOptions = [
    "Arial",
    "Calibri",
    "Cambria",
    "Comic Sans MS",
    "Courier New",
    "Georgia",
    "Helvetica",
    "Merriweather",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
  ];

  // Block type options
  const blockTypeOptions = [
    { value: "Normal", label: "Normal text" },
    { value: "Heading 1", label: "Heading 1" },
    { value: "Heading 2", label: "Heading 2" },
    { value: "Heading 3", label: "Heading 3" },
    { value: "Heading 4", label: "Heading 4" },
    { value: "Heading 5", label: "Heading 5" },
    { value: "Heading 6", label: "Heading 6" },
    { value: "Quote", label: "Quote" },
    { value: "Code Block", label: "Code Block" },
    { value: "Task List", label: "Task List" },
  ];

  // Handle clicks outside menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle Page Settings menu
      if (
        showPageSettingsMenu &&
        pageSettingsMenuRef.current &&
        !pageSettingsMenuRef.current.contains(event.target as Node) &&
        pageSettingsButtonRef.current &&
        !pageSettingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowPageSettingsMenu(false);
      }

      // Handle Insert menu
      if (
        showInsertMenu &&
        insertMenuRef.current &&
        !insertMenuRef.current.contains(event.target as Node) &&
        insertButtonRef.current &&
        !insertButtonRef.current.contains(event.target as Node)
      ) {
        setShowInsertMenu(false);
      }

      // Handle Text Case menu
      if (
        showTextCaseMenu &&
        textCaseMenuRef.current &&
        !textCaseMenuRef.current.contains(event.target as Node) &&
        textCaseButtonRef.current &&
        !textCaseButtonRef.current.contains(event.target as Node)
      ) {
        setShowTextCaseMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInsertMenu, showTextCaseMenu, showPageSettingsMenu]);

  const decreaseFontSize = () => {
    const currentSize = Number.parseInt(fontSize);
    if (currentSize > 6) {
      const newSize = (currentSize - 1).toString();
      setFontSize(newSize);
      onSetFontSize(newSize);
    }
  };

  const increaseFontSize = () => {
    const currentSize = Number.parseInt(fontSize);
    if (currentSize < 96) {
      const newSize = (currentSize + 1).toString();
      setFontSize(newSize);
      onSetFontSize(newSize);
    }
  };

  // Update margin settings
  const updateMargin = (side: string, value: number) => {
    if (isNaN(value) || value < 0) return;

    const newSettings = {
      ...paginationSettings,
      [`margin${side.charAt(0).toUpperCase() + side.slice(1)}`]: value,
    };

    setPaginationSettings(newSettings);

    // Apply the change immediately to the editor
    if (editor && editor.commands.setDocumentPageMargin) {
      editor.commands.setDocumentPageMargin(side, value / 3.78);
    }
  };

  return (
    <div className="editor-toolbar sticky top-[57px] z-20">
      <div className="toolbar-inner flex flex-wrap items-center gap-1 md:gap-2">
        {/* Undo/Redo buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Document style dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <span className="hidden sm:inline">Normal text</span>
              <span className="inline sm:hidden">Text</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <ScrollArea className="h-80">
              {blockTypeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFormatBlock(option.value)}
                  className={
                    option.value.startsWith("Heading")
                      ? `text-${option.value.split(" ")[1]}xl`
                      : ""
                  }
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font family dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 max-w-[120px] md:max-w-[150px]"
            >
              <span className="truncate">
                {editorState?.fontFamily || "Arial"}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <ScrollArea className="h-80">
              {fontFamilyOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onSetFontFamily(option)}
                  style={{ fontFamily: option }}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font size controls */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={decreaseFontSize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            type="text"
            className="font-size-input w-10 h-8 text-center"
            value={fontSize}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              if (value) {
                setFontSize(value);
                onSetFontSize(value);
              }
            }}
            aria-label="Font size"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={increaseFontSize}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Text formatting */}
        <Toggle
          pressed={editorState?.isBold}
          onPressedChange={() => onFormatText("bold")}
          size="sm"
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          pressed={editorState?.isItalic}
          onPressedChange={() => onFormatText("italic")}
          size="sm"
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          pressed={editorState?.isUnderline}
          onPressedChange={() => onFormatText("underline")}
          size="sm"
          aria-label="Underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>

        {/* More text formatting options - Add ChevronDown icon to indicate dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Type className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onFormatText("strikethrough")}>
                <Strikethrough className="mr-2 h-4 w-4" />
                <span>Strikethrough</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFormatText("subscript")}>
                <Subscript className="mr-2 h-4 w-4" />
                <span>Subscript</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFormatText("superscript")}>
                <Superscript className="mr-2 h-4 w-4" />
                <span>Superscript</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFormatText("code")}>
                <Code className="mr-2 h-4 w-4" />
                <span>Code</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFormatText("clear")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>Clear Formatting</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="highlight">Highlight</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-2">
                <div className="grid grid-cols-10 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: color }}
                      onClick={() => onSetTextColor(color)}
                      aria-label={`Text color: ${color}`}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="highlight" className="mt-2">
                <div className="grid grid-cols-8 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: color }}
                      onClick={() => onSetHighlightColor(color)}
                      aria-label={`Highlight color: ${color}`}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Text alignment dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8">
              {editorState?.alignment === "left" ? (
                <AlignLeft className="h-4 w-4" />
              ) : editorState?.alignment === "center" ? (
                <AlignCenter className="h-4 w-4" />
              ) : editorState?.alignment === "right" ? (
                <AlignRight className="h-4 w-4" />
              ) : (
                <AlignJustify className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onSetAlignment("left")}>
              <AlignLeft className="mr-2 h-4 w-4" />
              <span>Left</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetAlignment("center")}>
              <AlignCenter className="mr-2 h-4 w-4" />
              <span>Center</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetAlignment("right")}>
              <AlignRight className="mr-2 h-4 w-4" />
              <span>Right</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetAlignment("justify")}>
              <AlignJustify className="mr-2 h-4 w-4" />
              <span>Justify</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Lists */}
        <Toggle
          onPressedChange={() =>
            editor?.chain().focus().toggleBulletList().run()
          }
          size="sm"
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          onPressedChange={() =>
            editor?.chain().focus().toggleOrderedList().run()
          }
          size="sm"
          aria-label="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Toggle
          onPressedChange={() => onInsert("task-list")}
          size="sm"
          aria-label="Task List"
        >
          <ListChecks className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-8" />

        {/* Insert dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Insert</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onInsert("horizontal-rule")}>
              <span className="mr-2">—</span>
              <span>Horizontal Rule</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("page-break")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Page Break</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("image")}>
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("inline-image")}>
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Inline Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("table")}>
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="9"
                  x2="21"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="15"
                  x2="21"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="9"
                  y1="3"
                  x2="9"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="15"
                  y1="3"
                  x2="15"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>Table</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("link")}>
              <Link className="mr-2 h-4 w-4" />
              <span>Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("columns-layout")}>
              <Columns3 className="mr-2 h-4 w-4" />
              <span>Columns Layout</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("collapsible-container")}>
              <ChevronRight className="mr-2 h-4 w-4" />
              <span>Collapsible Container</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("canvas")}>
              <Layers className="mr-2 h-4 w-4" />
              <span>Canvas</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onInsert("header")}>
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="4"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="12"
                  x2="21"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="16"
                  x2="21"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>Header</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInsert("footer")}>
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="16"
                  width="18"
                  height="4"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="8"
                  x2="21"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="12"
                  x2="21"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>Footer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-8" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Canvas Table</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onInsert("canvas-table")}>
              <Table className="mr-2 h-4 w-4" />
              <span>Insert Canvas Table</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Page settings dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 ml-auto"
              ref={pageSettingsButtonRef}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Page</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            ref={pageSettingsMenuRef}
            align="end"
            className="w-72"
          >
            <DropdownMenuLabel>Page Size</DropdownMenuLabel>
            <Tabs defaultValue="common" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="common">Common</TabsTrigger>
                <TabsTrigger value="a">A Series</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="common" className="max-h-60 overflow-y-auto">
                {COMMON_PAPER_SIZES.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onPageSizeChange(size)}
                    className="flex items-center justify-between"
                  >
                    <span>{size}</span>
                    {pageSize === size && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </TabsContent>

              <TabsContent value="a" className="max-h-60 overflow-y-auto">
                {PAPER_SIZE_GROUPS["A Series"].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onPageSizeChange(size)}
                    className="flex items-center justify-between"
                  >
                    <span>{size}</span>
                    {pageSize === size && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </TabsContent>

              <TabsContent value="other" className="max-h-60 overflow-y-auto">
                <ScrollArea className="h-60">
                  <DropdownMenuLabel>B Series</DropdownMenuLabel>
                  {PAPER_SIZE_GROUPS["B Series"].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => onPageSizeChange(size)}
                      className="flex items-center justify-between"
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>C Series</DropdownMenuLabel>
                  {PAPER_SIZE_GROUPS["C Series"].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => onPageSizeChange(size)}
                      className="flex items-center justify-between"
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>US Sizes</DropdownMenuLabel>
                  {PAPER_SIZE_GROUPS["US Sizes"].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => onPageSizeChange(size)}
                      className="flex items-center justify-between"
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Architectural</DropdownMenuLabel>
                  {PAPER_SIZE_GROUPS["Architectural"].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => onPageSizeChange(size)}
                      className="flex items-center justify-between"
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Orientation</DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 p-1">
              {PAPER_ORIENTATIONS.map((item) => (
                <Button
                  key={item.orientation}
                  variant={
                    orientation === item.orientation ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => onOrientationChange(item.orientation)}
                  className="w-full"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Page Options</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onTogglePageMargins}
              className="flex items-center justify-between"
            >
              <span>Show Margins</span>
              {showPageMargins ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Page Margins</DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-2 p-2">
              <div className="space-y-1">
                <label className="text-xs">Top (px)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={Math.round(paginationSettings.marginTop)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (
                      !isNaN(value) &&
                      value >= 0 &&
                      value !== paginationSettings.marginTop
                    ) {
                      updateMargin("top", value);
                    }
                  }}
                  className="w-full h-8 px-2 border rounded text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Right (px)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={Math.round(paginationSettings.marginRight)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (
                      !isNaN(value) &&
                      value >= 0 &&
                      value !== paginationSettings.marginRight
                    ) {
                      updateMargin("right", value);
                    }
                  }}
                  className="w-full h-8 px-2 border rounded text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Bottom (px)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={Math.round(paginationSettings.marginBottom)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (
                      !isNaN(value) &&
                      value >= 0 &&
                      value !== paginationSettings.marginBottom
                    ) {
                      updateMargin("bottom", value);
                    }
                  }}
                  className="w-full h-8 px-2 border rounded text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Left (px)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={Math.round(paginationSettings.marginLeft)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (
                      !isNaN(value) &&
                      value >= 0 &&
                      value !== paginationSettings.marginLeft
                    ) {
                      updateMargin("left", value);
                    }
                  }}
                  className="w-full h-8 px-2 border rounded text-sm"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Zoom controls - improved with reset button */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={() => {
              const currentZoom = Number.parseInt(zoom);
              if (currentZoom > 50) {
                const newZoom = Math.max(currentZoom - 25, 50) + "%";
                onZoomChange(newZoom);
              }
            }}
            aria-label="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 min-w-[70px]"
              >
                {zoom}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
              <div className="flex flex-col">
                {["50%", "75%", "90%", "100%", "125%", "150%", "200%"].map(
                  (zoomLevel) => (
                    <Button
                      key={zoomLevel}
                      variant="ghost"
                      size="sm"
                      className={`justify-start rounded-none ${zoom === zoomLevel ? "bg-accent" : ""}`}
                      onClick={() => onZoomChange(zoomLevel)}
                    >
                      {zoomLevel}
                    </Button>
                  )
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start rounded-none border-t"
                  onClick={() => onZoomChange("100%")}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset zoom
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={() => {
              const currentZoom = Number.parseInt(zoom);
              if (currentZoom < 200) {
                const newZoom = Math.min(currentZoom + 25, 200) + "%";
                onZoomChange(newZoom);
              }
            }}
            aria-label="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isPartOfCanvas && onBackToBoard && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 ml-2"
            onClick={onBackToBoard}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Board
          </Button>
        )}
      </div>
    </div>
  );
}
