"use client";

import { AdminSidebar } from "@/components/dashboard-sidebar/admin-sidebar";
import { HeaderSidebar } from "@/components/header-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen  w-screen">
        <HeaderSidebar />

        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />
          <main className="flex-grow overflow-auto p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
