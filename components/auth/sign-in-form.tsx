"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/lib/contexts/userContext";
import { errorTracker } from "@/lib/posthog/errors";
import { FormEvent, InteractionEvent } from "@/lib/posthog/events";
import { tracker } from "@/lib/posthog/tracker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

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
  const [formStartTime, setFormStartTime] = useState<number>(Date.now());
  const { signIn, signInWithGoogle } = useUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Track form start when component mounts
  useEffect(() => {
    tracker.trackForm(FormEvent.FORM_STARTED, {
      form_name: "signin_form",
      form_step: 1,
    });
    setFormStartTime(Date.now());
  }, []);

  // Track validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const validationErrors = Object.entries(errors).map(
        ([field, error]) => `${field}: ${error?.message}`
      );

      tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: "signin_form",
        validation_errors: validationErrors,
        form_step: 1,
      });

      // Track individual field errors
      Object.entries(errors).forEach(([fieldName, error]) => {
        if (error?.message) {
          errorTracker.trackValidationError(
            "signin_form",
            fieldName,
            error.message
          );
        }
      });
    }
  }, [errors]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    // Track form submission
    tracker.trackForm(FormEvent.FORM_SUBMITTED, {
      form_name: "signin_form",
      form_duration: Date.now() - formStartTime,
      form_step: 1,
    });

    try {
      await signIn(data.email, data.password);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      // Track form submission error
      tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: "signin_form",
        error_message: error.message,
        validation_errors: [error.message],
        form_step: 1,
      });

      toast.error(error.message ?? "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  // Track field focus events
  const handleFieldFocus = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_FOCUSED, {
      form_name: "signin_form",
      field_name: fieldName,
      form_step: 1,
    });
  };

  // Track field blur events
  const handleFieldBlur = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_BLURRED, {
      form_name: "signin_form",
      field_name: fieldName,
      form_step: 1,
    });
  };

  // Track remember me checkbox
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "checkbox",
      element_text: "remember_me",
      interaction_context: "signin_form",
    });
  };

  // Track forgot password link click
  const handleForgotPasswordClick = () => {
    tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
      element_type: "link",
      element_text: "Forgot password?",
      interaction_context: "signin_form",
    });
  };

  // Track signup link click
  const handleSignupLinkClick = () => {
    tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
      element_type: "link",
      element_text: "Sign up",
      interaction_context: "signin_form",
    });
  };

  return (
    <div className="w-full space-y-6">
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
                onFocus={() => handleFieldFocus("email")}
                onBlur={() => handleFieldBlur("email")}
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
                onFocus={() => handleFieldFocus("password")}
                onBlur={() => handleFieldBlur("password")}
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
              onCheckedChange={handleRememberMeChange}
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
            onClick={handleForgotPasswordClick}
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yadn-accent-green hover:bg-yadn-acc text-yadn-accent-green/90 text-[#000A1F] font-medium py-6"
          onClick={() => {
            tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
              element_type: "button",
              element_text: "Sign In",
              interaction_context: "signin_form",
            });
          }}
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
          onClick={handleSignupLinkClick}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
