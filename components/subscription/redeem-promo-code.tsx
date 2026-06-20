"use client";

import { useState } from "react";

import { Loader2, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RedeemPromoCodeProps {
  // Called after a code is successfully applied so the parent can refetch the
  // subscription and re-render the plan card.
  onRedeemed?: () => void;
}

export function RedeemPromoCode({ onRedeemed }: RedeemPromoCodeProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Please enter a promo code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Could not redeem promo code.");
        return;
      }

      toast.success(`${data.planName || "Plan"} applied successfully!`);
      setCode("");
      onRedeemed?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-yadn-accent-green/10 rounded-full flex items-center justify-center">
          <Ticket className="h-5 w-5 text-yadn-accent-green" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">Have a promo code?</h4>
          <p className="text-sm text-gray-600 mb-4">
            Redeem a code to unlock or extend your plan. Additional codes stack
            onto your current expiry date.
          </p>
          <Label htmlFor="redeemPromoCode" className="sr-only">
            Promo code
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="redeemPromoCode"
              placeholder="Enter your promo code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              className="uppercase"
              disabled={loading}
            />
            <Button
              type="button"
              onClick={handleApply}
              disabled={loading || !code.trim()}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white sm:w-32"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
