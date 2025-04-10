"use client";

import { useDocumentStore } from "@/lib/store/useDocument";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  DOMConversionMap,
  TextNode,
} from "lexical";
import { useEffect, useState, type JSX } from "react";
import { PageManagerProvider } from "./components/PageManager";
import { FlashMessageContext } from "./context/FlashMessageContext";
import { SettingsContext } from "./context/SettingsContext";
import { SharedHistoryContext } from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import Editor from "./Editor";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import { TableContext } from "./plugins/TablePlugin";
import { parseAllowedFontSize } from "./plugins/ToolbarPlugin/fontSize";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import { parseAllowedColor } from "./ui/ColorPicker";

function getExtraStyles(element: HTMLElement): string {
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);

  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }

  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }

  if (color !== "" && color !== "rgb(0, 0, 0)") {
    extraStyles += `color: ${color};`;
  }

  return extraStyles;
}

function isValidEditorState(stateString: string): boolean {
  try {
    const parsed = JSON.parse(stateString);
    return parsed.root && Array.isArray(parsed.root.children);
  } catch {
    return false;
  }
}

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
}

function initializeEditorState() {
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() === null) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      root.append(paragraph);
    }
  };
}

function App({
  canvasId,
  isPartOfCanvas,
  onBackToBoard,
}: {
  canvasId: string;
  isPartOfCanvas?: boolean;
  onBackToBoard?: () => void;
}): JSX.Element {
  const { loadDocument, lexical_state, isLoading } = useDocumentStore();
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    loadDocument(canvasId).then(() => {
      setIsEditorReady(true);
    });
  }, [canvasId, loadDocument]);

  const editorState = (() => {
    if (
      typeof lexical_state === "string" &&
      lexical_state.trim() !== "" &&
      isValidEditorState(lexical_state)
    ) {
      return lexical_state;
    }
    return initializeEditorState;
  })();

  const initialConfig = {
    namespace: "Yadn Document Builder",
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      console.error("Lexical Editor Error:", error);
    },
    theme: PlaygroundEditorTheme,
    html: { import: buildImportMap() },
    editorState: editorState,
  };

  if (!isEditorReady) {
    return (
      <div className="min-h-screen bg-white flex flex-col w-screen items-center justify-center">
        <div className="text-gray-600">Preparing document editor...</div>
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <ToolbarContext>
            <PageManagerProvider>
              <div className="min-h-screen bg-white flex flex-col w-screen">
                <Editor
                  isPartOfCanvas={isPartOfCanvas}
                  onBackToBoard={onBackToBoard}
                />
              </div>
            </PageManagerProvider>
          </ToolbarContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function PlaygroundApp({
  canvasId,
  isPartOfCanvas,
  onBackToBoard,
}: {
  canvasId: string;
  isPartOfCanvas?: boolean;
  onBackToBoard?: () => void;
}): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App
          canvasId={canvasId}
          isPartOfCanvas={isPartOfCanvas}
          onBackToBoard={onBackToBoard}
        />
      </FlashMessageContext>
    </SettingsContext>
  );
}
