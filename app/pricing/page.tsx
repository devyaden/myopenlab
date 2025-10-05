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

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "1 Diagram",
      "5 AI Requests per month",
      "Basic diagram types",
      "Export as PNG/SVG",
    ],
    cta: "Get Started",
    planType: "free" as const,
    popular: false,
  },
  {
    name: "Monthly Pro",
    price: "£5",
    period: "/month",
    description: "Best for individuals and small teams",
    features: [
      "Unlimited Diagrams",
      "Unlimited AI Requests",
      "All diagram types",
      "Export as PNG/SVG/PDF",
      "Advanced collaboration",
      "Priority support",
    ],
    cta: "Pay with Stripe",
    planType: "monthly" as const,
    popular: true,
  },
  {
    name: "Yearly Pro",
    price: "£4",
    period: "/month",
    description: "Save £12/year with annual billing",
    features: [
      "Unlimited Diagrams",
      "Unlimited AI Requests",
      "All diagram types",
      "Export as PNG/SVG/PDF",
      "Advanced collaboration",
      "Priority support",
      "Save £12/year (billed £48/year)",
    ],
    cta: "Pay with Stripe",
    planType: "yearly" as const,
    popular: false,
    badge: "Best Value",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const router = useRouter();
  const { user } = useUser();

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

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.planType === "free") {
      router.push("/auth/signup");
      return;
    }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;

    const planType = selectedPlan.planType as "monthly" | "yearly";
    try {
      setLoading(planType);

      if (planType === "free") {
        router.push("/auth/signup");
        return;
      }

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

      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000A1F] via-[#001433] to-[#000A1F] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
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
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
              {plans.map((plan) => (
            <div
              key={plan.planType}
              className={`relative rounded-2xl border-2 transition-all duration-200 ${
                plan.popular
                  ? "border-yadn-accent-green shadow-lg shadow-yadn-accent-green/10 bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
              } p-8 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yadn-accent-green text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </div>
              )}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-3xl font-bold mb-2 text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-6xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2 text-lg">
                    {plan.period}
                  </span>
                </div>
                {plan.planType === "yearly" && (
                  <p className="text-sm text-yadn-accent-green font-semibold mt-2">
                    Billed annually at £48
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`w-6 h-6 mr-3 flex-shrink-0 mt-0.5 ${
                        plan.popular
                          ? "text-yadn-accent-green"
                          : "text-gray-600"
                      }`}
                    />
                    <span className="text-gray-700 text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan)}
                disabled={loading !== null}
                className={`w-full py-6 text-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? "bg-yadn-accent-green hover:bg-[#00D084] text-white shadow-md"
                    : "bg-gray-900 hover:bg-gray-700 text-white"
                }`}
              >
                {loading === plan.planType ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </Button>
                </div>
              ))}
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
