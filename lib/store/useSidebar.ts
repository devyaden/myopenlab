import { SidebarActions, SidebarStore } from "@/types/sidebar";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../supabase/client";
import { CANVAS_TYPE } from "@/types/store";

const initialState: Omit<SidebarStore, keyof SidebarActions> = {
  folders: [],
  selectedFolderId: null,
  selectedCanvasId: null,
  isLoading: false,
  error: null,
  folderLoading: false,
  canvasLoading: false,
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFolders: (folders) => set({ folders }),

      getFolders: async (userId) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from("folder")
            .select("*, canvases:canvas(*)")
            .eq("user_id", userId);

          if (error) throw error;

          set({ folders: data || [], isLoading: false });
        } catch (error) {
          console.error("Error fetching folders:", error);
          set({ error: "Failed to fetch folders", isLoading: false });
        }
      },

      createFolder: async (name, userId, parentId) => {
        set({ folderLoading: true });

        await supabase.auth.refreshSession();
        const state = get();

        const newFolder = {
          id: uuidv4(),
          name,
          parentId: parentId || null,
          canvases: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({
          folders: [...state.folders, newFolder],
        });

        try {
          const { error } = await supabase.from("folder").insert({
            id: newFolder.id,
            name: newFolder.name,
            parent_id: newFolder.parentId,
            user_id: userId,
          });

          if (error) throw error;

          toast.success("Folder created successfully!");
        } catch (error) {
          console.error("Error creating folder:", error);
          // Rollback optimistic update
          set({
            folders: state.folders,
            error: "Failed to create folder",
          });
          toast.error("Failed to create folder");
        } finally {
          set({ folderLoading: false });
        }
      },

      updateFolder: async (id, name) => {
        const state = get();
        const oldFolders = [...state.folders];

        // Optimistic update
        set({
          folders: state.folders.map((folder) =>
            folder.id === id
              ? { ...folder, name, updatedAt: new Date() }
              : folder
          ),
        });

        try {
          const { error } = await supabase
            .from("folder")
            .update({ name, updated_at: new Date().toISOString() })
            .eq("id", id);

          if (error) throw error;

          toast.success("Folder updated successfully!");
        } catch (error) {
          console.error("Error updating folder:", error);
          // Rollback optimistic update
          set({
            folders: oldFolders,
            error: "Failed to update folder",
          });
          toast.error("Failed to update folder");
        }
      },

      deleteFolder: async (id) => {
        const state = get();
        const oldFolders = [...state.folders];

        // Optimistic update
        set({
          folders: state.folders.filter((folder) => folder.id !== id),
        });

        try {
          // Call the stored function to delete the folder and canvases in a transaction
          const { error } = await supabase.rpc("delete_folder_with_contents", {
            folder_id_alias: id,
          });

          if (error) throw error;

          toast.success("Folder and all its canvases deleted successfully!");
        } catch (error) {
          console.error("Error deleting folder:", error);
          // Rollback optimistic update
          set({
            folders: oldFolders,
            error: "Failed to delete folder and its contents",
          });
          toast.error("Failed to delete folder and its contents");
        }
      },

      createCanvas: async (
        name,
        description,
        userId,
        folderId,
        canvas_type
      ) => {
        const state = get();
        const newCanvas = {
          id: uuidv4(),
          name,
          description,
          folderId: folderId || null,
          canvas_type: canvas_type || CANVAS_TYPE.HYBRID,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistic update
        set({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? { ...folder, canvases: [...folder.canvases, newCanvas] }
              : folder
          ),
        });

        try {
          const { error } = await supabase.from("canvas").insert({
            id: newCanvas.id,
            name: newCanvas.name,
            description: newCanvas.description,
            folder_id: newCanvas.folderId,
            user_id: userId,
            canvas_type: newCanvas.canvas_type,
          });

          if (error) throw error;

          toast.success("Canvas created successfully!");
        } catch (error) {
          console.error("Error creating canvas:", error);
          // Rollback optimistic update
          set({
            folders: state.folders,
            error: "Failed to create canvas",
          });
          toast.error("Failed to create canvas");
        }
      },

      updateCanvas: async (id, name, description) => {
        const state = get();
        const oldFolders = [...state.folders];

        // Optimistic update
        set({
          folders: state.folders.map((folder) => ({
            ...folder,
            canvases: folder.canvases.map((canvas) =>
              canvas.id === id
                ? { ...canvas, name, description, updatedAt: new Date() }
                : canvas
            ),
          })),
        });

        try {
          const { error } = await supabase
            .from("canvas")
            .update({
              name,
              description,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (error) throw error;

          toast.success("Canvas updated successfully!");
        } catch (error) {
          console.error("Error updating canvas:", error);
          // Rollback optimistic update
          set({
            folders: oldFolders,
            error: "Failed to update canvas",
          });
          toast.error("Failed to update canvas");
        }
      },

      deleteCanvas: async (id) => {
        const state = get();
        const oldFolders = [...state.folders];

        // Optimistic update
        set({
          folders: state.folders.map((folder) => ({
            ...folder,
            canvases: folder.canvases.filter((canvas) => canvas.id !== id),
          })),
        });

        try {
          const { error } = await supabase.from("canvas").delete().eq("id", id);

          if (error) throw error;

          toast.success("Canvas deleted successfully!");
        } catch (error) {
          console.error("Error deleting canvas:", error);
          // Rollback optimistic update
          set({
            folders: oldFolders,
            error: "Failed to delete canvas",
          });
          toast.error("Failed to delete canvas");
        }
      },

      moveCanvas: async (canvasId, newFolderId) => {
        const state = get();
        const oldFolders = [...state.folders];

        // Optimistic update
        set({
          folders: state.folders.map((folder) => {
            if (folder.id === newFolderId) {
              const canvas = state.folders
                .flatMap((f) => f.canvases)
                .find((c) => c.id === canvasId);
              if (canvas) {
                return {
                  ...folder,
                  canvases: [
                    ...folder.canvases,
                    { ...canvas, folderId: newFolderId },
                  ],
                };
              }
            }
            return {
              ...folder,
              canvases: folder.canvases.filter(
                (canvas) => canvas.id !== canvasId
              ),
            };
          }),
        });

        try {
          const { error } = await supabase
            .from("canvas")
            .update({ folder_id: newFolderId })
            .eq("id", canvasId);

          if (error) throw error;

          toast.success("Canvas moved successfully!");
        } catch (error) {
          console.error("Error moving canvas:", error);
          // Rollback optimistic update
          set({
            folders: oldFolders,
            error: "Failed to move canvas",
          });
          toast.error("Failed to move canvas");
        }
      },

      setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
      setSelectedCanvas: (canvasId) => set({ selectedCanvasId: canvasId }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({
        folders: state.folders,
        selectedFolderId: state.selectedFolderId,
        selectedCanvasId: state.selectedCanvasId,
      }),
    }
  )
);

// Subscribe to store changes for debugging
// if (process.env.NODE_ENV === "development") {
//   useSidebarStore.subscribe(console.log);
// }

// Initialize real-time sync
// useSidebarStore.subscribe((state) => {
//   if (state.selectedFolderId) {
//     realtimeSync.subscribeToFolder(state.selectedFolderId);
//   }
// });
