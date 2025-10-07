import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  plans: {
    free: {
      name: "Free",
      price: 0,
      currency: "gbp",
      interval: "month" as const,
      features: [
        "1 Diagram",
        "5 AI Requests per month",
        "Basic diagram types",
        "Export as PNG/SVG",
      ],
    },
    monthly: {
      name: "Monthly Pro",
      price: 500, // £5 in pence
      currency: "gbp",
      interval: "month" as const,
      stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
      features: [
        "Unlimited Diagrams",
        "Unlimited AI Requests",
        "All diagram types",
        "Export as PNG/SVG/PDF",
        "Advanced collaboration",
        "Priority support",
      ],
    },
    yearly: {
      name: "Yearly Pro",
      price: 4800, // £4 per month * 12 months = £48 in pence
      currency: "gbp",
      interval: "year" as const,
      stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || "",
      features: [
        "Unlimited Diagrams",
        "Unlimited AI Requests",
        "All diagram types",
        "Export as PNG/SVG/PDF",
        "Advanced collaboration",
        "Priority support",
        "Save £12/year",
      ],
    },
  },
};

export type PlanType = keyof typeof STRIPE_CONFIG.plans;
