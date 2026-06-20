"use client";

/**
 * Phase 3: client helper that records a typed cross-reference from the document
 * currently being edited to another artifact, fired when the user inserts a
 * typed @-mention or a sub-document reference card.
 *
 * Goes through /api/refs (server-authoritative: it derives user_id from the
 * session and verifies ownership of the source). Best-effort and non-blocking —
 * a failed reference write must never break the editor insert, so we swallow
 * errors and never await this on the critical path.
 */
export interface MentionReferenceInput {
  fromCanvas: string;
  fromNode?: string | null;
  toCanvas?: string | null;
  /** Phase 5d: a node within `toCanvas` (e.g. a person row in a directory). */
  toNode?: string | null;
  toCode?: string | null;
  type: string;
}

export async function createReferenceForMention(
  input: MentionReferenceInput
): Promise<void> {
  if (!input.fromCanvas) return;
  if (!input.toCanvas && !input.toCode) return;
  // A self-reference (mentioning the doc you're editing) carries no meaning.
  if (input.toCanvas && input.toCanvas === input.fromCanvas) return;
  try {
    await fetch("/api/refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (err) {
    console.error("[refs] failed to create reference", err);
  }
}

/**
 * Phase 5d: retract a typed reference (e.g. when a RACI/approver relation cell is
 * unlinked). Matches on the exact {fromCanvas, fromNode, toCanvas, toNode, type}
 * tuple, owner-scoped server-side. Best-effort; never blocks the edit.
 */
export async function deleteReferenceForMention(
  input: MentionReferenceInput
): Promise<void> {
  if (!input.fromCanvas) return;
  if (!input.toCanvas && !input.toCode) return;
  try {
    await fetch("/api/refs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (err) {
    console.error("[refs] failed to delete reference", err);
  }
}
