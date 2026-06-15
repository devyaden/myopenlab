"use client";

/**
 * Local safety net for document content. Keeps the last few non-empty
 * snapshots of each document in localStorage, independent of the network
 * save. If a save path ever clobbers the server copy, the user's recent
 * content is still recoverable from the browser.
 *
 * Keyed by canvasId. Never stores empty content (so an empty editor from a
 * failed load can't evict a good backup). Keeps a small ring of snapshots.
 */

const PREFIX = "doc-backup:";
const MAX_SNAPSHOTS = 5;

interface BackupSnapshot {
  savedAt: string;
  /** Tiptap JSON document. */
  json: unknown;
}

function key(canvasId: string): string {
  return `${PREFIX}${canvasId}`;
}

/** True if a Tiptap doc JSON has no meaningful content. */
function isEmptyDoc(json: any): boolean {
  if (!json || typeof json !== "object") return true;
  const content = json.content;
  if (!Array.isArray(content) || content.length === 0) return true;
  // A single empty paragraph counts as empty.
  if (content.length === 1) {
    const only = content[0];
    if (only?.type === "paragraph" && !only.content?.length) return true;
  }
  return false;
}

export function backupDocument(canvasId: string, json: unknown): void {
  if (typeof window === "undefined" || !canvasId) return;
  if (isEmptyDoc(json)) return; // never back up an empty doc
  try {
    const existing = readBackups(canvasId);
    const next: BackupSnapshot[] = [
      { savedAt: new Date().toISOString(), json },
      ...existing,
    ].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(key(canvasId), JSON.stringify(next));
  } catch (err) {
    // localStorage can throw (quota / private mode); backup is best-effort.
    console.warn("[document-backup] failed to write", err);
  }
}

export function readBackups(canvasId: string): BackupSnapshot[] {
  if (typeof window === "undefined" || !canvasId) return [];
  try {
    const raw = localStorage.getItem(key(canvasId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Most recent backed-up snapshot for a document, or null. */
export function latestBackup(canvasId: string): BackupSnapshot | null {
  return readBackups(canvasId)[0] ?? null;
}
