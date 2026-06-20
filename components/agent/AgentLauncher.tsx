"use client";

import { useAgentStore } from "@/lib/store/useAgent";
import { useOnboardingStore, ONBOARDING_STEP_IDS } from "@/lib/store/useOnboarding";
import { ANCHORS } from "@/components/onboarding/onboarding-steps";
import { Sparkles } from "lucide-react";

// Floating button that opens the workspace agent. Pass the current playbook id
// when launched from an editor so the agent can target it.
export function AgentLauncher({ canvasId }: { canvasId?: string | null }) {
  const { isOpen, open } = useAgentStore();
  const completeStep = useOnboardingStore((s) => s.completeStep);
  if (isOpen) return null;
  return (
    <button
      data-onboarding={ANCHORS.askAi}
      onClick={() => {
        completeStep(ONBOARDING_STEP_IDS.tryAskAi);
        open(canvasId ?? null);
      }}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      aria-label="Open workspace agent"
    >
      <Sparkles size={18} />
      <span className="text-sm font-medium">Ask AI</span>
    </button>
  );
}
