"use client";

import { CreateNewModal } from "@/components/dashboard-sidebar/create-new-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  ChevronRight,
  Edit,
  FileText,
  Folder,
  MoreVertical,
  PlusCircle,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useUser } from "@/lib/contexts/userContext";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { Canvas, Folder as FolderType } from "@/types/sidebar";
import { CANVAS_TYPE } from "@/types/store";

export function UserSidebar() {
  const {
    folders,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    getFolders,
  } = useSidebarStore();

  const { user } = useUser();

  const [isCreateNewModalOpen, setIsCreateNewModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "folder" | "canvas";
  } | null>(null);
  const [openFolders, setOpenFolders] = useState<string[]>([]);

  const handleCreateFolder = async (name: string) => {
    if (name.trim()) {
      await createFolder(name, user?.id as string);
    }
  };

  const handleCreateCanvas = async (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    folderId?: string | null
  ) => {
    await createCanvas(
      name,
      description,
      user?.id as string,
      folderId as string,
      type
    );

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
      }
      setIsEditDialogOpen(false);
      setEditingItemId(null);
      setEditingItemName("");
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete.type === "folder") {
        await deleteFolder(itemToDelete.id);
      } else {
        await deleteCanvas(itemToDelete.id);
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    if (user) {
      getFolders(user.id);
    }
  }, [user]);

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 md:pt-24 bg-white">
        <Button
          onClick={() => setIsCreateNewModalOpen(true)}
          className="w-full bg-yadn-pink hover:bg-yadn-pink/90 text-white rounded-xl py-3 px-4 text-base font-normal flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="mr-2"
          >
            <path
              d="M8 1.14286V14.8571M1.14286 8H14.8571"
              stroke="currentColor"
              strokeWidth="1.71429"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New
        </Button>
      </SidebarHeader>
      <SidebarContent className="px-1 bg-white">
        <div className="mt-4 mb-2">
          <h2 className="px-3 text-base font-medium">Folders</h2>

          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Folder className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500 mb-4">No folders yet</p>
              <Button
                onClick={() => setIsCreateNewModalOpen(true)}
                variant="outline"
                className="flex items-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first folder
              </Button>
            </div>
          ) : (
            folders.map((folder: FolderType) => (
              <Collapsible
                key={folder.id}
                open={openFolders.includes(folder.id)}
                onOpenChange={(isOpen) => {
                  setOpenFolders((prev) =>
                    isOpen
                      ? [...prev, folder.id]
                      : prev.filter((id) => id !== folder.id)
                  );
                }}
              >
                <div className="flex items-center justify-between w-full px-3 py-2 text-[15px] rounded-lg group hover:bg-[#f1f3f4]">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center flex-grow">
                      <ChevronRight
                        className={`mr-2 h-4 w-4 transition-transform duration-200 ${
                          openFolders.includes(folder.id)
                            ? "transform rotate-90"
                            : ""
                        }`}
                      />
                      <Folder className="mr-2 h-4 w-4" />
                      {folder.name}
                    </button>
                  </CollapsibleTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          handleEdit(folder.id, folder.name, "folder")
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDelete(folder.id, "folder")}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CollapsibleContent>
                  {folder.canvases?.length === 0 ? (
                    <div className="ml-6 px-3 py-2 text-sm text-gray-500">
                      No canvases in this folder
                    </div>
                  ) : (
                    folder.canvases?.map((canvas: Canvas) => (
                      <div
                        key={canvas.id}
                        className="flex items-center justify-between w-full px-3 py-2 text-[15px] rounded-lg group hover:bg-[#f1f3f4] ml-6"
                      >
                        <Link
                          href={`/protected/canvas-new/${canvas.id}`}
                          className="flex items-center flex-grow"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {canvas.name}
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                handleEdit(canvas.id, canvas.name, "canvas")
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleDelete(canvas.id, "canvas")}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </SidebarContent>

      <CreateNewModal
        isOpen={isCreateNewModalOpen}
        onClose={() => setIsCreateNewModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        // @ts-ignore
        onCreateCanvas={handleCreateCanvas}
        folders={folders}
      />
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingItemId && folders.some((f) => f.id === editingItemId)
                ? "Folder"
                : "Canvas"}{" "}
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
                ? "This will delete the folder and all canvases inside it."
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
    </Sidebar>
  );
}
