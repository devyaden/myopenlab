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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        .single();

      if (!error && data) {
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
      <div className="flex items-center justify-center min-h-screen w-screen">
        <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green" />
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
          className="mr-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-8 w-8 text-yadn-primary-text" />
        </Button>
        <h1 className="text-3xl font-bold text-yadn-primary-text">
          Profile Settings
        </h1>
      </div>

      {/* <h1 className="text-3xl font-bold text-yadn-primary-text mb-6">
        Profile Settings
      </h1> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg?height=128&width=128"}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="bg-yadn-accent-green text-white text-2xl">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-yadn-accent-green text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-yadn-accent-green/90 transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
                disabled={uploadingImage}
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              Click the camera icon to upload a new photo
            </p>
          </CardContent>
        </Card>

        {/* Profile Settings Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Full Name"
                        {...profileForm.register("name")}
                        icon={<UserIcon className="h-4 w-4 text-gray-500" />}
                        error={profileForm.formState.errors.name?.message}
                      />
                      <InputWithIcon
                        label="Username"
                        {...profileForm.register("username")}
                        icon={<UserIcon className="h-4 w-4 text-gray-500" />}
                        error={profileForm.formState.errors.username?.message}
                      />
                    </div>
                    <InputWithIcon
                      label="Email Address"
                      type="email"
                      {...profileForm.register("email")}
                      icon={<Mail className="h-4 w-4 text-gray-500" />}
                      error={profileForm.formState.errors.email?.message}
                    />

                    <Separator className="my-6" />

                    <h3 className="text-lg font-medium">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Company Name"
                        {...profileForm.register("company_name")}
                      />
                      <InputWithIcon
                        label="Company Email"
                        type="email"
                        {...profileForm.register("company_email")}
                        error={
                          profileForm.formState.errors.company_email?.message
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWithIcon
                        label="Industry/Sector"
                        {...profileForm.register("company_sector")}
                      />
                      <InputWithIcon
                        label="Company Size"
                        {...profileForm.register("company_size")}
                      />
                    </div>
                    <InputWithIcon
                      label="Your Position"
                      {...profileForm.register("user_position")}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                        disabled={profileForm.formState.isSubmitting}
                      >
                        {profileForm.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
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
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <InputWithIcon
                      label="Current Password"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                      icon={<Lock className="h-4 w-4 text-gray-500" />}
                      showPasswordToggle
                      error={
                        passwordForm.formState.errors.currentPassword?.message
                      }
                    />
                    <InputWithIcon
                      label="New Password"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      icon={<Lock className="h-4 w-4 text-gray-500" />}
                      showPasswordToggle
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <InputWithIcon
                      label="Confirm New Password"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      icon={<Lock className="h-4 w-4 text-gray-500" />}
                      showPasswordToggle
                      error={
                        passwordForm.formState.errors.confirmPassword?.message
                      }
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                        disabled={passwordForm.formState.isSubmitting}
                      >
                        {passwordForm.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Update Password
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
                      <Loader2 className="h-8 w-8 animate-spin text-yadn-accent-green" />
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Current Plan Card */}
                      <div className="bg-gradient-to-br from-yadn-accent-green/5 to-yadn-accent-green/10 border-2 border-yadn-accent-green/20 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-yadn-primary-text">
                                {subscription.planName || "Pro Plan"}
                              </h4>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                Active
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Your current subscription plan
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-yadn-accent-green">
                                {subscription.stripeCurrency}{Math.round(subscription.stripePrice || 0)}
                              </span>
                              <span className="text-sm text-gray-600">
                                /{subscription.stripeInterval}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-yadn-accent-green/20">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Started
                            </p>
                            <p className="text-sm font-semibold text-yadn-primary-text">
                              {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Next Billing
                            </p>
                            <p className="text-sm font-semibold text-yadn-primary-text">
                              {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mt-6 pt-6 border-t border-yadn-accent-green/20">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Your plan includes:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-yadn-accent-green flex-shrink-0" />
                              <span className="text-sm text-gray-700">Unlimited diagrams</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-yadn-accent-green flex-shrink-0" />
                              <span className="text-sm text-gray-700">Unlimited AI requests</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-yadn-accent-green flex-shrink-0" />
                              <span className="text-sm text-gray-700">All diagram types</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-yadn-accent-green flex-shrink-0" />
                              <span className="text-sm text-gray-700">Priority support</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Section */}
                      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Cancel Subscription
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                              You'll be downgraded to the free plan at the end of your current billing period and lose access to premium features.
                            </p>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
                              onClick={() => setShowCancelDialog(true)}
                              disabled={cancelingSubscription}
                            >
                              Cancel Subscription
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      {/* Free Plan Card */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Free Plan
                          </h4>
                          <p className="text-sm text-gray-600 mb-6">
                            You're currently using the free plan
                          </p>

                          {/* Free Plan Features */}
                          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                              Free Plan Includes
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">1 diagram</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">5 AI requests per month</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Basic diagram types</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Export as PNG/SVG</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => router.push("/pricing")}
                            className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white w-full"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
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
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose access to premium features immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              After canceling, you'll be downgraded to the free plan with:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                Limited to 1 diagram
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                Only 5 AI requests per month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                No PDF export
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                No advanced shapes
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelingSubscription}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription}
            >
              {cancelingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
