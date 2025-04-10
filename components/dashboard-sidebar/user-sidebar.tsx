"use client";

import {
  CANVAS_TYPE,
  CreateNewModal,
} from "@/components/dashboard-sidebar/create-new-modal";
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
  DropdownMenuSeparator,
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
  Clock,
  Edit,
  File,
  FileText,
  Folder,
  Home,
  MoreVertical,
  Plus,
  PlusCircle,
  Share2,
  Star,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useUser } from "@/lib/contexts/userContext";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { generateUntitledName } from "@/lib/utils";
import type { Canvas, Folder as FolderType } from "@/types/sidebar";

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
    fetchRootCanvases,
    rootCanvases,
  } = useSidebarStore();

  const { user } = useUser();

  const [createNewModalType, setCreateNewModalType] = useState<
    "folder" | "canvas" | null
  >(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "folder" | "canvas";
  } | null>(null);
  const [openFolders, setOpenFolders] = useState<string[]>(["root"]); // Open root folder by default
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [showShareWithMeDropdown, setShowShareWithMeDropdown] = useState(false);
  const [currentFolderForCreate, setCurrentFolderForCreate] = useState<
    string | null
  >(null);

  const handleCreateFolder = async (name: string) => {
    if (name.trim()) {
      await createFolder(name, user?.id as string);
    }

    setCreateNewModalType(null);
    setCurrentFolderForCreate(null);
  };

  const handleCreateCanvas = async (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    folderId?: string | null
  ) => {
    const canvasId = await createCanvas(
      name,
      description,
      user?.id as string,
      folderId as string,
      type
    );

    // If creating a canvas without a folder, fetch root canvases again
    if (!folderId) {
      fetchRootCanvases(user?.id);
    }

    if (canvasId) {
      window.location.href = `/protected/canvas-new/${canvasId}`;
    }

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

  useEffect(() => {
    if (user) {
      getFolders(user.id);
      fetchRootCanvases(user?.id);
    }
  }, [user]);

  return (
    <Sidebar className="border-r border-gray-100 bg-white w-64">
      <SidebarHeader className="p-4 bg-white pt-24">
        <Button
          className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-md py-2 px-4 text-sm font-medium flex items-center justify-center"
          onClick={() => setCreateNewModalType("canvas")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 bg-white">
        <div className="space-y-1 mt-2">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            <Home className="mr-3 h-4 w-4 text-gray-500" />
            Home
          </Link>

          <Link
            href="/recent"
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            <Clock className="mr-3 h-4 w-4 text-gray-500" />
            Recent
          </Link>

          <Link
            href="/starred"
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            <Star className="mr-3 h-4 w-4 text-gray-500" />
            Starred
          </Link>

          <Collapsible
            open={showDocumentDropdown}
            onOpenChange={setShowDocumentDropdown}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <div className="flex items-center">
                <File className="mr-3 h-4 w-4 text-gray-500" />
                Document
              </div>
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  showDocumentDropdown ? "transform rotate-90" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10">
              {/* Document content can go here */}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={showShareWithMeDropdown}
            onOpenChange={setShowShareWithMeDropdown}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <div className="flex items-center">
                <Share2 className="mr-3 h-4 w-4 text-gray-500" />
                Share with me
              </div>
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  showShareWithMeDropdown ? "transform rotate-90" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10">
              {/* Shared content can go here */}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-sm font-medium text-gray-900">Folders</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => setCreateNewModalType("folder")}
            >
              <PlusCircle className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Root folder to display items without a folder_id */}
          <Collapsible
            open={openFolders.includes("root")}
            onOpenChange={(isOpen) => {
              setOpenFolders((prev) =>
                isOpen ? [...prev, "root"] : prev.filter((id) => id !== "root")
              );
            }}
          >
            <div className="flex items-center justify-between w-full px-3 py-2 rounded-md group hover:bg-gray-100">
              <CollapsibleTrigger asChild>
                <button className="flex items-center flex-grow text-sm text-gray-700">
                  <ChevronRight
                    className={`mr-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      openFolders.includes("root") ? "transform rotate-90" : ""
                    }`}
                  />
                  <Folder className="mr-2 h-4 w-4 text-gray-500" />
                  Root
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {rootCanvases.length === 0 ? (
                <div className="pl-10 pr-3 py-1 text-xs text-gray-500">
                  No files in root folder
                </div>
              ) : (
                rootCanvases.map((canvas: Canvas) => (
                  <div
                    key={canvas.id}
                    className="flex items-center justify-between w-full px-3 py-1 rounded-md group hover:bg-gray-100 pl-6 pr-4"
                  >
                    <Link
                      href={
                        canvas.canvas_type === CANVAS_TYPE.DOCUMENT
                          ? `/protected/document-editor/${canvas.id}`
                          : `/protected/canvas-new/${canvas.id}`
                      }
                      className="flex items-center flex-grow text-sm text-gray-700"
                    >
                      <FileText className="mr-2 h-4 w-4 text-gray-500" />
                      {canvas.name}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
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

              <button
                className="flex items-center text-sm text-gray-500 px-3 py-1 pl-7 hover:bg-gray-100 rounded-md w-full"
                onClick={() => setCreateNewModalType("canvas")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add File
              </button>
            </CollapsibleContent>
          </Collapsible>

          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">No folders yet</p>
              <Button
                onClick={() => setCreateNewModalType("folder")}
                variant="outline"
                size="sm"
                className="flex items-center text-xs"
              >
                <PlusCircle className="mr-1 h-3 w-3" />
                Create folder
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
                <div className="flex items-center justify-between w-full px-3 py-2 rounded-md group hover:bg-gray-100">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center flex-grow text-sm text-gray-700">
                      <ChevronRight
                        className={`mr-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${
                          openFolders.includes(folder.id)
                            ? "transform rotate-90"
                            : ""
                        }`}
                      />
                      <Folder className="mr-2 h-4 w-4 text-gray-500" />
                      {folder.name}
                    </button>
                  </CollapsibleTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
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
                    <div className="pl-10 pr-3 py-1 text-xs text-gray-500">
                      No files in this folder
                    </div>
                  ) : (
                    folder.canvases?.map((canvas: Canvas) => (
                      <div
                        key={canvas.id}
                        className="flex items-center justify-between w-full px-3 py-1 rounded-md group hover:bg-gray-100 pl-6 pr-4"
                      >
                        <Link
                          href={
                            canvas.canvas_type === CANVAS_TYPE.DOCUMENT
                              ? `/protected/document-editor/${canvas.id}`
                              : `/protected/canvas-new/${canvas.id}`
                          }
                          className="flex items-center flex-grow text-sm text-gray-700"
                        >
                          <FileText className="mr-2 h-4 w-4 text-gray-500" />
                          {canvas.name}
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500" />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center text-sm text-gray-500 px-3 py-1 pl-7 hover:bg-gray-100 rounded-md w-full">
                        <Plus className="mr-1 h-3 w-3" />
                        Add File
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          const name = generateUntitledName(
                            CANVAS_TYPE.HYBRID,
                            [
                              ...folders.flatMap((folder) => folder.canvases),
                              ...rootCanvases,
                            ]
                          );
                          handleCreateCanvas(
                            name,
                            "",
                            CANVAS_TYPE.HYBRID,
                            folder.id
                          );
                        }}
                      >
                        <File className="mr-2 h-4 w-4" />
                        New Canvas
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const name = generateUntitledName(CANVAS_TYPE.TABLE, [
                            ...folders.flatMap((folder) => folder.canvases),
                            ...rootCanvases,
                          ]);
                          handleCreateCanvas(
                            name,
                            "",
                            CANVAS_TYPE.TABLE,
                            folder.id
                          );
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        New Table
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const name = generateUntitledName(
                            CANVAS_TYPE.DOCUMENT,
                            [
                              ...folders.flatMap((folder) => folder.canvases),
                              ...rootCanvases,
                            ]
                          );
                          handleCreateCanvas(
                            name,
                            "",
                            CANVAS_TYPE.DOCUMENT,
                            folder.id
                          );
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        New Document
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentFolderForCreate(folder.id);
                          setCreateNewModalType("canvas");
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create with Details...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </SidebarContent>

      <CreateNewModal
        isOpen={Boolean(createNewModalType)}
        onClose={() => {
          setCreateNewModalType(null);
          setCurrentFolderForCreate(null);
        }}
        onCreateFolder={handleCreateFolder}
        // @ts-ignore
        onCreateCanvas={handleCreateCanvas}
        folders={folders}
        type={createNewModalType}
        currentFolderId={currentFolderForCreate}
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
