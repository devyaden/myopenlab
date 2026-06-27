"use client";

/**
 * A tiny same-tab event bus signalling that the user's "library" — the set of
 * playbooks/folders shown in the sidebar and the document/canvas insert-pickers
 * — has changed (a canvas or folder was created, deleted, or moved).
 *
 * Why this exists: agent applies (`/api/ai/agent/apply`) and other mutations
 * write directly to the DB, but the Zustand caches that back the sidebar and the
 * insert-pickers (`getFolders` / `fetchRootCanvases` / `loadFolderCanvases`) are
 * populated once and never invalidated — so a newly created item only appeared
 * after a full page refresh. Emitting on this bus after a structural mutation
 * lets those views refetch immediately.
 *
 * This is intentionally parameterless (unlike the per-canvasId `embed-refresh`
 * bus): subscribers already know their own scope (e.g. the sidebar refetches with
 * its own userId), so the signal only needs to say "something changed, refetch".
 * Listeners are expected to debounce/coalesce — a single apply can mutate several
 * rows and fire this more than once in a burst.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Notify every subscriber that the library changed. Call after a canvas/folder
 * create, delete, or move has been persisted.
 */
export function emitLibraryRefresh(): void {
  // Snapshot so an unsubscribe during iteration can't disturb the walk.
  Array.from(listeners).forEach((cb) => {
    try {
      cb();
    } catch (err) {
      // One misbehaving listener must not block the others.
      console.error("[library-refresh] listener failed", err);
    }
  });
}

/**
 * Subscribe to library-change signals. Returns an unsubscribe fn the caller must
 * run on unmount.
 */
export function subscribeLibraryRefresh(onRefresh: Listener): () => void {
  listeners.add(onRefresh);
  return () => {
    listeners.delete(onRefresh);
  };
}
