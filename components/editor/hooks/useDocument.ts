"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { debounce } from "lodash";
import { Folder } from "@/types/sidebar";

/**
 * Detects an expired/invalid Supabase auth token. PostgREST returns
 * PGRST303 for an expired JWT; the message also contains "JWT".
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "PGRST303") return true;
  return typeof e.message === "string" && /jwt|token|expired/i.test(e.message);
}

interface DocumentState {
  id: string;
  name: string;
  user_id: string;
  code: string | null;
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
  folder?: any;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  updateEditorState: (editorState: any) => void;
  loadDocument: (canvasId: string) => Promise<void>;
  saveDocument: () => Promise<void>;
  syncChanges: () => void;
  resetState: () => void;
  loadFolderCanvases: (folderId: string) => Promise<void>;
  refreshSingleCanvas: (canvasId: string) => Promise<any>;
}

const initialState: DocumentState = {
  id: "",
  name: "Untitled Document",
  description: "",
  user_id: "",
  code: null,
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
  refreshSingleCanvas: async () => Promise.resolve(),
  folderCanvases: [],
  folder: null,
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

      // Throttle the save-error toast/log so an expired session or dropped
      // network doesn't flood the console on every keystroke-triggered save.
      let lastSaveErrorAt = 0;
      const reportSaveError = (error: unknown) => {
        const now = Date.now();
        if (now - lastSaveErrorAt > 8000) {
          lastSaveErrorAt = now;
          console.error("Error saving document:", error);
          const msg =
            error instanceof Error ? error.message : String(error ?? "");
          if (isAuthError(error)) {
            toast.error("Your session expired — please reload to sign back in.");
          } else {
            toast.error("Failed to save document");
          }
        }
      };

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
              .select(
                "id, name, code, description, folder_id, document_data(*), user_id, folder:folder!canvas_folder_id_fkey(*)"
              )
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
              code: (canvas as any).code ?? null,
              description: canvas.description || "",
              editor_state: documentData?.lexical_state || null,
              version: documentData?.version || 1,
              canvas_id: canvasId,
              isLoading: false,
              isDirty: false,
              lastSaved: documentData
                ? new Date(documentData.updated_at)
                : null,
              user_id: canvas.user_id,
              folder: canvas.folder,
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

          // Performs the actual upserts. Returns the resulting version so the
          // caller can update store state. Throws on any Supabase error.
          const performWrite = async (): Promise<number> => {
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

            return documentExists ? state.version + 1 : 1;
          };

          try {
            let newVersion: number;
            try {
              newVersion = await performWrite();
            } catch (error) {
              // An expired token is recoverable: refresh the session once and
              // retry the write rather than dropping the save.
              if (isAuthError(error)) {
                const { error: refreshError } =
                  await supabase.auth.refreshSession();
                if (refreshError) throw error; // refresh failed → bubble up
                newVersion = await performWrite();
              } else {
                throw error;
              }
            }

            set({
              isDirty: false,
              lastSaved: new Date(),
              version: newVersion,
              saveLoading: false,
              error: null,
            });
          } catch (error) {
            reportSaveError(error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save document",
              saveLoading: false,
              // Leave isDirty=true so the next edit retries the save.
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
          // NOTE: do not touch the shared `error` field here. This is a
          // secondary fetch (the insert-picker list); a failure must not be
          // mistaken for a document-load failure, which would block autosave.
          set({ isLoading: true });

          // if (!folderId) {
          //   set({ folderCanvases: [] });
          //   return;
          // }

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
            // Intentionally NOT setting the shared `error` field — see note
            // above. The insert-picker list staying empty is non-fatal.
          } finally {
            set({ isLoading: false });
          }
        },

        refreshSingleCanvas: async (canvasId: string) => {
          try {
            // Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              throw new Error("User not authenticated");
            }

            // Fetch the specific canvas with fresh data
            const { data, error } = await supabase
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
              .eq("id", canvasId)
              .eq("user_id", user.id)
              .single();

            if (error) {
              console.error("Error fetching canvas:", error);
              throw error;
            }

            if (!data) {
              throw new Error("Canvas not found");
            }

            // Update the specific canvas in folderCanvases
            set((state) => ({
              folderCanvases: state.folderCanvases.map((canvas) =>
                canvas.id === canvasId
                  ? {
                      id: data.id,
                      name: data.name,
                      canvas_type: data.canvas_type,
                      description: data.description || "",
                      updated_at: new Date(data.updated_at),
                      columns: data.columns,
                      flowData: data.data ? data.data : null,
                    }
                  : canvas
              ),
            }));

            // Return the fresh canvas data
            return {
              id: data.id,
              name: data.name,
              canvas_type: data.canvas_type,
              description: data.description || "",
              updated_at: new Date(data.updated_at),
              columns: data.columns,
              flowData: data.data ? data.data : null,
            };
          } catch (error) {
            console.error("Error refreshing single canvas:", error);
            throw error;
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
