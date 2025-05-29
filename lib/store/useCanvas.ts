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
import { ALL_SHAPES } from "../types/flow-table.types";

// Helper function to determine the correct dataKey for a column
const getColumnDataKey = (column: any): string => {
  // If dataKey is already set and it's one of the special keys, keep it
  if (column.dataKey && ["label", "shape", "id"].includes(column.dataKey)) {
    return column.dataKey;
  }

  // If data_key from database is set and it's one of the special keys, use it
  if (column.data_key && ["label", "shape", "id"].includes(column.data_key)) {
    return column.data_key;
  }

  // Check if this is a special column by its characteristics
  if (column.type === "Text" && column.order === 1) {
    return "label"; // This is likely the task column
  }

  if (
    column.type === "Select" &&
    column.options &&
    Array.isArray(column.options) &&
    column.options.some((opt: string) =>
      ["rectangle", "circle", "hexagon", "diamond", "triangle"].includes(opt)
    )
  ) {
    return "shape"; // This is likely the type column
  }

  if (column.title === "id" || column.order === 0) {
    return "id"; // This is the ID column
  }

  // For all other columns, use the title as dataKey
  return column.title;
};

// Helper function to ensure columns have proper dataKey
const ensureColumnDataKeys = (columns: any[]): any[] => {
  return columns.map((col) => ({
    ...col,
    dataKey: getColumnDataKey(col),
  }));
};

const initialUndoableState: UndoableState = {
  nodes: [],
  edges: [],
  nodeStyles: {},
  canvasSettings: {},
  columns: [
    { title: "id", type: "Text", dataKey: "id", order: 0 },
    { title: "task", type: "Text", dataKey: "label", order: 1 },
    {
      title: "type",
      type: "Select",
      options: ALL_SHAPES,
      dataKey: "shape",
      order: 2,
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
  canvas_type: null,
  currentFolder: null,
  canvasSettings: {
    theme: "light",
    grid_size: 15,
    snap_to_grid: true,
    show_grid: true,
    show_rulers: false,
    table_settings: {},
    backgroundColor: "#ffffff",
  },
};

const initialHistoryState: HistoryState = {
  past: [],
  present: initialUndoableState,
  future: [],
};

const MAX_HISTORY_LENGTH = 50; // Limit history to prevent memory issues
let isDragging = false;
let dragTimeout: NodeJS.Timeout | null = null;

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
        canvasSettings: state.canvasSettings,
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

        setDragging: (dragging: boolean) => {
          isDragging = dragging;
        },

        // Update nodes and track in history
        setNodes: (nodes) => {
          // Clear any existing timeout
          if (dragTimeout) {
            clearTimeout(dragTimeout);
            dragTimeout = null;
          }

          // Always update the nodes immediately
          set({ nodes: [...nodes] });

          // If we're dragging, debounce the history update
          if (isDragging) {
            dragTimeout = setTimeout(() => {
              const currentState = getUndoableState();
              const newState = { ...currentState, nodes: [...nodes] };
              addToHistory(newState);
              updateStateAndSync();
            }, 300);
          } else {
            // If not dragging, add to history immediately
            const currentState = getUndoableState();
            const newState = { ...currentState, nodes: [...nodes] };
            addToHistory(newState);
            updateStateAndSync();
          }
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

        updateCanvasSettings: (settings: any) => {
          const state = get();
          set({
            canvasSettings: { ...state.canvasSettings, ...settings },
            isDirty: true,
            updated_at: new Date(),
          });
          get().syncChanges();
        },

        // Update columns and track in history
        setColumns: (columns) => {
          if (!columns.length) return;

          // Ensure all columns have proper dataKey
          const columnsWithDataKey = ensureColumnDataKeys(columns);

          const currentState = getUndoableState();
          const newState = { ...currentState, columns: columnsWithDataKey };
          addToHistory(newState);

          set({
            columns: columnsWithDataKey,
            isDirty: true,
            updated_at: new Date(),
          });

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
                (column) => column?.type === "Rollup" && column.rollup_column_id
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
              console.log(
                "🚀 ~ refreshColumnsData: ~ rollupColumnDefs:",
                rollupColumnDefs
              );
            }

            // Map over column definitions and attach rollup column data when needed.
            const finalColumnDefs = columnDefs?.map((column) => {
              if (column?.type === "Rollup") {
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

            // Ensure columns have proper dataKey (using data_key from database)
            const columnsWithDataKey =
              finalColumnDefs?.map((col) => ({
                ...col,
                dataKey: col.data_key || getColumnDataKey(col),
              })) || [];

            set({ columns: columnsWithDataKey });
          } catch (error) {
            console.error("Error refreshing columns data:", error);
            toast.error("Error refreshing columns data.");
          }
        },

        addNewColumn: (column: any) => {
          const currentState = getUndoableState();
          const columnWithDataKey = {
            ...column,
            dataKey: column.dataKey || column.title, // Default to title if no dataKey provided
          };
          const newState = {
            ...currentState,
            columns: [...currentState.columns, columnWithDataKey],
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

          if (!state.id || !state.user_id) return;

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

                  // Columns data - ensure dataKey is always saved
                  columns: state.columns.map((column, index) => ({
                    id: column.id || uuidv4(),
                    title: column.title,
                    type: column?.type,
                    options: column.options || null,
                    required: column.required || false,
                    related_canvas_id: column.related_canvas_id || null,
                    rollup_column_id: column.rollup_column_id || null,
                    data_key: column.dataKey || column.title, // Always save dataKey
                    order: index,
                  })),

                  // Include settings directly in canvas_data
                  theme: state.canvasSettings?.theme || null,
                  grid_size: state.canvasSettings?.grid_size || 15,
                  show_grid: state.canvasSettings?.show_grid ?? true,
                  show_rulers: state.canvasSettings?.show_rulers ?? false,
                  snap_to_grid: state.canvasSettings?.snap_to_grid ?? true,
                  background_color:
                    state.canvasSettings?.backgroundColor || "#ffffff",
                  table_settings: state.canvasSettings?.table_settings || null,
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

        loadFolderCanvases: async (folderId: string | null) => {
          set({ isLoading: true, error: null });

          try {
            let query = supabase
              .from("canvas")
              .select(
                "id, name, description, updated_at, canvas_type, columns:column_definition!column_definition_canvas_id_fkey(*)"
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
                columns: ensureColumnDataKeys(canvas.columns || []),
                canvas_type: canvas.canvas_type,
              })),
            });
          } catch (error) {
            console.error("Error loading folder canvases:", error);
            set({ error: "Failed to load folder canvases" });
            // toast.error("Failed to load folder canvases");
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
              .select("*, folder:folder!canvas_folder_id_fkey(*)")
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
              ?.filter((column) => column?.type === "Rollup")
              .map((column) => column.rollup_column_id);

            const { data: rollupColumnDefs } = await supabase
              .from("column_definition")
              .select(
                "*, canvas:canvas!column_definition_canvas_id_fkey(*, canvas_data(*))"
              )
              .in("id", rollupDefs as String[]);

            // @ts-ignore
            columnDefs = columnDefs?.map((column) => {
              if (column?.type === "Rollup") {
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

            // Get canvas settings
            const { data: canvasSettings, error: settingsError } =
              await supabase
                .from("canvas_settings")
                .select("*")
                .eq("canvas_id", canvasId)
                .single();

            if (settingsError) {
              if (settingsError.code === "PGRST116") {
                // This is expected for new canvases - no settings exist yet
                console.log(
                  "No settings found for this canvas, using defaults"
                );
              } else {
                // This is an unexpected error
                console.error("Error loading canvas settings:", settingsError);
                throw settingsError;
              }
            }

            if (canvas) {
              // Ensure columns have proper dataKey (using data_key from database)
              const columnsWithDataKey = columnDefs?.length
                ? columnDefs.map((col) => ({
                    ...col,
                    dataKey: col.data_key || getColumnDataKey(col),
                  }))
                : ensureColumnDataKeys(initialState.columns);

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
                columns: columnsWithDataKey,
                version: canvasData?.version || 1,
                isDirty: false,
                lastSaved: new Date(),
                canvas_type: canvas.canvas_type,
                currentFolder: canvas.folder,
                canvasSettings: canvasSettings
                  ? {
                      ...canvasSettings,
                      backgroundColor:
                        canvasSettings.background_color || "#ffffff",
                    }
                  : {},
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
                  canvasSettings: {},
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
          const debounceTime = 2000;
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

        // Create a column in a specific canvas
        createColumnInCanvas: async (canvasId: string, columnData: any) => {
          try {
            // Generate a new UUID for the column
            const columnId = uuidv4();

            // Get the current order of columns for the target canvas
            const { data: existingColumns, error: columnsError } =
              await supabase
                .from("column_definition")
                .select("order")
                .eq("canvas_id", canvasId)
                .order("order", { ascending: false })
                .limit(1);

            if (columnsError) throw columnsError;

            // Determine the new order (highest + 1 or 0 if no columns exist)
            const newOrder =
              existingColumns && existingColumns.length > 0
                ? existingColumns[0].order + 1
                : 0;

            // Insert the new column with dataKey
            const { data, error } = await supabase
              .from("column_definition")
              .insert({
                id: columnId,
                canvas_id: canvasId,
                title: columnData.title,
                type: columnData.type,
                options: columnData.options || null,
                required: columnData.required || false,
                related_canvas_id: columnData.related_canvas_id || null,
                data_key: columnData.dataKey || columnData.title, // Use dataKey or fallback to title
                order: newOrder,
              })
              .select()
              .single();

            if (error) throw error;

            return data;
          } catch (error) {
            console.error("Error creating column in canvas:", error);
            toast.error("Failed to create reciprocal relation column");
            return null;
          }
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

        // Method to initialize the canvas with AI-generated data
        initializeWithAIData: (aiData: any) =>
          set((state) => {
            if (!aiData || !aiData.nodes || !aiData.edges) {
              console.error("Invalid AI data format");
              return state;
            }

            // Ensure all nodes have the required properties
            const nodes = aiData.nodes.map((node: any) => {
              return {
                ...node,
                id:
                  node.id ||
                  `node-${Math.random().toString(36).substring(2, 9)}`,
                type: node.type || "generic",
                position: node.position || { x: 0, y: 0 },
                data: node.data || { label: "Node" },
                style: node.style || {},
                width: node.width || 150,
                height: node.height || 50,
              };
            });

            // Ensure all edges have the required properties
            const edges = aiData.edges.map((edge: any) => {
              return {
                ...edge,
                id:
                  edge.id ||
                  `edge-${Math.random().toString(36).substring(2, 9)}`,
                type: edge.type || "custom",
                data: edge.data || { label: "" },
                style: edge.style || {},
              };
            });

            // Merge any provided node styles with defaults
            const nodeStyles = {
              ...state.nodeStyles,
              ...(aiData.nodeStyles || {}),
            };

            return {
              ...state,
              nodes,
              edges,
              nodeStyles,
              isDirty: true,
            };
          }),

        updateRelationInCanvas: async (
          canvasId: string,
          nodeId: string,
          columnTitle: string,
          relationValue: any[]
        ) => {
          try {
            console.log(
              `🔄 Updating reciprocal relation in canvas ${canvasId} for node ${nodeId}`
            );

            // Get the target canvas data
            const { data: targetCanvasData, error: canvasError } =
              await supabase
                .from("canvas_data")
                .select("nodes, version")
                .eq("canvas_id", canvasId)
                .single();

            if (canvasError && canvasError.code !== "PGRST116") {
              console.error("Error fetching target canvas:", canvasError);
              return false;
            }

            let targetNodes = targetCanvasData?.nodes || [];
            const currentVersion = targetCanvasData?.version || 1;

            // Update the specific node's relation data
            const updatedNodes = targetNodes.map((node: any) => {
              if (node.id === nodeId) {
                console.log(
                  `📝 Updating node ${nodeId} with new relations:`,
                  relationValue
                );
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [columnTitle]: relationValue,
                  },
                };
              }
              return node;
            });

            // Save the updated nodes back to the database
            const { error: updateError } = await supabase
              .from("canvas_data")
              .update({
                nodes: updatedNodes,
                updated_at: new Date().toISOString(),
                version: currentVersion + 1,
              })
              .eq("canvas_id", canvasId);

            if (updateError) {
              console.error("Error updating target canvas:", updateError);
              return false;
            }

            console.log(
              `✅ Successfully updated reciprocal relation in canvas ${canvasId}`
            );
            return true;
          } catch (error) {
            console.error("Error in updateRelationInCanvas:", error);
            return false;
          }
        },

        // Find reciprocal relation column in related canvas
        findReciprocalRelationColumn: async (
          relatedCanvasId: string,
          currentCanvasId: string,
          currentColumnTitle: string
        ) => {
          try {
            console.log(
              `🔍 Looking for reciprocal column in canvas ${relatedCanvasId} that points back to ${currentCanvasId}`
            );

            const { data: columns, error } = await supabase
              .from("column_definition")
              .select("*")
              .eq("canvas_id", relatedCanvasId)
              .eq("type", "Relation")
              .eq("related_canvas_id", currentCanvasId);

            if (error) {
              console.error("Error finding reciprocal column:", error);
              return null;
            }

            // Find the column that matches our relationship
            // Look for columns that reference back to our canvas
            const reciprocalColumn = columns?.find(
              (col) => col.related_canvas_id === currentCanvasId
            );

            if (reciprocalColumn) {
              console.log(
                `🔗 Found reciprocal column: "${reciprocalColumn.title}" in canvas ${relatedCanvasId}`
              );
            } else {
              console.log(
                `❌ No reciprocal column found in canvas ${relatedCanvasId}`
              );
            }

            return reciprocalColumn;
          } catch (error) {
            console.error("Error in findReciprocalRelationColumn:", error);
            return null;
          }
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
if (process.env.NODE_ENV === "development") {
  useCanvasStore.subscribe(console.log);
}
