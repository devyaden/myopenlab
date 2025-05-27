"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Joyride from 'react-joyride';
import {
  Folder,
  FileText,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { useUser } from "@/lib/contexts/userContext";
import { CANVAS_TYPE } from "@/components/dashboard-sidebar/create-new-modal";
import { CreateNewModal } from "@/components/dashboard-sidebar/create-new-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import CustomJoyrideTooltip from "../CustomJoyrideTooltip";

export function HomeContent() {
  const {
    folders,
    rootCanvases,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    getFolders,
    fetchRootCanvases,
  } = useSidebarStore();
  const { 
    protectedOnBording, 
    isFirstVisit, 
    setData, 
    setProtectedOnBording, 
    setCreateCategoryOnbording, 
    setCanvasOnbording,
    setNotFirstVisit,
    setIsChecked,
    isChecked
  } = useOnboardingStore();

  const steps = [
    {
      target: '.onboarding-create-button',
      content: 'Click here to create a new folder!',
      disableBeacon: true, 
    },
    {
      target: '.folderInput',
      content: 'Write folder name!',
      disableBeacon: true
    },
    {
      target: '.submit-create-folder',
      content: 'By clicking on Create folder button it will create a folder!',
      disableBeacon: true
    },
  ];

  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [createNewModalType, setCreateNewModalType] = useState<
    "folder" | "canvas" | null
  >(null);
  const [currentFolderForCreate, setCurrentFolderForCreate] = useState<
    string | null
  >(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [runTour, setRunTour] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "folder" | "canvas";
  } | null>(null);

  useEffect(() => {
    if (user) {
      getFolders(user.id);
      fetchRootCanvases(user?.id);
    }
  }, [user, getFolders, fetchRootCanvases]);

  // Include the Root folder in search
  const rootFolder = {
    id: "root",
    name: "Root",
    canvases: rootCanvases,
    is_root: true,
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if Root folder should be shown based on search
  const showRootFolder =
    searchQuery === "" || "root".includes(searchQuery.toLowerCase());

  const handleCreateFolder = async (name: string) => {
    if (name.trim()) {
      await createFolder(name, user?.id as string);
    }
    setCreateNewModalType(null);
  };

  const handleCreateCanvas = (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    folderId?: string | null
  ) => {
    createCanvas(
      name,
      description,
      user?.id as string,
      folderId as string,
      type
    ).then((canvasId) => {
      // If creating a canvas without a folder, fetch root canvases again
      if (!folderId) {
        fetchRootCanvases(user?.id);
      }

      if (
        canvasId &&
        (type === CANVAS_TYPE.HYBRID || type === CANVAS_TYPE.TABLE)
      ) {
        window.location.href = `/protected/canvas-new/${canvasId}`;
      } else if (canvasId && type === CANVAS_TYPE.DOCUMENT) {
        window.location.href = `/protected/document-editor/${canvasId}`;
      }
    });

    setCreateNewModalType(null);
    setCurrentFolderForCreate(null);
    return true;
  };

  const handleEdit = (id: string, name: string, type: "folder" | "canvas") => {
    setEditingItemId(id);
    setEditingItemName(name);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string, type: "folder" | "canvas") => {
    setItemToDelete({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (editingItemId) {
      const isFolder = folders.some((f) => f.id === editingItemId);
      if (isFolder) {
        await updateFolder(editingItemId, editingItemName);
      } else {
        await updateCanvas(editingItemId, editingItemName);

        // Check if this was a root canvas
        if (rootCanvases.some((c) => c.id === editingItemId)) {
          fetchRootCanvases(user?.id);
        }
      }
      setIsEditDialogOpen(false);
      setEditingItemId(null);
      setEditingItemName("");
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete?.type === "folder") {
        await deleteFolder(itemToDelete.id);
      } else {
        await deleteCanvas(itemToDelete.id);

        // Check if this was a root canvas
        if (rootCanvases.some((c) => c.id === itemToDelete.id)) {
          fetchRootCanvases(user?.id);
        }
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDontShowAgainChange = (e: any) => {
    setIsChecked(e.target?.checked)
  }

  const handleJoyrideCllback = (data: any) => {
    const { action, index, status, type } = data;

    if (action === 'next' && index === 0) {
      setCreateNewModalType("folder")
    }
  }

  useEffect(() => {
    if (isFirstVisit && protectedOnBording) {
      setData(steps);
    }

    const timeout = setTimeout(() => {
      setHasMounted(true);
      setRunTour(isFirstVisit);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isFirstVisit]);

  return (
    <div className="flex flex-col h-full">
      {hasMounted 
        && isFirstVisit 
          && protectedOnBording && (
            <Joyride
              steps={steps}
              run={runTour}
              callback={handleJoyrideCllback}
              tooltipComponent={(props: any) => (
                <CustomJoyrideTooltip 
                  {...props} 
                  onDontShowAgainChange={handleDontShowAgainChange}
                  isChecked={isChecked}
                />
              )}
              continuous
              showProgress
              showSkipButton
              styles={{
                options: {
                  primaryColor: '#22c55e',
                  zIndex: 10000,
                },
              }}
            />
      )}
      <div className="p-6 flex-shrink-0 bg-white">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          <h1 className="text-2xl font-semibold md:w-1/4">Home</h1>
          <div className="flex justify-center items-center w-full md:w-2/4">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search folders and files..."
                className="pl-10 pr-10 h-12 rounded-lg border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className="md:w-1/4 flex justify-end gap-3 mt-4 md:mt-0">
            <Button
              onClick={() => setCreateNewModalType("canvas")}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/80 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Folders Grid */}
      <ScrollArea className="flex-grow p-6 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-6">
          {/* Root Folder - Only show if it matches search or thesearch is empty */}
          {showRootFolder && (
            <Link href={`/protected/folder/root`}>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group border-2 border-dashed border-yadn-accent-blue/30 h-28 w-28 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Folder className="h-10 w-10 text-yadn-accent-blue mb-1" />
                  <h3 className="font-medium text-gray-900 truncate max-w-[90px] text-center text-sm">
                    Root
                  </h3>
                  <p className="text-xs text-gray-500">
                    {rootCanvases.length || 0} items
                  </p>
                </div>
              </Card>
            </Link>
          )}

          {/* Other folders */}
          {filteredFolders.length === 0 && !showRootFolder ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg col-span-full">
              <Folder className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No folders found</p>
            </div>
          ) : (
            filteredFolders.map((folder) => (
              <Link href={`/protected/folder/${folder.id}`} key={folder.id}>
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group h-28 w-28 relative">
                  <div className="absolute top-1 right-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleEdit(folder.id, folder.name, "folder");
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(folder.id, "folder");
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-col items-center justify-center h-full">
                    <Folder className="h-10 w-10 text-yadn-accent-dark-orange mb-1" />
                    <h3 className="font-medium text-gray-900 truncate max-w-[90px] text-center text-sm">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {folder.canvases?.length || 0} items
                    </p>
                  </div>
                </Card>
              </Link>
            ))
          )}
          {/* New Folder Button */}
          <div className="h-28 w-28">
            <Button
              variant="ghost"
              className="flex flex-col text-sm w-full h-full border border-gray-200 rounded-lg onboarding-create-button"
              onClick={() => setCreateNewModalType("folder")}
            >
              <Plus className="mb-1 h-5 w-5" />
              <span className="text-sm">New Folder</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
        <div>
          <CreateNewModal
            isOpen={Boolean(createNewModalType)}
            onClose={() => {
              setCreateNewModalType(null);
              setCurrentFolderForCreate(null);
            }}
            onCreateFolder={handleCreateFolder}
            onCreateCanvas={handleCreateCanvas}
            folders={folders}
            type={createNewModalType}
            currentFolderId={currentFolderForCreate}
            rootCanvases={rootCanvases}
          />
        </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingItemId && folders.some((f) => f.id === editingItemId)
                ? "Folder"
                : "File"}{" "}
              Name
            </DialogTitle>
          </DialogHeader>
          <Input
            value={editingItemName}
            onChange={(e) => setEditingItemName(e.target.value)}
            placeholder="Enter new name"
          />
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this {itemToDelete?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "folder"
                ? "This will delete the folder and all files inside it."
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
