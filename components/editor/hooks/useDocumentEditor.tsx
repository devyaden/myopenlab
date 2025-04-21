"use client";

import { useDocumentStore } from "./useDocument";

export function useDocumentEditorBridge() {
  return {
    saveDocument: useDocumentStore.getState().saveDocument,
    loadDocument: useDocumentStore.getState().loadDocument,
    updateEditorState: useDocumentStore.getState().updateEditorState,
    setName: useDocumentStore.getState().setName,
    setDescription: useDocumentStore.getState().setDescription,
    syncChanges: useDocumentStore.getState().syncChanges,
  };
}
