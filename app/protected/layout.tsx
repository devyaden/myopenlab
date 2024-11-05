"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProvider } from "@/lib/contexts/userContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <SidebarProvider suppressHydrationWarning>{children}</SidebarProvider>
    </UserProvider>
  );
}
