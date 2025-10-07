import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe/config";
import { z } from "zod";

const checkoutSchema = z.object({
  planType: z.string(),
  priceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { planType, priceId } = result.data;

    console.log("🚀 Checkout API received:", { planType, priceId });

    // Use provided priceId or fall back to config
    let stripePriceId = priceId;

    if (!stripePriceId) {
      const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans];
      if (!plan || !('stripePriceId' in plan) || !plan.stripePriceId) {
        return NextResponse.json(
          { error: `Stripe Price ID not configured for plan: ${planType}` },
          { status: 500 }
        );
      }
      stripePriceId = plan.stripePriceId;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || request.nextUrl.origin;
    const successUrl = `${baseUrl}/payment/success?plan=${planType}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Get user email from Supabase
    const userEmail = user.email || "";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        planType,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planType,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
