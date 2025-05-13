"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/lib/contexts/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message ?? "Failed to sign in with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-yadn-primary-gray/20 bg-transparent px-4 py-3 text-yadn-primary-gray hover:bg-yadn-primary-gray/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image
            src="/assets/icons/google-icon.svg"
            alt="Google"
            width={24}
            height={24}
          />
        )}
        {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center">
        <div className="h-px w-1/4 bg-yadn-primary-gray/10"></div>
        <span className="px-4 text-sm text-yadn-primary-gray/60">
          Or sign in with email
        </span>
        <div className="h-px w-1/4 bg-yadn-primary-gray/10"></div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                type="email"
                placeholder="Email"
                error={errors.email ? errors.email.message : undefined}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-acctext-yadn-accent-green focus:ring-yadn-acctext-yadn-accent-green"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                error={errors.password ? errors.password.message : undefined}
                showPasswordToggle
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-acctext-yadn-accent-green focus:ring-yadn-acctext-yadn-accent-green pr-10"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-yadn-primary-gray/30 data-[state=checked]:bg-yadn-acctext-yadn-accent-green data-[state=checked]:border-yadn-acctext-yadn-accent-green"
              disabled={isLoading}
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-yadn-primary-gray/80"
            >
              Keep me logged in
            </label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm text-yadn-accent-green hover:underline"
            tabIndex={isLoading ? -1 : 0}
            aria-disabled={isLoading}
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yadn-accent-green hover:bg-yadn-acc text-yadn-accent-green/90 text-[#000A1F] font-medium py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center text-sm">
        <span className="text-yadn-primary-gray/60">
          Don&apos;t have an account?
        </span>{" "}
        <Link
          href="/auth/signup"
          className="text-yadn-accent-green hover:underline font-medium"
          tabIndex={isLoading ? -1 : 0}
          aria-disabled={isLoading}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
