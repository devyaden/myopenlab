"use client";

import { useAgentStore } from "@/lib/store/useAgent";
import { useExplorationStore } from "@/lib/store/useExploration";
import { useOnboardingStore, ONBOARDING_STEP_IDS } from "@/lib/store/useOnboarding";
import { ANCHORS } from "@/components/onboarding/onboarding-steps";
import { useT } from "@/lib/i18n/LocaleProvider";
import { Sparkles } from "lucide-react";

// Floating button that opens the workspace agent. The agent targets whatever
// playbook/document the route is on (the layout keeps the store's canvasId in
// sync), so the launcher no longer needs a canvasId prop.
export function AgentLauncher() {
  const t = useT();
  const { isOpen, open } = useAgentStore();
  const exploring = useExplorationStore((s) => s.active);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  // Hide while exploration mode is active so the floating buttons don't stack atop
  // the full-screen surface.
  if (isOpen || exploring) return null;
  return (
    <button
      data-onboarding={ANCHORS.askAi}
      onClick={() => {
        completeStep(ONBOARDING_STEP_IDS.tryAskAi);
        open();
      }}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-90 rtl:left-4 rtl:right-auto"
      aria-label={t("agent.askAi")}
    >
      <Sparkles size={18} />
      <span className="text-sm font-medium">{t("agent.askAi")}</span>
    </button>
  );
}
