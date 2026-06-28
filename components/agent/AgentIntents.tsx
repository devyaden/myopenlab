"use client";

import { Plus, Pencil, Link2, Wand2 } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

export type AgentIntent = "create" | "edit" | "link" | "optimize";

const ICONS = {
  create: Plus,
  edit: Pencil,
  link: Link2,
  optimize: Wand2,
} as const;

// The Create/Edit/Link/Optimize action chips. Context-aware: when nothing is open
// only "Create" makes sense; when a playbook/document is open the edit/link/optimize
// actions appear too. Clicking a chip sends the turn with that intent (which biases
// the agent's tools + prompt) — bias only, the agent can still range freely.
export function AgentIntents({
  hasContext,
  disabled,
  onPick,
}: {
  hasContext: boolean;
  disabled?: boolean;
  onPick: (intent: AgentIntent) => void;
}) {
  const t = useT();
  const intents: AgentIntent[] = hasContext
    ? ["create", "edit", "link", "optimize"]
    : ["create"];

  return (
    <div className="flex flex-wrap gap-1.5">
      {intents.map((intent) => {
        const Icon = ICONS[intent];
        return (
          <button
            key={intent}
            type="button"
            onClick={() => onPick(intent)}
            disabled={disabled}
            title={t(`agent.intents.${intent}Tip`)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-signal/40 hover:bg-signal/10 hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50"
          >
            <Icon size={13} className="text-signal" />
            {t(`agent.intents.${intent}`)}
          </button>
        );
      })}
    </div>
  );
}
