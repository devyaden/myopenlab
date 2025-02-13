"use client";

import { HeaderSidebar } from "@/components/header-dashboard";

import { SidebarDashboard } from "@/components/dashboard-sidebar";
import { DashboardNavMenu } from "./dashboard-nav-menu";
import { DiagramsSection } from "./diagrams-section";
import { RecentDocuments } from "./recent-documents";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen  w-screen">
      <HeaderSidebar />

      <div className="flex flex-1 overflow-hidden">
        <SidebarDashboard
          onCanvasNameChange={() => {
            console.log("---- name change requested ----");
          }}
        />

        <main className="flex-grow overflow-auto">
          <DashboardNavMenu />
          <DiagramsSection />
          <RecentDocuments />
        </main>
      </div>
    </div>
  );
}
