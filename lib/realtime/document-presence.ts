"use client";

import { supabase } from "@/lib/supabase/client";

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

/** Stable, pleasant avatar colour derived from a user id. */
export function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 65%, 45%)`;
}

/**
 * Join the presence channel for a document and report the OTHER editors present
 * (self excluded, de-duplicated by id). Best-effort: if Realtime isn't enabled
 * on the project this simply never reports anyone. Returns a `leave()` cleanup.
 */
export function joinDocumentPresence(
  canvasId: string,
  self: PresenceUser,
  onSync: (others: PresenceUser[]) => void
): { leave: () => void } {
  const channel = supabase.channel(`doc-presence:${canvasId}`, {
    config: { presence: { key: self.id } },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState() as Record<string, any[]>;
    const seen = new Set<string>();
    const others: PresenceUser[] = [];
    Object.values(state).forEach((entries) => {
      entries.forEach((p: any) => {
        if (!p?.id || p.id === self.id || seen.has(p.id)) return;
        seen.add(p.id);
        others.push({
          id: p.id,
          name: p.name ?? "Someone",
          color: p.color ?? colorForUser(p.id),
        });
      });
    });
    onSync(others);
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void channel.track(self);
    }
  });

  return {
    leave: () => {
      void supabase.removeChannel(channel);
    },
  };
}
