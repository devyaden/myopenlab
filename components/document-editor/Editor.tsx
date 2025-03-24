"use client";

import { useDocumentStore } from "@/lib/store/useDocument";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SelectionAlwaysOnDisplay } from "@lexical/react/LexicalSelectionAlwaysOnDisplay";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { CAN_USE_DOM } from "@lexical/utils";
import { DELETE_WORD_COMMAND, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createWebsocketProvider } from "./collaboration";
import { usePageManager } from "./components/PageManager";
import { useSettings } from "./context/SettingsContext";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import { useDocumentEditorBridge } from "./hooks/useDocumentEditor";
import AutocompletePlugin from "./plugins/AutocompletePlugin";
import AutoEmbedPlugin from "./plugins/AutoEmbedPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import CodeActionMenuPlugin from "./plugins/CodeActionMenuPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CollapsiblePlugin from "./plugins/CollapsiblePlugin";
import ComponentPickerPlugin from "./plugins/ComponentPickerPlugin";
import ContextMenuPlugin from "./plugins/ContextMenuPlugin";
import DragDropPaste from "./plugins/DragDropPastePlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import EmojiPickerPlugin from "./plugins/EmojiPickerPlugin";
import EmojisPlugin from "./plugins/EmojisPlugin";
import EquationsPlugin from "./plugins/EquationsPlugin";
import ExcalidrawPlugin from "./plugins/ExcalidrawPlugin";
import FigmaPlugin from "./plugins/FigmaPlugin";
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin";
import HeaderPlugin from "./plugins/HeaderPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import InlineImagePlugin from "./plugins/InlineImagePlugin";
import KeywordsPlugin from "./plugins/KeywordsPlugin";
import { LayoutPlugin } from "./plugins/LayoutPlugin/LayoutPlugin";
import LinkPlugin from "./plugins/LinkPlugin";
import MarkdownShortcutPlugin from "./plugins/MarkdownShortcutPlugin";
import { MaxLengthPlugin } from "./plugins/MaxLengthPlugin";
import MentionsPlugin from "./plugins/MentionsPlugin";
import PageBreakPlugin from "./plugins/PageBreakPlugin";
import PageNavigationPlugin from "./plugins/PageNavigationPlugin";
import PollPlugin from "./plugins/PollPlugin";
import ReactFlowPlugin from "./plugins/ReactflowPlugin";
import ShortcutsPlugin from "./plugins/ShortcutsPlugin";
import SpecialTextPlugin from "./plugins/SpecialTextPlugin";
import SpeechToTextPlugin from "./plugins/SpeechToTextPlugin";
import TabFocusPlugin from "./plugins/TabFocusPlugin";
import TableCellActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import TableCellResizer from "./plugins/TableCellResizer";
import TableHoverActionsPlugin from "./plugins/TableHoverActionsPlugin";
import TableOfContentsPlugin from "./plugins/TableOfContentsPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/index";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import TwitterPlugin from "./plugins/TwitterPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import ContentEditable from "./ui/ContentEditable";

const skipCollaborationInit =
  // @ts-ignore
  window.parent != null && window.parent.frames.right === window;

const EMPTY_EDITOR_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

export default function Editor(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const placeholder = isCollab
    ? "Enter some collaborative rich text..."
    : isRichText
      ? "Enter some rich text..."
      : "Enter some plain text...";
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const {
    currentPageIndex,
    pages,
    updatePageContent,
    getCurrentPageContent,
    getCurrentPageSize,
    isPageContentLoaded,
    setPages,
  } = usePageManager();

  const { saveDocument } = useDocumentEditorBridge();
  const { name, saveLoading, lexical_state, isLoading, folderCanvases } =
    useDocumentStore();

  const isPagesInitializedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isPagesInitializedRef.current) {
      if (lexical_state) {
        try {
          const parsed = JSON.parse(lexical_state);
          if (parsed.pages) {
            setPages(parsed.pages);
          } else {
            setPages([
              {
                id: "page-1",
                title: "Page 1",
                content: lexical_state,
                pageSize: { name: "A4", width: "210mm", height: "297mm" },
              },
            ]);
          }
        } catch (error) {
          console.error("Error parsing lexical_state:", error);
          setPages([
            {
              id: "page-1",
              title: "Page 1",
              content: null,
              pageSize: { name: "A4", width: "210mm", height: "297mm" },
            },
          ]);
        }
      } else {
        // New document: start with one empty page
        setPages([
          {
            id: "page-1",
            title: "Page 1",
            content: null,
            pageSize: { name: "A4", width: "210mm", height: "297mm" },
          },
        ]);
      }
      isPagesInitializedRef.current = true; // Mark as initialized
    }
  }, [isLoading, lexical_state, setPages]);

  const needToSaveRef = useRef(true);
  const lastSavedPageIndexRef = useRef(currentPageIndex);
  const isClearingEditorRef = useRef(false);
  const prevPageIndexRef = useRef(currentPageIndex);

  const onRef = useCallback((_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (prevPageIndexRef.current === currentPageIndex) {
      prevPageIndexRef.current = currentPageIndex;
      return;
    }

    if (
      lastSavedPageIndexRef.current !== currentPageIndex &&
      needToSaveRef.current
    ) {
      const saveContent = () => {
        editor.update(() => {
          const editorState = editor.getEditorState();
          const jsonString = JSON.stringify(editorState);
          updatePageContent(lastSavedPageIndexRef.current, jsonString);
        });
      };
      saveContent();
    }

    lastSavedPageIndexRef.current = currentPageIndex;
    prevPageIndexRef.current = currentPageIndex;
    needToSaveRef.current = true;
  }, [currentPageIndex, editor, updatePageContent, isLoading]);

  useEffect(() => {
    return () => {
      editor.update(() => {
        const editorState = editor.getEditorState();
        const jsonString = JSON.stringify(editorState);
        updatePageContent(currentPageIndex, jsonString);
      });
    };
  }, [currentPageIndex, editor, updatePageContent]);

  const setEditorContent = useCallback(
    (content: string | null) => {
      if (isClearingEditorRef.current) return;
      isClearingEditorRef.current = true;

      if (!content) {
        try {
          const emptyState = editor.parseEditorState(EMPTY_EDITOR_STATE);
          editor.setEditorState(emptyState);
        } catch (error) {
          console.error("Error creating empty editor state:", error);
          editor.update(() => {
            const root = editor.getRootElement();
            if (root) root.innerText = "";
          });
        }
      } else {
        try {
          const editorState = editor.parseEditorState(content);
          editor.setEditorState(editorState);
        } catch (error) {
          console.error("Error parsing editor state:", error);
          try {
            const emptyState = editor.parseEditorState(EMPTY_EDITOR_STATE);
            editor.setEditorState(emptyState);
          } catch (innerError) {
            console.error("Error creating empty editor state:", innerError);
          }
        }
      }

      setTimeout(() => {
        isClearingEditorRef.current = false;
      }, 100);
    },
    [editor]
  );

  useEffect(() => {
    if (!isPageContentLoaded && !isClearingEditorRef.current) {
      const content = getCurrentPageContent();
      setEditorContent(content);
      needToSaveRef.current = false;
    }
  }, [
    currentPageIndex,
    getCurrentPageContent,
    isPageContentLoaded,
    setEditorContent,
  ]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (!isClearingEditorRef.current) {
        editor.update(() => {
          const editorState = editor.getEditorState();
          const jsonString = JSON.stringify(editorState);
          updatePageContent(currentPageIndex, jsonString);
        });
      }
    }, 5000);
    return () => clearInterval(autoSaveInterval);
  }, [currentPageIndex, editor, updatePageContent]);

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;
      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);
    return () => window.removeEventListener("resize", updateViewPortWidth);
  }, [isSmallWidthViewport]);

  const headerProps = {
    projectName: name,
    setProjectName: useDocumentStore.getState().setName,
    onSave: saveDocument,
    saveLoading: saveLoading,
    onInsertImage: () => {},
    onUndo: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
    onRedo: () => editor.dispatchCommand(REDO_COMMAND, undefined),
    onCut: () => document.execCommand("cut"),
    onCopy: () => document.execCommand("copy"),
    onPaste: () => document.execCommand("paste"),
    onDelete: () => editor.dispatchCommand(DELETE_WORD_COMMAND, false),
    onFitToScreen: () => {},
    onToggleGrid: () => {},
    onToggleRulers: () => {},
    onBackToDashboard: () => (window.location.href = "/protected"),
    currentState: editor.getEditorState(),
    onImportCanvas: () => {},
    onBringForward: () => {},
    onSendBackward: () => {},
  };

  return (
    <>
      {/* @ts-ignore */}
      <HeaderPlugin {...headerProps} />
      {isRichText && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
          folderCanvases={folderCanvases}
        />
      )}
      <PageNavigationPlugin />
      {isRichText && (
        <ShortcutsPlugin
          editor={activeEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <div
        className="editor-container"
        style={{ height: "calc(100vh - 210px)", overflowY: "auto" }}
      >
        <div className="page-container a4-page">
          <div
            style={{
              width: getCurrentPageSize().width,
              height: getCurrentPageSize().height,
              margin: "0 auto",
              padding: "20mm",
              backgroundColor: "white",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
              position: "relative",
              overflow: "hidden",
              marginBottom: "44px",
            }}
          >
            {isMaxLength && <MaxLengthPlugin maxLength={30} />}
            <DragDropPaste />
            <AutoFocusPlugin />
            {selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
            <ClearEditorPlugin />
            <ComponentPickerPlugin />
            <EmojiPickerPlugin />
            <AutoEmbedPlugin />
            <MentionsPlugin />
            <EmojisPlugin />
            <HashtagPlugin />
            <KeywordsPlugin />
            <SpeechToTextPlugin />
            <AutoLinkPlugin />
            <ReactFlowPlugin />
            {isRichText ? (
              <>
                {isCollab ? (
                  <CollaborationPlugin
                    id="main"
                    providerFactory={createWebsocketProvider}
                    shouldBootstrap={!skipCollaborationInit}
                  />
                ) : (
                  <HistoryPlugin externalHistoryState={historyState} />
                )}
                <RichTextPlugin
                  contentEditable={
                    <div className="editor-scroller">
                      <div className="editor" ref={onRef}>
                        <ContentEditable placeholder={placeholder} />
                      </div>
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <MarkdownShortcutPlugin />
                <CodeHighlightPlugin />
                <ListPlugin />
                <CheckListPlugin />
                <TablePlugin
                  hasCellMerge={tableCellMerge}
                  hasCellBackgroundColor={tableCellBackgroundColor}
                  hasHorizontalScroll={tableHorizontalScroll}
                />
                <TableCellResizer />
                <ImagesPlugin />
                <InlineImagePlugin />
                <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
                <PollPlugin />
                <TwitterPlugin />
                <YouTubePlugin />
                <FigmaPlugin />
                <ClickableLinkPlugin disabled={isEditable} />
                <HorizontalRulePlugin />
                <EquationsPlugin />
                <ExcalidrawPlugin />
                <TabFocusPlugin />
                <TabIndentationPlugin maxIndent={7} />
                <CollapsiblePlugin />
                <PageBreakPlugin />
                <LayoutPlugin />
                {floatingAnchorElem && (
                  <>
                    <FloatingLinkEditorPlugin
                      anchorElem={floatingAnchorElem}
                      isLinkEditMode={isLinkEditMode}
                      setIsLinkEditMode={setIsLinkEditMode}
                    />
                    <TableCellActionMenuPlugin
                      anchorElem={floatingAnchorElem}
                      cellMerge={true}
                    />
                  </>
                )}
                {floatingAnchorElem && !isSmallWidthViewport && (
                  <>
                    <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                    <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                    <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                    <FloatingTextFormatToolbarPlugin
                      anchorElem={floatingAnchorElem}
                      setIsLinkEditMode={setIsLinkEditMode}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <PlainTextPlugin
                  contentEditable={
                    <ContentEditable placeholder={placeholder} />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin externalHistoryState={historyState} />
              </>
            )}
            {(isCharLimit || isCharLimitUtf8) && (
              <CharacterLimitPlugin
                charset={isCharLimit ? "UTF-16" : "UTF-8"}
                maxLength={300}
              />
            )}
            {isAutocomplete && <AutocompletePlugin />}
            <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
            {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
            {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />}
          </div>
        </div>
      </div>
      {showTreeView && <TreeViewPlugin />}
    </>
  );
}
