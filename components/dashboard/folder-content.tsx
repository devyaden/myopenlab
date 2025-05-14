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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash,
  File,
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { useUser } from "@/lib/contexts/userContext";
import {
  CANVAS_TYPE,
  CreateNewModal,
} from "@/components/dashboard-sidebar/create-new-modal";
import { generateUntitledName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Joyride from 'react-joyride';
import { useOnboardingStore } from "@/lib/store/useOnboarding";

interface FolderContentProps {
  folderId: string;
}

export function FolderContent({ folderId }: FolderContentProps) {
  const {
    folders,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    getFolders,
    fetchRootCanvases,
    rootCanvases,
  } = useSidebarStore();

  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [createNewModalType, setCreateNewModalType] = useState<
    "folder" | "canvas" | null
  >(null);
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "canvas";
  } | null>(null);
  const { setSecoundStepData, isFirstVisit, data, isFirstStepCompleted } = useOnboardingStore();
  const [runTour, setRunTour] = useState(true);

  const steps = [
    {
      target: '.onboarding-create-button',
      content: 'Click here to create a new folder!',
      disableBeacon: true, 
    }
  ];

  const handleJoyrideCllback = (data: any) => {
    const { action, index, status, type } = data;

    if (action === 'next' && index === 0) {
      setCreateNewModalType("canvas")
    }

    if (status === 'finished' || status === 'skipped') {
      setRunTour(false);
    }
  }

  useEffect(() => {
    if (user) {
      getFolders(user.id);
      if (folderId === "root") {
        fetchRootCanvases(user?.id);
      }
    }
  }, [user, getFolders, folderId, fetchRootCanvases]);

  useEffect(() => {
    if (folderId === "root") {
      setCurrentFolder({
        id: "root",
        name: "Root",
        canvases: rootCanvases || [],
        is_root: true,
      });
    } else {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder);
      }
    }
  }, [folders, folderId, rootCanvases]);

  const filteredCanvases =
    currentFolder?.canvases?.filter((canvas: any) =>
      canvas.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Function to handle empty canvases array gracefully
  const getEmptyState = () => (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      {isFirstVisit && (
        <Joyride
          steps={steps}
          run={runTour}
          callback={handleJoyrideCllback}
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
      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
      <p className="text-gray-500">No files found in this folder</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 onboarding-create-button"
        onClick={() => setCreateNewModalType("canvas")}
      >
        <Plus className="mr-1 h-4 w-4" /> Create New
      </Button>
    </div>
  );

  // Function to render the file grid
  const renderFileGrid = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredCanvases.map((canvas: any) => (
        <Link
          href={
            canvas.canvas_type === CANVAS_TYPE.DOCUMENT
              ? `/protected/document-editor/${canvas.id}`
              : `/protected/canvas-new/${canvas.id}`
          }
          key={canvas.id}
        >
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    canvas.canvas_type === CANVAS_TYPE.DOCUMENT
                      ? "bg-yadn-accent-blue"
                      : canvas.canvas_type === CANVAS_TYPE.TABLE
                        ? "bg-yadn-accent-dark-orange"
                        : "bg-yadn-accent-pink"
                  }`}
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
                    {canvas.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {canvas.canvas_type === CANVAS_TYPE.DOCUMENT
                      ? "Document"
                      : canvas.canvas_type === CANVAS_TYPE.TABLE
                        ? "Table"
                        : "Canvas"}
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
                      handleEdit(canvas.id, canvas.name);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(canvas.id);
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
      ))}
    </div>
  );

  const handleCreateCanvas = (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    _folderId: string | null
  ) => {
    const folderIdToUse = folderId === "root" ? null : folderId;

    createCanvas(
      name,
      description,
      user?.id as string,
      folderIdToUse as string,
      type
    ).then((canvasId) => {
      if (
        canvasId &&
        (type === CANVAS_TYPE.HYBRID || type === CANVAS_TYPE.TABLE)
      ) {
        window.location.href = `/protected/canvas-new/${canvasId}`;
      } else if (canvasId && type === CANVAS_TYPE.DOCUMENT) {
        window.location.href = `/protected/document-editor/${canvasId}`;
      }

      if (folderId === "root") {
        fetchRootCanvases(user?.id);
      }
    });

    setCreateNewModalType(null);
    return true;
  };

  // Helper to refresh data after operations in the root folder
  const refreshRootFolderData = () => {
    if (folderId === "root" && user) {
      fetchRootCanvases(user.id);
    }
  };

  const handleEdit = (id: string, name: string) => {
    setEditingItemId(id);
    setEditingItemName(name);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete({ id, type: "canvas" });
    setIsDeleteDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (editingItemId) {
      await updateCanvas(editingItemId, editingItemName);
      refreshRootFolderData();
      setIsEditDialogOpen(false);
      setEditingItemId(null);
      setEditingItemName("");
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteCanvas(itemToDelete.id);
      refreshRootFolderData();
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (!currentFolder) {
    return (
      <div className="p-6 text-center">
        <p>Loading folder...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex-shrink-0 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={() => router.push("/protected")}
            >
              <ArrowLeft className="h-4 w-4" />
              {/* Back */}
            </Button>
            <h1 className="text-xl font-semibold">
              {currentFolder?.name || "Loading..."}
            </h1>
          </div>

          <div className="relative w-full max-w-xl mx-auto px-4">
            <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search files in this folder..."
              className="pl-10 pr-10 h-12 rounded-lg border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-7 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-yadn-accent-green hover:bg-yadn-accent-green/80 text-white">
                <Plus className="mr-2 h-4 w-4" /> Create New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const name = generateUntitledName(
                    CANVAS_TYPE.HYBRID,
                    currentFolder.canvases || []
                  );
                  const folderIdToUse = folderId === "root" ? null : folderId;
                  handleCreateCanvas(
                    name,
                    "",
                    CANVAS_TYPE.HYBRID,
                    folderIdToUse
                  );
                }}
              >
                <File className="mr-2 h-4 w-4" />
                New Canvas
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const name = generateUntitledName(
                    CANVAS_TYPE.TABLE,
                    currentFolder.canvases || []
                  );
                  const folderIdToUse = folderId === "root" ? null : folderId;
                  handleCreateCanvas(
                    name,
                    "",
                    CANVAS_TYPE.TABLE,
                    folderIdToUse
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
                    currentFolder.canvases || []
                  );
                  const folderIdToUse = folderId === "root" ? null : folderId;
                  handleCreateCanvas(
                    name,
                    "",
                    CANVAS_TYPE.DOCUMENT,
                    folderIdToUse
                  );
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                New Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateNewModalType("canvas")}>
                <Plus className="mr-2 h-4 w-4" />
                Create with Details...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Files Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Files</h2>
        </div>
      </div>

      {/* Scrollable Files Grid */}
      <ScrollArea className="flex-grow p-6 pt-0">
        {filteredCanvases.length === 0 ? getEmptyState() : renderFileGrid()}
      </ScrollArea>

      <CreateNewModal
        isOpen={Boolean(createNewModalType)}
        onClose={() => setCreateNewModalType(null)}
        onCreateFolder={() => {}} // Not used in folder view
        onCreateCanvas={handleCreateCanvas}
        folders={folders}
        type={createNewModalType}
        currentFolderId={folderId === "root" ? null : folderId}
        rootCanvases={folderId === "root" ? rootCanvases : []}
      />
    </div>
  );
}
