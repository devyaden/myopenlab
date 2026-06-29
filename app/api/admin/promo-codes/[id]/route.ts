import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/promo-codes/:id  { active }  — activate / deactivate a promo code.
 * Admin-only (requireAdmin). Soft toggle of the `active` flag — never deletes a code,
 * so its redemption history stays intact. Replaces a browser-client write in the admin
 * UI with a gated server route.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: { active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "active (boolean) is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("promo_code")
    .update({ active: body.active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, code, active")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  return NextResponse.json({ promoCode: data });
}
