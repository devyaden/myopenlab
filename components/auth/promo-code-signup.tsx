"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export function PromoCodeSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(email)) newErrors.email = "Invalid email format";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!promoCode.trim()) newErrors.promoCode = "Promo code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Step 1: Check if the promo code is valid
      const { data: promoData, error: promoError } = await supabase
        .from("promo_code")
        .select("*, subscription:subscription_id(*)")
        .eq("code", promoCode.trim())
        .eq("active", true)
        .single();

      if (promoError || !promoData) {
        setErrors({ promoCode: "Invalid or expired promo code" });
        setLoading(false);
        return;
      }

      // Check if promo code has expired
      if (new Date(promoData.expiry_date) < new Date()) {
        setErrors({ promoCode: "This promo code has expired" });
        setLoading(false);
        return;
      }

      // Check if promo code is domain specific and the email matches
      if (promoData.is_domain_specific) {
        const emailDomain = email.split("@")[1];
        const allowedDomains = promoData.allowed_domains;

        if (!allowedDomains.includes(emailDomain)) {
          setErrors({
            promoCode: "This promo code is not valid for your email domain",
          });
          setLoading(false);
          return;
        }
      } else if (promoData.allowed_emails.length > 0) {
        // Check if email is in the allowed emails list
        if (!promoData.allowed_emails.includes(email)) {
          setErrors({
            promoCode: "This promo code is not valid for your email",
          });
          setLoading(false);
          return;
        }
      }

      // Check if the promo code has reached its max usage limit
      if (promoData.max_uses !== null) {
        const { count, error: countError } = await supabase
          .from("user_subscription")
          .select("*", { count: "exact" })
          .eq("promo_code_id", promoData.id);

        if (!countError && count !== null && count >= promoData.max_uses) {
          setErrors({
            promoCode: "This promo code has reached its maximum usage limit",
          });
          setLoading(false);
          return;
        }
      }

      // Step 2: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Step 3: Create a subscription for the user
      const subscriptionData = promoData.subscription;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + subscriptionData.duration);

      const { error: subscriptionError } = await supabase
        .from("user_subscription")
        .insert({
          user_id: authData.user.id,
          subscription_id: subscriptionData.id,
          promo_code_id: promoData.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        });

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Success! Redirect to success page
      toast({
        title: "Account created successfully",
        description:
          "Your subscription has been activated. Please check your email to confirm your account.",
      });

      router.push("/signup-success");
    } catch (error: any) {
      console.error("Error during signup:", error);

      let errorMessage = "Failed to create account. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details and promo code to sign up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code</Label>
            <Input
              id="promoCode"
              placeholder="Enter your promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className={`uppercase ${errors.promoCode ? "border-red-500" : ""}`}
            />
            {errors.promoCode && (
              <p className="text-sm text-red-500">{errors.promoCode}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
