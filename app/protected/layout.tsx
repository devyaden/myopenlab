"use client";

import LayoutWrapper from "@/components/onboarding/layout-wrapper";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/command-palette/CommandPalette";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper>
      <SidebarProvider>{children}</SidebarProvider>
      {/* Global Cmd/Ctrl+K command palette — available on every protected surface. */}
      <CommandPalette />
    </LayoutWrapper>
  );
}
