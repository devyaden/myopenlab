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
 *
 * Channels are de-duplicated per `canvasId`: a document embedding the same flow
 * N times opens ONE realtime channel (not N), shared by all its embeds. The
 * postgres_changes event fans out to every listener for that canvas.
 */

type Listener = () => void;

interface Entry {
  listeners: Set<Listener>;
  channel: ReturnType<typeof supabase.channel> | null;
}

const entries = new Map<string, Entry>();

/** Invoke every listener registered for `canvasId`, isolating failures. */
function fanOut(canvasId: string): void {
  const entry = entries.get(canvasId);
  if (!entry) return;
  // Snapshot so an unsubscribe during iteration can't disturb the walk.
  Array.from(entry.listeners).forEach((cb) => {
    try {
      cb();
    } catch (err) {
      // A single misbehaving embed must not block the others.
      console.error("[embed-refresh] listener failed", err);
    }
  });
}

/**
 * Notify every embed of `canvasId` to refetch. Call this right after a source
 * canvas/table's data has been persisted, so any open document embedding it
 * updates immediately.
 */
export function emitEmbedRefresh(canvasId: string | null | undefined): void {
  if (!canvasId) return;
  fanOut(canvasId);
}

/**
 * Subscribe an embed to refresh signals for `canvasId`. Wires up both the
 * in-app bus and a best-effort realtime channel (one shared channel per
 * canvasId). Returns an unsubscribe fn the caller must run on unmount.
 */
export function subscribeEmbedRefresh(
  canvasId: string | null | undefined,
  onRefresh: Listener
): () => void {
  if (!canvasId) return () => {};

  let entry = entries.get(canvasId);
  if (!entry) {
    entry = { listeners: new Set(), channel: null };
    entries.set(canvasId, entry);
    // One channel per canvasId, shared by all its embeds. Stable topic name so
    // we never create more than one concurrent subscription for the same canvas.
    entry.channel = supabase
      .channel(`embed:canvas_data:${canvasId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "canvas_data",
          filter: `canvas_id=eq.${canvasId}`,
        },
        () => fanOut(canvasId)
      )
      .subscribe();
  }
  entry.listeners.add(onRefresh);

  return () => {
    const e = entries.get(canvasId);
    if (!e) return;
    e.listeners.delete(onRefresh);
    if (e.listeners.size === 0) {
      if (e.channel) void supabase.removeChannel(e.channel);
      entries.delete(canvasId);
    }
  };
}
