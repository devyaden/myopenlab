"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import LayoutWrapper from "@/components/onboarding/layout-wrapper";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { AgentLauncher } from "@/components/agent/AgentLauncher";
import { AgentChat } from "@/components/agent/AgentChat";
import { ExplorationToggle } from "@/components/explore/ExplorationToggle";
import { ExplorationOverlay } from "@/components/explore/ExplorationOverlay";
import { useAgentStore } from "@/lib/store/useAgent";

// Pull the playbook/document id out of the current route so the agent always
// targets what the user is viewing. Editors live on two routes: documents at
// /protected/document-editor/[id], everything else at /protected/playbook/[id].
// On any other route (dashboard, folders, profile) there is no focused artifact
// and the id is null — the agent then only proposes new artifacts, which is right.
const CANVAS_ROUTE =
  /^\/protected\/(?:playbook|document-editor)\/([0-9a-fA-F-]{36})(?:\/|$)/;

function useSyncAgentCanvasId() {
  const pathname = usePathname();
  useEffect(() => {
    const match = pathname?.match(CANVAS_ROUTE);
    useAgentStore.getState().setCanvasId(match ? match[1] : null);
  }, [pathname]);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSyncAgentCanvasId();

  return (
    <LayoutWrapper>
      <SidebarProvider>{children}</SidebarProvider>
      {/* Global Cmd/Ctrl+K command palette — available on every protected surface. */}
      <CommandPalette />
      {/* The workspace agent lives at the layout level so it's reachable on every
          protected route AND survives client-side navigation (the layout doesn't
          remount). Applying a proposal therefore no longer destroys the chat. */}
      <AgentLauncher />
      <AgentChat />
      {/* Exploration Mode (read-only governance Q&A). The toggle + overlay are the
          only references the editor shell holds to the self-contained explore module. */}
      <ExplorationToggle />
      <ExplorationOverlay />
    </LayoutWrapper>
  );
}
