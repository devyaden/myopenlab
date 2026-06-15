import type { SupabaseClient } from "@supabase/supabase-js";

// Phase 2: human-readable canvas codes (e.g. "HR-01"), unique per user. The
// agent assigns these on create; the server is the authority that guarantees
// uniqueness and fills one in when the agent doesn't propose one.

const SERIAL_PAD = 2;

/** Strip a free-form prefix to A-Z0-9 (uppercase); fall back to "PB". */
export function normalizePrefix(prefix?: string | null): string {
  const p = String(prefix ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return p || "PB";
}

/** Derive a short prefix from a playbook name (initials of the first two words). */
export function derivePrefix(name?: string | null): string {
  const words = String(name ?? "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "PB";
  if (words.length === 1) return normalizePrefix(words[0].slice(0, 3));
  return normalizePrefix(words[0][0] + words[1][0]);
}

/** Parse the serial out of a "PREFIX-NN" code, or null if it doesn't match. */
function serialFor(prefix: string, code: string | null | undefined): number | null {
  if (!code) return null;
  const m = new RegExp(`^${prefix}-(\\d+)$`).exec(code);
  return m ? parseInt(m[1], 10) : null;
}

/** True if this exact code is already used by the user. */
async function codeTaken(
  supabase: SupabaseClient,
  userId: string,
  code: string
): Promise<boolean> {
  const { data } = await supabase
    .from("canvas")
    .select("id")
    .eq("user_id", userId)
    .eq("code", code)
    .limit(1);
  return !!(data && data.length);
}

export interface GenerateCodeOpts {
  /** An explicit code the agent proposed (e.g. "HR-01" or "TMPL01-HR-01"); used verbatim if free. */
  explicit?: string | null;
  /** A function/area prefix (e.g. "HR"); else derived from the name. */
  prefix?: string | null;
  /** The playbook name, used to derive a prefix when none is given. */
  name?: string | null;
}

/** A code the agent may have proposed is well-formed if it is uppercase
 * alphanumeric segments joined by hyphens, with at least two segments. */
function isWellFormedExplicit(code: string): boolean {
  return /^[A-Z0-9]+(-[A-Z0-9]+)+$/.test(code);
}

/**
 * Generate the next free human-readable code for a user. Prefers an explicit
 * agent-proposed code (if well-formed and free), else `${prefix}-NN` with NN
 * auto-incrementing past the user's existing codes under that prefix.
 *
 * Not race-proof on its own — the caller should retry on a unique-violation
 * (the partial logic below only sees committed rows). See the apply route.
 */
export async function generateCanvasCode(
  supabase: SupabaseClient,
  userId: string,
  opts: GenerateCodeOpts = {}
): Promise<string> {
  const explicit = String(opts.explicit ?? "")
    .trim()
    .toUpperCase();
  if (
    explicit &&
    isWellFormedExplicit(explicit) &&
    !(await codeTaken(supabase, userId, explicit))
  ) {
    return explicit;
  }

  const prefix = opts.prefix
    ? normalizePrefix(opts.prefix)
    : derivePrefix(opts.name);

  const { data } = await supabase
    .from("canvas")
    .select("code")
    .eq("user_id", userId)
    .like("code", `${prefix}-%`);

  let max = 0;
  for (const row of data ?? []) {
    const s = serialFor(prefix, (row as any).code);
    if (s !== null && s > max) max = s;
  }
  return `${prefix}-${String(max + 1).padStart(SERIAL_PAD, "0")}`;
}
