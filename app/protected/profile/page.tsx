"use client";

import type React from "react";

import { InputWithIcon } from "@/components/input-with-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RedeemPromoCode } from "@/components/subscription/redeem-promo-code";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/lib/contexts/userContext";
import { supabase } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  company_name: z.string().optional(),
  company_email: z
    .string()
    .email("Invalid company email")
    .optional()
    .or(z.literal("")),
  company_sector: z.string().optional(),
  company_size: z.string().optional(),
  user_position: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Password form schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user, refreshSession } = useUser();
  const router = useRouter();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      company_name: "",
      company_email: "",
      company_sector: "",
      company_size: "",
      user_position: "",
    },
    mode: "onBlur",
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        company_name: user.company_name || "",
        company_email: user.company_email || "",
        company_sector: user.company_sector || "",
        company_size: user.company_size || "",
        user_position: user.user_position || "",
      });

      if (user.avatar_url) {
        downloadImage(user.avatar_url);
      }

      // Load subscription data
      loadSubscription();
    }
  }, [user, profileForm]);

  async function loadSubscription() {
    try {
      setLoadingSubscription(true);
      const { data, error } = await supabase
        .from("user_subscription")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // Set default plan name for promo code subscriptions
        if (!data.planName && data.promo_code_id) {
          data.planName = "Pro Plan";
        }

        if (data.stripe_subscription_id && !data.stripe_subscription_id.startsWith('local_test_')) {
          try {
            const stripeResponse = await fetch(`/api/stripe/subscription/${data.stripe_subscription_id}`);
            if (stripeResponse.ok) {
              const stripeData = await stripeResponse.json();
              // Add Stripe data to subscription
              data.stripePrice = stripeData.price;
              data.stripeCurrency = stripeData.currencySymbol;
              data.stripeInterval = stripeData.interval;
            }
          } catch (error) {
            console.log("Could not fetch Stripe subscription details");
          }
        } else if (data.stripe_subscription_id?.startsWith('local_test_')) {
          // For local test subscriptions, fetch plan details from products API
          try {
            const productsResponse = await fetch('/api/stripe/products');
            if (productsResponse.ok) {
              const productsData = await productsResponse.json();
              // Determine plan type from subscription ID or dates
              let isYearly = data.stripe_subscription_id.includes('yearly');
              let isMonthly = data.stripe_subscription_id.includes('monthly');

              // If not in ID, calculate from dates
              if (!isYearly && !isMonthly) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(data.end_date);
                const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                                   (endDate.getMonth() - startDate.getMonth());

                isYearly = monthsDiff >= 12;
                isMonthly = monthsDiff < 12;
              }

              // Find the matching product based on interval
              const matchingProduct = productsData.products.find((p: any) => {
                const interval = p.defaultPrice?.interval;
                if (isYearly && (interval === 'year' || interval === 'yearly')) return true;
                if (isMonthly && interval === 'month') return true;
                return false;
              });

              if (matchingProduct && matchingProduct.defaultPrice) {
                data.stripePrice = matchingProduct.defaultPrice.amount / 100;
                data.stripeCurrency = matchingProduct.defaultPrice.currencySymbol;
                data.stripeInterval = matchingProduct.defaultPrice.interval;
                data.planName = matchingProduct.name;
              } else {
                // If no match found, default to first product (usually monthly)
                const defaultProduct = productsData.products[0];
                if (defaultProduct && defaultProduct.defaultPrice) {
                  data.stripePrice = defaultProduct.defaultPrice.amount / 100;
                  data.stripeCurrency = defaultProduct.defaultPrice.currencySymbol;
                  data.stripeInterval = defaultProduct.defaultPrice.interval;
                  data.planName = defaultProduct.name;
                }
              }
            }
          } catch (error) {
            console.log("Could not fetch product details for local test", error);
          }
        }
        setSubscription(data);
      }
    } catch (error) {
      console.log("No active subscription found");
    } finally {
      setLoadingSubscription(false);
    }
  }

  async function handleCancelSubscription() {
    try {
      setCancelingSubscription(true);
      setShowCancelDialog(false);
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      toast.success("Subscription canceled successfully. Switching to Free Plan...");

      setSubscription(null);

      sessionStorage.clear();
      localStorage.removeItem('subscription_cache');

    } catch (error: any) {
      toast.error(error.message || "Error canceling subscription");
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from("yadn-diagrams")
        .download(`avatars/${path}`);
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log("Error downloading image: ", error);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploadingImage(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("yadn-diagrams")
        .upload(`avatars/${filePath}`, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Update user profile with avatar URL - store just the filename, not the full path
      const { error: updateError } = await supabase
        .from("user")
        .update({ avatar_url: filePath })
        .eq("id", user?.id);

      if (updateError) {
        throw updateError;
      }

      await refreshSession();
      downloadImage(filePath);
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
    } finally {
      setUploadingImage(false);
    }
  }

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      profileForm.formState.isSubmitting;

      // Update user profile in Supabase
      const { error } = await supabase
        .from("user")
        .update({
          name: data.name,
          username: data.username,
          company_name: data.company_name,
          company_email: data.company_email,
          company_sector: data.company_sector,
          company_size: data.company_size,
          user_position: data.user_position,
        })
        .eq("id", user?.id);

      if (error) throw error;

      // Update email in auth if changed
      if (user?.email !== data.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (emailError) throw emailError;
        toast.success("Verification email sent to your new email address");
      }

      await refreshSession();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      passwordForm.formState.isSubmitting;

      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: data.currentPassword,
      });

      if (signInError) {
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect",
        });
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      // Reset form
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated successfully");
    } catch (error: any) {
      if (!error.message.includes("Current password is incorrect")) {
        toast.error(error.message || "Error updating password");
      }
    }
  };

  const handleGoBack = () => {
    router.back(); // Navigate to the previous page
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          aria-label="Go back"
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Profile &amp; account
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-display">Profile photo</CardTitle>
            <CardDescription>
              This appears next to your name across the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-32 w-32 border-4 border-card shadow-md ring-1 ring-border">
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg?height=128&width=128"}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="bg-signal text-signal-foreground text-2xl">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                title="Upload a new photo"
                className="absolute bottom-0 right-0 bg-signal text-signal-foreground p-2 rounded-full cursor-pointer shadow-md hover:bg-signal-hover transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <span className="sr-only">Upload a new profile photo</span>
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/png, image/jpeg"
                onChange={uploadAvatar}
                className="sr-only"
                disabled={uploadingImage}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Tap the camera to choose a new photo.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              JPG or PNG, up to 5&nbsp;MB.
            </p>
          </CardContent>
        </Card>

        {/* Profile Settings Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Account settings</CardTitle>
            <CardDescription>
              Update your details, password, and plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Personal information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Full Name"
                        {...profileForm.register("name")}
                        icon={<UserIcon className="h-4 w-4 text-muted-foreground" />}
                        error={profileForm.formState.errors.name?.message}
                      />
                      <InputWithIcon
                        label="Username"
                        {...profileForm.register("username")}
                        icon={<UserIcon className="h-4 w-4 text-muted-foreground" />}
                        error={profileForm.formState.errors.username?.message}
                      />
                    </div>
                    <InputWithIcon
                      label="Email address"
                      type="email"
                      {...profileForm.register("email")}
                      icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                      error={profileForm.formState.errors.email?.message}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you change this, we&apos;ll email the new address to
                      confirm it before it takes effect.
                    </p>

                    <Separator className="my-6" />

                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Company information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Optional &mdash; helps us tailor your workspace.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Company name"
                        {...profileForm.register("company_name")}
                      />
                      <InputWithIcon
                        label="Company email"
                        type="email"
                        {...profileForm.register("company_email")}
                        error={
                          profileForm.formState.errors.company_email?.message
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Industry or sector"
                        {...profileForm.register("company_sector")}
                      />
                      <InputWithIcon
                        label="Company size"
                        {...profileForm.register("company_size")}
                      />
                    </div>
                    <InputWithIcon
                      label="Your role"
                      {...profileForm.register("user_position")}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        variant="signal"
                        disabled={profileForm.formState.isSubmitting}
                      >
                        {profileForm.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Change password
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your current password, then choose a new one of at
                      least 6 characters.
                    </p>
                    <InputWithIcon
                      label="Current password"
                      type="password"
                      autoComplete="current-password"
                      {...passwordForm.register("currentPassword")}
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                      showPasswordToggle
                      error={
                        passwordForm.formState.errors.currentPassword?.message
                      }
                    />
                    <InputWithIcon
                      label="New password"
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register("newPassword")}
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                      showPasswordToggle
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <InputWithIcon
                      label="Confirm new password"
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register("confirmPassword")}
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                      showPasswordToggle
                      error={
                        passwordForm.formState.errors.confirmPassword?.message
                      }
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        variant="signal"
                        disabled={passwordForm.formState.isSubmitting}
                      >
                        {passwordForm.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating…
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Update password
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription">
                <div className="space-y-6">
                  {loadingSubscription ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-signal" />
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Current Plan Card */}
                      <div className="bg-signal-tint border-2 border-signal/20 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-display text-xl font-bold text-foreground">
                                {subscription.planName || "Pro Plan"}
                              </h4>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-signal/10 text-signal border border-signal/20">
                                Active
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Your current plan
                            </p>
                          </div>
                          <div className="text-right">
                            {subscription.promo_code_id ? (
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-signal">
                                  Promo code
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Free via promo
                                </span>
                              </div>
                            ) : subscription.stripePrice ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-signal">
                                  {subscription.stripeCurrency}{Math.round(subscription.stripePrice)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  /{subscription.stripeInterval}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-signal">
                                Free
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-signal/20">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Started
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Next billing
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mt-6 pt-6 border-t border-signal/20">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Your plan includes:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-signal flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">Unlimited diagrams</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-signal flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">Unlimited AI requests</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-signal flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">All diagram types</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-signal flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">Priority support</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Section - Only show for paid subscriptions (not promo codes) */}
                      {!subscription.promo_code_id && (
                        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-display font-semibold text-foreground mb-2">
                                Cancel subscription
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                You&apos;ll stay on your current plan until the
                                end of this billing period, then move to the free
                                plan. You can resubscribe any time.
                              </p>
                              <Button
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={cancelingSubscription}
                              >
                                Cancel subscription
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <RedeemPromoCode onRedeemed={loadSubscription} />
                    </div>
                  ) : (
                    <div className="py-8">
                      {/* Free Plan Card */}
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 bg-signal-tint text-signal rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-8 w-8" />
                          </div>
                          <h4 className="font-display text-lg font-semibold text-foreground mb-2">
                            Free plan
                          </h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            You&apos;re on the free plan. Upgrade for unlimited
                            playbooks and AI.
                          </p>

                          {/* Free Plan Features */}
                          <div className="bg-card border border-border rounded-lg p-4 mb-6 text-left">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                              What&apos;s included
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">1 diagram</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">5 AI requests per month</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">Basic diagram types</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">Export as PNG or SVG</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="signal"
                            onClick={() => router.push("/pricing")}
                            className="w-full"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <RedeemPromoCode onRedeemed={loadSubscription} />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel subscription?"
        description="You'll keep your current plan until the end of this billing period, then move to the free plan."
        blastRadiusLabel="On the free plan you'll be limited to:"
        blastRadius={[
          "1 diagram",
          "5 AI requests per month",
          "No PDF export",
          "No advanced shapes",
        ]}
        destructive
        loading={cancelingSubscription}
        confirmLabel="Yes, cancel subscription"
        cancelLabel="Keep subscription"
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}
