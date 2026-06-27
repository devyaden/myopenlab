import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { listDirectories, listDirectoryRows } from "@/lib/refs/resolver";

// ─────────────────────────────────────────────────────────────────────────────
// THE single access/scope layer for Exploration Mode.
//
// Exploration mode is deliberately self-contained so that a FUTURE "explorer"
// role can be given access to exploration ONLY (no editor) and be scoped to just
// the part of the knowledge base their position in the company directory allows
// (matched by email + department). Roles/permissions don't exist in the app yet,
// so v1 is owner-scoped and open to any signed-in user — but every exploration
// entry point and data path funnels through THIS module, so turning real gating
// on later means editing essentially this one file (+ one middleware branch in
// lib/supabase/middleware.ts). Nothing else in the feature needs to change.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Master switch for directory-position scoping. While false (v1) the scope is a
 * pure pass-through over the user's own workspace. Flip to true once the person
 * directory reliably carries Email/Department for every user, and `resolveScope`
 * will start narrowing `allowed*` to what that person's position permits.
 */
const EXPLORE_DIRECTORY_SCOPING = false;

export interface ExplorerScope {
  userId: string;
  email: string;
  // Directory linkage (resolved by matching the user's email to a person row).
  // Populated only when EXPLORE_DIRECTORY_SCOPING is on; null otherwise.
  personRowId: string | null;
  department: string | null;
  positionLabel: string | null;
  // The effective data scope. `null` ⇒ unrestricted (the owner's whole
  // workspace). When directory scoping goes live these become concrete id/type
  // allow-lists and the chat route filters the workspace index by them.
  allowedCanvasIds: string[] | null;
  allowedDirectoryIds: string[] | null;
  allowedReferenceTypes: string[] | null;
  /** Human banner shown in the UI, e.g. "Your whole workspace". */
  label: string;
}

/** Read a field from a directory row's data with tolerant key matching. */
function pickField(data: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    const direct = data?.[k];
    if (direct != null && String(direct).trim() !== "") return String(direct);
    const lower = data?.[k.toLowerCase()];
    if (lower != null && String(lower).trim() !== "") return String(lower);
  }
  return null;
}

interface PersonLink {
  personRowId: string | null;
  department: string | null;
  positionLabel: string | null;
}

/**
 * Resolve a user to their row in a person directory by email. Implemented and
 * ready, but only invoked when EXPLORE_DIRECTORY_SCOPING is enabled so v1 pays
 * no extra round-trips. This is exactly the lookup future role-scoping builds on.
 */
async function findPersonLink(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<PersonLink> {
  const empty: PersonLink = { personRowId: null, department: null, positionLabel: null };
  const target = email.trim().toLowerCase();
  if (!target) return empty;
  const directories = await listDirectories(supabase, userId, "person");
  for (const dir of directories) {
    const rows = await listDirectoryRows(supabase, userId, dir.id);
    const match = rows.find((r) => {
      const rowEmail = pickField(r.data, ["Email", "email", "Email Address", "email_address"]);
      return rowEmail != null && rowEmail.trim().toLowerCase() === target;
    });
    if (match) {
      return {
        personRowId: match.id,
        department: pickField(match.data, ["Department", "department", "Dept", "Team"]),
        positionLabel:
          pickField(match.data, ["Role", "role", "Title", "Position"]) ?? match.label,
      };
    }
  }
  return empty;
}

/**
 * Build the data scope for a request. v1: pass-through over the owner's whole
 * workspace. The directory lookup + allow-list narrowing is the ONLY thing that
 * changes when role/authority scoping ships.
 */
export async function resolveExplorerScope(
  supabase: SupabaseClient,
  user: User
): Promise<ExplorerScope> {
  const email = user.email ?? "";
  let link: PersonLink = { personRowId: null, department: null, positionLabel: null };

  if (EXPLORE_DIRECTORY_SCOPING && email) {
    try {
      link = await findPersonLink(supabase, user.id, email);
    } catch (err) {
      // Never block exploration on a directory hiccup — fall back to whole workspace.
      console.error("resolveExplorerScope: directory lookup failed:", err);
    }
  }

  // FUTURE: when scoping is live, derive allowedCanvasIds/allowedReferenceTypes
  // from `link.department` (e.g. canvases tagged to that department + shared ones)
  // and set a personalized label like `Exploring as ${link.positionLabel} — ${link.department}`.
  return {
    userId: user.id,
    email,
    personRowId: link.personRowId,
    department: link.department,
    positionLabel: link.positionLabel,
    allowedCanvasIds: null,
    allowedDirectoryIds: null,
    allowedReferenceTypes: null,
    label: "Your whole workspace",
  };
}

/** The role carried on a Supabase auth user (or our app user shape). */
export function roleOf(user: { user_metadata?: { role?: string }; role?: string } | null): string | null {
  return user?.user_metadata?.role ?? user?.role ?? null;
}

/**
 * UI/route seam: may this user enter exploration mode? v1: any signed-in user.
 * FUTURE: return whether `roleOf(user)` is granted an exploration seat.
 */
export function canEnterExplore(user: unknown): boolean {
  return Boolean(user);
}

/**
 * UI/route seam: may this user enter the editing app? v1: everyone.
 * FUTURE: an explorer-only role returns false here, and the middleware branch in
 * lib/supabase/middleware.ts redirects them from /protected/* to /explore.
 */
export function canEnterEditor(user: unknown): boolean {
  return Boolean(user);
}

export type ExploreAccessResult =
  | { ok: true; supabase: SupabaseClient; user: User; scope: ExplorerScope }
  | { ok: false; status: number; error: string };

/**
 * The single backend gate. Every /api/explore/* route starts with this: it
 * authenticates, checks `canEnterExplore`, and resolves the data scope. Routes
 * then reuse the returned `supabase` client and honor `scope` when querying.
 */
export async function requireExploreAccess(): Promise<ExploreAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, status: 401, error: "Unauthorized" };
  if (!canEnterExplore(user)) {
    return { ok: false, status: 403, error: "No access to exploration mode" };
  }
  const scope = await resolveExplorerScope(supabase, user);
  return { ok: true, supabase, user, scope };
}
