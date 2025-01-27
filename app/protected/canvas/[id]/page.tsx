"use client";

import Canvas from "@/components/canvas";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import useCanvas from "@/hooks/use-canvas";
import { ArrowRight, Check, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
  const {
    handleTitleChange,
    loading,
    canvasTitle,
    setCanvasTitle,
    isEditing,
    setIsEditing,
  } = useCanvas();

  const router = useRouter();

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="hover:bg-gray-100 p-2 rounded-full"
              onClick={() => router.back()}
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={canvasTitle}
                    onChange={(e) => setCanvasTitle(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                    onBlur={() => handleTitleChange(canvasTitle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTitleChange(canvasTitle);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleTitleChange(canvasTitle)}
                    className="hover:bg-gray-100 p-2 rounded-full"
                  >
                    <Check className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {canvasTitle}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-gray-100 p-2 rounded-full"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {loading ? <LoadingSpinner /> : <Canvas />}
    </div>
  );
}
