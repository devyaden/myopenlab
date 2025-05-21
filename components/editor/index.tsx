"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser } from "@/lib/contexts/userContext";
import type { PaperOrientation, PaperSize } from "@/types/paper";
import { CANVAS_TYPE } from "@/types/store";
import { DEFAULT_MARGINS, PAPER_DIMENSIONS } from "@/utils/paper-sizes";
import { browserPrintToPDF } from "@/utils/pdf-export";
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
import { Minus, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import FontSize from "tiptap-extension-font-size";
import PaginationExtension, {
  BodyNode,
  HeaderFooterNode,
  PageNode,
} from "tiptap-extension-pagination";
import { Header } from "../canvas-new/header";
import { Unauthorized } from "../unauthorized";
import CanvasCropDialog from "./CanvasCropDialog";
import CanvasDialog from "./CanvasDialog";
import "./editor.css";
import EditorToolbar from "./EditorToolbar";
import CanvasTableNode from "./extensions/CanvasTableNode";
import { ReactFlowNode } from "./extensions/ReactFlowNode";
import ResizableImageNode from "./extensions/ResizableImageNode";
import { TextDirection } from "./extensions/TextDirection";
import HeaderFooterDialog, {
  type HeaderFooterConfig,
} from "./HeaderFooterDialog";
import { useDocumentStore } from "./hooks/useDocument";
import ImageDialog from "./ImageDialog";
import LinkDialog from "./LinkDialog";
import TableDialog from "./TableDialog";
import TableSelectorDialog from "./TableSelectorDialog";

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
  textDirection: "ltr" | "rtl";
}

const Editor = (
  {
    isPartOfCanvas,
    onBackToBoard,
    canvasId,
    readOnly,
    onViewModeChange,
    viewMode,
    canvasType,
  }: {
    isPartOfCanvas?: boolean;
    onBackToBoard?: () => void;
    canvasId: string;
    readOnly?: boolean;
    onViewModeChange?: (viewMode: "canvas" | "table" | "document") => void;
    canvasType?: CANVAS_TYPE;
    viewMode?: "canvas" | "table" | "document";
  },
  ref: any
) => {
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
  const [visibility, setVisibility] = useState<string>("private");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");

  const { user } = useUser();

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
  const saveTimeoutRef = useRef<any>(null);
  const pendingChangesRef = useRef<boolean>(false);

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
    textDirection: "ltr",
  });

  // Add new state variable for tracking editor key change time
  const [editorKeyChangeTime, setEditorKeyChangeTime] = useState<number>(
    Date.now()
  );

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
    user_id,
    folder,
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
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: "editor-bullet-list",
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: "editor-ordered-list",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "editor-list-item",
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
      TextDirection.configure({
        types: ["heading", "paragraph"],
        defaultDirection: "ltr",
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
    editable: !readOnly,
    content: "",
    onSelectionUpdate: ({ editor }) => {
      if (editor) {
        updateEditorState(editor);
      }
    },
    onUpdate: ({ editor }) => {
      if (editor) {
        updateEditorState(editor);

        triggerAutoSave();
      }
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
    autofocus: true,
  });

  // Enhanced auto-save mechanism with proper debouncing
  const triggerAutoSave = useCallback(() => {
    if (readOnly) return; // Don't save in read-only mode
    if (!editor) return;

    // Mark as unsaved immediately for UI feedback
    setSaveStatus("unsaved");
    pendingChangesRef.current = true;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set up a new timeout for saving
    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingChangesRef.current) return;

      try {
        setSaveStatus("saving");

        // Get the latest editor state
        const latestEditorState = editor.getHTML();
        const editorJSON = editor.getJSON();

        // Save the complete state including HTML and JSON
        const fullState = {
          state: latestEditorState,
          json: editorJSON,
          controls: editorState,
        };

        // Update the state in the document store
        updateLexicalState(JSON.stringify(fullState));

        // Save the document to the database
        await saveDocument();

        // Mark as saved
        pendingChangesRef.current = false;
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");

        // Retry once after a short delay if there was an error
        setTimeout(() => {
          if (pendingChangesRef.current) {
            triggerAutoSave();
          }
        }, 5000);
      }
    }, 2000); // 2-second debounce
  }, [editor, editorState, saveDocument, updateLexicalState, readOnly]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(() => {
      if (readOnly) return; // Don't save in read-only mode
      if (!editor) return;

      try {
        // Get the latest editor state
        const latestEditorState = editor.getHTML();

        // Find all ReactFlow nodes in the editor and ensure their data is preserved
        const editorJSON = editor.getJSON();

        // Save the complete state including HTML and JSON
        const fullState = {
          state: latestEditorState,
          json: editorJSON,
          controls: editorState,
        };

        // Update the Lexical state in the document store
        updateLexicalState(JSON.stringify(fullState));

        // Save the document to the database
        saveDocument();
      } catch (error) {
        console.error("Error saving document:", error);
      }
    }, 1000),
    [editor, editorState, saveDocument, updateLexicalState, readOnly]
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

      // Add to recent documents
      const savedDocuments = localStorage.getItem("recentDocuments");
      const documents = savedDocuments ? JSON.parse(savedDocuments) : [];

      // Check if document already exists
      const existingDocIndex = documents.findIndex(
        (doc: any) => doc.id === canvasId
      );

      if (existingDocIndex === -1) {
        // Add new document
        documents.unshift({
          id: canvasId,
          title: name || "Untitled Document",
          date: new Date().toLocaleDateString(),
          type: "document",
        });
      } else {
        // Update existing document
        documents[existingDocIndex].date = new Date().toLocaleDateString();
        documents[existingDocIndex].title = name || "Untitled Document";
      }

      // Keep only the last 10 documents
      const recentDocuments = documents.slice(0, 10);
      localStorage.setItem("recentDocuments", JSON.stringify(recentDocuments));
    }
  }, [canvasId, name]);
  // Update the useEffect that handles editor initialization and content loading
  useEffect(() => {
    if (!editor) return;

    // Apply page dimensions and margins immediately when editor is created
    const initializeEditor = async () => {
      if (editor && !editor.isDestroyed) {
        try {
          // First apply page settings
          editor.commands.setDocumentPaperSize(pageSize);
          editor.commands.setDocumentPaperOrientation(orientation);

          // Then apply margins
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

          // Load content if available - with improved error handling
          if (editor_state) {
            try {
              const parsedState = JSON.parse(editor_state);
              const { state, controls, json } = parsedState;

              // If we have the full JSON structure, use it for better data preservation
              if (json) {
                editor.commands.setContent(json);
              } else if (state) {
                // Fallback to HTML content
                editor.commands.setContent(state);
              } else {
              }

              if (controls) {
                setEditorState(controls);
              }

              // Mark as saved after initial load
              setSaveStatus("saved");
              pendingChangesRef.current = false;
            } catch (error) {
              toast.error("Failed to load document content - reload may help");

              // Recovery attempt - try to set empty content
              editor.commands.setContent("");
              setSaveStatus("error");
            }
          } else {
            editor.commands.setContent("");
          }
        } catch (error) {
          toast.error("Editor initialization failed");
        }
      }
    };

    // Delay initialization slightly to ensure editor is fully mounted
    const timer = setTimeout(initializeEditor, 100);

    return () => clearTimeout(timer);
  }, [
    editor,
    editorKey,
    editor_state,
    pageSize,
    orientation,
    paginationSettings.marginLeft,
    paginationSettings.marginRight,
    paginationSettings.marginTop,
    paginationSettings.marginBottom,
  ]);
  // Keep the existing useEffect for editor_state changes, but modify to prevent duplicate state updates
  useEffect(() => {
    if (!editor || !editor_state) return;

    // Skip this effect if the editor was just recreated (avoid double loading)
    const lastKeyChange = Date.now() - editorKeyChangeTime;
    if (lastKeyChange <= 500) return;

    // Use a small delay to ensure the editor is ready and avoid conflicts
    const timer = setTimeout(() => {
      try {
        if (editor.isDestroyed) {
          return;
        }

        const parsedState = JSON.parse(editor_state);
        const { state, controls, json } = parsedState;

        // Important: get the current editor content for comparison
        const currentContent = JSON.stringify(editor.getJSON());
        const incomingContent = JSON.stringify(json || state);

        // Only update if content is different to avoid loops and cursor jumps
        if (currentContent !== incomingContent) {
          // If we have the full JSON structure, use it for better data preservation
          if (json) {
            editor.commands.setContent(json);
          } else if (state) {
            // Fallback to HTML content
            editor.commands.setContent(state);
          }

          if (controls) {
            setEditorState(controls);
          }

          // Mark as saved after content update from store
          setSaveStatus("saved");
          pendingChangesRef.current = false;
        } else {
          console.log("Content unchanged, skipping update");
        }
      } catch (error) {
        toast.error("Failed to update document content");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [editor_state, editor, editorKeyChangeTime]);

  const updateEditorState = useCallback(
    (editor: any) => {
      if (!editor || !editor.state) return;

      try {
        // Get the current selection from the editor
        const { from, to, empty } = editor.state.selection;

        // Get the specific mark and node attributes at the current selection
        let marks = {};
        let nodeAttrs = {};
        let blockType = "p";

        // Get text style attributes - directly using the editor's helper methods
        const textStyleAttrs = editor.getAttributes("textStyle");
        const fontFamily = textStyleAttrs.fontFamily || "Arial";
        const fontSize = textStyleAttrs.fontSize || "15px";

        // Determine block type and alignment
        if (editor.isActive("heading", { level: 1 })) blockType = "h1";
        else if (editor.isActive("heading", { level: 2 })) blockType = "h2";
        else if (editor.isActive("heading", { level: 3 })) blockType = "h3";
        else if (editor.isActive("heading", { level: 4 })) blockType = "h4";
        else if (editor.isActive("heading", { level: 5 })) blockType = "h5";
        else if (editor.isActive("heading", { level: 6 })) blockType = "h6";
        else if (editor.isActive("blockquote")) blockType = "blockquote";
        else if (editor.isActive("codeBlock")) blockType = "pre";

        // Get alignment
        let alignment = "left";
        if (editor.isActive({ textAlign: "center" })) alignment = "center";
        else if (editor.isActive({ textAlign: "right" })) alignment = "right";
        else if (editor.isActive({ textAlign: "justify" }))
          alignment = "justify";

        // Get current text direction
        let textDirection: "ltr" | "rtl" = "ltr";
        // Get the current node
        const node = editor.state.selection.$anchor.parent;
        if (node && node.attrs && node.attrs.dir) {
          textDirection = node.attrs.dir as "ltr" | "rtl";
        }

        // Build the updated state
        const newState = {
          isBold: editor.isActive("bold"),
          isItalic: editor.isActive("italic"),
          isUnderline: editor.isActive("underline"),
          fontFamily,
          fontSize,
          alignment,
          blockType,
          showGrid: editorState?.showGrid,
          showRulers: editorState?.showRulers,
          characterCount: editor.storage.characterCount?.characters() || 0,
          wordCount: editor.storage.characterCount?.words() || 0,
          textDirection,
        };

        // Only update if state has actually changed
        if (JSON.stringify(newState) !== JSON.stringify(editorState)) {
          setEditorState(newState as EditorState);
        }
      } catch (error) {
        console.error("Error updating editor state:", error);
      }
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

  // Update the useEffect that watches for page dimensions changes
  useEffect(() => {
    if (!editor) return; // Skip if editor isn't initialized yet

    const dimensions = getDimensions();

    if (
      dimensions.width !== paginationSettings.pageWidth ||
      dimensions.height !== paginationSettings.pageHeight
    ) {
      // Store current editor content
      const editorJSON = editor.getJSON();

      // Update pagination settings
      setPaginationSettings((prev) => ({
        ...prev,
        pageWidth: dimensions.width,
        pageHeight: dimensions.height,
      }));

      // Force recreation of the editor
      setEditorKey((prevKey) => {
        setEditorKeyChangeTime(Date.now());
        return prevKey + 1;
      });

      // After editor is recreated, restore content and apply settings
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            // Set content first
            editor.commands.setContent(editorJSON);

            // Then apply the new page size to the editor
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
          }
        }, 100);
      });
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
    paginationSettings.pageWidth,
    paginationSettings.pageHeight,
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

  // A complete approach to handle page size changes that forces a full editor recreation
  const handlePageSizeChange = (newSize: PaperSize) => {
    if (!editor) return;

    // Store the current content state before changing dimensions
    const editorJSON = editor.getJSON();

    // Update the page size state
    setPageSize(newSize);

    // Update the pagination settings with new dimensions
    const newDimensions = PAPER_DIMENSIONS[newSize];
    const dimensions =
      orientation === "landscape"
        ? { width: newDimensions.height, height: newDimensions.width }
        : newDimensions;

    setPaginationSettings((prev) => ({
      ...prev,
      pageWidth: dimensions.width,
      pageHeight: dimensions.height,
    }));

    setEditorKey((prevKey) => {
      setEditorKeyChangeTime(Date.now());
      return prevKey + 1;
    });

    // After editor is recreated, restore its content in the next animation frame
    requestAnimationFrame(() => {
      // Use setTimeout to ensure the editor is fully initialized
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          // Set content first to ensure all nodes are present
          editor.commands.setContent(editorJSON);

          // Then apply the page settings
          editor.commands.setDocumentPaperSize(newSize);
          editor.commands.setDocumentPaperOrientation(orientation);

          // Apply margins after content is set
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
        }
      }, 100);
    });
  };

  // Similarly update the orientation change handler
  const handleOrientationChange = (newOrientation: PaperOrientation) => {
    if (!editor) return;

    // Store the current content state before changing dimensions
    const editorJSON = editor.getJSON();

    // Update the orientation state
    setOrientation(newOrientation);

    // Update pagination settings with new dimensions based on orientation
    const newDimensions = PAPER_DIMENSIONS[pageSize];
    const dimensions =
      newOrientation === "landscape"
        ? { width: newDimensions.height, height: newDimensions.width }
        : newDimensions;

    setPaginationSettings((prev) => ({
      ...prev,
      pageWidth: dimensions.width,
      pageHeight: dimensions.height,
    }));

    // Force a complete editor recreation
    setEditorKey((prevKey) => {
      setEditorKeyChangeTime(Date.now());
      return prevKey + 1;
    });

    // After editor is recreated, restore its content
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          // Set content first
          editor.commands.setContent(editorJSON);

          // Then apply page settings
          editor.commands.setDocumentPaperSize(pageSize);
          editor.commands.setDocumentPaperOrientation(newOrientation);

          // Apply margins after content is set
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
        }
      }, 100);
    });
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
      case "ltr":
        editor.chain().focus().setTextDirection("ltr").run();
        break;
      case "rtl":
        editor.chain().focus().setTextDirection("rtl").run();
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

  const setTextDirection = (direction: "ltr" | "rtl") => {
    if (!editor) return;
    editor.chain().focus().setTextDirection(direction).run();
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

      // Check if we should use real-time data or static image
      if (croppedData.useRealTimeData && croppedData.canvasId) {
        // Insert as a ReactFlow node with real-time updates enabled
        editor
          .chain()
          .focus()
          .insertContent({
            type: "reactFlow",
            attrs: {
              id: `canvas-${Date.now()}`,
              canvasId: croppedData.canvasId,
              name: croppedData.name || "Canvas diagram",
              nodes: JSON.stringify(croppedData.originalNodes || []),
              edges: JSON.stringify(croppedData.originalEdges || []),
              width: croppedData.dimensions?.width || 600,
              height: croppedData.dimensions?.height || 400,
              useRealTimeData: true,
              lastUpdated: new Date().toISOString(),
            },
          })
          .run();
      } else if (croppedData.imageData) {
        // Use the imageData directly as a static image source
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

      // Ensure data is properly stringified and all cell values are converted to strings
      let dataString = "";

      try {
        // If data is already a string, try to parse it to process the values
        if (typeof tableData.data === "string") {
          const parsedData = JSON.parse(tableData.data);
          // Convert each cell value to a string to avoid React rendering objects
          const processedData = Array.isArray(parsedData)
            ? parsedData.map((row: any[]) =>
                row.map((cell: any) => {
                  // Convert objects or complex types to strings
                  return typeof cell === "object" && cell !== null
                    ? JSON.stringify(cell)
                    : String(cell);
                })
              )
            : [];
          dataString = JSON.stringify(processedData);
        } else if (Array.isArray(tableData.data)) {
          // If data is already an array, process it directly
          const processedData = tableData.data.map((row: any[]) =>
            row.map((cell: any) => {
              return typeof cell === "object" && cell !== null
                ? JSON.stringify(cell)
                : String(cell);
            })
          );
          dataString = JSON.stringify(processedData);
        } else {
          // Fallback to empty array if data is invalid
          dataString = "[]";
        }
      } catch (error) {
        console.error("Error processing table data:", error);
        dataString = "[]";
      }

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
            data: dataString,
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
      nodes: canvasData.flowData?.[0]?.nodes || [],
      edges: canvasData.flowData?.[0]?.edges || [],
      styles: canvasData.flowData?.[0]?.styles || {},
      useRealTimeData: canvasData.useRealTimeData || false,
      canvasId: canvasData.id, // Store the original canvas ID for real-time updates
    };

    // Fix pointer events before closing the dialog
    document.body.style.pointerEvents = "";

    // Close the canvas selection dialog first
    setCanvasDialogOpen(false);

    // Directly insert the canvas without cropping
    // Construct the necessary data for handleInsertCroppedCanvas
    const croppedData = {
      id: formattedCanvasData.id,
      name: formattedCanvasData.name,
      imageData: null, // No image data as we are inserting the live canvas
      dimensions: { width: 570, height: 300 }, // Default dimensions
      originalNodes: formattedCanvasData.nodes,
      originalEdges: formattedCanvasData.edges,
      useRealTimeData: formattedCanvasData.useRealTimeData,
      canvasId: formattedCanvasData.canvasId,
    };
    handleInsertCroppedCanvas(croppedData);
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
        // Fix pointer events before opening the dialogF
        document.body.style.pointerEvents = "";

        // Find tables from folder canvases
        const tableCanvases = folderCanvases.filter(
          (canvas) =>
            (canvas.canvas_type === "table" ||
              canvas.canvas_type === "hybrid") &&
            canvas.columns?.length > 0
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
  const handleSave = async () => {
    if (!editor || readOnly) return;

    try {
      setSaveStatus("saving");

      // Get the latest editor state
      const latestEditorState = editor.getHTML();
      const editorJSON = editor.getJSON();

      // Save the complete state including HTML and JSON
      const fullState = {
        state: latestEditorState,
        controls: editorState,
        json: editorJSON,
      };

      // Update the Lexical state in the document store
      updateLexicalState(JSON.stringify(fullState));

      // Save the document to the database
      await saveDocument();

      // Update status to saved
      setSaveStatus("saved");
      pendingChangesRef.current = false;
    } catch (error) {
      setSaveStatus("error");

      // Show error toast only on manual save
      toast.error("Failed to save document");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChangesRef.current && !readOnly) {
        // Save any pending changes synchronously before unload
        try {
          if (editor) {
            const latestEditorState = editor.getHTML();
            const editorJSON = editor.getJSON();
            const fullState = {
              state: latestEditorState,
              json: editorJSON,
              controls: editorState,
            };
            updateLexicalState(JSON.stringify(fullState));
          }
        } catch (error) {
          console.error("Error in beforeunload save:", error);
        }

        // Standard way to show confirmation dialog
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editor, editorState, updateLexicalState, readOnly]);

  // Export to PDF - Server-side rendering
  const handleExportPDF = async () => {
    // Simply forward to browser print method by default
    handleBrowserPrintToPDF();
  };

  // Export to PDF using browser's print functionality - better for ReactFlow diagrams
  const handleBrowserPrintToPDF = async () => {
    if (!editor) {
      toast.error("Editor content not available");
      return;
    }

    try {
      setIsExporting(true);

      // Get the editor DOM element
      const editorElement = document.querySelector(".ProseMirror");

      if (!editorElement) {
        throw new Error("Editor element not found");
      }

      // Use the browser print to PDF function
      await browserPrintToPDF(editorElement as HTMLElement, name || "Document");

      toast.success(
        "Print dialog opened. Select 'Save as PDF' from your browser's print options to complete the export.",
        { duration: 6000 }
      );
    } catch (error) {
      toast.error(
        "Failed to open print dialog: " +
          ((error as Error)?.message || "Unknown error")
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Update the handleZoomChange function
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

    // If resetting to 100%, refresh the editor to ensure all elements are rendered correctly
    if (newZoom === "100%" && editor) {
      // Store current content
      const editorJSON = editor.getJSON();

      // Force editor recreation
      setEditorKey((prevKey) => {
        setEditorKeyChangeTime(Date.now());
        return prevKey + 1;
      });

      // Restore content after editor recreation
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(editorJSON);

            // Apply page settings
            editor.commands.setDocumentPaperSize(pageSize);
            editor.commands.setDocumentPaperOrientation(orientation);
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
          }
        }, 100);
      });
    }

    triggerAutoSave();
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

  useEffect(() => {
    if (user && user_id) {
      setIsOwner(user.id === user_id);
      setIsLoaded(true);
    }
  }, [user, user_id]);

  const handleVisibilityChange = async (newVisibility: string) => {
    try {
      const response = await fetch("/api/canvas/visibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canvasId,
          visibility: newVisibility,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      setVisibility(newVisibility);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user || !isLoaded) return;

      try {
        // Get canvas details to check visibility
        const response = await fetch(`/api/canvas/${canvasId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Canvas not found");
            router.push("/protected");
            return;
          }
          throw new Error("Failed to fetch canvas");
        }

        const data = await response.json();
        setVisibility(data.visibility || "private");

        // If user is not owner and canvas is not public, show unauthorized component
        if (user.id !== data.user_id && data.visibility !== "public") {
          setUnauthorized(true);
        }

        if (user.id !== data.user_id && data.visibility === "public") {
          // setIsOwner(true);
          editor?.setOptions({ editable: false });
        }
      } catch (error) {
        toast.error("Failed to check authorization");
      }
    };

    checkAuthorization();
  }, [canvasId, user, isLoaded, router]);

  useEffect(() => {
    if (editor && !readOnly) {
      triggerAutoSave();
    }
  }, [
    pageSize,
    orientation,
    paginationSettings,
    headerConfig,
    footerConfig,
    triggerAutoSave,
    readOnly,
    editor,
  ]);

  useImperativeHandle(ref, () => ({
    exportAsPDF: handleExportPDF,
    exportAsJSON: handleExportJSON,
  }));

  const renderSaveStatus = () => {
    if (readOnly) return null;

    return (
      <div className="save-status flex items-center text-sm ml-2">
        {saveStatus === "saving" && (
          <span className="text-yellow-600 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-green-600 flex items-center">
            <svg
              className="h-3 w-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Saved
          </span>
        )}
        {saveStatus === "unsaved" && (
          <span className="text-orange-600 flex items-center">
            <span className="h-2 w-2 mr-1 rounded-full bg-orange-600"></span>
            Unsaved changes
          </span>
        )}
        {saveStatus === "error" && (
          <span
            className="text-red-600 flex items-center cursor-pointer"
            onClick={handleSave}
          >
            <span className="h-2 w-2 mr-1 rounded-full bg-red-600"></span>
            Save failed. Click to retry
          </span>
        )}
      </div>
    );
  };

  const renderHeader = () => {
    if (canvasType !== CANVAS_TYPE.HYBRID) {
      return (
        <Header
          projectName={name}
          setProjectName={setName}
          onBackToDashboard={() => router.push("/protected")}
          onImportCanvas={handleImportCanvas}
          saveLoading={saveLoading || saveStatus === "saving"}
          onSave={handleSave}
          canvasId={canvasId}
          visibility={visibility}
          onVisibilityChange={handleVisibilityChange}
          isOwner={isOwner}
          viewMode={"document"}
          exportAsJSON={handleExportJSON}
          propExportAsPDF={handleBrowserPrintToPDF}
          canvasType={CANVAS_TYPE.DOCUMENT}
          currentFolder={folder}
          // saveStatus={saveStatus} // Pass save status to header
          // renderSaveStatus={renderSaveStatus} // Pass render function
        />
      );
    }
    return null;
  };

  // If unauthorized, show the Unauthorized component
  if (unauthorized) {
    return <Unauthorized />;
  }

  return (
    <div className="w-full h-full editor-container">
      {renderSaveStatus()}
      {canvasType !== CANVAS_TYPE.HYBRID && (
        <Header
          projectName={name}
          setProjectName={setName}
          onBackToDashboard={() => router.push("/protected")}
          onImportCanvas={handleImportCanvas}
          saveLoading={saveLoading || saveStatus === "saving"}
          onSave={handleSave}
          canvasId={canvasId}
          visibility={visibility}
          onVisibilityChange={handleVisibilityChange}
          isOwner={isOwner}
          viewMode={"document"}
          exportAsJSON={handleExportJSON}
          propExportAsPDF={handleBrowserPrintToPDF}
          canvasType={CANVAS_TYPE.DOCUMENT}
          currentFolder={folder}
        />
      )}

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
        onSetTextDirection={(direction) =>
          setTextDirection(direction as "ltr" | "rtl")
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
        isPartOfCanvas={isPartOfCanvas}
        onBackToBoard={onBackToBoard}
        onViewModeChange={onViewModeChange || (() => {})}
        viewMode={viewMode ?? "document"}
        canvasType={canvasType ?? CANVAS_TYPE.DOCUMENT}
        isOwner={isOwner}
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

        {/* Zoom controls in bottom right */}
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-md p-1 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={() => {
              const currentZoom = Number.parseInt(zoom);
              if (currentZoom > 50) {
                const newZoom = Math.max(currentZoom - 25, 50) + "%";
                handleZoomChange(newZoom);
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
                      onClick={() => handleZoomChange(zoomLevel)}
                    >
                      {zoomLevel}
                    </Button>
                  )
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start rounded-none border-t"
                  onClick={() => handleZoomChange("100%")}
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
                handleZoomChange(newZoom);
              }
            }}
            aria-label="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
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
            (canvas.canvas_type === "table" ||
              canvas.canvas_type === "hybrid") &&
            canvas.columns?.length > 0
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
};

export default forwardRef(Editor);
