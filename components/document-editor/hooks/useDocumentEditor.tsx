"use client";

import { useDocumentStore } from "@/lib/store/useDocument";

export function useDocumentEditorBridge() {
  return {
    saveDocument: useDocumentStore.getState().saveDocument,
  };
}
