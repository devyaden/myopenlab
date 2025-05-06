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
import {
  Folder,
  FileText,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash,
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex-shrink-0 bg-white">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          <h1 className="text-2xl font-semibold">Home</h1>
          <div className="flex justify-end items-center w-full">
            <div className="relative max-w-3xl w-full mr-2 mt-1 md:mt-auto md:mx-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search folders and files..."
                className="pl-10 h-12 rounded-lg border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
        <div className="grid grid-cols-1 xs:grid-cols-3 md:grid-cols-8 lg:grid-cols-12 gap-4">
          {/* Root Folder - Only show if it matches search or search is empty */}
          {showRootFolder && (
            <Link href={`/protected/folder/root`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group border-2 border-dashed border-yadn-accent-blue/30">
                <div className="flex items-start justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <Folder className="h-14 w-14 text-yadn-accent-blue mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
                        Root
                      </h3>
                      <p className="text-xs text-gray-500">
                        {rootCanvases.length || 0} items
                      </p>
                    </div>
                  </div>
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
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-center">
                    <div className="flex flex-col items-center justify-center">
                      <Folder className="h-14 w-14 text-yadn-accent-dark-orange mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {folder.canvases?.length || 0} items
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-4 w-4" />
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
                </Card>
              </Link>
            ))
          )}
          {/* Folders Section Header */}
          <div className="flex w-full h-full items-center justify-between mb-4">
            {/* <h2 className="text-lg font-medium">Folders</h2> */}
            <Button
              variant="ghost"
              className="flex flex-col text-sm w-full h-full border border-gray-200"
              onClick={() => setCreateNewModalType("folder")}
            >
              <Plus className="mr-1 h-4 w-4" /> New Folder
            </Button>
          </div>
        </div>
      </ScrollArea>

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
