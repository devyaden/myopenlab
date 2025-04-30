import React, { useState } from "react";
import { createCanvas, fetchRootCanvases } from "../services/canvasService";
import { CANVAS_TYPE } from "../constants/canvasType";

interface DashboardContextProps {
  aiGeneratedData: any;
  setAIGeneratedData: (data: any) => void;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [aiGeneratedData, setAIGeneratedData] = useState<any>(null);

  const handleCreateCanvas = (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    folderId?: string | null
  ) => {
    return createCanvas(
      name,
      description,
      user?.id as string,
      folderId as string,
      type
    ).then((canvasId) => {
      if (!folderId) {
        fetchRootCanvases(user?.id);
      }

      if (aiGeneratedData && canvasId) {
        localStorage.setItem(
          `ai-data-${canvasId}`,
          JSON.stringify(aiGeneratedData)
        );
        setAIGeneratedData(null);
      }

      if (
        canvasId &&
        (type === CANVAS_TYPE.HYBRID || type === CANVAS_TYPE.TABLE)
      ) {
        window.location.href = `/protected/canvas-new/${canvasId}`;
      } else if (canvasId && type === CANVAS_TYPE.DOCUMENT) {
        window.location.href = `/protected/document-editor/${canvasId}`;
      }

      return true;
    });
  };

  const contextValue: DashboardContextProps = {
    aiGeneratedData,
    setAIGeneratedData,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
