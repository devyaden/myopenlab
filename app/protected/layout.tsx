import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactFlowProvider } from "@xyflow/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider suppressHydrationWarning>{children}</SidebarProvider>;
}
