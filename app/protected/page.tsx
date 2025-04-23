"use client";

import { HeaderSidebar } from "@/components/header-dashboard";
import { UserSidebar } from "@/components/dashboard-sidebar/user-sidebar";
import { DiagramsSection } from "../../components/dashboard/diagrams-section";
import { RecentDocuments } from "../../components/dashboard/recent-documents";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">
        <HeaderSidebar />

        <div className="flex flex-1 overflow-hidden">
          <UserSidebar />

          <main className="flex-grow overflow-auto h-full">
            {/* <DashboardNavMenu /> */}
            {/* <DiagramsSection /> */}
            <RecentDocuments />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
