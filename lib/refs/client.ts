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
