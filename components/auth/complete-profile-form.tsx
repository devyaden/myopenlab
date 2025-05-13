"use client";

import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/input-with-icon";
import { useUser } from "@/lib/contexts/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

// Define Zod schema for profile completion
const profileCompletionSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  name: z.string().min(1, "Name is required."),
  company_name: z.string().optional(),
  company_email: z
    .string()
    .email("Please enter a valid company email address.")
    .optional()
    .or(z.literal("")),
  company_sector: z.string().optional(),
  company_size: z.string().optional(), // e.g., "1-10 employees"
  user_position: z.string().optional(),
  promo_code: z.string().optional(),
  // role is implicitly 'user' and handled by the context update function
});

type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

// Define error types
type ErrorType =
  | "invalid"
  | "expired"
  | "maxUsed"
  | "domainRestricted"
  | "invalidDomain"
  | "invalidEmail"
  | "error"
  | null;

// Update the PromoCodeStatus type
type EnhancedPromoCodeStatus = {
  isValid: boolean;
  error?: string | null;
  errorType?: ErrorType;
  discount?: string;
  subscription?: any;
  promoCodeData?: any;
};

export default function CompleteProfileForm() {
  const router = useRouter();
  const {
    user,
    updateUserProfileAndCompleteOnboarding,
    loading: userLoading,
  } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const promoInputRef = useRef<HTMLInputElement>(null);

  // Promo code validation states
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoStatus, setPromoStatus] =
    useState<EnhancedPromoCodeStatus | null>(null);
  const [promoValidationTimeout, setPromoValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      username: "",
      name: "",
      company_name: "",
      company_email: "",
      company_sector: "",
      company_size: "",
      user_position: "",
      promo_code: "",
    },
  });

  const promoCode = watch("promo_code");

  useEffect(() => {
    if (user) {
      setValue("name", user.name || "");
      setValue("username", user.username || ""); // Pre-fill username if available
      // Pre-fill other fields if they exist on user object from initial Google Sign In
      setValue("company_name", user.company_name || "");
      setValue("company_email", user.company_email || "");
      setValue("company_sector", user.company_sector || "");
      setValue("company_size", user.company_size || "");
      setValue("user_position", user.user_position || "");
    }
  }, [user, setValue]);

  // Validate promo code
  const validatePromoCode = async (code: string) => {
    if (code.length !== 8) return;

    setIsValidatingPromo(true);
    try {
      const userEmail = user?.email;
      if (!userEmail) {
        setPromoStatus({
          isValid: false,
          error: "User email not available",
          errorType: "invalidEmail",
        });
        return;
      }

      const { data, error } = await supabase
        .from("promo_code")
        .select("*, subscription:subscription_id(*)")
        .eq("code", code)
        .eq("active", true)
        .single();

      if (error || !data) {
        setPromoStatus({
          isValid: false,
          error: "Invalid or expired promo code",
          errorType: "invalid",
        });
        return;
      }

      // Check if promo code has expired
      if (new Date(data.expiry_date) < new Date()) {
        setPromoStatus({
          isValid: false,
          error: "This promo code has expired",
          errorType: "expired",
        });
        return;
      }

      // Check if promo code has reached its max usage limit (only if max_uses is set)
      if (data.max_uses !== null) {
        const { count: totalUsageCount } = await supabase
          .from("user_subscription")
          .select("*", { count: "exact" })
          .eq("promo_code_id", data.id);

        if (totalUsageCount && totalUsageCount >= data.max_uses) {
          setPromoStatus({
            isValid: false,
            error: "This promo code has reached its maximum usage limit",
            errorType: "maxUsed",
          });
          return;
        }
      }

      // Check email/domain restrictions
      const emailDomain = userEmail.split("@")[1];
      let isEmailValid = false;

      // If promo code has allowed emails, check if user's email is in the list
      if (data.allowed_emails && data.allowed_emails.length > 0) {
        isEmailValid = data.allowed_emails.includes(userEmail);
      }

      // If promo code is domain specific, check if user's domain is allowed
      if (
        data.is_domain_specific &&
        data.allowed_domains &&
        data.allowed_domains.length > 0
      ) {
        isEmailValid = data.allowed_domains.includes(emailDomain);
      }

      // If neither allowed_emails nor allowed_domains are set, the promo code is unrestricted
      if (
        (!data.allowed_emails || data.allowed_emails.length === 0) &&
        (!data.is_domain_specific ||
          !data.allowed_domains ||
          data.allowed_domains.length === 0)
      ) {
        isEmailValid = true;
      }

      if (!isEmailValid) {
        if (data.is_domain_specific) {
          setPromoStatus({
            isValid: false,
            error: "This promo code is not valid for your email domain",
            errorType: "invalidDomain",
          });
        } else {
          setPromoStatus({
            isValid: false,
            error: "This promo code is not valid for your email",
            errorType: "invalidEmail",
          });
        }
        return;
      }

      setPromoStatus({
        isValid: true,
        discount: `${data.subscription.title} subscription`,
        subscription: data.subscription,
        promoCodeData: data,
        errorType: null,
        error: null,
      });
    } catch (error) {
      console.error("Error validating promo code:", error);
      setPromoStatus({
        isValid: false,
        error: "Error validating promo code",
        errorType: "error",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Handle promo code change
  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit to 8 characters and uppercase
    const value = e.target.value.toUpperCase().slice(0, 8);
    setValue("promo_code", value);

    // Reset promo status when user changes the code
    setPromoStatus(null);

    // Debounce promo code validation
    if (promoValidationTimeout) {
      clearTimeout(promoValidationTimeout);
    }

    // Only validate if we have a complete 8-character code
    if (value.length === 8) {
      const timeout = setTimeout(() => {
        validatePromoCode(value);
      }, 500);
      setPromoValidationTimeout(timeout);
    }
  };

  // Get promo error message
  const getPromoErrorMessage = () => {
    if (!promoStatus || promoStatus.isValid || !promoStatus.error) return null;

    const icon = <AlertCircle className="h-4 w-4 mr-1" />;

    return (
      <div className="flex items-center text-xs font-medium mt-2">
        {icon}
        <span>{promoStatus.error}</span>
      </div>
    );
  };

  const onSubmit = async (data: ProfileCompletionFormData) => {
    if (!user || !updateUserProfileAndCompleteOnboarding) {
      toast.error("User context not available. Please try again.");
      return;
    }

    debugger;
    setIsSubmitting(true);
    try {
      const userPayload = {
        ...data,
      };

      delete userPayload.promo_code;
      await updateUserProfileAndCompleteOnboarding(userPayload);

      // If we have a valid promo code, create a subscription for the user
      if (
        promoStatus?.isValid &&
        promoStatus.promoCodeData &&
        promoStatus.subscription &&
        user.id
      ) {
        // Create subscription for the user
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + promoStatus.subscription.duration);

        const { error: subscriptionError } = await supabase
          .from("user_subscription")
          .insert({
            id: uuidv4(),
            user_id: user.id,
            subscription_id: promoStatus.promoCodeData.subscription_id,
            promo_code_id: promoStatus.promoCodeData.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
          });

        if (subscriptionError) {
          console.error("Error creating subscription:", subscriptionError);
          toast.error("Error creating subscription. Please contact support.");
        } else {
          toast.success("Subscription activated successfully!");
        }
      }

      toast.success("Profile completed successfully!");
      // Redirection to /protected will be handled by the context updateUserProfileAndCompleteOnboarding method
    } catch (error: any) {
      toast.error(
        error.message || "Failed to complete profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green" />
      </div>
    );
  }

  if (!user && !userLoading) {
    // This case should ideally be handled by redirection logic in userContext
    // if user is not logged in and tries to access this page.
    toast.error("No user session found. Redirecting to login.");
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6 shadow-xl rounded-lg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-yadn-primary-gray">
          Complete Your Profile
        </h1>
        <p className="text-sm text-yadn-primary-gray/70">
          Welcome, {user?.email || "user"}! Just a few more details to get you
          started.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Full Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="name"
                type="text"
                placeholder="Enter your full name"
                error={errors.name?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Username
          </label>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="username"
                type="text"
                placeholder="Choose a username"
                error={errors.username?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div className="pt-4">
          <h2 className="text-lg font-medium text-yadn-primary-gray">
            Company Details (Optional)
          </h2>
        </div>

        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Company Name
          </label>
          <Controller
            name="company_name"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="company_name"
                type="text"
                placeholder="Your company's name"
                error={errors.company_name?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label
            htmlFor="company_email"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Company Email
          </label>
          <Controller
            name="company_email"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="company_email"
                type="email"
                placeholder="Your company's email address"
                error={errors.company_email?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label
            htmlFor="company_sector"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Company Sector
          </label>
          <Controller
            name="company_sector"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="company_sector"
                type="text"
                placeholder="e.g., Technology, Healthcare, Finance"
                error={errors.company_sector?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label
            htmlFor="company_size"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Company Size
          </label>
          <Controller
            name="company_size"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="company_size"
                type="text"
                placeholder="e.g., 1-10, 11-50, 50+"
                error={errors.company_size?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label
            htmlFor="user_position"
            className="block text-sm font-medium text-yadn-primary-gray/80 mb-2"
          >
            Your Position/Role
          </label>
          <Controller
            name="user_position"
            control={control}
            render={({ field }) => (
              <InputWithIcon
                {...field}
                id="user_position"
                type="text"
                placeholder="e.g., Software Engineer, Product Manager"
                error={errors.user_position?.message}
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div className="pt-4">
          <h2 className="text-lg font-medium text-yadn-primary-gray">
            Promo Code (Optional)
          </h2>
        </div>

        {/* Promo Code Section */}
        <div className="flex justify-center">
          <div className="inline-block">
            <table
              className={cn(
                "bg-yadn-accent-green rounded-lg shadow-md",
                promoStatus?.isValid && "bg-yadn-accent-green",
                promoStatus?.isValid === false && "bg-yadn-accent-green/80"
              )}
              cellPadding="0"
              cellSpacing="0"
              style={{ margin: "0 auto" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        border: "2px solid #000A1F",
                        padding: "15px 20px",
                        backgroundColor: "transparent",
                        position: "relative",
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="sr-only">
                        <Controller
                          name="promo_code"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              ref={promoInputRef}
                              type="text"
                              maxLength={8}
                              className="sr-only"
                              aria-label="Promo code"
                              onChange={handlePromoCodeChange}
                            />
                          )}
                        />
                      </div>
                      <div
                        className="flex space-x-3 cursor-text flex-1 justify-center"
                        onClick={() => promoInputRef.current?.focus()}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center w-8"
                          >
                            <div className="text-[#000A1F] text-2xl font-bold h-8 flex items-center justify-center">
                              {(promoCode && promoCode[index]) || ""}
                            </div>
                            <div className="h-0.5 w-full bg-[#000A1F]"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Promo code status message */}
                    {isValidatingPromo && (
                      <div className="mt-2 text-xs font-medium text-[#000A1F]">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    )}
                    {promoStatus && !isValidatingPromo && (
                      <div
                        className={cn(
                          "mt-2 text-xs font-medium",
                          promoStatus.isValid
                            ? "text-[#000A1F]"
                            : "text-red-700"
                        )}
                      >
                        {promoStatus.isValid ? (
                          <div className="flex items-center justify-center">
                            <Check className="h-4 w-4 mr-1" />
                            <span>Valid: {promoStatus.discount}</span>
                          </div>
                        ) : (
                          getPromoErrorMessage()
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-center text-xs text-yadn-primary-gray/60">
          Enter your promo code (optional)
        </p>

        <Button
          type="submit"
          disabled={isSubmitting || userLoading || isValidatingPromo}
          className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-[#000A1F] font-medium py-3 mb-2"
        >
          {isSubmitting || isValidatingPromo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSubmitting ? "Saving..." : "Validating..."}
            </>
          ) : (
            "Save and Continue"
          )}
        </Button>
      </form>
    </div>
  );
}
