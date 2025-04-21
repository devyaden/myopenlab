"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import FontSize from "tiptap-extension-font-size";
import PaginationExtension, {
  BodyNode,
  HeaderFooterNode,
  PageNode,
} from "tiptap-extension-pagination";

import type { PaperOrientation, PaperSize } from "@/types/paper";
import { DEFAULT_MARGINS, PAPER_DIMENSIONS } from "@/utils/paper-sizes";
import CanvasCropDialog from "./CanvasCropDialog";
import CanvasDialog from "./CanvasDialog";
import "./editor.css";
import EditorToolbar from "./EditorToolbar";
import CanvasTableNode from "./extensions/CanvasTableNode";
import { ReactFlowNode } from "./extensions/ReactFlowNode";
import ResizableImageNode from "./extensions/ResizableImageNode";
import { Header } from "./Header";
import HeaderFooterDialog, {
  type HeaderFooterConfig,
} from "./HeaderFooterDialog";
import { useDocumentStore } from "./hooks/useDocument";
import ImageDialog from "./ImageDialog";
import LinkDialog from "./LinkDialog";
import TableDialog from "./TableDialog";
import TableSelectorDialog from "./TableSelectorDialog";
import { useRouter } from "next/navigation";

// Add the function to generate the HTML content for header/footer
const generateHeaderFooterContent = (config: HeaderFooterConfig) => {
  const {
    type,
    includeCompanyLogo,
    companyLogoUrl,
    companyName,
    alignment,
    showPageNumbers,
    showDate,
    customText,
    style,
  } = config;

  // Create base wrapper with alignment
  let alignmentClass = "";
  if (alignment === "center") alignmentClass = "text-center";
  if (alignment === "right") alignmentClass = "text-right";

  // Apply style classes based on selected style
  let styleClasses = "";
  switch (style) {
    case "bold":
      styleClasses = "font-bold text-gray-800";
      break;
    case "minimal":
      styleClasses = "text-sm text-gray-600";
      break;
    case "corporate":
      styleClasses = "border-b border-gray-300 pb-2";
      break;
    default:
      styleClasses = "text-gray-700";
  }

  // Build the HTML content
  let html = `<div class="${alignmentClass} ${styleClasses} w-full flex items-center ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start"} space-x-2">`;

  // Add company logo if included
  if (includeCompanyLogo && companyLogoUrl) {
    html += `<img src="${companyLogoUrl}" alt="${companyName || "Company"} Logo" class="h-8 w-auto object-contain" />`;
  }

  // Add company name if provided
  if (companyName) {
    html += `<span class="font-semibold">${companyName}</span>`;
  }

  // Add custom text if provided
  if (customText) {
    html += `<span class="text-sm">${customText}</span>`;
  }

  // Add date if selected
  if (showDate) {
    const currentDate = new Date().toLocaleDateString();
    html += `<span class="text-sm text-gray-500">${currentDate}</span>`;
  }

  // Add page number placeholder if selected
  if (showPageNumbers) {
    // Use the pagination extension's page number format
    html += `<span class="text-sm text-gray-500">Page <span class="page-number"></span></span>`;
  }

  html += "</div>";

  return html;
};

// Define proper types
interface Document {
  id: string;
  name: string;
  content: string;
  nodes: any[];
  edges: any[];
}

interface EditorState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontFamily: string;
  fontSize: string;
  alignment: "left" | "center" | "right" | "justify";
  blockType: string;
  showGrid: boolean;
  showRulers: boolean;
  characterCount: number;
  wordCount: number;
}

export default function Editor({
  isPartOfCanvas,
  onBackToBoard,
  canvasId,
}: {
  isPartOfCanvas?: boolean;
  onBackToBoard?: () => void;
  canvasId: string;
}) {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [inlineImageMode, setInlineImageMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [canvasDialogOpen, setCanvasDialogOpen] = useState(false);
  const [cropCanvasDialogOpen, setCropCanvasDialogOpen] = useState(false);
  const [selectedCanvasForCrop, setSelectedCanvasForCrop] = useState<any>(null);
  const [tableSelectorDialogOpen, setTableSelectorDialogOpen] = useState(false);
  const [selectedTableData, setSelectedTableData] = useState<any>(null);
  const [headerFooterDialogOpen, setHeaderFooterDialogOpen] =
    useState<boolean>(false);
  const [headerFooterType, setHeaderFooterType] = useState<"header" | "footer">(
    "header"
  );
  const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig | null>(
    null
  );
  const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig | null>(
    null
  );

  const router = useRouter();

  // Refs
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);

  // Paper settings
  const [pageSize, setPageSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<PaperOrientation>("portrait");
  const [showPageMargins, setShowPageMargins] = useState(true);
  const [editorKey, setEditorKey] = useState(0);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    fontFamily: "Arial",
    fontSize: "15px",
    alignment: "left",
    blockType: "p",
    showGrid: false,
    showRulers: false,
    characterCount: 0,
    wordCount: 0,
  });

  // Get dimensions based on current paper size and orientation
  const getDimensions = useCallback(() => {
    const dimensions = PAPER_DIMENSIONS[pageSize];
    if (orientation === "landscape") {
      return {
        width: dimensions.height,
        height: dimensions.width,
      };
    }
    return dimensions;
  }, [pageSize, orientation]);

  // Update pagination settings with page size and margins
  const [paginationSettings, setPaginationSettings] = useState({
    pageWidth: getDimensions()?.width,
    pageHeight: getDimensions()?.height,
    marginTop: DEFAULT_MARGINS.top,
    marginRight: DEFAULT_MARGINS.right,
    marginBottom: DEFAULT_MARGINS.bottom,
    marginLeft: DEFAULT_MARGINS.left,
  });

  const {
    editor_state,
    saveDocument,
    loadDocument,
    setName,
    name,
    setDescription,
    syncChanges,
    updateEditorState: updateLexicalState,
    isLoading,
    saveLoading,
    folderCanvases,
  } = useDocumentStore();

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "editor-paragraph",
          },
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "editor-code-block",
          },
        },
      }),
      TextStyle,
      FontFamily,
      FontSize.configure({
        types: ["textStyle"],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      ResizableImageNode.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table",
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Typography,
      Placeholder.configure({
        placeholder: "Start typing or use the toolbar to format...",
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      PaginationExtension.configure({
        defaultPaperSize: pageSize,
        defaultPaperOrientation: orientation,
        defaultMarginConfig: {
          top: paginationSettings.marginTop / 3.78,
          right: paginationSettings.marginRight / 3.78,
          bottom: paginationSettings.marginBottom / 3.78,
          left: paginationSettings.marginLeft / 3.78,
        },
        defaultPageBorders: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        pageAmendmentOptions: {
          enableHeader: false,
          enableFooter: false,
        },
      }),

      PageNode,
      HeaderFooterNode,
      BodyNode,
      ReactFlowNode,
      CanvasTableNode,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (editor) {
        const content = editor.getHTML();
        setCurrentDocument((prev) => (prev ? { ...prev, content } : null));
        updateEditorState(editor);
        debouncedSave();
      }
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
    autofocus: true,
    editable: true,
  });

  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(() => {
      if (!editor) return;

      try {
        // Get the latest editor state
        const latestEditorState = editor.getHTML();

        // Find all ReactFlow nodes in the editor and ensure their data is preserved
        const editorJSON = editor.getJSON();

        // Store the complete JSON structure to preserve all custom node data
        updateLexicalState(
          JSON.stringify({
            state: latestEditorState,
            controls: editorState,
            json: editorJSON,
          })
        );
      } catch (error) {
        console.error("Error saving document:", error);
        toast.error("Failed to save document");
      }
    }, 1000), // 1 second delay
    [editor, editorState, updateLexicalState]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Load document on mount
  useEffect(() => {
    if (canvasId) {
      loadDocument(canvasId);
    }
  }, [canvasId]);

  useEffect(() => {
    if (editor && editor_state) {
      try {
        const parsedState = JSON.parse(editor_state);
        const { state, controls, json } = parsedState;

        // If we have the full JSON structure, use it for better data preservation
        if (json) {
          editor.commands.setContent(json);
        } else {
          // Fallback to HTML content
          editor.commands.setContent(state);
        }

        setEditorState(controls);
      } catch (error) {
        console.error("Error parsing editor state:", error);
        toast.error("Failed to load document content");
      }
    }
  }, [editor_state, editor]);

  // Update editor content when document changes
  useEffect(() => {
    if (editor && currentDocument?.content) {
      try {
        editor.commands.setContent(currentDocument.content);
        updateEditorState(editor);
      } catch (error) {
        console.error("Error loading document content:", error);
        toast.error("Failed to load document content");
      }
    }
  }, [editor, currentDocument?.content]);

  // Update editor state based on current selection
  const updateEditorState = useCallback(
    (editor: any | null) => {
      if (!editor) return;

      const newState: EditorState = {
        isBold: editor?.isActive("bold"),
        isItalic: editor?.isActive("italic"),
        isUnderline: editor?.isActive("underline"),
        fontFamily: editor?.getAttributes("textStyle")?.fontFamily || "Arial",
        fontSize: editor?.getAttributes("textStyle")?.fontSize || "15px",
        alignment: editor?.isActive({ textAlign: "center" })
          ? "center"
          : editor?.isActive({ textAlign: "right" })
            ? "right"
            : editor?.isActive({ textAlign: "justify" })
              ? "justify"
              : "left",
        blockType: editor?.isActive("heading", { level: 1 })
          ? "h1"
          : editor?.isActive("heading", { level: 2 })
            ? "h2"
            : editor?.isActive("heading", { level: 3 })
              ? "h3"
              : editor?.isActive("heading", { level: 4 })
                ? "h4"
                : editor?.isActive("heading", { level: 5 })
                  ? "h5"
                  : editor?.isActive("heading", { level: 6 })
                    ? "h6"
                    : editor?.isActive("blockquote")
                      ? "blockquote"
                      : editor?.isActive("codeBlock")
                        ? "pre"
                        : "p",
        showGrid: editorState?.showGrid,
        showRulers: editorState?.showRulers,
        characterCount: editor?.storage.characterCount?.characters() || 0,
        wordCount: editor?.storage.characterCount?.words() || 0,
      };

      if (JSON.stringify(newState) !== JSON.stringify(editorState)) {
        setEditorState(newState);
      }

      handleSave();
    },
    [editorState]
  );

  const togglePageMargins = () => {
    setShowPageMargins(!showPageMargins);

    // Apply visualization to the editor pages
    if (pagesContainerRef.current) {
      const pages = pagesContainerRef.current.querySelectorAll(".tiptap-page");
      pages.forEach((page) => {
        if (!showPageMargins) {
          page.classList.add("show-margins");
        } else {
          page.classList.remove("show-margins");
        }
      });
    }
  };

  useEffect(() => {
    if (!editor) return; // Skip if editor isn't initialized yet

    const dimensions = getDimensions();

    if (
      dimensions.width !== paginationSettings.pageWidth ||
      dimensions.height !== paginationSettings.pageHeight
    ) {
      setPaginationSettings((prev) => ({
        ...prev,
        pageWidth: dimensions.width,
        pageHeight: dimensions.height,
      }));

      // Apply the new page size to the editor
      editor.commands.setDocumentPaperSize(pageSize);
      editor.commands.setDocumentPaperOrientation(orientation);

      // Apply the margins to the editor (convert from px to mm for the pagination extension)
      editor.commands.setDocumentPageMargin(
        "left",
        paginationSettings.marginLeft / 3.78
      );
      editor.commands.setDocumentPageMargin(
        "right",
        paginationSettings.marginRight / 3.78
      );
      editor.commands.setDocumentPageMargin(
        "top",
        paginationSettings.marginTop / 3.78
      );
      editor.commands.setDocumentPageMargin(
        "bottom",
        paginationSettings.marginBottom / 3.78
      );

      // Force a re-render of the editor to apply the new dimensions
      setEditorKey((prevKey) => prevKey + 1);
    }
  }, [
    pageSize,
    orientation,
    editor,
    getDimensions,
    paginationSettings.marginBottom,
    paginationSettings.marginLeft,
    paginationSettings.marginRight,
    paginationSettings.marginTop,
  ]);

  // Apply margin visualization after editor is initialized
  useEffect(() => {
    if (editor && showPageMargins) {
      setTimeout(() => {
        if (pagesContainerRef.current) {
          const pages =
            pagesContainerRef.current.querySelectorAll(".tiptap-page");
          pages.forEach((page) => {
            page.classList.add("show-margins");
          });
        }
      }, 100);
    }
  }, [editor, showPageMargins]);

  // Apply header and footer when editor is initialized
  useEffect(() => {
    if (editor && (headerConfig || footerConfig)) {
      if (headerConfig) {
        editor
          .chain()
          .focus()
          .updateAttributes("doc", {
            header: generateHeaderFooterContent(headerConfig),
          })
          .run();
      }

      if (footerConfig) {
        editor
          .chain()
          .focus()
          .updateAttributes("doc", {
            footer: generateHeaderFooterContent(footerConfig),
          })
          .run();
      }
    }
  }, [editor, headerConfig, footerConfig]);

  // Handle page size and orientation change
  const handlePageSizeChange = (newSize: PaperSize) => {
    setPageSize(newSize);
  };

  const handleOrientationChange = (newOrientation: PaperOrientation) => {
    setOrientation(newOrientation);
  };

  // Apply formatting from toolbar
  const applyFormat = (command: string) => {
    if (!editor) return;

    switch (command) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "underline":
        editor.chain().focus().toggleUnderline().run();
        break;
      case "strikethrough":
        editor.chain().focus().toggleStrike().run();
        break;
      case "subscript":
        editor.chain().focus().toggleSubscript().run();
        break;
      case "superscript":
        editor.chain().focus().toggleSuperscript().run();
        break;
      case "highlight":
        editor.chain().focus().toggleHighlight().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;
      case "clear":
        editor.chain().focus().unsetAllMarks().run();
        break;
      default:
        break;
    }
  };

  const setFontFamily = (fontFamily: string) => {
    if (!editor) return;
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const setFontSize = (fontSize: number | string) => {
    if (!editor) return;
    editor.chain().focus().setFontSize(`${fontSize}px`).run();
  };

  const setTextColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };

  const setHighlightColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const setAlignment = (alignment: "left" | "center" | "right" | "justify") => {
    if (!editor) return;
    editor.chain().focus().setTextAlign(alignment).run();
  };

  const formatBlock = (blockType: string) => {
    if (!editor) return;

    if (blockType.startsWith("Heading")) {
      const level = Number.parseInt(blockType.split(" ")[1]) as
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    } else if (blockType === "Normal") {
      editor.chain().focus().setParagraph().run();
    } else if (blockType === "Quote") {
      editor.chain().focus().toggleBlockquote().run();
    } else if (blockType === "Code Block") {
      editor.chain().focus().toggleCodeBlock().run();
    } else if (blockType === "Task List") {
      editor.chain().focus().toggleTaskList().run();
    }
  };

  // Handle image insertion
  const handleInsertImage = (url: string, isUpload: boolean) => {
    if (!editor) return;

    if (inlineImageMode) {
      editor
        .chain()
        .focus()
        .setResizableImage({
          src: url,
          alt: "Inline image",
          width: 24,
          height: 24,
        })
        .run();

      // Apply inline specific styles after insertion
      const image = editor.view.dom.querySelector(
        'img[alt="Inline image"]'
      ) as HTMLImageElement;
      if (image) {
        image.style.display = "inline";
        image.style.verticalAlign = "middle";
        image.classList.add("editor-inline-image");
      }
    } else {
      editor
        .chain()
        .focus()
        .setResizableImage({
          src: url,
          alt: "Inserted image",
        })
        .run();
    }

    setImageDialogOpen(false);

    handleSave();
  };

  // Handle table insertion
  const handleInsertTable = (rows: number, cols: number) => {
    if (!editor) return;

    editor.chain().focus().insertTable({ rows, cols }).run();

    handleSave();
  };

  // Handle link insertion
  const handleInsertLink = (url: string) => {
    if (!editor) return;

    // Check if text is selected
    if (editor.view.state.selection.empty) {
      // If no text is selected, insert the URL as a link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}" class="editor-link">${url}</a>`)
        .run();
    } else {
      // If text is selected, convert it to a link
      editor.chain().focus().setLink({ href: url }).run();
    }

    handleSave();
  };

  const handleInsertCroppedCanvas = (croppedData: any) => {
    if (!editor) return;

    try {
      // Fix pointer events before inserting
      document.body.style.pointerEvents = "";

      // Use the imageData directly as an image source
      if (croppedData.imageData) {
        editor
          .chain()
          .focus()
          .setResizableImage({
            src: croppedData.imageData,
            alt: croppedData.name || "Canvas diagram",
            width: croppedData.dimensions?.width || 600,
            height: croppedData.dimensions?.height || 400,
          })
          .run();
      } else {
        toast.error("No image data available from cropped canvas");
      }

      setCropCanvasDialogOpen(false);
      setSelectedCanvasForCrop(null);
    } catch (error) {
      console.error("Error inserting cropped canvas:", error);
      // toast.error("Failed to insert cropped canvas");
    }

    handleSave();
  };

  const handleInsertCanvasTable = (tableData: any) => {
    if (!editor) return;

    try {
      // Fix pointer events before inserting
      document.body.style.pointerEvents = "";

      // Insert the canvas table node
      editor
        .chain()
        .focus()
        .insertContent({
          type: "canvasTable",
          attrs: {
            tableId: tableData.id,
            rows: tableData.rows,
            columns: tableData.columns,
            data: tableData.data,
          },
        })
        .run();

      // Ensure dialog is fully closed before proceeding
      setTimeout(() => {
        setTableSelectorDialogOpen(false);
        setSelectedTableData(null);
      }, 10);

      handleSave();
    } catch (error) {
      console.error("Error inserting canvas table:", error);
      // toast.error("Failed to insert canvas table");
      // Ensure pointer events are restored even if there's an error
      document.body.style.pointerEvents = "";
    }
  };

  // Modify the handleInsertCanvas function to open the crop dialog
  const handleInsertCanvas = (canvasData: any) => {
    if (!canvasData) {
      toast.error("Invalid canvas data");
      return;
    }

    // Ensure the canvas data has the required properties
    const formattedCanvasData = {
      id: canvasData.id || `canvas-${Date.now()}`,
      name: canvasData.name || "Untitled Canvas",
      nodes: canvasData.flowData?.nodes || [],
      edges: canvasData.flowData?.edges || [],
    };

    // Fix pointer events before closing the dialog
    document.body.style.pointerEvents = "";

    // Close the canvas selection dialog first
    setCanvasDialogOpen(false);

    // Then open the crop dialog with the selected canvas
    setTimeout(() => {
      setSelectedCanvasForCrop(formattedCanvasData);
      setCropCanvasDialogOpen(true);
    }, 10);
  };

  const handleApplyHeaderFooter = (config: HeaderFooterConfig) => {
    if (!editor) return;

    const { type } = config;

    // Save the config
    if (type === "header") {
      setHeaderConfig(config);
    } else {
      setFooterConfig(config);
    }

    // Generate HTML content based on config
    const content = generateHeaderFooterContent(config);

    // Apply the header or footer to all pages using the correct approach
    // The pagination extension uses attributes on the document node

    if (type === "header") {
      // Set header content using the pagination extension's API
      editor
        .chain()
        .focus()
        .updateAttributes("doc", {
          header: content,
        })
        .run();
    } else {
      // Set footer content using the pagination extension's API
      editor
        .chain()
        .focus()
        .updateAttributes("doc", {
          footer: content,
        })
        .run();
    }

    toast.success(
      `${type === "header" ? "Header" : "Footer"} applied successfully!`
    );
  };

  // Insert content
  const insertContent = (type: string) => {
    if (!editor) return;

    switch (type) {
      case "image":
        setInlineImageMode(false);
        setImageDialogOpen(true);
        break;
      case "inline-image":
        setInlineImageMode(true);
        setImageDialogOpen(true);
        break;
      case "table":
        setTableDialogOpen(true);
        break;
      case "link":
        setLinkDialogOpen(true);
        break;
      case "canvas":
        setCanvasDialogOpen(true);
        break;
      case "canvas-table":
        // Fix pointer events before opening the dialog
        document.body.style.pointerEvents = "";

        // Find tables from folder canvases
        const tableCanvases = folderCanvases.filter(
          (canvas) =>
            canvas.canvas_type === "table" && canvas.columns?.length > 0
        );

        if (tableCanvases.length > 0) {
          // Select the first table by default
          const firstTable = tableCanvases[0];
          setSelectedTableData({
            id: firstTable.id,
            name: firstTable.name,
            columns: firstTable.columns,
            flowData: firstTable.flowData || { nodes: [], edges: [] },
          });

          // Use setTimeout to ensure the dialog opens properly
          setTimeout(() => {
            setTableSelectorDialogOpen(true);
          }, 10);
        } else {
          toast.error("No tables available");
        }
        break;
      case "horizontal-rule":
        editor.chain().focus().setHorizontalRule().run();
        break;
      case "page-break":
        handlePageBreak();
        break;
      case "columns-layout":
        editor
          .chain()
          .focus()
          .insertContent(
            '<div style="column-count: 2; column-gap: 40px;"><p>Column 1 content...</p><p>Column 2 content...</p></div>'
          )
          .run();
        break;
      case "collapsible-container":
        editor
          .chain()
          .focus()
          .insertContent(
            "<details><summary>Click to expand</summary><p>Hidden content goes here...</p></details>"
          )
          .run();
        break;
      case "task-list":
        editor.chain().focus().toggleTaskList().run();
        break;
      case "task-item":
        editor.chain().focus().splitListItem("taskItem").run();
        break;
      case "header":
        setHeaderFooterType("header");
        setHeaderFooterDialogOpen(true);
        break;
      case "footer":
        setHeaderFooterType("footer");
        setHeaderFooterDialogOpen(true);
        break;
      default:
        break;
    }
  };

  // Header action handlers
  const handleSave = () => {
    if (!editor) return;

    try {
      // Get the latest editor state
      const latestEditorState = editor.getHTML();

      // Find all ReactFlow nodes in the editor and ensure their data is preserved
      const editorJSON = editor.getJSON();

      // Store the complete JSON structure to preserve all custom node data
      updateLexicalState(
        JSON.stringify({
          state: latestEditorState,
          controls: editorState,
          json: editorJSON,
        })
      );

      // toast.success("Document saved successfully");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!editor) {
      toast.error("Editor content not available");
      return;
    }

    try {
      setIsExporting(true);

      // Get the editor HTML - now all content should be standard HTML
      const editorHtml = editor.getHTML();

      // Extract any CSS styles from the document
      const styleElement = document.querySelector("style[data-tiptap-style]");
      const styleSheet = styleElement?.textContent || "";

      // Prepare the request payload
      const payload = {
        html: editorHtml,
        title: name || "document",
        paperSize: pageSize,
        orientation: orientation,
        styleSheet: styleSheet,
      };

      // Call the server-side API for PDF generation
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Get the PDF blob from response
      const pdfBlob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error(
        "Failed to export PDF: " +
          ((error as Error)?.message || "Unknown error")
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleUndo = () => {
    if (editor) editor.chain().focus().undo().run();
  };

  const handleRedo = () => {
    if (editor) editor.chain().focus().redo().run();
  };

  const handleCut = () => {
    document.execCommand("cut");
  };

  const handleCopy = () => {
    document.execCommand("copy");
  };

  const handlePaste = () => {
    document.execCommand("paste");
  };

  const handleDelete = () => {
    if (editor) editor.chain().focus().deleteSelection().run();
  };

  const handleSelectAll = () => {
    if (editor) editor.chain().focus().selectAll().run();
  };

  // Improved zoom handling - only zoom the content, not the container
  const handleZoomChange = (newZoom: string) => {
    const zoomValue = Number.parseInt(newZoom) / 100;
    setZoom(newZoom);

    if (zoomWrapperRef.current) {
      zoomWrapperRef.current.style.transform = `scale(${zoomValue})`;

      // When zoomed in, ensure the container allows for horizontal scrolling
      if (zoomValue > 1 && pagesContainerRef.current) {
        pagesContainerRef.current.style.alignItems = "flex-start";
        pagesContainerRef.current.style.overflowX = "auto";
      } else if (pagesContainerRef.current) {
        // When at normal zoom or zoomed out, keep content centered
        pagesContainerRef.current.style.alignItems = "center";
      }

      // Adjust the editor container's padding to accommodate the zoomed content
      if (pagesContainerRef.current) {
        // Add more padding when zoomed out to center the content better
        if (zoomValue < 1) {
          pagesContainerRef.current.style.paddingBottom = `${100 / zoomValue}px`;
        } else {
          pagesContainerRef.current.style.paddingBottom = "40px";
        }
      }
    }
    handleSave();
  };

  const handleZoomIn = () => {
    const currentZoom = Number.parseInt(zoom);
    if (currentZoom < 200) {
      const newZoom = Math.min(currentZoom + 25, 200) + "%";
      handleZoomChange(newZoom);
    }
  };

  const handleZoomOut = () => {
    const currentZoom = Number.parseInt(zoom);
    if (currentZoom > 50) {
      const newZoom = Math.max(currentZoom - 25, 50) + "%";
      handleZoomChange(newZoom);
    }
  };

  const handleFitToScreen = () => {
    handleZoomChange("100%");
  };

  const handleToggleGrid = () => {
    setEditorState((prev) => ({ ...prev, showGrid: !prev?.showGrid }));
  };

  const handleToggleRulers = () => {
    setEditorState((prev) => ({ ...prev, showRulers: !prev.showRulers }));
  };

  const handleBackToDashboard = async () => {
    await saveDocument();
    router.push("/protected");
  };

  const handleImportCanvas = (data: any) => {
    try {
      if (data && data.content && editor) {
        editor.commands.setContent(data.content);
        if (data.name) {
          setName(data.name);
        }
        toast.success("Document imported successfully");
      } else {
        toast.error("Invalid document format");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import document");
    }
  };

  // Export document as JSON
  const handleExportJSON = () => {
    if (!editor) return;

    try {
      const content = editor.getHTML();
      const documentData = {
        content,
        name,
        pageSize,
        orientation,
        margins: {
          top: paginationSettings.marginTop,
          right: paginationSettings.marginRight,
          bottom: paginationSettings.marginBottom,
          left: paginationSettings.marginLeft,
        },
        createdAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(documentData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document exported as JSON");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error("Failed to export document");
    }
  };

  const handlePageBreak = () => {
    if (!editor) return;

    // Use the command from the pagination extension
    editor
      .chain()
      .focus()
      .insertContent('<div class="pagination-page-break">Page Break</div>')
      .run();

    handleSave();
  };

  return (
    <div className="editor-container w-full">
      <Header
        onInsertImage={() => insertContent("image")}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onSelectAll={handleSelectAll}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onToggleGrid={handleToggleGrid}
        onToggleRulers={handleToggleRulers}
        projectName={name}
        setProjectName={setName}
        onSave={handleSave}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onBackToDashboard={handleBackToDashboard}
        onImportCanvas={handleImportCanvas}
        saveLoading={saveLoading}
        isExporting={isExporting}
        wordCount={editorState?.wordCount}
        characterCount={editorState?.characterCount}
      />
      <EditorToolbar
        editorState={editorState}
        onFormatText={applyFormat}
        onSetFontFamily={setFontFamily}
        onSetFontSize={setFontSize}
        onSetTextColor={setTextColor}
        onSetHighlightColor={setHighlightColor}
        onSetAlignment={(alignment) =>
          setAlignment(alignment as "left" | "center" | "right" | "justify")
        }
        onFormatBlock={formatBlock}
        onInsert={insertContent}
        pageSize={pageSize}
        orientation={orientation}
        onPageSizeChange={(size) => handlePageSizeChange(size as PaperSize)}
        onOrientationChange={(orientation) =>
          handleOrientationChange(orientation as PaperOrientation)
        }
        showPageMargins={showPageMargins}
        onTogglePageMargins={togglePageMargins}
        paginationSettings={{
          marginTop: paginationSettings.marginTop,
          marginRight: paginationSettings.marginRight,
          marginBottom: paginationSettings.marginBottom,
          marginLeft: paginationSettings.marginLeft,
        }}
        setPaginationSettings={(settings) => {
          setPaginationSettings((prev) => ({
            ...prev,
            ...settings,
          }));
        }}
        editor={editor}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        isPartOfCanvas={isPartOfCanvas}
        onBackToBoard={onBackToBoard}
      />

      <div className="editor-layout">
        <div className="editor-with-pages" ref={pagesContainerRef}>
          <div className="editor-zoom-wrapper" ref={zoomWrapperRef}>
            <div className="editor-content-scroll-container">
              <div ref={editorContentRef}>
                <EditorContent key={editorKey} editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageDialog
        isOpen={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsertImage={handleInsertImage}
        isInline={inlineImageMode}
      />

      <TableDialog
        isOpen={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        onInsertTable={handleInsertTable}
      />

      <LinkDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onInsertLink={handleInsertLink}
      />

      {/* Canvas Dialog */}
      <CanvasDialog
        isOpen={canvasDialogOpen}
        onClose={() => setCanvasDialogOpen(false)}
        onInsertCanvas={handleInsertCanvas}
        canvases={folderCanvases.filter(
          (canvas) => canvas.canvas_type === "hybrid" && canvas.flowData
        )}
      />
      <CanvasCropDialog
        isOpen={cropCanvasDialogOpen}
        onClose={() => setCropCanvasDialogOpen(false)}
        onInsertCroppedCanvas={handleInsertCroppedCanvas}
        canvasData={selectedCanvasForCrop}
      />
      <TableSelectorDialog
        isOpen={tableSelectorDialogOpen}
        onClose={() => setTableSelectorDialogOpen(false)}
        onInsertTable={handleInsertCanvasTable}
        tableData={selectedTableData}
        tables={folderCanvases.filter(
          (canvas) =>
            canvas.canvas_type === "table" && canvas.columns?.length > 0
        )}
      />
      <HeaderFooterDialog
        isOpen={headerFooterDialogOpen}
        onClose={() => setHeaderFooterDialogOpen(false)}
        onApply={handleApplyHeaderFooter}
        initialConfig={
          headerFooterType === "header"
            ? headerConfig || undefined
            : footerConfig || undefined
        }
        type={headerFooterType}
      />
    </div>
  );
}
