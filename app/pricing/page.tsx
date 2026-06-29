"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { ExplorationOverlay } from "@/components/explore/ExplorationOverlay";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, CreditCard, Shield, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/contexts/userContext";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface StripePlan {
  id: string;
  name: string;
  description: string | null;
  metadata: {
    plan_type?: string;
    features?: string;
    popular?: string;
    badge?: string;
  };
  prices: Array<{
    id: string;
    amount: number | null;
    currency: string;
    interval: string | null;
    intervalCount: number | null;
    type: string;
    metadata: any;
  }>;
  defaultPrice: {
    id: string;
    amount: number | null;
    currency: string;
    currencySymbol: string;
    interval: string | null;
    intervalCount: number | null;
    customUnitLabel: string | null;
  } | null;
}

/**
 * Pricing is an authenticated in-app surface, so it wears the same Atlas chrome as
 * the rest of the app: the LibrarySidebar + TopBar (via AppShell), the ⌘K command
 * palette, and The Map overlay — the supporting pieces the /protected layout would
 * otherwise provide. Replaces the legacy dark header-dashboard.
 */
function PricingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppShell>{children}</AppShell>
      </SidebarProvider>
      <CommandPalette />
      <ExplorationOverlay />
    </>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  // Fetch Stripe products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingPlans(true);
        const response = await fetch("/api/stripe/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();

        const formattedPlans = data.products
          .filter((product: StripePlan) => {
            const planType = product.metadata?.plan_type;
            const isFree = planType === "free" || product.name.toLowerCase().includes("free");
            return !isFree;
          })
          .map((product: StripePlan) => {
            const features = Array.isArray(product.metadata?.features)
              ? product.metadata.features
              : [];

            const price = product.defaultPrice?.amount
              ? (product.defaultPrice.amount / 100).toFixed(0)
              : "0";

            const currencySymbol = product.defaultPrice?.currencySymbol || "$";
            const interval = product.defaultPrice?.interval;
            const customUnitLabel = product.defaultPrice?.customUnitLabel;

            let planType = product.metadata?.plan_type;
            if (!planType) {
              planType = interval === "year" ? "yearly" : "monthly";
            }

            return {
              id: product.id,
              priceId: product.defaultPrice?.id,
              name: product.name,
              price: `${currencySymbol}${price}`,
              period: interval ? `/${interval}` : "/month",
              description: product.description || "",
              features: features,
              cta: "Pay with Stripe",
              planType: planType,
              popular: customUnitLabel?.toLowerCase() === "popular" || product.metadata?.popular === "true",
              badge: product.metadata?.badge,
            };
          });

        setPlans(formattedPlans);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load pricing plans");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchProducts();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login?redirect=/pricing");
      }
    };

    checkAuth();
  }, [router]);

  // Load user's current subscription
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_subscription")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        console.log("🚀 Pricing page - Subscription data:", data);

        // Determine plan type from stripe_subscription_id or dates
        let planType = "free";

        if (data.stripe_subscription_id) {
          // Check if it's in the subscription ID
          if (data.stripe_subscription_id.includes('yearly')) {
            planType = "yearly";
          } else if (data.stripe_subscription_id.includes('monthly')) {
            planType = "monthly";
          } else {
            // Calculate from dates
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);
            const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                               (endDate.getMonth() - startDate.getMonth());

            planType = monthsDiff >= 12 ? "yearly" : "monthly";
          }
        }

        console.log("🚀 Pricing page - Detected plan type:", planType);
        setCurrentPlan(planType);
      } else {
        setCurrentPlan("free");
      }
    };

    loadSubscription();
  }, [user]);

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;

    const planType = selectedPlan.planType;

    try {
      setLoading(planType);

      // Check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setShowModal(false);
        toast.error("Please sign in to upgrade your plan");
        router.push("/auth/login?redirect=/pricing");
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          priceId: selectedPlan.priceId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast.error(error.message || "Failed to start checkout process");
      setLoading(null);
    }
  };

  if (!user || loadingPlans) {
    return (
      <PricingShell>
        <div className="container mx-auto px-4 py-16">
          <div className="mb-16 flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-96 max-w-full" />
            <Skeleton className="h-5 w-[28rem] max-w-full" />
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-8"
              >
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-4 h-10 w-40" />
                <div className="mt-8 space-y-3">
                  {[0, 1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="mt-8 h-11 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </PricingShell>
    );
  }

  return (
    <PricingShell>
          <div className="container mx-auto px-4 py-16">
            {/* Page Title */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4 text-foreground">
                Pricing that grows with your playbooks
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Unlimited playbooks and an AI co-pilot that knows how your company
                works. Pick the plan that fits your team.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
              {plans.map((plan) => {
                const isActive = plan.planType === currentPlan;
                const isRecommended = !isActive && plan.popular;
                return (
                  <div
                    key={plan.planType}
                    className={cn(
                      "relative rounded-xl border bg-card p-6 flex flex-col transition-all duration-200",
                      isActive
                        ? "border-signal ring-2 ring-signal/20 shadow-lg"
                        : isRecommended
                        ? "border-signal hover:shadow-md"
                        : "border-border hover:border-foreground/20 hover:shadow-sm"
                    )}
                  >
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-signal text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        Your current plan
                      </div>
                    )}
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-signal text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        Recommended
                      </div>
                    )}
                    {!isActive && !isRecommended && plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-signal text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1 text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground ml-1 text-base">
                          {plan.period}
                        </span>
                      </div>
                      {plan.planType === "yearly" && (
                        <p className="text-xs text-signal font-semibold mt-1">
                          Billed annually at £48
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <Check
                            className={cn(
                              "w-4 h-4 mr-2 flex-shrink-0 mt-0.5",
                              isActive || isRecommended
                                ? "text-signal"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="text-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePlanClick(plan)}
                      disabled={loading !== null || isActive}
                      variant={isActive ? "secondary" : "signal"}
                      size="lg"
                      className="w-full text-base font-semibold"
                    >
                      {isActive ? (
                        "Current plan"
                      ) : loading === plan.planType ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Contact Us */}
            <div className="mt-16 text-center">
              <p className="text-muted-foreground">
                Need help choosing?{" "}
                <a
                  href="mailto:support@yadn.com"
                  className="text-signal hover:underline font-semibold"
                >
                  Contact us
                </a>
              </p>
            </div>

            {/* Payment Confirmation Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <CreditCard className="w-7 h-7 text-signal" />
                    Confirm your subscription
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-base mt-2">
                    Review your plan before you continue to secure checkout.
                  </DialogDescription>
                </DialogHeader>

                {selectedPlan && (
                  <div className="space-y-6 py-4">
                    {/* Plan Details */}
                    <div className="bg-muted border border-border rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-foreground">
                          {selectedPlan.name}
                        </h3>
                        {selectedPlan.badge && (
                          <span className="bg-signal text-white px-3 py-1 rounded-full text-xs font-bold">
                            {selectedPlan.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {selectedPlan.price}
                        </span>
                        <span className="text-muted-foreground text-lg">
                          {selectedPlan.period}
                        </span>
                      </div>

                      {selectedPlan.planType === "yearly" && (
                        <p className="text-sm text-signal font-semibold">
                          Billed annually at £48 — save £12 a year
                        </p>
                      )}

                      <div className="pt-4 space-y-3">
                        {selectedPlan.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-signal flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Security Badges */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Shield className="w-5 h-5 text-signal" />
                        <span className="text-sm">
                          Secure payment powered by Stripe
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Lock className="w-5 h-5 text-signal" />
                        <span className="text-sm">
                          Your card details are encrypted end to end
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Check className="w-5 h-5 text-signal" />
                        <span className="text-sm">
                          14-day money-back guarantee
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setShowModal(false)}
                        disabled={loading !== null}
                        variant="outline"
                        size="lg"
                        className="flex-1 text-base font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={loading !== null}
                        variant="signal"
                        size="lg"
                        className="flex-1 text-base font-semibold"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Continue to payment
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
    </PricingShell>
  );
}
