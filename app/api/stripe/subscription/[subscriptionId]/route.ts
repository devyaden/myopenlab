import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Helper function to get currency symbol
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: "$",
    gbp: "£",
    eur: "€",
    jpy: "¥",
    inr: "₹",
    cad: "C$",
    aud: "A$",
  };
  return symbols[currency.toLowerCase()] || currency.toUpperCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subscriptionId } = await params;

    console.log("Fetching Stripe subscription:", subscriptionId);

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    console.log("Stripe subscription retrieved:", {
      id: subscription.id,
      status: subscription.status,
      items: subscription.items.data.length,
    });

    // Get price details
    const price = subscription.items.data[0]?.price;

    if (!price) {
      console.error("No price found for subscription");
      return NextResponse.json(
        { error: "No price found for subscription" },
        { status: 404 }
      );
    }

    const amount = price.unit_amount || 0;
    const currency = price.currency;
    const interval = price.recurring?.interval || "month";

    const responseData = {
      price: amount / 100, // Convert from cents to dollars
      currency: currency.toUpperCase(),
      currencySymbol: getCurrencySymbol(currency),
      interval: interval,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    console.log("Returning subscription data:", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching Stripe subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
