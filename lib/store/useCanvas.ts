import type {
  CanvasActions,
  CanvasStore,
  HistoryState,
  UndoableState,
} from "@/types/store";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "../supabase/client";

const initialUndoableState: UndoableState = {
  nodes: [],
  edges: [],
  nodeStyles: {},
  columns: [
    { title: "id", type: "Text" },
    { title: "task", type: "Text" },
    {
      title: "type",
      type: "Select",
      options: [
        "rectangle",
        "rounded",
        "circle",
        "diamond",
        "hexagon",
        "triangle",
        "useCase",
        "actor",
        "class",
        "interface",
      ],
    },
    {
      title: "parent",
      type: "Text",
    },
  ],
  name: "Untitled Canvas",
  description: "",
  folder_id: undefined,
};

const initialState: Omit<CanvasStore, keyof CanvasActions> = {
  id: "",
  ...initialUndoableState,
  user_id: "",
  created_at: null,
  updated_at: null,
  version: 1,
  isLoading: false,
  saveLoading: false,
  error: null,
  isDirty: false,
  lastSaved: null,
  folderCanvases: [],
};

const initialHistoryState: HistoryState = {
  past: [],
  present: initialUndoableState,
  future: [],
};

const MAX_HISTORY_LENGTH = 50; // Limit history to prevent memory issues

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => {
      // Initialize history state
      let history: HistoryState = initialHistoryState;

      // Helper to extract undoable state from the current state
      const getUndoableState = (state = get()): UndoableState => ({
        nodes: state.nodes,
        edges: state.edges,
        nodeStyles: state.nodeStyles,
        columns: state.columns,
        name: state.name,
        description: state.description,
        folder_id: state.folder_id,
      });

      // Add a change to the history
      const addToHistory = (newPresent: UndoableState) => {
        const { past, present } = history;

        if (JSON.stringify(present) !== JSON.stringify(newPresent)) {
          history = {
            past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
            present: newPresent,
            future: [],
          };
        }
      };

      // Helper function to mark state as dirty and sync changes
      const updateStateAndSync = () => {
        set({ isDirty: true, updated_at: new Date() });
        get().syncChanges();
      };

      return {
        ...initialState,

        // Update nodes and track in history
        setNodes: (nodes) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, nodes };
          addToHistory(newState);

          set({ nodes });
          updateStateAndSync();
        },

        // Update edges and track in history
        setEdges: (edges) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, edges };
          addToHistory(newState);

          set({ edges });
          updateStateAndSync();
        },

        // Update nodeStyles and track in history
        setNodeStyles: (nodeStyles) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, nodeStyles };
          addToHistory(newState);

          set({ nodeStyles });
          updateStateAndSync();
        },

        // Update a specific node's style and track in history
        updateNodeStyle: (nodeId, style) => {
          const currentStyles = get().nodeStyles;
          const newStyles = {
            ...currentStyles,
            [nodeId]: { ...currentStyles[nodeId], ...style },
          };

          const currentState = getUndoableState();
          const newState = { ...currentState, nodeStyles: newStyles };
          addToHistory(newState);

          set({ nodeStyles: newStyles });
          updateStateAndSync();
        },

        // Update columns and track in history
        setColumns: (columns) => {
          if (!columns.length) return;

          const currentState = getUndoableState();
          const newState = { ...currentState, columns };
          addToHistory(newState);

          set({ columns, isDirty: true, updated_at: new Date() });

          get()
            .syncChanges()
            .then(() => {
              get().refreshColumnsData();
            });
        },

        refreshColumnsData: async () => {
          const state = get();
          if (!state.id) return;
          try {
            // Fetch the updated columns for the current canvas.
            let { data: columnDefs, error: columnsError } = await supabase
              .from("column_definition")
              .select(
                `
        *,
        related_canvas:canvas!column_definition_related_canvas_id_fkey(
          id, 
          name, 
          description, 
          canvas_data(*),
          columns:column_definition!column_definition_canvas_id_fkey(*)
        )
        `
              )
              .eq("canvas_id", state.id)
              .order("order");

            if (columnsError) throw columnsError;

            // Extract rollup column IDs.
            const rollupIds = columnDefs
              ?.filter(
                (column) => column.type === "Rollup" && column.rollup_column_id
              )
              .map((column) => column.rollup_column_id);

            let rollupColumnDefs: any[] = [];
            if (rollupIds?.length) {
              const { data: rollupData, error: rollupError } = await supabase
                .from("column_definition")
                .select(
                  `
          *,
          canvas:canvas!column_definition_canvas_id_fkey(
            *,
            canvas_data(*)
          )
          `
                )
                .in("id", rollupIds);
              if (rollupError) throw rollupError;
              rollupColumnDefs = rollupData;
            }

            // Map over column definitions and attach rollup column data when needed.
            const finalColumnDefs = columnDefs?.map((column) => {
              if (column.type === "Rollup") {
                const rollupColumn = rollupColumnDefs.find(
                  (rollup) => rollup.id === column.rollup_column_id
                );
                return {
                  ...column,
                  rollup_column: rollupColumn,
                };
              }
              return column;
            });

            set({ columns: finalColumnDefs });
          } catch (error) {
            console.error("Error refreshing columns data:", error);
            toast.error("Error refreshing columns data.");
          }
        },

        addNewColumn: (column: any) => {
          const currentState = getUndoableState();
          const newState = {
            ...currentState,
            columns: [...currentState.columns, column],
          };
          addToHistory(newState);

          set({ columns: newState.columns });
        },

        // Update name and track in history
        setName: (name) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, name };
          addToHistory(newState);

          set({ name });
          updateStateAndSync();
        },

        // Update description and track in history
        setDescription: (description) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, description };
          addToHistory(newState);

          set({ description });
          updateStateAndSync();
        },

        // Update folder_id and track in history
        setFolderId: (folder_id) => {
          const currentState = getUndoableState();
          const newState = { ...currentState, folder_id };
          addToHistory(newState);

          set({ folder_id });
          updateStateAndSync();
        },

        saveCanvas: async () => {
          const state = get();

          if (!state.id) return;

          set({ saveLoading: true });
          try {
            // Start a Supabase transaction
            const { data, error } = await supabase.rpc(
              "save_canvas_transaction",
              {
                canvas_data: {
                  id: state.id,
                  name: state.name,
                  description: state.description,
                  folder_id: state.folder_id,
                  user_id: state.user_id, // Using demo user if not set
                  updated_at: new Date().toISOString(),

                  // Canvas data fields
                  nodes: state.nodes,
                  edges: state.edges,
                  styles: state.nodeStyles,
                  version: state.version,

                  // History data
                  history_id: uuidv4(),
                  history_data: JSON.stringify(getUndoableState()),

                  // Columns data
                  columns: state.columns.map((column, index) => ({
                    id: column.id || uuidv4(),
                    title: column.title,
                    type: column.type,
                    options: column.options || null,
                    required: column.required || false,
                    related_canvas_id: column.related_canvas_id || null,
                    rollup_column_id: column.rollup_column_id || null,
                    order: index,
                  })),
                },
              }
            );

            if (error) throw error;

            set({
              isDirty: false,
              lastSaved: new Date(),
              version: state.version + 1,
              updated_at: new Date(),
            });

            // toast.success("Saved successfully!", { id: savingToast });
          } catch (error) {
            console.error("Error saving canvas:", error);

            set({ error: "Failed to save changes" });
            toast.error(
              "Failed to save changes. Please check your internet conection and try again"
            );
          } finally {
            set({ saveLoading: false });
          }
        },

        loadFolderCanvases: async (folderId) => {
          set({ isLoading: true, error: null });

          try {
            const { data, error } = await supabase
              .from("canvas")
              .select(
                "id, name, description, updated_at, columns:column_definition!column_definition_canvas_id_fkey(*)"
              )
              .eq("folder_id", folderId)
              .order("updated_at", { ascending: false });

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

        loadCanvas: async (canvasId) => {
          set({ isLoading: true, error: null });

          try {
            // Get canvas details
            const { data: canvas, error: canvasError } = await supabase
              .from("canvas")
              .select("*")
              .eq("id", canvasId)
              .single();

            if (canvasError) throw canvasError;

            // Get canvas data
            const { data: canvasData, error: dataError } = await supabase
              .from("canvas_data")
              .select("*")
              .eq("canvas_id", canvasId)
              .single();

            if (dataError && dataError.code !== "PGRST116") throw dataError;

            let { data: columnDefs, error: columnsError } = await supabase
              .from("column_definition")
              .select(
                `
    *,
    related_canvas:canvas!column_definition_related_canvas_id_fkey(
      id, 
      name, 
      description, 
      canvas_data(*),
      columns:column_definition!column_definition_canvas_id_fkey(*)
    )
  `
              )
              .eq("canvas_id", canvasId)
              .order("order");

            const rollupDefs = columnDefs
              ?.filter((column) => column.type === "Rollup")
              .map((column) => column.rollup_column_id);

            const { data: rollupColumnDefs } = await supabase
              .from("column_definition")
              .select(
                "*, canvas:canvas!column_definition_canvas_id_fkey(*, canvas_data(*))"
              )
              .in("id", rollupDefs as String[]);

            // @ts-ignore
            columnDefs = columnDefs?.map((column) => {
              if (column.type === "Rollup") {
                const rollupColumn = rollupColumnDefs?.find(
                  (rollupColumn) => rollupColumn.id === column.rollup_column_id
                );
                return {
                  ...column,
                  rollup_column: rollupColumn,
                };
              }
              return column;
            });

            if (columnsError) throw columnsError;

            if (canvas) {
              const newState = {
                id: canvasId,
                name: canvas.name,
                description: canvas.description || "",
                user_id: canvas.user_id,
                folder_id: canvas.folder_id,
                created_at: new Date(canvas.created_at),
                updated_at: new Date(canvas.updated_at),
                nodes: canvasData?.nodes || [],
                edges: canvasData?.edges || [],
                nodeStyles: canvasData?.styles || {},
                columns: columnDefs?.length ? columnDefs : initialState.columns,
                version: canvasData?.version || 1,
                isDirty: false,
                lastSaved: new Date(),
              };

              // Reset history when loading a new canvas
              history = {
                past: [],
                present: {
                  nodes: newState.nodes,
                  edges: newState.edges,
                  nodeStyles: newState.nodeStyles,
                  columns: newState.columns,
                  name: newState.name,
                  description: newState.description,
                  folder_id: newState.folder_id,
                },
                future: [],
              };

              set(newState);
            }

            get().loadFolderCanvases(canvas.folder_id);
          } catch (error) {
            console.error("Error loading canvas:", error);
            set({ error: "Failed to load canvas" });
            toast.error("Failed to load canvas");
          } finally {
            set({ isLoading: false });
          }
        },

        syncChanges: () => {
          const state = get();
          const debounceTime = 3000;
          if (state.isDirty) {
            if ((window as any).syncTimeout) {
              clearTimeout((window as any).syncTimeout);
            }
            return new Promise<void>((resolve) => {
              (window as any).syncTimeout = setTimeout(async () => {
                await state.saveCanvas();
                resolve();
              }, debounceTime);
            });
          } else {
            return Promise.resolve();
          }
        },

        resetState: () => {
          // Reset history
          history = initialHistoryState;
          set(initialState);
        },

        // Undo action - apply previous state from history
        undo: () => {
          const { past, present, future } = history;

          if (past.length === 0) return; // Can't undo if no past

          const newPresent = past[past.length - 1];
          const newPast = past.slice(0, past.length - 1);

          // Update history
          history = {
            past: newPast,
            present: newPresent,
            future: [present, ...future],
          };

          // Update state
          set({
            ...newPresent,
            isDirty: true,
            updated_at: new Date(),
          });
          get().syncChanges();
        },

        // Redo action - apply next state from history
        redo: () => {
          const { past, present, future } = history;

          if (future.length === 0) return; // Can't redo if no future

          const newPresent = future[0];
          const newFuture = future.slice(1);

          // Update history
          history = {
            past: [...past, present],
            present: newPresent,
            future: newFuture,
          };

          // Update state
          set({
            ...newPresent,
            isDirty: true,
            updated_at: new Date(),
          });
          get().syncChanges();
        },

        // Computed properties for undo/redo availability
        get canUndo() {
          return true;
          // return history.past.length > 0;
        },

        get canRedo() {
          return true;
          // return history.future.length > 0;
        },
      };
    },
    {
      name: "canvas-store",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        id: state.id,
        nodes: state.nodes,
        edges: state.edges,
        nodeStyles: state.nodeStyles,
        columns: state.columns,
        name: state.name,
        description: state.description,
        folder_id: state.folder_id,
        version: state.version,
      }),
    }
  )
);

// Subscribe to store changes for debugging
// if (process.env.NODE_ENV === "development") {
//   useCanvasStore.subscribe(console.log);
// }
