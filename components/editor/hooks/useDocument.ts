"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { debounce } from "lodash";

interface DocumentState {
  id: string;
  name: string;
  description: string;
  editor_state: any;
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
  syncChanges: () => void;
  resetState: () => void;
  loadFolderCanvases: (folderId: string) => Promise<void>;
}

const initialState: DocumentState = {
  id: "",
  name: "Untitled Document",
  description: "",
  editor_state: null,
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
  syncChanges: () => {},
  resetState: () => {},
  loadFolderCanvases: async () => {},
  folderCanvases: [],
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => {
      // Create a debounced version of saveDocument that we'll use for syncing
      const debouncedSave = debounce(async () => {
        if (get().isDirty) {
          await get().saveDocument();
        }
      }, 3000);

      return {
        ...initialState,
        setName: (name) => {
          set({ name, isDirty: true });
          get().syncChanges();
        },
        setDescription: (description) => {
          set({ description, isDirty: true });
          get().syncChanges();
        },
        updateEditorState: (editorState) => {
          const stateToStore =
            typeof editorState === "string"
              ? editorState
              : JSON.stringify(editorState);

          // Update local state immediately but don't trigger unnecessary re-renders
          set((state) => {
            // Only update if state actually changed to prevent focus loss
            if (state.editor_state !== stateToStore) {
              return {
                editor_state: stateToStore,
                isDirty: true,
              };
            }
            return state; // Return unchanged state if nothing changed
          });

          // Trigger debounced save
          get().syncChanges();
        },
        loadDocument: async (canvasId) => {
          set({ isLoading: true, error: null, canvas_id: canvasId });
          try {
            const { data: canvas, error: canvasError } = await supabase
              .from("canvas")
              .select("id, name, description, folder_id, document_data(*)")
              .eq("id", canvasId)
              .single();

            if (canvasError) throw canvasError;

            const documentData =
              canvas?.document_data && canvas?.document_data?.length > 0
                ? canvas?.document_data[0]
                : null;

            set({
              id: documentData?.id || "",
              name: canvas.name,
              description: canvas.description || "",
              editor_state: documentData?.lexical_state || null,
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
            const latestEditorState = state.editor_state;

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
            });

            // toast.success("Document saved");
          } catch (error) {
            console.error("Error saving document:", error);
            toast.error("Failed to save document");
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
          // Just trigger the debounced save function
          debouncedSave();
        },
        resetState: () => {
          // Cancel any pending debounced saves
          debouncedSave.cancel();
          set(initialState);
        },
        loadFolderCanvases: async (folderId: string | null) => {
          set({ isLoading: true, error: null });

          if (!folderId) {
            set({ folderCanvases: [] });
            return;
          }

          try {
            // Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              throw new Error("User not authenticated");
            }

            let query = supabase
              .from("canvas")
              .select(
                `
          id, 
          name,
          canvas_type,
          description, 
          updated_at, 
          columns:column_definition!column_definition_canvas_id_fkey(*), 
          data:canvas_data(*)
        `
              )
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false });

            if (folderId !== null) {
              query = query.eq("folder_id", folderId);
            } else {
              query = query.is("folder_id", null);
            }

            const { data, error } = await query;

            if (error) throw error;

            set({
              folderCanvases: data.map((canvas) => ({
                id: canvas.id,
                name: canvas.name,
                canvas_type: canvas.canvas_type,
                description: canvas.description || "",
                updated_at: new Date(canvas.updated_at),
                columns: canvas.columns,
                flowData: canvas.data ? canvas.data : null,
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
