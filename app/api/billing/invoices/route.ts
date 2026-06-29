import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";

/**
 * GET /api/billing/invoices?limit=&starting_after= — the caller's Stripe invoices
 * (most recent first), for the Settings → Plan & Billing invoice list. Owner-scoped:
 * it resolves the user's own stripe_customer_id from their subscription and only ever
 * lists THAT customer's invoices, so a user can never enumerate another's. Read-only;
 * returns just the fields a list/row needs (plus the user's own hosted invoice + PDF
 * links), never the raw Stripe object.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve the caller's Stripe customer from their most-recent subscription row.
  const { data: sub } = await supabase
    .from("user_subscription")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerId = sub?.stripe_customer_id;
  if (!customerId) {
    // No Stripe customer yet (free / promo user) — no invoices, not an error.
    return NextResponse.json({ invoices: [], hasMore: false });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 12, 1),
    50
  );
  const startingAfter = searchParams.get("starting_after") || undefined;

  try {
    const list = await stripe.invoices.list({
      customer: customerId,
      limit,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      periodEnd: inv.period_end,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }));
    return NextResponse.json({ invoices, hasMore: list.has_more });
  } catch (e) {
    console.error("Error listing Stripe invoices:", e);
    return NextResponse.json(
      { error: "Could not load invoices" },
      { status: 502 }
    );
  }
}
