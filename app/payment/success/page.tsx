"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        // Get plan type from URL params (passed from checkout)
        const planType = searchParams.get("plan") || "monthly";

        setIsActivating(false);

        const response = await fetch("/api/stripe/activate-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType }),
        });

        const data = await response.json();
        console.log("Activation response:", data);

        if (!response.ok) {
          setError(data.error || "Failed to activate");
        }
      } catch (error) {
        console.error("Error activating subscription:", error);
        setError(String(error));
      }
    };

    activateSubscription();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-signal-tint p-4">
            <CheckCircle className="size-16 text-signal" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            You're all set
          </h1>
          <p className="text-muted-foreground">
            Your payment went through and your subscription is now active.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-attention/30 bg-attention-tint p-4 text-left text-sm text-attention-text">
            We couldn't finish activating your subscription automatically. If
            you don't see your new plan in a few minutes, contact support and
            we'll sort it out right away.
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="signal"
            onClick={() => router.push("/protected")}
            className="w-full"
          >
            Go to your workspace
          </Button>
          <Button
            onClick={() => router.push("/protected/profile")}
            variant="outline"
            className="w-full"
          >
            View subscription
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
