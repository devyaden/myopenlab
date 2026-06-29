"use client";

import { useCallback, useEffect, useState } from "react";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { subscribeLibraryRefresh } from "@/lib/realtime/library-refresh";

/**
 * Loads + live-refreshes the workspace library (folders + uncategorized canvases)
 * for the Library and Collection surfaces. Extracted from the old HomeContent so
 * both can share one source of truth. Live-refreshes on `subscribeLibraryRefresh`
 * (e.g. when the agent creates an artifact) since the store caches are otherwise
 * never invalidated.
 */
export function useHomeManagement(user: any) {
  const {
    folders,
    rootCanvases,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    moveCanvas,
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
      } catch (e) {
        console.error("Error refreshing data:", e);
      }
    }
  }, [user, getFolders, fetchRootCanvases]);

  useEffect(() => {
    const init = async () => {
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
    init();
  }, [user, refreshData, hasInitialized]);

  useEffect(() => {
    if (!user) return;
    return subscribeLibraryRefresh(() => {
      void refreshData();
    });
  }, [user, refreshData]);

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
    moveCanvas,
    refreshData,
    hasInitialized,
  };
}
