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
import { Minus, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import toast from "react-hot-toast";
import FontSize from "tiptap-extension-font-size";
import { Header } from "../canvas-new/header";
import { Unauthorized } from "../unauthorized";
import CanvasDialog from "./CanvasDialog";
import "./editor.css";
import EditorToolbar from "./EditorToolbar";
import CanvasTableNode from "./extensions/CanvasTableNode";
import { createFileMentionConfig } from "./extensions/FileMention";
import { createSlashCommandsConfig } from "./extensions/SlashCommands";
import FloatBlock from "./extensions/FloatBlock";
import { ReactFlowNode } from "./extensions/ReactFlowNode";
import ResizableImageNode from "./extensions/ResizableImageNode";
import { TextDirection } from "./extensions/TextDirection";
import { useDocumentStore } from "./hooks/useDocument";
import ImageDialog from "./ImageDialog";
import { backupDocument } from "@/lib/document-backup";
import FontUploadDialog from "./FontUploadDialog";
import LinkDialog from "./LinkDialog";
import PageSettingsDialog, {
  type PageSettingsValue,
} from "./PageSettingsDialog";
import TableDialog from "./TableDialog";
import TableSelectorDialog from "./TableSelectorDialog";
import { useUserFonts } from "./hooks/useUserFonts";

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

/**
 * Removes the legacy `tiptap-extension-pagination` wrapper structure from a
 * stored Tiptap document JSON.
 *
 * Pre-2.5 docs were saved as `Doc → Page → [HeaderFooter, Body, HeaderFooter]
 * → [paragraphs…]`. Without the plugin in the schema, ProseMirror would
 * reject those nodes on load. We unwrap them in-place: each Page is replaced
 * by its Body's children; HeaderFooter content is dropped (header/footer
 * config is persisted separately under `page.headerConfig`/`footerConfig`).
 *
 * The next autosave persists the cleaned shape, so this is a one-time-per-doc
 * cost.
 */
function flattenLegacyPagination(node: any): any {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node.content)) {
    const flattened: any[] = [];
    for (const child of node.content) {
      if (!child || typeof child !== "object") {
        flattened.push(child);
        continue;
      }
      if (child.type === "page") {
        // Extract the body's content; discard header/footer wrappers.
        const body = Array.isArray(child.content)
          ? child.content.find((c: any) => c?.type === "body")
          : null;
        if (body && Array.isArray(body.content)) {
          for (const grandchild of body.content) {
            flattened.push(flattenLegacyPagination(grandchild));
          }
        }
      } else if (child.type === "body") {
        if (Array.isArray(child.content)) {
          for (const grandchild of child.content) {
            flattened.push(flattenLegacyPagination(grandchild));
          }
        }
      } else if (child.type === "header-footer") {
        // Discard — config persists separately.
      } else {
        flattened.push(flattenLegacyPagination(child));
      }
    }
    return { ...node, content: flattened };
  }

  return node;
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
    onReady,
  }: {
    isPartOfCanvas?: boolean;
    onBackToBoard?: () => void;
    canvasId: string;
    readOnly?: boolean;
    onViewModeChange?: (viewMode: "canvas" | "table" | "document") => void;
    canvasType?: CANVAS_TYPE;
    viewMode?: "canvas" | "table" | "document";
    onReady?: () => void;
  },
  ref: any
) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [inlineImageMode, setInlineImageMode] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [fontUploadOpen, setFontUploadOpen] = useState(false);

  const [zoom, setZoom] = useState("100%");
  const [canvasDialogOpen, setCanvasDialogOpen] = useState(false);
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

  const userFonts = useUserFonts(user?.id ?? null);

  const router = useRouter();

  // Refs
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  const pendingChangesRef = useRef<boolean>(false);
  // Tracks which canvas the editor instance has already loaded; gates the
  // one-shot content loader so subsequent editor_state writes from our own
  // autosave never re-apply content mid-typing (the "flinch").
  const loadedCanvasIdRef = useRef<string | null>(null);
  // Set to true while we programmatically apply content; onUpdate skips
  // autosave during this window to avoid loops.
  const isApplyingRemoteRef = useRef<boolean>(false);
  // Indirection so the slash-command extension (created at useEditor time,
  // before insertContent is defined below) can call the latest handler.
  const insertContentRef = useRef<(type: string) => void>(() => {});
  // DATA-LOSS GUARD: only true once the document has loaded cleanly into the
  // editor. Autosave is blocked until then so a failed/incomplete load (e.g.
  // expired auth → empty editor) can never overwrite the stored content with
  // an empty document.
  const hasLoadedRef = useRef<boolean>(false);

  // Paper settings
  const [pageSize, setPageSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<PaperOrientation>("portrait");
  // (Phase 2.6: dropped the show-margins toggle — the editor is now a clean
  // paper surface without overlay clutter. Margins still apply as padding.)

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

  // Ref mirror of editorState so triggerAutoSave can read the latest value
  // without re-binding on every selection/keystroke (which would defeat the
  // debounce by recreating the timer).
  const editorStateRef = useRef<EditorState | null>(null);

  // Ref mirror of page settings (pageSize, orientation, margins) so
  // triggerAutoSave can serialize them without binding to those values.
  const pageSettingsRef = useRef<{
    pageSize: PaperSize;
    orientation: PaperOrientation;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  } | null>(null);

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
    lastSaved,
    folderCanvases,
    user_id,
    folder,
    error: loadError,
  } = useDocumentStore();

  // Initialize editor
  const editor = useEditor({
    immediatelyRender: false,
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
        limit: 500000,
      }),

      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ReactFlowNode,
      CanvasTableNode,
      FloatBlock,
      createFileMentionConfig({}),
      createSlashCommandsConfig({
        onInsert: (type) => insertContentRef.current(type),
      }),
    ],
    editable: !readOnly,
    content: "",
    onSelectionUpdate: ({ editor }) => {
      if (editor) {
        updateEditorState(editor);
      }
    },
    onUpdate: ({ editor }) => {
      if (!editor) return;
      // Skip autosave + state sync while we're applying server content; otherwise
      // the load itself races with autosave and we round-trip through the store.
      if (isApplyingRemoteRef.current) return;
      updateEditorState(editor);
      triggerAutoSave();
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
    // Focus is placed at end of content after the one-shot load completes.
    // Using `true` here would focus the empty doc before content arrives.
    autofocus: false,
  });

  // Auto-save: stable callback that doesn't re-bind on every keystroke.
  // editorState is read through a ref (editorStateRef) so changes to formatting
  // controls don't recreate this function and break the debounce.
  const triggerAutoSave = useCallback(() => {
    if (readOnly) return;
    if (!editor) return;
    // DATA-LOSS GUARD: never autosave before the document has loaded cleanly.
    // Prevents an empty/partial editor (failed load) from overwriting the
    // stored content.
    if (!hasLoadedRef.current) return;

    setSaveStatus("unsaved");
    pendingChangesRef.current = true;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingChangesRef.current) return;

      try {
        setSaveStatus("saving");

        const latestEditorState = editor.getHTML();
        const editorJSON = editor.getJSON();

        // Local safety-net backup before the network write (no-op for empty
        // docs). Survives even if the server save later fails or clobbers.
        if (canvasId) backupDocument(canvasId, editorJSON);

        const fullState = {
          state: latestEditorState,
          json: editorJSON,
          controls: editorStateRef.current,
          page: pageSettingsRef.current,
        };

        updateLexicalState(JSON.stringify(fullState));
        await saveDocument();

        pendingChangesRef.current = false;
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        // No recursive retry: the next user edit will retrigger the debounce
        // naturally. The previous setTimeout-retry could compound if saves kept
        // failing, multiplying stale-state writes.
      }
    }, 2000);
  }, [editor, saveDocument, updateLexicalState, readOnly]);

  // Phase 1: a single flush used by both unmount (SPA navigation) and
  // beforeunload (hard reload/close). Held in a ref that we refresh every render
  // so these listeners never capture a stale editor/state. Persisting on the way
  // out is what makes autosave the contract — "navigate away without Save" keeps
  // the work.
  const flushPendingSaveRef = useRef<() => void>(() => {});
  flushPendingSaveRef.current = () => {
    if (readOnly || !editor || !hasLoadedRef.current) return;
    if (!pendingChangesRef.current) return;
    try {
      const editorJSON = editor.getJSON();
      if (canvasId) backupDocument(canvasId, editorJSON);
      const fullState = {
        state: editor.getHTML(),
        json: editorJSON,
        controls: editorStateRef.current,
        page: pageSettingsRef.current,
      };
      // Push the latest content into the store, then fire the write. The zustand
      // store outlives this component, so the network save completes even after
      // unmount. saveDocument() snapshots the store synchronously at its top, so
      // a sibling document mounting right after can't redirect this write.
      updateLexicalState(JSON.stringify(fullState));
      void saveDocument();
      pendingChangesRef.current = false;
    } catch (error) {
      console.error("Error flushing pending document save:", error);
    }
  };

  // On unmount: cancel the pending debounce, then flush so the last edits within
  // the debounce window aren't dropped on navigation.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      flushPendingSaveRef.current();
    };
  }, []);

  // (Removed: a separate `debouncedSave` previously duplicated triggerAutoSave
  // but was never wired to onUpdate; both flowed to the same Supabase upsert
  // and racing the two only created stale writes.)

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
  // Mirror local toolbar state into a ref so triggerAutoSave reads the
  // latest value without re-binding (which would break debouncing).
  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  useEffect(() => {
    pageSettingsRef.current = {
      pageSize,
      orientation,
      marginTop: paginationSettings.marginTop,
      marginRight: paginationSettings.marginRight,
      marginBottom: paginationSettings.marginBottom,
      marginLeft: paginationSettings.marginLeft,
    };
  }, [
    pageSize,
    orientation,
    paginationSettings.marginTop,
    paginationSettings.marginRight,
    paginationSettings.marginBottom,
    paginationSettings.marginLeft,
  ]);

  // One-shot content loader. Runs exactly once per canvasId — gated by
  // loadedCanvasIdRef. Subsequent editor_state writes from autosave do NOT
  // re-enter this effect, which is what previously caused the "flinch":
  // the user's keystrokes round-tripped through the store and were re-applied
  // mid-typing.
  //
  // The actual load runs in a microtask (via setTimeout 0) to escape React's
  // commit phase. Tiptap's setContent internally calls flushSync, which React
  // 19 forbids during a render — without the deferral we get a
  // "flushSync was called from inside a lifecycle method" warning.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!canvasId) return;
    if (isLoading) return; // wait for store to finish loadDocument
    if (loadedCanvasIdRef.current === canvasId) return;

    // DATA-LOSS GUARD: if the store reports a load error (e.g. expired auth,
    // network failure), DO NOT mount empty content and DO NOT enable
    // autosave. The stored document is still intact in the DB; mounting empty
    // here and letting autosave fire would overwrite it with nothing. Leave
    // the gate unclaimed so a later successful load (after session refresh /
    // reconnection) retries cleanly.
    if (loadError) {
      hasLoadedRef.current = false;
      setSaveStatus("error");
      return;
    }

    // Claim the gate immediately so a re-run before the deferred work fires
    // doesn't enqueue a second load. If we abort below (editor destroyed
    // mid-defer), we release it.
    loadedCanvasIdRef.current = canvasId;

    const timer = setTimeout(() => {
      if (!editor || editor.isDestroyed) {
        loadedCanvasIdRef.current = null;
        return;
      }

      isApplyingRemoteRef.current = true;
      try {
        if (editor_state) {
          try {
            const parsedState = JSON.parse(editor_state);
            const { state, controls, json, page } = parsedState ?? {};
            // Migrate legacy pagination wrappers (Page/Body/HeaderFooter)
            // produced by the now-removed tiptap-extension-pagination, so
            // ProseMirror doesn't reject the doc on load. Idempotent — a
            // doc that's already flat passes through unchanged.
            const migratedJson = json ? flattenLegacyPagination(json) : null;
            if (migratedJson) {
              editor.commands.setContent(migratedJson, false);
            } else if (state) {
              editor.commands.setContent(state, false);
            } else {
              editor.commands.setContent("", false);
            }
            if (controls) {
              setEditorState(controls);
            }
            if (page) {
              // Restore persisted page geometry. (Phase 2.6: showMargins
              // dropped from the model — silently ignored on load if a
              // legacy save still has it.)
              if (page.pageSize) setPageSize(page.pageSize);
              if (page.orientation) setOrientation(page.orientation);
              const hasMargins =
                typeof page.marginTop === "number" ||
                typeof page.marginRight === "number" ||
                typeof page.marginBottom === "number" ||
                typeof page.marginLeft === "number";
              if (hasMargins) {
                setPaginationSettings((prev) => ({
                  ...prev,
                  marginTop: page.marginTop ?? prev.marginTop,
                  marginRight: page.marginRight ?? prev.marginRight,
                  marginBottom: page.marginBottom ?? prev.marginBottom,
                  marginLeft: page.marginLeft ?? prev.marginLeft,
                }));
              }
            }
          } catch (err) {
            editor.commands.setContent("", false);
            setSaveStatus("error");
            toast.error("Failed to load document content");
          }
        } else {
          editor.commands.setContent("", false);
        }
        pendingChangesRef.current = false;
        setSaveStatus("saved");
        // The document loaded cleanly — autosave is now safe to run.
        hasLoadedRef.current = true;
        // Place caret at the end after the document is mounted; replaces the
        // previous `autofocus: true` which fired on the empty doc.
        editor.commands.focus("end");
      } finally {
        isApplyingRemoteRef.current = false;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [editor, canvasId, editor_state, isLoading, loadError]);

  // Reset the load + autosave gates when the user navigates to a different
  // canvas, so the new doc must load cleanly before it can autosave.
  useEffect(() => {
    return () => {
      if (loadedCanvasIdRef.current !== canvasId) {
        loadedCanvasIdRef.current = null;
        hasLoadedRef.current = false;
      }
    };
  }, [canvasId]);

  // (Phase 2.5: removed the pagination-command effect. Page geometry now
  // flows entirely through CSS variables on the .editor-page-surface
  // wrapper — see the JSX render below. No editor commands needed.)

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

  // (Phase 2.5 removed: dimension-watcher effect.
  //  Phase 2.6 removed: show-margins toggle.
  //  Page geometry is now driven entirely by CSS variables on the
  //  .editor-page-surface wrapper — see the JSX below. The editor itself no
  //  longer knows about pages.)

  // Sync paginationSettings.pageWidth / pageHeight with the chosen paper
  // (now in mm). Some downstream code still reads these — keep them
  // accurate without firing any plugin commands.
  useEffect(() => {
    const dimensions = getDimensions();
    setPaginationSettings((prev) => {
      if (
        prev.pageWidth === dimensions.width &&
        prev.pageHeight === dimensions.height
      ) {
        return prev;
      }
      return {
        ...prev,
        pageWidth: dimensions.width,
        pageHeight: dimensions.height,
      };
    });
  }, [pageSize, orientation, getDimensions]);

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
        console.log(
          "Inserting real-time canvas with styles:",
          Object.keys(croppedData.originalStyles || {}).length
        );

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
              styles: JSON.stringify(croppedData.originalStyles || {}), // Include styles
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

      // Insert the canvas table node with enhanced attributes including RTL support
      editor
        .chain()
        .focus()
        .insertContent({
          type: "canvasTable",
          attrs: {
            tableId: tableData.tableId || tableData.id,
            rows: tableData.rows,
            columns: tableData.columns,
            data: dataString,
            // New dynamic attributes
            filterConfig: tableData.filterConfig || "[]",
            sortConfig: tableData.sortConfig || null,
            selectedColumns: tableData.selectedColumns || "[]",
            displayRows: tableData.displayRows || 5,
            isDynamic: tableData.isDynamic !== false, // Default to true
            lastUpdated: tableData.lastUpdated || new Date().toISOString(),
            // NEW: RTL support
            isRTL: tableData.isRTL || false, // Include RTL configuration
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
      console.error("Error inserting canvas table:", error);
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
      originalStyles: formattedCanvasData.styles,
      useRealTimeData: formattedCanvasData.useRealTimeData,
      canvasId: formattedCanvasData.canvasId,
    };
    handleInsertCroppedCanvas(croppedData);
  };

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
      case "float-block":
        editor.chain().focus().insertFloatBlock({ side: "right" }).run();
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
      default:
        break;
    }
  };
  // Keep the ref the slash-command extension calls pointed at the latest
  // insertContent closure (recreated each render).
  insertContentRef.current = insertContent;

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
    // Phase 1: autosave is the contract, so we no longer throw the browser's
    // "unsaved changes" confirmation dialog (no preventDefault / returnValue).
    // We just best-effort flush the pending save on the way out.
    const handleBeforeUnload = () => {
      flushPendingSaveRef.current();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Export to PDF - Server-side rendering
  const handleExportPDF = async () => {
    // Simply forward to browser print method by default
    handleBrowserPrintToPDF();
  };

  // Export to PDF using browser's print engine. Phase 7: forwards full
  // page geometry + text direction so the printed PDF matches the editor.
  const handleBrowserPrintToPDF = async () => {
    if (!editor) {
      toast.error("Editor content not available");
      return;
    }

    try {
      // Prefer the page surface so the cloned tree includes float blocks
      // and other editor-side wrappers, not just the bare ProseMirror.
      const surface = document.querySelector(".editor-page-surface");
      const editorElement =
        (surface as HTMLElement | null) ??
        (document.querySelector(".ProseMirror") as HTMLElement | null);
      if (!editorElement) {
        throw new Error("Editor element not found");
      }

      // Determine the document's predominant text direction by inspecting
      // the first non-empty top-level block's `dir` attribute (set by the
      // TextDirection extension). Default to ltr.
      let dir: "ltr" | "rtl" = "ltr";
      const doc = editor.state.doc;
      doc.forEach((node) => {
        if (dir !== "ltr") return; // first non-default wins
        if (node.attrs?.dir === "rtl") {
          dir = "rtl";
        }
      });

      await browserPrintToPDF({
        editorContent: editorElement,
        title: name || "Document",
        pageSize,
        orientation,
        margins: {
          top: paginationSettings.marginTop / 3.78,
          right: paginationSettings.marginRight / 3.78,
          bottom: paginationSettings.marginBottom / 3.78,
          left: paginationSettings.marginLeft / 3.78,
        },
        textDirection: dir,
      });

      toast.success(
        "Print dialog opened. Select 'Save as PDF' from your browser's print options to complete the export.",
        { duration: 6000 }
      );
    } catch (error) {
      toast.error(
        "Failed to open print dialog: " +
          ((error as Error)?.message || "Unknown error")
      );
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

    // (Phase 2.5: removed the editor-recreation dance on zoom reset.
    // Without the pagination plugin there's nothing to "rebuild" — zoom is
    // just a CSS transform on the wrapper.)

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
    // Inserts a regular <hr>. At PDF/print time (Phase 7) we'll emit a
    // `break-after: page` rule for all `.ProseMirror hr` so any horizontal
    // rule acts as a page break — which matches the typical print
    // convention. A dedicated PageBreak node can come later if we want
    // separate semantics from a section divider.
    editor.chain().focus().setHorizontalRule().run();
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
    triggerAutoSave,
    readOnly,
    editor,
  ]);

  useImperativeHandle(ref, () => {
    const methods = {
      exportAsPDF: handleExportPDF,
      exportAsJSON: handleExportJSON,
    };

    onReady?.();

    return methods;
  });

  const filteredCanvases = useMemo(() => {
    if (canvasType === CANVAS_TYPE.HYBRID) {
      // get the current canvas from id
      const currentCanvas = folderCanvases.find(
        (canvas) => canvas.id === canvasId
      );

      return [currentCanvas].filter(Boolean);
    }

    return folderCanvases.filter(
      (canvas) => canvas.canvas_type === "hybrid" && canvas.flowData
    );
  }, [folder, canvasType, folderCanvases]);

  const filteredTables = useMemo(() => {
    if (canvasType === CANVAS_TYPE.HYBRID) {
      const currentTable = folderCanvases.find(
        (canvas) => canvas.id === canvasId
      );

      return [currentTable].filter(Boolean);
    }

    return folderCanvases.filter(
      (canvas) =>
        (canvas.canvas_type === "table" || canvas.canvas_type === "hybrid") &&
        canvas.columns?.length > 0
    );
  }, [folderCanvases]);

  // If unauthorized, show the Unauthorized component
  if (unauthorized) {
    return <Unauthorized />;
  }

  return (
    <div className="w-full h-full editor-container">
      {/* {canvasType !== CANVAS_TYPE.HYBRID && ( */}
      <Header
        projectName={name}
        setProjectName={setName}
        onBackToDashboard={() => router.push("/protected")}
        onImportCanvas={handleImportCanvas}
        saveLoading={saveLoading || saveStatus === "saving"}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
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
      {/* // )} */}

      <div
        style={{
          position: "fixed",
          top: "58px",
          left: 0,
          right: 0,
          zIndex: 49,
          backgroundColor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          padding: "8px 16px",
        }}
      >
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
          onOpenPageSettings={
            isOwner && !readOnly ? () => setPageSettingsOpen(true) : undefined
          }
          userFontFamilies={userFonts.families}
          onOpenFontUpload={
            !readOnly ? () => setFontUploadOpen(true) : undefined
          }
        />
      </div>

      <div className="editor-layout">
        <div className="editor-with-pages" ref={pagesContainerRef}>
          <div className="editor-zoom-wrapper" ref={zoomWrapperRef}>
            <div className="editor-content-scroll-container">
              <div ref={editorContentRef}>
                {/*
                 * Phase 2.5: the .editor-page-surface wrapper applies
                 * paper-style geometry purely via CSS variables. Page size,
                 * orientation, and the four margins flow in from React
                 * state below; the editor itself is one continuous column.
                 * Real page splitting only happens at print time via the
                 * @page rules emitted by the PDF export pipeline.
                 */}
                <div
                  className="editor-page-surface"
                  style={
                    {
                      "--page-width-mm": `${getDimensions().width}mm`,
                      "--page-height-mm": `${getDimensions().height}mm`,
                      "--margin-top-mm": `${
                        paginationSettings.marginTop / 3.78
                      }mm`,
                      "--margin-right-mm": `${
                        paginationSettings.marginRight / 3.78
                      }mm`,
                      "--margin-bottom-mm": `${
                        paginationSettings.marginBottom / 3.78
                      }mm`,
                      "--margin-left-mm": `${
                        paginationSettings.marginLeft / 3.78
                      }mm`,
                    } as CSSProperties
                  }
                  onClick={(e) => {
                    // Navigate when a file-mention chip is clicked. The
                    // chip is a span inside the editor; matching by class
                    // lets us avoid wiring a per-instance click handler
                    // on every NodeView.
                    const target = (e.target as HTMLElement).closest(
                      ".file-mention"
                    ) as HTMLElement | null;
                    if (!target) return;
                    const id = target.getAttribute("data-file-id");
                    if (!id) return;
                    e.preventDefault();
                    router.push(`/protected/playbook/${id}`);
                  }}
                >
                  <EditorContent editor={editor} />
                </div>
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

      <CanvasDialog
        isOpen={canvasDialogOpen}
        onClose={() => setCanvasDialogOpen(false)}
        onInsertCanvas={handleInsertCanvas}
        canvases={filteredCanvases}
      />

      <TableSelectorDialog
        isOpen={tableSelectorDialogOpen}
        onClose={() => setTableSelectorDialogOpen(false)}
        onInsertTable={handleInsertCanvasTable}
        tableData={selectedTableData}
        tables={filteredTables}
      />

      <PageSettingsDialog
        isOpen={pageSettingsOpen}
        onClose={() => setPageSettingsOpen(false)}
        value={{
          pageSize,
          orientation,
          marginTop: paginationSettings.marginTop,
          marginRight: paginationSettings.marginRight,
          marginBottom: paginationSettings.marginBottom,
          marginLeft: paginationSettings.marginLeft,
        }}
        onApply={(next) => {
          setPageSize(next.pageSize);
          setOrientation(next.orientation);
          setPaginationSettings((prev) => ({
            ...prev,
            marginTop: next.marginTop,
            marginRight: next.marginRight,
            marginBottom: next.marginBottom,
            marginLeft: next.marginLeft,
          }));
          // Persist the new geometry so reload restores it.
          triggerAutoSave();
        }}
      />

      <FontUploadDialog
        isOpen={fontUploadOpen}
        onClose={() => setFontUploadOpen(false)}
        fonts={userFonts.fonts}
        onUpload={userFonts.upload}
        onRemove={userFonts.remove}
      />
    </div>
  );
};

export default forwardRef(Editor);
