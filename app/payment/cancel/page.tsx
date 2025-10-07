"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-orange-100 rounded-full p-4">
            <XCircle className="w-16 h-16 text-orange-600" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Canceled
          </h1>
          <p className="text-gray-600">
            No charges were made to your account
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/pricing")}
            className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
          >
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/protected")}
            variant="outline"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
