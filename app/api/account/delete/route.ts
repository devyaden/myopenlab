import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Self-service account deletion — the Settings → Advanced danger zone. GET previews
 * the blast radius (what will be removed); POST irreversibly deletes everything after
 * an exact email-match confirm. Deletion runs the security-definer delete_user_account
 * function (dependency-ordered, since the FKs are ON DELETE RESTRICT) and then removes
 * the auth user. Both gated to the signed-in user — a user can only ever delete
 * themselves (the id comes from the session, never the request body).
 */
async function countOwned(table: string, userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    canvases,
    folders,
    references,
    agentConversations,
    exploreConversations,
    subscriptions,
  ] = await Promise.all([
    countOwned("canvas", user.id),
    countOwned("folder", user.id),
    countOwned("reference", user.id),
    countOwned("agent_conversation", user.id),
    countOwned("explore_conversation", user.id),
    countOwned("user_subscription", user.id),
  ]);

  return NextResponse.json({
    email: user.email,
    blastRadius: {
      canvases,
      folders,
      references,
      agentConversations,
      exploreConversations,
      subscriptions,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Foolproof guard: the typed email must match the account email exactly.
  const confirm = (body.confirmEmail ?? "").trim().toLowerCase();
  if (!confirm || confirm !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json(
      {
        error:
          "Email confirmation does not match. Type your account email exactly to confirm.",
      },
      { status: 400 }
    );
  }

  // Audit: no audit table by design — log server-side (swap for PostHog if desired).
  console.warn(
    `[account-delete] user=${user.id} email=${user.email} — removing all owned data`
  );

  // 1. Remove all owned app data in dependency order (security-definer function).
  const { error: rpcErr } = await supabaseAdmin.rpc("delete_user_account", {
    target_user_id: user.id,
  });
  if (rpcErr) {
    console.error("[account-delete] data deletion failed:", rpcErr);
    return NextResponse.json(
      { error: "Could not delete account data. Please contact support." },
      { status: 500 }
    );
  }

  // 2. Remove the auth login. (Storage objects from agent attachments are GC'd
  //    separately — the DB rows + profile are already gone.)
  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("[account-delete] auth deletion failed:", delErr);
    return NextResponse.json(
      {
        error:
          "Account data removed but the login could not be deleted. Please contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true });
}
