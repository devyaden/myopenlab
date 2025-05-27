"use client";

import { HomeContent } from "@/components/dashboard/home-content";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { HeaderSidebar } from "@/components/header-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRef } from "react";

export default function Dashboard() {
  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">
        <HeaderSidebar />

        <div className="flex flex-1 overflow-hidden relative">
          <main ref={mainRef} className="h-full overflow-hidden w-full">
            <HomeContent />
          </main>
          <RecentDocuments />
        </div>
      </div>
    </SidebarProvider>
  );
}
