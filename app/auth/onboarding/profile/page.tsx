"use client";

import { User, Mail, Lock, Gift } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { signupSchema, type SignupFormData } from "@/lib/schemas/signup.schema";
import { useRouter } from "next/navigation";
import useSignupFormStore from "@/lib/store/useSignupFormStore";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/contexts/userContext";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

export default function SignupForm() {
  const { formData, clearFormData } = useSignupFormStore();
  const router = useRouter();
  const { signUp } = useUser();
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeVerified, setPromoCodeVerified] = useState(false);
  const [verifyingPromoCode, setVerifyingPromoCode] = useState(false);
  const [verifiedPromoCodeData, setVerifiedPromoCodeData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const verifyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setVerifyingPromoCode(true);
    try {
      // Get the user's email from the form data
      const userEmail = formData.personalInfo?.email;
      if (!userEmail) {
        toast.error("Please enter your email first");
        setVerifyingPromoCode(false);
        return;
      }

      const { data, error } = await supabase
        .from("promo_code")
        .select("*, subscription:subscription_id(*)")
        .eq("code", promoCode.trim())
        .eq("active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired promo code");
        setPromoCodeVerified(false);
        setVerifiedPromoCodeData(null);
        return;
      }

      // Check if promo code has expired
      if (new Date(data.expiry_date) < new Date()) {
        toast.error("This promo code has expired");
        setPromoCodeVerified(false);
        setVerifiedPromoCodeData(null);
        return;
      }

      // Check if promo code has reached its max usage limit (only if max_uses is set)
      if (data.max_uses !== null) {
        const { count: totalUsageCount } = await supabase
          .from("user_subscription")
          .select("*", { count: "exact" })
          .eq("promo_code_id", data.id);

        if (totalUsageCount && totalUsageCount >= data.max_uses) {
          toast.error("This promo code has reached its maximum usage limit");
          setPromoCodeVerified(false);
          setVerifiedPromoCodeData(null);
          return;
        }
      }

      // Check email/domain restrictions
      const emailDomain = userEmail.split("@")[1];
      let isEmailValid = false;

      // If promo code has allowed emails, check if user's email is in the list
      if (data.allowed_emails.length > 0) {
        isEmailValid = data.allowed_emails.includes(userEmail);
      }

      // If promo code is domain specific, check if user's domain is allowed
      if (data.is_domain_specific && data.allowed_domains.length > 0) {
        isEmailValid = data.allowed_domains.includes(emailDomain);
      }

      // If neither allowed_emails nor allowed_domains are set, the promo code is unrestricted
      if (
        data.allowed_emails.length === 0 &&
        (!data.is_domain_specific || data.allowed_domains.length === 0)
      ) {
        isEmailValid = true;
      }

      if (!isEmailValid) {
        if (data.is_domain_specific) {
          toast.error("This promo code is not valid for your email domain");
        } else {
          toast.error("This promo code is not valid for your email");
        }
        setPromoCodeVerified(false);
        setVerifiedPromoCodeData(null);
        return;
      }

      toast.success(
        `Promo code verified! You'll get ${data.subscription.title} subscription.`
      );
      setPromoCodeVerified(true);
      setVerifiedPromoCodeData(data);
      setValue("promoCode", promoCode);
    } catch (err) {
      console.error("Error verifying promo code:", err);
      toast.error("Error verifying promo code");
      setPromoCodeVerified(false);
      setVerifiedPromoCodeData(null);
    } finally {
      setVerifyingPromoCode(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    const { error, user } = await signUp(
      {
        personalInfo: {
          ...data,
          promoCode: promoCodeVerified ? promoCode : undefined,
        },
        companyInfo: formData.companyInfo,
      },
      data.password
    );
    debugger;
    if (user) {
      // Create subscription for the user after successful signup
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(
        endDate.getDate() + verifiedPromoCodeData.subscription.duration
      );

      const { error: subscriptionError } = await supabase
        .from("user_subscription")
        .insert({
          user_id: user.id,
          subscription_id: verifiedPromoCodeData.subscription_id,
          promo_code_id: verifiedPromoCodeData.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        });

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        toast.error("Error creating subscription. Please contact support.");
      }
    }

    if (!error) {
      clearFormData();
      router.push("/auth/login");
    }
  };

  useEffect(() => {
    if (formData.personalInfo) {
      setValue("email", formData?.personalInfo?.email || "");
    }
  }, [formData.personalInfo]);

  useEffect(() => {
    toast("🌟 Step 3 of 3: Personal Information", {
      duration: Infinity,
      position: "bottom-center",
      icon: "👤",
    });

    return () => {
      toast.dismiss();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-screen p-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-center">
          <Image
            src="/assets/global/app-logo.png"
            alt="Logo"
            width={60}
            height={60}
          />
        </div>
        <div className="text-center mb-3 mt-3">
          <h1 className="text-xl font-semibold">
            <span className="text-yadn-accent-green">Hang tight!</span> Your
            setup is almost finished.
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <InputWithIcon
            label="Name"
            icon={<User className="h-4 w-4 text-gray-400" />}
            {...register("name")}
            error={errors.name?.message}
            placeholder="Enter your name"
            className="border-gray-200 placeholder:text-gray-400"
          />

          <InputWithIcon
            label="Username"
            icon={<User className="h-4 w-4 text-gray-400" />}
            {...register("username")}
            error={errors.username?.message}
            placeholder="Create Username"
            className="border-gray-200 placeholder:text-gray-400"
          />

          {/* <InputWithIcon
            label="Email Address"
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            {...register("email")}
            error={errors.email?.message}
            placeholder="John.Doe@gmail.com"
            type="email"
            className="border-gray-200 placeholder:text-gray-400"
          /> */}

          <InputWithIcon
            label="Password"
            icon={<Lock className="h-4 w-4 text-gray-400" />}
            {...register("password")}
            error={errors.password?.message}
            placeholder="Enter password"
            type="password"
            showPasswordToggle
            className="border-gray-200 placeholder:text-gray-400"
          />

          <InputWithIcon
            label="Confirm Password"
            icon={<Lock className="h-4 w-4 text-gray-400" />}
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            placeholder="Re-Enter password"
            type="password"
            showPasswordToggle
            className="border-gray-200 placeholder:text-gray-400"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <InputWithIcon
                label="Promo Code (Optional)"
                icon={<Gift className="h-4 w-4 text-gray-400" />}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="border-gray-200 placeholder:text-gray-400"
              />
              <Button
                type="button"
                onClick={verifyPromoCode}
                disabled={!promoCode.trim() || verifyingPromoCode}
                className="mt-6"
              >
                {verifyingPromoCode ? "Verifying..." : "Verify"}
              </Button>
            </div>
            {promoCodeVerified && (
              <p className="text-sm text-green-600">✓ Promo code verified!</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green-dark text-white font-medium mt-3"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
