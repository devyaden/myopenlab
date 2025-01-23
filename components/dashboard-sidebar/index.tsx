"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useUser } from "@/lib/contexts/userContext";
import { createClient } from "@/lib/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown, FileText, Folder, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "../loading-spinner";
import CreateCanvasButton from "./create-canvas-button";
import CreateFolderButton from "./create-folder-button";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Folder {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

interface Canvas {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_edited: string;
  flow_data: {
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  };
  is_published: boolean;
  user_id: number;
  folder_id: number;
}

interface CanvasMap {
  [key: number]: Canvas[];
}

interface LoadingState {
  [key: number]: boolean;
}

export const SidebarDashboard = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [canvases, setCanvases] = useState<CanvasMap>({});

  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [canvasesLoading, setCanvasesLoading] = useState<LoadingState>({});
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const supabase = createClient();
  const { user } = useUser();
  const userId = user?.id;

  const fetchFolders = async () => {
    setIsFoldersLoading(true);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFolders(data);
        // Initialize loading states for each folder's canvases
        const loadingStates: LoadingState = {};
        data.forEach((folder) => {
          loadingStates[folder.id] = true;
          fetchCanvases(folder.id);
        });
        setCanvasesLoading(loadingStates);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setIsFoldersLoading(false);
    }
  };

  const fetchCanvases = async (folderId: number) => {
    setCanvasesLoading((prev) => ({ ...prev, [folderId]: true }));
    try {
      const { data, error } = await supabase
        .from("canvases")
        .select("*")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCanvases((prev) => ({
          ...prev,
          [folderId]: data,
        }));
      }
    } catch (error) {
      console.error(`Error fetching canvases for folder ${folderId}:`, error);
    } finally {
      setCanvasesLoading((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const handleCanvasClick = (canvas: Canvas) => {
    const recentlyOpenedCanvases = JSON.parse(
      localStorage.getItem("recentlyOpenedCanvases") || "[]"
    );

    const newEntry = {
      id: canvas.id,
      name: canvas.name,
      openedAt: new Date().toISOString(),
    };

    const updatedCanvases = [
      newEntry,
      ...recentlyOpenedCanvases.filter((item: any) => item.id !== canvas.id),
    ].slice(0, 10); // Keep only the latest 10 entries

    localStorage.setItem(
      "recentlyOpenedCanvases",
      JSON.stringify(updatedCanvases)
    );

    router.push(`/protected/canvas/${canvas.id}`);
  };

  const handleDeleteCanvas = async (canvas: Canvas) => {
    try {
      // Delete the canvas
      const { error } = await supabase
        .from("canvases")
        .delete()
        .eq("id", canvas.id);

      if (error) {
        throw error;
      }

      // Remove the deleted canvas from the local state
      setCanvases((prev) => ({
        ...prev,
        [canvas.folder_id]: prev[canvas.folder_id].filter(
          (c) => c.id !== canvas.id
        ),
      }));

      // Show success toast
      toast({
        title: "Canvas Deleted",
        description: `Canvas "${canvas.name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting canvas:", error);
      toast({
        title: "Error",
        description: "Failed to delete canvas. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      setIsDeletingFolder(true);

      // First, get all canvases in the folder
      const { data: folderCanvases, error: fetchError } = await supabase
        .from("canvases")
        .select("id")
        .eq("folder_id", folder.id);

      if (fetchError) {
        throw fetchError;
      }

      // Delete all canvases in the folder
      if (folderCanvases && folderCanvases.length > 0) {
        const { error: deleteCanvasesError } = await supabase
          .from("canvases")
          .delete()
          .in(
            "id",
            folderCanvases.map((canvas) => canvas.id)
          );

        if (deleteCanvasesError) {
          throw deleteCanvasesError;
        }
      }

      // Delete the folder
      const { error: deleteFolderError } = await supabase
        .from("folders")
        .delete()
        .eq("id", folder.id);

      if (deleteFolderError) {
        throw deleteFolderError;
      }

      // Remove the deleted folder from the local state
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));

      // Remove the folder's canvases from the local state
      setCanvases((prev) => {
        const newCanvases = { ...prev };
        delete newCanvases[folder.id];
        return newCanvases;
      });

      // Show success toast
      toast({
        title: "Folder Deleted",
        description: `Folder "${folder.name}" and all its canvases have been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingFolder(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [userId]);

  if (isFoldersLoading) {
    return (
      <Sidebar side="right">
        <SidebarHeader className="pt-4 md:pt-24 flex justify-center items-center">
          <LoadingSpinner size={32} className="text-gray-400" />
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar side="right">
      <SidebarHeader className="pt-4 md:pt-24">
        <CreateFolderButton userId={userId} onFolderCreated={fetchFolders} />
        {folders.map((folder) => (
          <Collapsible key={folder.id} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full">
                  <div className="w-full text-lg flex items-center text-black">
                    <Folder className="ml-4 h-4 w-4" />
                    <span className="ml-2">{folder.name}</span>
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 text-black" />
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <div className="flex justify-between items-center py-2 flex-col border-b">
                    <CreateCanvasButton
                      folderId={folder.id}
                      userId={userId || ""}
                      onCanvasCreated={() => fetchCanvases(folder.id)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild className="px-1 text-red-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Folder</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this folder and all
                            its canvases? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFolder(folder)}
                            disabled={isDeletingFolder}
                          >
                            {isDeletingFolder ? (
                              <LoadingSpinner size={16} className="mr-2" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {canvasesLoading[folder.id] ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size={24} className="text-gray-400" />
                    </div>
                  ) : (
                    <SidebarMenuSub>
                      {canvases[folder.id]?.map((canvas) => (
                        <SidebarMenuSubItem
                          key={canvas.id}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <SidebarMenuSubButton
                            className="flex-grow"
                            onClick={() => handleCanvasClick(canvas)}
                          >
                            <FileText className="ml-2 h-4 w-4" />
                            {canvas.name}
                          </SidebarMenuSubButton>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCanvas(canvas);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarHeader>
    </Sidebar>
  );
};
