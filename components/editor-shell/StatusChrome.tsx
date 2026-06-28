"use client";

import {
  SaveStatusIndicator,
  type SaveStatus,
} from "@/components/editor/SaveStatusIndicator";
import { PresenceAvatars } from "@/components/editor/PresenceAvatars";
import { colorForUser } from "@/lib/realtime/document-presence";
import { AIBudgetMeter } from "./AIBudgetMeter";
import { cn } from "@/lib/utils";

interface StatusChromeProps {
  saveStatus?: SaveStatus;
  lastSaved?: Date | null;
  canvasId?: string;
  /** Current user, for presence. Presence renders nothing when alone. */
  user?: { id: string; email?: string | null } | null;
  /** Owner-only chrome (save state, AI budget). Presence shows for everyone. */
  isOwner?: boolean;
  className?: string;
}

/**
 * The editor StatusChrome — one cohesive cluster that answers, at a glance:
 * "is my work safe, how much AI do I have left today, and who else is here?"
 * Shared by all three editor surfaces (Flow / Table / Document) so status always
 * reads the same way. (Drift / integrity status is backend-blocked and will join
 * this cluster once the endpoint lands.)
 */
export function StatusChrome({
  saveStatus,
  lastSaved,
  canvasId,
  user,
  isOwner,
  className,
}: StatusChromeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {user?.id && canvasId && (
        <PresenceAvatars
          canvasId={canvasId}
          self={{
            id: user.id,
            name: user.email ? user.email.split("@")[0] : "You",
            color: colorForUser(user.id),
          }}
        />
      )}
      {isOwner && <AIBudgetMeter />}
      {isOwner && saveStatus && (
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
      )}
    </div>
  );
}

export default StatusChrome;
