import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/subscriptions — list subscription plans (newest first). Read-only,
 * behind requireAdmin(). Moves the admin subscriptions read off the browser client
 * and behind the gate; subscription CRUD (soft-delete only) stays a gated follow-up.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from("subscription")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data ?? [] });
}
