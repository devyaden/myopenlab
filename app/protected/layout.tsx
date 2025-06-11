"use client";

import LayoutWrapper from "@/components/onboarding/layout-wrapper";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper>
      <SidebarProvider>{children}</SidebarProvider>
    </LayoutWrapper>
  );
}
