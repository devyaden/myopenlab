"use client";

import {
  CANVAS_TYPE,
  CreateNewModal,
} from "@/components/dashboard-sidebar/create-new-modal";
import { useOnboarding } from "@/components/onboarding/custom-tooltip";
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
import { getUserFeatureLimits, SubscriptionFeatureFlag } from "@/lib/subscription-features";
import { supabase } from "@/lib/supabase/client";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/lib/contexts/userContext";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { generateUntitledName } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  File,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

interface FolderContentProps {
  folderId: string;
}

interface Canvas {
  id: string;
  name: string;
  canvas_type: CANVAS_TYPE;
}

interface EditDialogState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  item: { id: string; type: "canvas" } | null;
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

// Enhanced folder management hook with comprehensive loading states
const useFolderManagement = (folderId: string, user: any) => {
  const {
    folders,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    getFolders,
    fetchRootCanvases,
    rootCanvases,
    isLoading,
    canvasLoading,
    folderLoading,
    error,
  } = useSidebarStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const currentFolder = useMemo(() => {
    if (folderId === "root") {
      return {
        id: "root",
        name: "Root",
        canvases: rootCanvases || [],
        is_root: true,
      };
    }
    return folders.find((f) => f.id === folderId) || null;
  }, [folders, folderId, rootCanvases]);

  const refreshData = useCallback(async () => {
    if (user) {
      try {
        if (folderId === "root") {
          await fetchRootCanvases(user.id);
        } else {
          await getFolders(user.id);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  }, [user, folderId, fetchRootCanvases, getFolders]);

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

  // Reset when folder changes
  useEffect(() => {
    setHasInitialized(false);
  }, [folderId]);

  return {
    currentFolder,
    isLoading: initialLoading || isLoading,
    canvasLoading,
    folderLoading,
    error,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    refreshData,
    hasInitialized,
  };
};

// Skeleton loader for cards
const SkeletonCard = memo(() => (
  <Card className="p-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center flex-1">
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        <div className="ml-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </div>
  </Card>
));

SkeletonCard.displayName = "SkeletonCard";

// Skeleton grid component
const SkeletonGrid = memo(({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
));

SkeletonGrid.displayName = "SkeletonGrid";

// Enhanced Canvas Card with all loading states
const CanvasCard = memo(
  ({
    canvas,
    onEdit,
    onDelete,
    isDeleting = false,
    isUpdating = false,
    className = "",
  }: {
    canvas: Canvas;
    onEdit: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
    className?: string;
  }) => {
    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDeleting && !isUpdating) {
          onEdit(canvas.id, canvas.name);
        }
      },
      [canvas.id, canvas.name, onEdit, isDeleting, isUpdating]
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDeleting && !isUpdating) {
          onDelete(canvas.id);
        }
      },
      [canvas.id, onDelete, isDeleting, isUpdating]
    );

    const href = useMemo(() => {
      return canvas.canvas_type === CANVAS_TYPE.DOCUMENT
        ? `/protected/document-editor/${canvas.id}`
        : `/protected/canvas-new/${canvas.id}`;
    }, [canvas.id, canvas.canvas_type]);

    const iconBgColor = useMemo(() => {
      switch (canvas.canvas_type) {
        case CANVAS_TYPE.DOCUMENT:
          return "bg-yadn-accent-blue";
        case CANVAS_TYPE.TABLE:
          return "bg-yadn-accent-dark-orange";
        default:
          return "bg-yadn-accent-pink";
      }
    }, [canvas.canvas_type]);

    const typeLabel = useMemo(() => {
      switch (canvas.canvas_type) {
        case CANVAS_TYPE.DOCUMENT:
          return "Document";
        case CANVAS_TYPE.TABLE:
          return "Table";
        default:
          return "Canvas";
      }
    }, [canvas.canvas_type]);

    const isDisabled = isDeleting || isUpdating;

    return (
      <div
        className={`transition-all duration-200 ${
          isDeleting ? "opacity-50 scale-95" : ""
        } ${isUpdating ? "opacity-75" : ""} ${className}`}
      >
        <Link href={href} className={isDisabled ? "pointer-events-none" : ""}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group onboarding-file-actions">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBgColor}`}
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
                    {canvas.name}
                    {isUpdating && (
                      <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">{typeLabel}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                    disabled={isDisabled}
                  >
                    {isDeleting || isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
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
          </Card>
        </Link>
      </div>
    );
  }
);

CanvasCard.displayName = "CanvasCard";

// Error state component
const ErrorState = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
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
    onCreateNew,
    isSearching = false,
    searchQuery = "",
  }: {
    onCreateNew: () => void;
    isSearching?: boolean;
    searchQuery?: string;
  }) => (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
      <p className="text-gray-500">
        {isSearching
          ? `No files found matching "${searchQuery}"`
          : "No files found in this folder"}
      </p>
      {!isSearching && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onCreateNew}
        >
          <Plus className="mr-1 h-4 w-4" /> Create New
        </Button>
      )}
    </div>
  )
);

EmptyState.displayName = "EmptyState";

// Loading overlay for operations
const LoadingOverlay = memo(({ message }: { message: string }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
    <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-lg shadow-lg border">
      <Loader2 className="h-5 w-5 animate-spin text-yadn-accent-green" />
      <span className="text-gray-700 font-medium">{message}</span>
    </div>
  </div>
));

LoadingOverlay.displayName = "LoadingOverlay";

export const FolderContent = memo(({ folderId }: FolderContentProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { trackCreate, trackSearch } = useOnboarding();

  // Local state management
  const [searchQuery, setSearchQuery] = useState("");
  const [createNewModalType, setCreateNewModalType] = useState<
    "folder" | "canvas" | null
  >(null);
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    isOpen: false,
    itemId: null,
    itemName: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    item: null,
  });

  // Track operation states for visual feedback
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [operationError, setOperationError] = useState<string | null>(null);

  // Custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    currentFolder,
    isLoading,
    canvasLoading,
    folderLoading,
    error,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    refreshData,
    hasInitialized,
  } = useFolderManagement(folderId, user);

  // Get canvases from current folder
  const allCanvases = useMemo(() => {
    return currentFolder?.canvases || [];
  }, [currentFolder?.canvases]);

  // Filtered canvases with memoization
  const filteredCanvases = useMemo(() => {
    if (!debouncedSearchQuery) return allCanvases;
    return allCanvases.filter((canvas: Canvas) =>
      canvas.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [allCanvases, debouncedSearchQuery]);

  // Event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setOperationError(null);

      // Track search action for smart suggestions
      if (e.target.value.length > 2) {
        trackSearch();
      }
    },
    [trackSearch]
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleBackNavigation = useCallback(() => {
    router.push("/protected");
  }, [router]);

  const handleCreateCanvas = useCallback(
    async (
      name: string,
      description: string,
      type: CANVAS_TYPE,
      _folderId: string | null
    ) => {
      const folderIdToUse = folderId === "root" ? null : folderId;
      setOperationError(null);

      // Check diagram limit
      if (user?.id) {
        const limits = await getUserFeatureLimits(user.id);
        const maxDiagrams = limits[SubscriptionFeatureFlag.MAX_DIAGRAMS];

        // Get total diagrams count
        const { count } = await supabase
          .from("canvas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count !== null && count >= maxDiagrams) {
          setOperationError(`You've reached your limit of ${maxDiagrams} diagram(s). Upgrade to create more.`);
          setCreateNewModalType(null);
          router.push("/pricing");
          return false;
        }
      }

      try {
        const canvasId = await createCanvas(
          name,
          description,
          user?.id as string,
          folderIdToUse as string,
          type
        );

        trackCreate(); // Track for smart suggestions

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
      return true;
    },
    [folderId, createCanvas, user?.id, trackCreate, router]
  );

  const handleQuickCreate = useCallback(
    (type: CANVAS_TYPE) => {
      const name = generateUntitledName(type, allCanvases || []);
      const folderIdToUse = folderId === "root" ? null : folderId;
      trackCreate(); // Track quick creation
      handleCreateCanvas(name, "", type, folderIdToUse);
    },
    [allCanvases, folderId, handleCreateCanvas, trackCreate]
  );

  const handleEdit = useCallback((id: string, name: string) => {
    setEditDialog({
      isOpen: true,
      itemId: id,
      itemName: name,
    });
    setOperationError(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteDialog({
      isOpen: true,
      item: { id, type: "canvas" },
    });
    setOperationError(null);
  }, []);

  const confirmEdit = useCallback(async () => {
    if (editDialog.itemId && editDialog.itemName.trim()) {
      setUpdatingItems((prev) => new Set(prev).add(editDialog.itemId!));
      setOperationError(null);

      try {
        await updateCanvas(editDialog.itemId, editDialog.itemName.trim());
        await refreshData();
      } catch (error) {
        console.error("Failed to update canvas:", error);
        setOperationError("Failed to update canvas. Please try again.");
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
    });
  }, [editDialog.itemId, editDialog.itemName, updateCanvas, refreshData]);

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.item) {
      const itemId = deleteDialog.item.id;

      setDeletingItems((prev) => new Set(prev).add(itemId));
      setOperationError(null);

      setDeleteDialog({
        isOpen: false,
        item: null,
      });

      try {
        await deleteCanvas(itemId);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete canvas:", error);
        setOperationError("Failed to delete canvas. Please try again.");
      } finally {
        setDeletingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  }, [deleteDialog.item, deleteCanvas, refreshData]);

  const handleEditDialogClose = useCallback(() => {
    setEditDialog({
      isOpen: false,
      itemId: null,
      itemName: "",
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

  // Render helpers
  const renderCreateDropdown = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-yadn-accent-green hover:bg-yadn-accent-green/80 text-white onboarding-create-dropdown"
            disabled={canvasLoading}
          >
            {canvasLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleQuickCreate(CANVAS_TYPE.HYBRID)}
            disabled={canvasLoading}
            className="onboarding-canvas-option"
          >
            <File className="mr-2 h-4 w-4" />
            New Canvas
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickCreate(CANVAS_TYPE.TABLE)}
            disabled={canvasLoading}
            className="onboarding-table-option"
          >
            <FileText className="mr-2 h-4 w-4" />
            New Table
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickCreate(CANVAS_TYPE.DOCUMENT)}
            disabled={canvasLoading}
            className="onboarding-document-option"
          >
            <FileText className="mr-2 h-4 w-4" />
            New Document
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateNewModalType("canvas")}
            disabled={canvasLoading}
            className="onboarding-ai-option"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create with AI...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [canvasLoading, handleQuickCreate]
  );

  const renderContent = useMemo(() => {
    // Show error state if there's a persistent error
    if (error && hasInitialized) {
      return <ErrorState error={error} onRetry={handleRetryOperation} />;
    }

    // Show skeleton loading during initial load
    if (isLoading && !hasInitialized) {
      return <SkeletonGrid count={8} />;
    }

    // Show empty state
    if (filteredCanvases.length === 0) {
      return (
        <EmptyState
          onCreateNew={() => setCreateNewModalType("canvas")}
          isSearching={!!searchQuery}
          searchQuery={searchQuery}
        />
      );
    }

    // Show file grid
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCanvases.map((canvas: Canvas, index: number) => (
          <CanvasCard
            key={canvas.id}
            canvas={canvas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingItems.has(canvas.id)}
            isUpdating={updatingItems.has(canvas.id)}
            className={index === 0 ? "onboarding-file-card" : ""}
          />
        ))}
      </div>
    );
  }, [
    error,
    hasInitialized,
    isLoading,
    filteredCanvases,
    searchQuery,
    handleEdit,
    handleDelete,
    deletingItems,
    updatingItems,
    handleRetryOperation,
  ]);

  // Show initial loading for the entire component
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
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
      {folderLoading && <LoadingOverlay message="Updating folder..." />}

      <div className="p-6 flex-shrink-0 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4 onboarding-back-nav"
              onClick={handleBackNavigation}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">
              {isLoading && !hasInitialized ? (
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              ) : (
                currentFolder?.name || "Loading..."
              )}
            </h1>
          </div>

          <div className="relative w-full max-w-xl mx-auto px-4">
            <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search files in this folder..."
              className="pl-10 pr-10 h-12 rounded-lg border-gray-200 onboarding-folder-search"
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={isLoading && !hasInitialized}
            />
            {searchQuery && (
              <button
                onClick={handleSearchClear}
                className="absolute right-7 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {renderCreateDropdown}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Files</h2>
          {isLoading && hasInitialized && (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-grow p-6 pt-0">{renderContent}</ScrollArea>

      <CreateNewModal
        isOpen={Boolean(createNewModalType)}
        onClose={() => setCreateNewModalType(null)}
        onCreateFolder={() => {}}
        // @ts-ignore
        onCreateCanvas={handleCreateCanvas}
        folders={[]}
        type={createNewModalType}
        currentFolderId={folderId === "root" ? null : folderId}
        rootCanvases={folderId === "root" ? allCanvases : []}
      />

      <Dialog open={editDialog.isOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit File Name</DialogTitle>
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
              Are you sure you want to delete this file?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently
              deleted.
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

FolderContent.displayName = "FolderContent";
