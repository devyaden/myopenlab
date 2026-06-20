import { NextRequest, NextResponse } from "next/server";

import { redeemPromoCode } from "@/lib/services/promo";
import { createClient } from "@/lib/supabase/server";

// POST /api/promo/redeem  { code }  — redeem a promo code for the logged-in user.
// Validation + write happen server-side in redeemPromoCode (service role); this
// handler only authenticates the caller and maps the result to a response.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = (body.code || "").trim();
  if (!code) {
    return NextResponse.json({ error: "A promo code is required" }, { status: 400 });
  }

  const result = await redeemPromoCode({
    userId: user.id,
    userEmail: user.email,
    code,
  });

  if (!result.ok) {
    const status =
      result.reason === "alreadyRedeemed"
        ? 409
        : result.reason === "error"
          ? 500
          : 400;
    return NextResponse.json(
      { error: result.message, reason: result.reason },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    planName: result.planName,
    endDate: result.endDate,
  });
}
