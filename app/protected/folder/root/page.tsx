"use client";

import { FolderContent } from "@/components/dashboard/folder-content";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { HeaderSidebar } from "@/components/header-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";

export default function FolderPage() {
  const params = useParams();
  const folderId = params.id as string;

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">
        <HeaderSidebar />

        <div className="flex flex-1 overflow-hidden relative">
          <main className="h-full w-full overflow-hidden">
            <FolderContent folderId="root" />
          </main>

          <RecentDocuments />
        </div>
      </div>
    </SidebarProvider>
  );
}
