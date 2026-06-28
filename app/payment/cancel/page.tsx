"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-attention-tint p-4">
            <XCircle className="size-16 text-attention" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Checkout canceled
          </h1>
          <p className="text-muted-foreground">
            No charge was made. You can pick a plan and try again whenever
            you're ready.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="signal"
            onClick={() => router.push("/pricing")}
            className="w-full"
          >
            Choose a plan
          </Button>
          <Button
            onClick={() => router.push("/protected")}
            variant="outline"
            className="w-full"
          >
            Back to your workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
