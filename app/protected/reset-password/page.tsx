"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useUser();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.password, data.confirmPassword);
      toast.success("Password reset successfully!");
      router.push("/protected");
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#000A1F] w-full">
      {/* Left side - Reset Password Form */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-yadn-primary-gray">
              Reset Password
            </h1>
            <p className="text-sm text-yadn-primary-gray/60">
              Please enter your new password below.
            </p>
          </div>

          <div className="w-full space-y-6">
            {/* Password Reset Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password Input */}
              <div>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <InputWithIcon
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      error={
                        errors.password ? errors.password.message : undefined
                      }
                      showPasswordToggle
                      className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green pr-10"
                      disabled={isLoading}
                    />
                  )}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <InputWithIcon
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      error={
                        errors.confirmPassword
                          ? errors.confirmPassword.message
                          : undefined
                      }
                      showPasswordToggle
                      className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green pr-10"
                      disabled={isLoading}
                    />
                  )}
                />
              </div>

              {/* Reset Password Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-[#000A1F] font-medium py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            {/* Back to Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-yadn-primary-gray/60">
                Remember your password?
              </span>{" "}
              <Link
                href="/auth/signin"
                className="text-yadn-accent-green hover:underline font-medium"
                tabIndex={isLoading ? -1 : 0}
                aria-disabled={isLoading}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Decorative elements and tagline */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-opacity-20 bg-yadn-accent-green blur-xl"></div>
        <div className="absolute bottom-20 right-40 w-48 h-48 rounded-full bg-opacity-20 bg-yadn-primary-gray blur-xl"></div>
        <div className="absolute top-1/2 left-20 w-72 h-72 rounded-full bg-opacity-10 bg-yadn-accent-green blur-xl"></div>

        {/* Tagline */}
        <div className="relative z-10 max-w-md px-8">
          <h2 className="text-5xl font-bold text-yadn-primary-gray leading-tight text-center">
            Secure your account
          </h2>
        </div>

        {/* Logo */}
        <div className="absolute top-10 right-10 justify-center">
          <Image
            src="/assets/global/app-logo-white.svg"
            alt="Logo"
            width={60}
            height={60}
            className="h-10 w-auto"
          />
        </div>
      </div>
    </div>
  );
}
