"use client";

import { HeaderSidebar } from "@/components/header-dashboard";

import { UserSidebar } from "@/components/dashboard-sidebar/user-sidebar";
import { DashboardNavMenu } from "../../components/dashboard/dashboard-nav-menu";
import { DiagramsSection } from "../../components/dashboard/diagrams-section";
import { RecentDocuments } from "../../components/dashboard/recent-documents";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen  w-screen">
      <HeaderSidebar />

      <div className="flex flex-1 overflow-hidden">
        <UserSidebar
          onCanvasNameChange={() => {
            console.log("---- name change requested ----");
          }}
        />

        <main className="flex-grow overflow-auto">
          {/* <DashboardNavMenu /> */}
          <DiagramsSection />
          <RecentDocuments />
        </main>
      </div>
    </div>
  );
}
