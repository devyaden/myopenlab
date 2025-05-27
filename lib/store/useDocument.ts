"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Folder } from "@/types/sidebar";

interface DocumentState {
  id: string;
  name: string;
  user_id: string;
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
      return {
        ...initialState,
        setName: (name) => {
          set({ name, isDirty: true });
        },
        setDescription: (description) => {
          set({ description, isDirty: true });
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
        },

        loadDocument: async (canvasId) => {
          set({ isLoading: true, error: null, canvas_id: canvasId });
          try {
            console.log(`Loading document with ID: ${canvasId}`);

            const { data: canvas, error: canvasError } = await supabase
              .from("canvas")
              .select(
                "id, name, description, folder_id, document_data(*), user_id, folder:folder!canvas_folder_id_fkey(*)"
              )
              .eq("id", canvasId)
              .single();

            if (canvasError) {
              console.error("Error fetching canvas:", canvasError);
              throw canvasError;
            }

            console.log(`Canvas loaded: ${canvas.name}`);

            const documentData =
              canvas?.document_data && canvas?.document_data?.length > 0
                ? canvas?.document_data[0]
                : null;

            console.log(`Document data found: ${documentData ? "yes" : "no"}`);

            if (documentData && documentData.lexical_state) {
              // Validate that the JSON is parseable before storing
              try {
                JSON.parse(documentData.lexical_state);
                console.log("Document state is valid JSON");
              } catch (e) {
                console.error("Invalid document state JSON:", e);
                console.warn("Resetting document state due to invalid JSON");
                documentData.lexical_state = JSON.stringify({
                  state: "<p>Document content could not be loaded.</p>",
                  controls: {},
                  json: {
                    type: "doc",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: "Document content could not be loaded.",
                          },
                        ],
                      },
                    ],
                  },
                });
              }
            }

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

            // Set a fallback empty editor state if loading failed
            set({
              editor_state: JSON.stringify({
                state: "<p>Failed to load document. Please try again.</p>",
                controls: {},
                json: {
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Failed to load document. Please try again.",
                        },
                      ],
                    },
                  ],
                },
              }),
            });
          }
        },

        saveDocument: async () => {
          const state = get();
          if (!state.canvas_id) return Promise.resolve();
          set({ saveLoading: true });

          try {
            const now = new Date().toISOString();

            // Ensure editor_state is valid before saving
            if (!state.editor_state) {
              console.warn("Attempting to save without editor state");
              set({ saveLoading: false });
              return Promise.reject(new Error("No editor state to save"));
            }

            // Validate JSON format before saving
            try {
              JSON.parse(state.editor_state);
            } catch (e) {
              console.error("Invalid JSON in editor_state:", e);
              set({ saveLoading: false });
              return Promise.reject(new Error("Invalid editor state format"));
            }

            console.log(`Saving document for canvas ID: ${state.canvas_id}`);

            // First check if document exists
            const { data: existingDocs, error: checkError } = await supabase
              .from("document_data")
              .select("canvas_id")
              .eq("canvas_id", state.canvas_id);

            if (checkError) {
              console.error("Error checking document existence:", checkError);
              throw checkError;
            }

            const documentExists = existingDocs && existingDocs.length > 0;
            console.log(`Document exists: ${documentExists}`);

            const latestEditorState = state.editor_state;

            // Save document data
            if (documentExists) {
              console.log("Updating existing document");
              const { error: updateError } = await supabase
                .from("document_data")
                .update({
                  lexical_state: latestEditorState,
                  version: state.version + 1,
                  updated_at: now,
                })
                .eq("canvas_id", state.canvas_id);

              if (updateError) {
                console.error("Error updating document:", updateError);
                throw updateError;
              }
            } else {
              console.log("Creating new document");
              const { error: insertError } = await supabase
                .from("document_data")
                .insert({
                  lexical_state: latestEditorState,
                  version: 1,
                  canvas_id: state.canvas_id,
                  updated_at: now,
                });

              if (insertError) {
                console.error("Error inserting document:", insertError);
                throw insertError;
              }
            }

            // Update canvas metadata
            console.log("Updating canvas metadata");
            const { error: canvasError } = await supabase
              .from("canvas")
              .update({
                name: state.name,
                description: state.description,
                updated_at: now,
              })
              .eq("id", state.canvas_id);

            if (canvasError) {
              console.error("Error updating canvas:", canvasError);
              throw canvasError;
            }

            console.log("Document saved successfully");
            set({
              isDirty: false,
              lastSaved: new Date(),
              version: documentExists ? state.version + 1 : 1,
              saveLoading: false,
            });

            return Promise.resolve();
          } catch (error) {
            console.error("Error saving document:", error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save document",
              saveLoading: false,
            });
            return Promise.reject(error);
          }
        },
        syncChanges: () => {
          // This is now a no-op since auto-save is handled directly in the Editor component
        },
        resetState: () => {
          set(initialState);
        },

        loadFolderCanvases: async (folderId: string | null) => {
          set({ isLoading: true, error: null });

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
