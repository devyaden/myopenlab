import { stripe } from "@/lib/stripe/config";
import Stripe from "stripe";

/**
 * Validate subscription status with Stripe
 * This function checks if a subscription is active in Stripe
 */
export async function validateSubscriptionWithStripe(
  stripeSubscriptionId: string
): Promise<{
  isValid: boolean;
  status: Stripe.Subscription.Status | null;
  subscription: Stripe.Subscription | null;
}> {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );

    const isValid =
      subscription.status === "active" || subscription.status === "trialing";

    return {
      isValid,
      status: subscription.status,
      subscription,
    };
  } catch (error) {
    console.error("Error validating subscription with Stripe:", error);
    return {
      isValid: false,
      status: null,
      subscription: null,
    };
  }
}

/**
 * Get customer's active subscriptions from Stripe
 */
export async function getCustomerSubscriptions(
  stripeCustomerId: string
): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
    });

    return subscriptions.data;
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    return [];
  }
}

/**
 * Cancel a subscription in Stripe
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{
  success: boolean;
  subscription: Stripe.Subscription | null;
  error?: string;
}> {
  try {
    const subscription = await stripe.subscriptions.cancel(
      stripeSubscriptionId
    );

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      subscription: null,
      error: error.message || "Failed to cancel subscription",
    };
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return null;
  }
}
