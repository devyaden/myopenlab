"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../supabase/client";
import toast from "react-hot-toast";

interface DocumentState {
  id: string;
  name: string;
  description: string;
  lexical_state: any;
  version: number;
  canvas_id: string;
  isLoading: boolean;
  saveLoading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  folderCanvases: any[];
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  updateEditorState: (editorState: any) => void;
  loadDocument: (canvasId: string) => Promise<void>;
  saveDocument: () => Promise<void>;
  syncChanges: () => Promise<void>;
  resetState: () => void;
  loadFolderCanvases: (folderId: string) => Promise<void>;
}

const initialState: DocumentState = {
  id: "",
  name: "Untitled Document",
  description: "",
  lexical_state: null,
  version: 1,
  canvas_id: "",
  isLoading: true,
  saveLoading: false,
  error: null,
  isDirty: false,
  lastSaved: null,
  setName: () => {},
  setDescription: () => {},
  updateEditorState: () => {},
  loadDocument: async () => {},
  saveDocument: async () => {},
  syncChanges: async () => Promise.resolve(),
  resetState: () => {},
  loadFolderCanvases: async () => {},
  folderCanvases: [],
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => {
      const updateStateAndSync = () => {
        set({ isDirty: true });
        get().syncChanges();
      };

      return {
        ...initialState,
        setName: (name) => {
          set({ name });
          updateStateAndSync();
        },
        setDescription: (description) => {
          set({ description });
          updateStateAndSync();
        },
        updateEditorState: (editorState) => {
          const stateToStore =
            typeof editorState === "string"
              ? editorState
              : JSON.stringify(editorState);
          set((state) => ({
            lexical_state: stateToStore,
            isDirty: true,
          }));
          get().syncChanges();
        },
        loadDocument: async (canvasId) => {
          set({ isLoading: true, error: null, canvas_id: canvasId });
          try {
            const { data: canvas, error: canvasError } = await supabase
              .from("canvas")
              .select("id, name, description, folder_id")
              .eq("id", canvasId)
              .single();
            if (canvasError) throw canvasError;

            const { data: documentDataArray, error: documentError } =
              await supabase
                .from("document_data")
                .select("*")
                .eq("canvas_id", canvasId);

            if (documentError) throw documentError;

            const documentData =
              documentDataArray && documentDataArray.length > 0
                ? documentDataArray[0]
                : null;

            set({
              id: documentData?.id || "",
              name: canvas.name,
              description: canvas.description || "",
              lexical_state: documentData?.lexical_state || null,
              version: documentData?.version || 1,
              canvas_id: canvasId,
              isLoading: false,
              isDirty: false,
              lastSaved: documentData
                ? new Date(documentData.updated_at)
                : null,
            });

            get().loadFolderCanvases(canvas.folder_id);
          } catch (error) {
            console.error("Error loading document:", error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load document",
              isLoading: false,
            });
          }
        },
        saveDocument: async () => {
          const state = get();
          if (!state.canvas_id) return;
          set({ saveLoading: true });
          try {
            const now = new Date().toISOString();
            const { data: existingDocs, error: checkError } = await supabase
              .from("document_data")
              .select("canvas_id")
              .eq("canvas_id", state.canvas_id);
            if (checkError) throw checkError;

            const documentExists = existingDocs && existingDocs.length > 0;
            const latestEditorState = state.lexical_state;

            if (documentExists) {
              const { error: updateError } = await supabase
                .from("document_data")
                .update({
                  lexical_state: latestEditorState,
                  version: state.version + 1,
                  updated_at: now,
                })
                .eq("canvas_id", state.canvas_id);
              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from("document_data")
                .insert({
                  lexical_state: latestEditorState,
                  version: 1,
                  canvas_id: state.canvas_id,
                  updated_at: now,
                });
              if (insertError) throw insertError;
            }

            const { error: canvasError } = await supabase
              .from("canvas")
              .update({
                name: state.name,
                description: state.description,
                updated_at: now,
              })
              .eq("id", state.canvas_id);
            if (canvasError) throw canvasError;

            set({
              isDirty: false,
              lastSaved: new Date(),
              version: documentExists ? state.version + 1 : 1,
              saveLoading: false,
              lexical_state: latestEditorState,
            });
          } catch (error) {
            console.error("Error saving document:", error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save document",
              saveLoading: false,
            });
          }
        },
        syncChanges: () => {
          const state = get();
          const debounceTime = 3000;
          if (state.isDirty) {
            if ((window as any).documentSyncTimeout) {
              clearTimeout((window as any).documentSyncTimeout);
            }
            return new Promise<void>((resolve) => {
              (window as any).documentSyncTimeout = setTimeout(async () => {
                await state.saveDocument();
                resolve();
              }, debounceTime);
            });
          } else {
            return Promise.resolve();
          }
        },
        resetState: () => {
          set(initialState);
        },

        loadFolderCanvases: async (folderId: string | null) => {
          set({ isLoading: true, error: null });

          try {
            let query = supabase
              .from("canvas")
              .select(
                "id, name, description, updated_at, columns:column_definition!column_definition_canvas_id_fkey(*)"
              )
              .order("updated_at", { ascending: false });

            // Conditionally add filter only if folderId is not null
            if (folderId !== null) {
              query = query.eq("folder_id", folderId);
            } else {
              // If folderId is null, filter for canvases with null folder_id
              query = query.is("folder_id", null);
            }

            const { data, error } = await query;

            if (error) throw error;

            set({
              folderCanvases: data.map((canvas) => ({
                id: canvas.id,
                name: canvas.name,
                description: canvas.description || "",
                updated_at: new Date(canvas.updated_at),
                columns: canvas.columns,
              })),
            });
          } catch (error) {
            console.error("Error loading folder canvases:", error);
            set({ error: "Failed to load folder canvases" });
            toast.error("Failed to load folder canvases");
          } finally {
            set({ isLoading: false });
          }
        },
      };
    },
    {
      name: "document-store",
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        description: state.description,
        canvas_id: state.canvas_id,
        version: state.version,
      }),
    }
  )
);
