import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/promo-codes — list promo codes (newest first) with their linked
 * subscription title. Read-only, behind requireAdmin(). Moving this read off the
 * browser client (where the admin UI fetches it today) and behind the gate is a
 * security upgrade. The deactivate (PATCH) write stays a separate, gated follow-up.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from("promo_code")
    .select("*, subscription:subscription_id (id, title)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promoCodes: data ?? [] });
}
