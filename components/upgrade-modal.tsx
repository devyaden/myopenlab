"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "diagrams" | "ai_requests";
  currentCount?: number;
  limit?: number;
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/pricing");
  };

  const messages = {
    diagrams: {
      title: "Diagram Limit Reached",
      description: `You've reached your limit of ${limit || 1} diagram${(limit || 1) > 1 ? "s" : ""} on the free plan.`,
      feature: "Unlimited diagrams",
    },
    ai_requests: {
      title: "AI Request Limit Reached",
      description: `You've used all ${limit || 5} AI requests for this month.`,
      feature: "Unlimited AI-powered diagram generation",
    },
  };

  const message = messages[reason];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-bold">
              {message.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-600 pt-2">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-br from-yadn-accent-green/5 to-yadn-accent-green/10 border border-yadn-accent-green/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yadn-accent-green" />
              Upgrade to Pro and get:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yadn-accent-green mt-0.5 flex-shrink-0" />
                <span>{message.feature}</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yadn-accent-green mt-0.5 flex-shrink-0" />
                <span>All diagram types and advanced features</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yadn-accent-green mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yadn-accent-green mt-0.5 flex-shrink-0" />
                <span>Advanced collaboration tools</span>
              </li>
            </ul>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Starting at</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-yadn-accent-green">£5</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">or £4/month billed annually</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
          >
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
