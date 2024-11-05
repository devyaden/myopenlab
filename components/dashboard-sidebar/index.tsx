// components/Sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useUser } from "@/lib/contexts/userContext";
import { createClient } from "@/utils/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown, FileText, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import CreateFolderButton from "./create-folder-button";
import CreateCanvasButton from "./create-canvas-button";
import { useRouter } from "next/navigation";

interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({
  size = 24,
  className,
  ...props
}: ISVGProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

interface Folder {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

interface Canvas {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_edited: string;
  flow_data: {
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  };
  is_published: boolean;
  user_id: number;
  folder_id: number;
}

interface CanvasMap {
  [key: number]: Canvas[];
}

interface LoadingState {
  [key: number]: boolean;
}

export const SidebarDashboard = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [canvases, setCanvases] = useState<CanvasMap>({});

  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [canvasesLoading, setCanvasesLoading] = useState<LoadingState>({});

  const router = useRouter();

  const supabase = createClient();
  const { user } = useUser();
  const userId = user?.id;

  const fetchFolders = async () => {
    setIsFoldersLoading(true);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFolders(data);
        // Initialize loading states for each folder's canvases
        const loadingStates: LoadingState = {};
        data.forEach((folder) => {
          loadingStates[folder.id] = true;
          fetchCanvases(folder.id);
        });
        setCanvasesLoading(loadingStates);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setIsFoldersLoading(false);
    }
  };

  const fetchCanvases = async (folderId: number) => {
    setCanvasesLoading((prev) => ({ ...prev, [folderId]: true }));
    try {
      const { data, error } = await supabase
        .from("canvas")
        .select("*")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCanvases((prev) => ({
          ...prev,
          [folderId]: data,
        }));
      }
    } catch (error) {
      console.error(`Error fetching canvases for folder ${folderId}:`, error);
    } finally {
      setCanvasesLoading((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [userId]);

  if (isFoldersLoading) {
    return (
      <Sidebar side="right">
        <SidebarHeader className="pt-4 md:pt-24 flex justify-center items-center">
          <LoadingSpinner size={32} className="text-gray-400" />
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar side="right">
      <SidebarHeader className="pt-4 md:pt-24">
        <CreateFolderButton userId={userId} onFolderCreated={fetchFolders} />
        {folders.map((folder) => (
          <Collapsible
            key={folder.id}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full">
                  <div className="w-full text-lg flex items-center text-black">
                    <Folder className="ml-4 h-4 w-4" />
                    <span>{folder.name}</span>
                  </div>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 text-black" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <CreateCanvasButton
                      folderId={folder.id}
                      userId={userId || ""}
                      onCanvasCreated={() => fetchCanvases(folder.id)}
                    />
                    {canvasesLoading[folder.id] ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size={24} className="text-gray-400" />
                      </div>
                    ) : (
                      canvases[folder.id]?.map((canvas) => (
                        <SidebarMenuSubItem
                          key={canvas.id}
                          className=" cursor-pointer"
                          onClick={() =>
                            router.push(`/protected/canvas/${canvas.id}`)
                          }
                        >
                          <SidebarMenuSubButton>
                            <FileText className="ml-2 h-4 w-4" />
                            {canvas.name}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    )}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarHeader>
    </Sidebar>
  );
};
