"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CanvasParams {
  canvasId: number;
  isValid: boolean;
}

function useCanvasParams(): CanvasParams {
  const params = useParams();

  return useMemo(() => {
    const id = params?.id;
    const parsedId = typeof id === "string" ? parseInt(id) : null;

    return {
      canvasId: parsedId || 0,
      isValid: !isNaN(parsedId as number) && Number(parsedId) > 0,
    };
  }, [params]);
}

export default useCanvasParams;
