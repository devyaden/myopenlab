"use client";

import { supabase } from "@/lib/supabase/client";

/**
 * Phase 3: keep document embeds (live flows / tables / reference cards) in sync
 * with their source canvas without naive polling.
 *
 * Two complementary signals feed a single `onRefresh` callback per embed:
 *
 *  1. An in-app event bus — fired synchronously after a source canvas is saved
 *     in this tab (manual edit, autosave, or an agent "Apply"). This is the
 *     reliable same-tab path and does not depend on any server configuration.
 *
 *  2. Best-effort Supabase realtime on the `canvas_data` row — catches edits
 *     made in another tab / by another client. This is a no-op (never fires,
 *     never errors) if realtime isn't enabled for the table on the project, so
 *     the in-app bus + focus refresh in the NodeViews remain the guarantee.
 *
 * Embeds are expected to debounce their refetch — both signals can arrive in a
 * burst (e.g. an agent apply that also writes a history row).
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
let channelSeq = 0;

/**
 * Notify every embed of `canvasId` to refetch. Call this right after a source
 * canvas/table's data has been persisted, so any open document embedding it
 * updates immediately.
 */
export function emitEmbedRefresh(canvasId: string | null | undefined): void {
  if (!canvasId) return;
  const set = listeners.get(canvasId);
  if (!set) return;
  // Snapshot so an unsubscribe during iteration can't disturb the walk.
  Array.from(set).forEach((cb) => {
    try {
      cb();
    } catch (err) {
      // A single misbehaving embed must not block the others.
      console.error("[embed-refresh] listener failed", err);
    }
  });
}

/**
 * Subscribe an embed to refresh signals for `canvasId`. Wires up both the
 * in-app bus and a best-effort realtime channel. Returns an unsubscribe fn the
 * caller must run on unmount.
 */
export function subscribeEmbedRefresh(
  canvasId: string | null | undefined,
  onRefresh: Listener
): () => void {
  if (!canvasId) return () => {};

  let set = listeners.get(canvasId);
  if (!set) {
    set = new Set();
    listeners.set(canvasId, set);
  }
  set.add(onRefresh);

  // Unique topic per subscriber so two embeds of the same canvas don't share
  // (and clobber) a channel.
  const topic = `embed:canvas_data:${canvasId}:${channelSeq++}`;
  const channel = supabase
    .channel(topic)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "canvas_data",
        filter: `canvas_id=eq.${canvasId}`,
      },
      () => onRefresh()
    )
    .subscribe();

  return () => {
    const s = listeners.get(canvasId);
    if (s) {
      s.delete(onRefresh);
      if (s.size === 0) listeners.delete(canvasId);
    }
    void supabase.removeChannel(channel);
  };
}
