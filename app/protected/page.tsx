"use client";

import { HeaderSidebar } from "@/components/header-dashboard";

import { SidebarDashboard } from "@/components/dashboard-sidebar";
import { useEffect, useState } from "react";
import { DashboardNavMenu } from "./dashboard-nav-menu";
import { DiagramsSection } from "./diagrams-section";
import { RecentDocuments } from "./recent-documents";

export default function Dashboard() {
  const [recentlyOpened, setRecentlyOpened] = useState<any>([]);

  const fetchRecentlyOpened = async () => {
    const recentlyOpened = localStorage.getItem("recentlyOpenedCanvases");
    if (!recentlyOpened) return;
    setRecentlyOpened(JSON.parse(recentlyOpened));
  };

  useEffect(() => {
    fetchRecentlyOpened();
  }, []);

  return (
    <div className="flex flex-col h-screen  w-screen">
      <HeaderSidebar />

      <div className="flex flex-1 overflow-hidden">
        <SidebarDashboard />
        {/* <SidebarDashboard /> */}

        <main className="flex-grow overflow-auto">
          <DashboardNavMenu />
          <DiagramsSection />
          <RecentDocuments />
        </main>
      </div>
    </div>
  );
}
