import { NextResponse } from "next/server";

import { validatePromoCode } from "@/lib/services/promo";

/**
 * GET /api/promo/validate?code=&email= — real-time promo validity for the signup
 * flow. Intentionally ANON: signup validates a code before an account exists (unlike
 * POST /api/promo/redeem, which is logged-in only). Read-only — it reflects validity
 * only, never redeems, exposes no user data, and returns HTTP 200 even when invalid
 * (the reason is in the body) so the form can show inline feedback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const email = searchParams.get("email");

  if (!code.trim()) {
    return NextResponse.json({
      valid: false,
      reason: "invalid",
      message: "Please enter a promo code.",
    });
  }

  const result = await validatePromoCode({ code, email });
  return NextResponse.json(result);
}
