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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/lib/contexts/userContext";
import { supabase } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Loader2, Lock, Mail, UserIcon } from "lucide-react";
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
    }
  }, [user, profileForm]);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen">
        <Loader2 className="h-8 w-8 animate-spin text-yadn-pink" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold text-yadn-primary-text mb-6">
        Profile Settings
      </h1>

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
                <AvatarFallback className="bg-yadn-pink text-white text-2xl">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-yadn-button-blue text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-yadn-button-blue/90 transition-colors"
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
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
                        className="bg-yadn-button-blue hover:bg-yadn-button-blue/90 text-white"
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
                        className="bg-yadn-button-blue hover:bg-yadn-button-blue/90 text-white"
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
