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
import { Card } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/lib/contexts/userContext";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useSidebarStore } from "@/lib/store/useSidebar";
import {
  Edit,
  Folder,
  MoreVertical,
  Plus,
  Search,
  Trash,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import Joyride from "react-joyride";
import CustomJoyrideTooltip from "../CustomJoyrideTooltip";

interface EditDialogState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string;
  itemType: "folder" | "canvas" | null;
}

interface DeleteDialogState {
  isOpen: boolean;
  item: { id: string; type: "folder" | "canvas" } | null;
}

interface Folder {
  id: string;
  name: string;
  canvases?: any[];
}

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Enhanced home management hook
const useHomeManagement = (user: any) => {
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
    isLoading,
    folderLoading,
    canvasLoading,
    error,
  } = useSidebarStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const refreshData = useCallback(async () => {
    if (user) {
      try {
        await Promise.all([getFolders(user.id), fetchRootCanvases(user.id)]);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  }, [user, getFolders, fetchRootCanvases]);

  // Handle initial loading state
  useEffect(() => {
    const initializeData = async () => {
      if (user && !hasInitialized) {
        setInitialLoading(true);
        try {
          await refreshData();
        } finally {
          setInitialLoading(false);
          setHasInitialized(true);
        }
      }
    };

    initializeData();
  }, [user, refreshData, hasInitialized]);

  return {
    folders,
    rootCanvases,
    isLoading: initialLoading || isLoading,
    folderLoading,
    canvasLoading,
    error,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    refreshData,
    hasInitialized,
  };
};

// Skeleton loader for folder cards - fixed size and no animation
const SkeletonFolderCard = memo(() => (
  <div className="h-28 w-28">
    <Card className="p-3 h-full w-full">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="h-10 w-10 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </Card>
  </div>
));

SkeletonFolderCard.displayName = "SkeletonFolderCard";

// Skeleton grid for folders - matches exact real layout
const SkeletonFolderGrid = memo(() => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-6">
    {/* Root folder skeleton */}
    <div className="h-28 w-28">
      <Card className="p-3 border-2 border-dashed border-gray-200 h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="h-10 w-10 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-10"></div>
        </div>
      </Card>
    </div>

    {/* Regular folder skeletons */}
    {Array.from({ length: 8 }).map((_, index) => (
      <SkeletonFolderCard key={index} />
    ))}

    {/* New folder button skeleton */}
    <div className="h-28 w-28">
      <div className="flex flex-col text-sm w-full h-full border border-gray-200 rounded-lg items-center justify-center">
        <div className="h-5 w-5 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
));

SkeletonFolderGrid.displayName = "SkeletonFolderGrid";

// Enhanced Folder Card with operation states
const FolderCard = memo(
  ({
    folder,
    onEdit,
    onDelete,
    isDeleting = false,
    isUpdating = false,
  }: {
    folder: Folder;
    onEdit: (id: string, name: string, type: "folder") => void;
    onDelete: (id: string, type: "folder") => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
  }) => {
    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDeleting && !isUpdating) {
          onEdit(folder.id, folder.name, "folder");
        }
      },
      [folder.id, folder.name, onEdit, isDeleting, isUpdating]
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDeleting && !isUpdating) {
          onDelete(folder.id, "folder");
        }
      },
      [folder.id, onDelete, isDeleting, isUpdating]
    );

    const isDisabled = isDeleting || isUpdating;

    return (
      <div
        className={`transition-all duration-200 ${
          isDeleting ? "opacity-50 scale-95" : ""
        } ${isUpdating ? "opacity-75" : ""}`}
      >
        <Link
          href={`/protected/folder/${folder.id}`}
          className={isDisabled ? "pointer-events-none" : ""}
        >
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group h-28 w-28 relative">
            <div className="absolute top-1 right-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                    disabled={isDisabled}
                  >
                    {isDeleting || isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MoreVertical className="h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit} disabled={isDisabled}>
                    <Edit className="mr-2 h-4 w-4" />
                    {isUpdating ? "Updating..." : "Edit"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDisabled}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col items-center justify-center h-full">
              <Folder className="h-10 w-10 text-yadn-accent-dark-orange mb-1" />
              <h3 className="font-medium text-gray-900 truncate max-w-[90px] text-center text-sm">
                {folder.name}
                {isUpdating && (
                  <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {folder.canvases?.length || 0} items
              </p>
            </div>
          </Card>
        </Link>
      </div>
    );
  }
);

FolderCard.displayName = "FolderCard";

// Root folder card component
const RootFolderCard = memo(({ rootCanvases }: { rootCanvases: any[] }) => (
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
));

RootFolderCard.displayName = "RootFolderCard";

// Error state component
const ErrorState = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200 col-span-full">
      <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-red-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-red-700 mb-4">{error}</p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        Try Again
      </Button>
    </div>
  )
);

ErrorState.displayName = "ErrorState";

// Enhanced Empty State
const EmptyState = memo(
  ({
    isSearching,
    searchQuery,
    onCreateFolder,
  }: {
    isSearching: boolean;
    searchQuery: string;
    onCreateFolder: () => void;
  }) => (
    <div className="text-center py-8 bg-gray-50 rounded-lg col-span-full">
      <Folder className="mx-auto h-12 w-12 text-gray-300 mb-2" />
      <p className="text-gray-500">
        {isSearching
          ? `No folders found matching "${searchQuery}"`
          : "No folders found"}
      </p>
      {!isSearching && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onCreateFolder}
        >
          <Plus className="mr-1 h-4 w-4" /> Create Your First Folder
        </Button>
      )}
    </div>
  )
);

EmptyState.displayName = "EmptyState";

// Loading overlay component
const LoadingOverlay = memo(({ message }: { message: string }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
    <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-lg shadow-lg border">
      <Loader2 className="h-5 w-5 animate-spin text-yadn-accent-green" />
      <span className="text-gray-700 font-medium">{message}</span>
    </div>
  </div>
));

LoadingOverlay.displayName = "LoadingOverlay";

export const HomeContent = memo(() => {
  const { user } = useUser();
  const { protectedOnBording, isFirstVisit, setData, setIsChecked, isChecked } =
    useOnboardingStore();

  // Local state management
  const [searchQuery, setSearchQuery] = useState("");
  const [createNewModalType, setCreateNewModalType] = useState<
    "folder" | "canvas" | null
  >(null);
  const [currentFolderForCreate, setCurrentFolderForCreate] = useState<
    string | null
  >(null);
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    isOpen: false,
    itemId: null,
    itemName: "",
    itemType: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    item: null,
  });
  const [runTour, setRunTour] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Operation state tracking
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [operationError, setOperationError] = useState<string | null>(null);

  // Custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    folders,
    rootCanvases,
    isLoading,
    folderLoading,
    canvasLoading,
    error,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    refreshData,
    hasInitialized,
  } = useHomeManagement(user);

  // Onboarding configuration
  const onboardingSteps = useMemo(
    () => [
      {
        target: ".onboarding-create-button",
        content: "Click here to create a new folder!",
        disableBeacon: true,
      },
      {
        target: ".folderInput",
        content: "Write folder name!",
        disableBeacon: true,
      },
      {
        target: ".submit-create-folder",
        content: "By clicking on Create folder button it will create a folder!",
        disableBeacon: true,
      },
    ],
    []
  );

  const isHasSeenProtectedOnBording = useMemo(() => {
    if (!user?.has_seen_onboarding) {
      return !user?.has_seen_onboarding && protectedOnBording;
    }
    return user?.has_seen_onboarding && protectedOnBording;
  }, [user?.has_seen_onboarding, protectedOnBording]);

  // Initialize onboarding
  useEffect(() => {
    if (isFirstVisit && protectedOnBording) {
      setData(onboardingSteps);
    }

    const timeout = setTimeout(() => {
      setHasMounted(true);
      setRunTour(isFirstVisit);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isFirstVisit, protectedOnBording, onboardingSteps, setData]);

  // Filtered data with memoization
  const filteredFolders = useMemo(() => {
    if (!debouncedSearchQuery) return folders;
    return folders.filter((folder: Folder) =>
      folder.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [folders, debouncedSearchQuery]);

  const showRootFolder = useMemo(() => {
    return (
      debouncedSearchQuery === "" ||
      "root".includes(debouncedSearchQuery.toLowerCase())
    );
  }, [debouncedSearchQuery]);

  // Event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setOperationError(null);
    },
    []
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleDontShowAgainChange = useCallback(
    (e: any) => {
      setIsChecked(e.target?.checked);
    },
    [setIsChecked]
  );

  const handleJoyrideCllback = useCallback((data: any) => {
    const { action, index } = data;

    if (action === "next" && index === 0) {
      setCreateNewModalType("folder");
    }
  }, []);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (name.trim()) {
        setOperationError(null);
        try {
          await createFolder(name, user?.id as string);
          await refreshData();
        } catch (error) {
          console.error("Failed to create folder:", error);
          setOperationError("Failed to create folder. Please try again.");
        }
      }
      setCreateNewModalType(null);
    },
    [createFolder, user?.id, refreshData]
  );

  const handleCreateCanvas = useCallback(
    async (
      name: string,
      description: string,
      type: CANVAS_TYPE,
      folderId?: string | null
    ) => {
      setOperationError(null);

      try {
        const canvasId = await createCanvas(
          name,
          description,
          user?.id as string,
          folderId as string,
          type
        );

        if (!folderId) {
          await refreshData();
        }

        if (canvasId) {
          const href =
            type === CANVAS_TYPE.DOCUMENT
              ? `/protected/document-editor/${canvasId}`
              : `/protected/canvas-new/${canvasId}`;

          window.location.href = href;
        }
      } catch (error) {
        console.error("Failed to create canvas:", error);
        setOperationError("Failed to create canvas. Please try again.");
      }

      setCreateNewModalType(null);
      setCurrentFolderForCreate(null);
      return true;
    },
    [createCanvas, user?.id, refreshData]
  );

  const handleEdit = useCallback(
    (id: string, name: string, type: "folder" | "canvas") => {
      setEditDialog({
        isOpen: true,
        itemId: id,
        itemName: name,
        itemType: type,
      });
      setOperationError(null);
    },
    []
  );

  const handleDelete = useCallback((id: string, type: "folder" | "canvas") => {
    setDeleteDialog({
      isOpen: true,
      item: { id, type },
    });
    setOperationError(null);
  }, []);

  const confirmEdit = useCallback(async () => {
    if (editDialog.itemId && editDialog.itemName.trim()) {
      setUpdatingItems((prev) => new Set(prev).add(editDialog.itemId!));
      setOperationError(null);

      try {
        if (editDialog.itemType === "folder") {
          await updateFolder(editDialog.itemId, editDialog.itemName.trim());
        } else {
          await updateCanvas(editDialog.itemId, editDialog.itemName.trim());
        }
        await refreshData();
      } catch (error) {
        console.error("Failed to update item:", error);
        setOperationError(
          `Failed to update ${editDialog.itemType}. Please try again.`
        );
      } finally {
        setUpdatingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(editDialog.itemId!);
          return newSet;
        });
      }
    }

    setEditDialog({
      isOpen: false,
      itemId: null,
      itemName: "",
      itemType: null,
    });
  }, [editDialog, updateFolder, updateCanvas, refreshData]);

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.item) {
      const itemId = deleteDialog.item.id;
      const itemType = deleteDialog.item.type;

      setDeletingItems((prev) => new Set(prev).add(itemId));
      setOperationError(null);

      setDeleteDialog({
        isOpen: false,
        item: null,
      });

      try {
        if (itemType === "folder") {
          await deleteFolder(itemId);
        } else {
          await deleteCanvas(itemId);
        }
        await refreshData();
      } catch (error) {
        console.error("Failed to delete item:", error);
        setOperationError(`Failed to delete ${itemType}. Please try again.`);
      } finally {
        setDeletingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  }, [deleteDialog.item, deleteFolder, deleteCanvas, refreshData]);

  const handleEditDialogClose = useCallback(() => {
    setEditDialog({
      isOpen: false,
      itemId: null,
      itemName: "",
      itemType: null,
    });
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialog({
      isOpen: false,
      item: null,
    });
  }, []);

  const handleEditNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditDialog((prev) => ({
        ...prev,
        itemName: e.target.value,
      }));
    },
    []
  );

  const handleRetryOperation = useCallback(() => {
    setOperationError(null);
    refreshData();
  }, [refreshData]);

  // Render content based on state
  const renderContent = useMemo(() => {
    // Show error state if there's a persistent error
    if (error && hasInitialized) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-6">
          <ErrorState error={error} onRetry={handleRetryOperation} />
        </div>
      );
    }

    // Show skeleton loading during initial load
    if (isLoading && !hasInitialized) {
      return <SkeletonFolderGrid />;
    }

    const hasResults = showRootFolder || filteredFolders.length > 0;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-6">
        {/* Root Folder */}
        {showRootFolder && <RootFolderCard rootCanvases={rootCanvases} />}

        {/* Filtered Folders */}
        {filteredFolders.map((folder: Folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingItems.has(folder.id)}
            isUpdating={updatingItems.has(folder.id)}
          />
        ))}

        {/* New Folder Button */}
        <div className="h-28 w-28">
          <Button
            variant="ghost"
            className="flex flex-col text-sm w-full h-full border border-gray-200 rounded-lg onboarding-create-button"
            onClick={() => setCreateNewModalType("folder")}
            disabled={folderLoading}
          >
            {folderLoading ? (
              <Loader2 className="mb-1 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mb-1 h-5 w-5" />
            )}
            <span className="text-sm">New Folder</span>
          </Button>
        </div>

        {/* Empty State */}
        {!hasResults && !isLoading && (
          <EmptyState
            isSearching={!!debouncedSearchQuery}
            searchQuery={debouncedSearchQuery}
            onCreateFolder={() => setCreateNewModalType("folder")}
          />
        )}
      </div>
    );
  }, [
    error,
    hasInitialized,
    isLoading,
    showRootFolder,
    filteredFolders,
    rootCanvases,
    handleEdit,
    handleDelete,
    deletingItems,
    updatingItems,
    folderLoading,
    debouncedSearchQuery,
    handleRetryOperation,
  ]);

  // Show initial loading for the entire component
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 flex-shrink-0 bg-white">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
            <h1 className="text-2xl font-semibold md:w-1/4">Home</h1>
          </div>
        </div>
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Onboarding */}
      {hasMounted && isChecked && isHasSeenProtectedOnBording && (
        <Joyride
          steps={onboardingSteps}
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
              primaryColor: "#22c55e",
              zIndex: 10000,
            },
          }}
        />
      )}

      {/* Operation Error Toast */}
      {operationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{operationError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOperationError(null)}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay for folder operations */}
      {folderLoading && <LoadingOverlay message="Processing folders..." />}

      <div className="p-6 flex-shrink-0 bg-white">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          <h1 className="text-2xl font-semibold md:w-1/4">
            {isLoading && !hasInitialized ? (
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            ) : (
              "Home"
            )}
          </h1>
          <div className="flex justify-center items-center w-full md:w-2/4">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search folders and files..."
                className="pl-10 pr-10 h-12 rounded-lg border-gray-200"
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isLoading && !hasInitialized}
              />
              {searchQuery && (
                <button
                  onClick={handleSearchClear}
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
              disabled={canvasLoading}
            >
              {canvasLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create New
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-grow p-6 pt-0">{renderContent}</ScrollArea>

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
        rootCanvases={rootCanvases}
      />

      <Dialog open={editDialog.isOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editDialog.itemType === "folder" ? "Folder" : "File"} Name
            </DialogTitle>
          </DialogHeader>
          <Input
            value={editDialog.itemName}
            onChange={handleEditNameChange}
            placeholder="Enter new name"
            onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
            disabled={updatingItems.has(editDialog.itemId || "")}
          />
          <DialogFooter>
            <Button onClick={handleEditDialogClose}>Cancel</Button>
            <Button
              onClick={confirmEdit}
              disabled={
                !editDialog.itemName.trim() ||
                updatingItems.has(editDialog.itemId || "")
              }
            >
              {updatingItems.has(editDialog.itemId || "") ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={handleDeleteDialogClose}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this {deleteDialog.item?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.item?.type === "folder"
                ? "This will delete the folder and all files inside it."
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

HomeContent.displayName = "HomeContent";
