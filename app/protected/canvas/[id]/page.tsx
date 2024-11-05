"use client";

import Canvas from "@/components/canvas";
import { InitialCanvasData } from "@/components/canvas/FlowTable/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Canvas as CanvasType } from "@prisma/client";

import { ArrowRight, Check, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";

export default function Page({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("My Canvas");
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [canvasDetails, setCanvasDetails] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const { toast } = useToast();

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    setIsEditing(false);

    if (canvasId) {
      // Update existing canvas title
      const { error } = await supabase
        .from("canvas")
        .update({ name: newTitle })
        .eq("id", params.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update canvas title",
          variant: "destructive",
        });
      }
    }
  };

  const fetchCanvasDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("canvas")
      .select("*")
      .eq("id", params.id)
      .single();
    console.log("🚀 ~ fetchCanvasDetails ~ data:", data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch canvas data",
        variant: "destructive",
      });
      router.back();
    }

    if (data) {
      setTitle(data.name);
      setCanvasId(data.id);
      setCanvasDetails(data);
    }
    setLoading(false);
  };

  const handleFlowDataChange = async (data: InitialCanvasData) => {
    const { error } = await supabase
      .from("canvas")
      .update({
        flow_data: data,
      })
      .eq("id", params.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save the changes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "success",
        description: "Changes saved successfully",
      });
    }
  };

  // fetch canvas data
  useEffect(() => {
    fetchCanvasDetails();
  }, [params.id]);

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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                    onBlur={() => handleTitleChange(title)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTitleChange(title);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleTitleChange(title)}
                    className="hover:bg-gray-100 p-2 rounded-full"
                  >
                    <Check className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title}
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
      <ReactFlowProvider>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Canvas
            onCanvasSave={handleFlowDataChange}
            initialData={canvasDetails?.flow_data || {}}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
}
