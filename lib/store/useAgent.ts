import { create } from "zustand";

interface AgentStore {
  isOpen: boolean;
  // The playbook in focus, if launched from an editor (lets the agent target it).
  canvasId: string | null;
  open: (canvasId?: string | null) => void;
  close: () => void;
  toggle: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  isOpen: false,
  canvasId: null,
  open: (canvasId) => set({ isOpen: true, canvasId: canvasId ?? null }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
