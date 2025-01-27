"use client";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider suppressHydrationWarning>{children}</SidebarProvider>;
}
