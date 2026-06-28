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
  reason: "diagrams" | "ai_requests" | "ai_tokens";
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

  const diagramLimit = limit || 1;
  const requestLimit = limit || 5;

  const messages = {
    diagrams: {
      title: "You've used all your playbooks",
      description: `The Free plan includes ${diagramLimit} playbook${diagramLimit > 1 ? "s" : ""}, and you're using ${
        currentCount ?? diagramLimit
      } of ${diagramLimit}. Upgrade to Pro to create as many as you need.`,
      feature: "Unlimited playbooks",
    },
    ai_requests: {
      title: "You've used all your AI requests",
      description: `The Free plan includes ${requestLimit} AI request${
        requestLimit > 1 ? "s" : ""
      } a month, and you've used them all. Upgrade to Pro for unlimited AI help.`,
      feature: "Unlimited AI-powered diagram generation",
    },
    ai_tokens: {
      title: "You've reached your AI usage limit",
      description:
        "You've used your AI allowance for now. Upgrade to Pro for a larger context window and higher daily and monthly limits.",
      feature: "A bigger context window and higher usage limits",
    },
  };

  const message = messages[reason];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-attention-tint rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-attention-text" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {message.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Upgrade Benefits */}
          <div className="bg-signal/10 border border-signal/20 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-signal" />
              What you get with Pro
            </h4>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
                <span>{message.feature}</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
                <span>All diagram types and advanced features</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
                <span>Advanced collaboration tools</span>
              </li>
            </ul>
          </div>

          {/* Pricing Info */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Starting at</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-signal">£5</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">or £4/month billed annually</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Maybe later
          </Button>
          <Button
            variant="signal"
            onClick={handleUpgrade}
            className="flex-1"
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
