import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe/config";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { clearFeatureLimitsCache } = await import("@/lib/subscription-features");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
        });

        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;

        if (userId && session.subscription) {
          // Clear cache for this user
          clearFeatureLimitsCache(userId);
          // Get subscription details from user_subscription table
          const { data: existingSubscription } = await supabase
            .from("user_subscription")
            .select("id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .single();

          if (existingSubscription) {
            // Update existing subscription
            await supabase
              .from("user_subscription")
              .update({
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingSubscription.id);
          } else {
            // Get the subscription plan from database
            const { data: plan } = await supabase
              .from("subscription")
              .select("id")
              .eq("title", planType === "yearly" ? "Yearly Pro" : "Monthly Pro")
              .single();

            if (plan) {
              // Create new subscription record
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + (planType === "yearly" ? 12 : 1));

              await supabase.from("user_subscription").insert({
                user_id: userId,
                subscription_id: plan.id,
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                is_active: true,
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription event:", {
          type: event.type,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end,
          metadata: subscription.metadata,
        });

        const userId = subscription.metadata?.userId;

        if (userId) {
          const endDate = new Date((subscription as any).current_period_end * 1000);

          await supabase
            .from("user_subscription")
            .update({
              end_date: endDate.toISOString(),
              is_active: subscription.status === "active" || subscription.status === "trialing",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription canceled:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          canceledAt: subscription.canceled_at,
          metadata: subscription.metadata,
        });

        // Mark subscription as inactive
        await supabase
          .from("user_subscription")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", {
          invoiceId: invoice.id,
          subscriptionId: (invoice as any).subscription,
          customerId: invoice.customer,
          amountPaid: (invoice as any).amount_paid,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", {
          invoiceId: invoice.id,
          subscriptionId: (invoice as any).subscription,
          customerId: invoice.customer,
          attemptCount: (invoice as any).attempt_count,
        });

        // User will lose access on next validation check
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
