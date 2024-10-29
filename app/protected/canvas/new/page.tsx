"use client";

import Canvas from "@/components/canvas";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Check, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";

export default function Page() {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("My Canvas");
  const [userId, setUserId] = useState<string | null>(null);
  console.log("🚀 ~ Page ~ userId:", userId);
  const [canvasId, setCanvasId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to get user information",
          variant: "destructive",
        });

        await supabase.auth.signOut();
        return;
      }
      setUserId(user?.id || null);
    };

    getCurrentUser();
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    setIsEditing(false);

    if (canvasId) {
      // Update existing canvas title
      const { error } = await supabase
        .from("canvas")
        .update({ name: newTitle })
        .eq("id", canvasId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update canvas title",
          variant: "destructive",
        });
      }
    }
  };

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
        <Canvas
          userId={userId}
          title={title}
          onCanvasCreated={(id) => setCanvasId(id)}
        />
      </ReactFlowProvider>
    </div>
  );
}
