"use client";

import { useState, useEffect } from "react";
import { CreateNewModal } from "../dashboard-sidebar/create-new-modal";

interface SidebarDashboardProps {
  onCanvasNameChange: (canvasId: string, newName: string) => void;
  onFolderNameChange: (folderId: string, newName: string) => void;
  folders: {
    id: string;
    name: string;
    canvases: { id: string; name: string; description: string }[];
  }[];
  setFolders: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        name: string;
        canvases: { id: string; name: string; description: string }[];
      }[]
    >
  >;
}

export function SidebarDashboard({
  onCanvasNameChange,
  onFolderNameChange,
  folders,
  setFolders,
}: SidebarDashboardProps) {
  const [isCreateNewModalOpen, setIsCreateNewModalOpen] = useState(false);

  useEffect(() => {
    // Load folders from localStorage on component mount
    const savedFolders = localStorage.getItem("savedFolders");
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }
  }, []);

  const handleCreateFolder = (name: string) => {
    if (name.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: name.trim(),
        canvases: [],
      };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      localStorage.setItem("savedFolders", JSON.stringify(updatedFolders));
    }
  };

  const handleCreateCanvas = (
    name: string,
    description: string,
    folderId: string | null
  ) => {
    const newCanvas = { id: Date.now().toString(), name, description };
    let updatedFolders;

    if (folderId && folderId !== "0") {
      const targetFolder = folders.find((folder) => folder.id === folderId);
      if (
        targetFolder &&
        targetFolder.canvases.some((canvas) => canvas.name === name)
      ) {
        // Canvas with the same name already exists in this folder
        return false;
      }

      updatedFolders = folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            canvases: [...folder.canvases, newCanvas],
          };
        }
        return folder;
      });
    } else {
      // If no folder is selected or "0" is selected, create a new "root" canvas
      if (
        folders.some(
          (folder) =>
            folder.name === "Root" &&
            folder.canvases.some((canvas) => canvas.name === name)
        )
      ) {
        return false;
      }
      const rootFolder = folders.find((folder) => folder.name === "Root");
      if (rootFolder) {
        updatedFolders = folders.map((folder) =>
          folder.name === "Root"
            ? { ...folder, canvases: [...folder.canvases, newCanvas] }
            : folder
        );
      } else {
        updatedFolders = [
          ...folders,
          { id: Date.now().toString(), name: "Root", canvases: [newCanvas] },
        ];
      }
    }
    setFolders(updatedFolders);
    localStorage.setItem("savedFolders", JSON.stringify(updatedFolders));
    onCanvasNameChange(newCanvas.id, name);
    return true;
  };

  return (
    <>
      <CreateNewModal
        isOpen={isCreateNewModalOpen}
        onClose={() => setIsCreateNewModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        onCreateCanvas={handleCreateCanvas}
        folders={folders}
        onCanvasNameChange={() => {
          console.log("onCanvasNameChange");
        }}
      />
    </>
  );
}
