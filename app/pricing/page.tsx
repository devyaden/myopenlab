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
import { HeaderSidebar } from "@/components/header-dashboard";
import { Check, Loader2, CreditCard, Shield, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/contexts/userContext";
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
        .single();

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green" />
          <div className="text-gray-700 text-xl">Loading pricing plans...</div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen bg-white">
        <HeaderSidebar />

        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4 py-16">
            {/* Page Title */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4 text-gray-900">
                Choose Your Plan
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Unlock unlimited diagrams and AI-powered features. Select the plan that fits your needs.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
              {plans.map((plan) => {
                const isActive = plan.planType === currentPlan;
                return (
                  <div
                    key={plan.planType}
                    className={`relative rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? "border-yadn-accent-green bg-gradient-to-br from-yadn-accent-green/5 to-yadn-accent-green/10 shadow-lg ring-2 ring-yadn-accent-green/20"
                        : plan.popular
                        ? "border-yadn-accent-green/40 bg-white hover:border-yadn-accent-green/60 hover:shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    } p-6 flex flex-col`}
                  >
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yadn-accent-green text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        CURRENT PLAN
                      </div>
                    )}
                    {!isActive && plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yadn-accent-green text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        MOST POPULAR
                      </div>
                    )}
                    {!isActive && plan.badge && !plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1 text-gray-900">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-xs">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        <span className="text-gray-600 ml-1 text-base">
                          {plan.period}
                        </span>
                      </div>
                      {plan.planType === "yearly" && (
                        <p className="text-xs text-yadn-accent-green font-semibold mt-1">
                          Billed annually at £48
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check
                            className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${
                              isActive || plan.popular
                                ? "text-yadn-accent-green"
                                : "text-gray-500"
                            }`}
                          />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePlanClick(plan)}
                      disabled={loading !== null || isActive}
                      className={`w-full py-4 text-base font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : plan.popular
                          ? "bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white shadow-md"
                          : "bg-gray-900 hover:bg-gray-700 text-white"
                      }`}
                    >
                      {isActive ? (
                        "Current Plan"
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
              <p className="text-gray-600">
                Need help choosing?{" "}
                <a
                  href="mailto:support@yadn.com"
                  className="text-yadn-accent-green hover:underline font-semibold"
                >
                  Contact us
                </a>
              </p>
            </div>

            {/* Payment Confirmation Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="sm:max-w-lg bg-white border-2 border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-yadn-accent-green" />
                    Confirm Your Subscription
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-base mt-2">
                    Review your plan details before proceeding to payment
                  </DialogDescription>
                </DialogHeader>

                {selectedPlan && (
                  <div className="space-y-6 py-4">
                    {/* Plan Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedPlan.name}
                        </h3>
                        {selectedPlan.badge && (
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {selectedPlan.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {selectedPlan.price}
                        </span>
                        <span className="text-gray-600 text-lg">
                          {selectedPlan.period}
                        </span>
                      </div>

                      {selectedPlan.planType === "yearly" && (
                        <p className="text-sm text-yadn-accent-green font-semibold">
                          Billed annually at £48 - Save £12/year
                        </p>
                      )}

                      <div className="pt-4 space-y-3">
                        {selectedPlan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-yadn-accent-green flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Security Badges */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Shield className="w-5 h-5 text-yadn-accent-green" />
                        <span className="text-sm">
                          Secure payment powered by Stripe
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Lock className="w-5 h-5 text-yadn-accent-green" />
                        <span className="text-sm">
                          Your data is encrypted and secure
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-yadn-accent-green" />
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
                        className="flex-1 py-6 text-base font-semibold bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={loading !== null}
                        className="flex-1 py-6 text-base font-semibold bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white shadow-lg shadow-yadn-accent-green/30"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Proceed to Payment
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
