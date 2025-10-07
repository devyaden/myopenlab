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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your subscription is now active
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/protected")}
            className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push("/protected/profile")}
            variant="outline"
            className="w-full"
          >
            View Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
