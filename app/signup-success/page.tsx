"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Account Created Successfully!
        </h1>

        <p className="mt-2 text-gray-600">
          Your subscription has been activated. Please check your email to
          confirm your account.
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            You'll be able to access all the features of your subscription once
            you confirm your email.
          </p>

          <div className="pt-4">
            <Link href="/login">
              <Button size="lg" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-8">
            If you don't see the confirmation email, please check your spam
            folder.
          </p>
        </div>
      </div>
    </div>
  );
}
