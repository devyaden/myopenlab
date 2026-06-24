import { create } from "zustand";

interface AgentStore {
  isOpen: boolean;
  // The playbook/document currently in focus, so the agent targets it. Kept in
  // sync with the route (see the agent mount in app/protected/layout.tsx) rather
  // than captured at open() time, so it stays correct as the user navigates while
  // the chat is open.
  canvasId: string | null;
  open: (canvasId?: string | null) => void;
  close: () => void;
  toggle: () => void;
  setCanvasId: (canvasId: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  isOpen: false,
  canvasId: null,
  // `open()` no longer needs an argument (the route drives canvasId), but the
  // optional arg is kept for back-compat with any caller that still passes one.
  open: (canvasId) =>
    set((s) => ({ isOpen: true, canvasId: canvasId ?? s.canvasId })),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setCanvasId: (canvasId) => set({ canvasId }),
}));
