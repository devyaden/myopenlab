import { redirect } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../supabase/client";
import { SignupFormData } from "../types/forms.types";
import { User } from "@/types/auth";
import { z } from "zod";

// Define Zod schema and type for profile completion (can be imported from the form component or a types file)
// For now, defining it here for clarity in this step.
const profileCompletionSchemaForContext = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  name: z.string().min(1, "Name is required."),
  company_name: z.string().optional(),
  company_email: z
    .string()
    .email("Please enter a valid company email address.")
    .optional()
    .or(z.literal("")),
  company_sector: z.string().optional(),
  company_size: z.string().optional(),
  user_position: z.string().optional(),
});
export type ProfileCompletionFormData = z.infer<
  typeof profileCompletionSchemaForContext
>;

type UserContextType = {
  user: User | null;
  loading: boolean;
  signUp: (
    data: SignupFormData,
    password: string
  ) => Promise<{ error?: any; user: any }>;
  signIn: (email: string, password: string) => Promise<any>;
  checkIfEmailExists: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  resetPassword: (
    password: string,
    confirmPassword: string
  ) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
  updateUserProfileAndCompleteOnboarding?: (
    data: ProfileCompletionFormData
  ) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string | undefined) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.log("---- error while fetching user ----", error);
    }

    setUser(data);
    return data;
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await fetchUserData(session?.user?.id);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setTimeout(async () => {
              const fetchedUser = await fetchUserData(session?.user?.id);
              // if (
              //   fetchedUser &&
              //   !fetchedUser.onboarding_completed &&
              //   !window.location.pathname.startsWith(
              //     "/auth/complete-profile"
              //   ) &&
              //   !window.location.pathname.startsWith("/auth/login") &&
              //   window.location.pathname !== "/auth/callback"
              // ) {
              //   window.location.href = "/auth/complete-profile";
              // }
            });
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  const signUp = async (data: SignupFormData, password: string) => {
    const userAdditionalAttributes = {
      email: data?.personalInfo?.email as string,
      username: data?.personalInfo?.username,
      name: data?.personalInfo?.name,
      company_name: data?.companyInfo?.companyName,
      company_email: data?.companyInfo?.companyEmail,
      company_sector: data?.companyInfo?.companySector,
      company_size: data?.companyInfo?.companySize,
      user_position: data?.companyInfo?.userPosition,
    };

    const origin = window.location.origin;
    const { data: signupUser, error } = await supabase.auth.signUp({
      email: data?.personalInfo?.email as string,
      password,

      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: userAdditionalAttributes,
      },
    });

    if (error) {
      toast.error(error.message ?? "Sign up failed. Please try again later.");
      return { error: error.message, user: null };
    }

    toast.success("Success. Please check your email for a verification link.");
    return {
      error: null,
      user: signupUser?.user,
    };
  };

  const checkIfEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("email", email);

    if (error) {
      toast.error("Error checking email");
      return false;
    }

    return data.length > 0;
  };

  const signIn = async (email: string, password: string) => {
    const { error, data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (signInData?.user) {
      await fetchUserData(signInData.user.id);
      // if (
      //   fetchedUser &&
      //   !fetchedUser.onboarding_completed &&
      //   !window.location.pathname.startsWith("/auth/complete-profile")
      // ) {
      //   window.location.href = "/auth/complete-profile";
      //   return;
      // }
    }

    window.location.href = "/protected";
  };

  const signInWithGoogle = async () => {
    console.log("-----------------", process.env.NEXT_PUBLIC_SERVER_URL);
    debugger;
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/callback`,
      },
    });

    if (error) {
      toast.error("Google sign-in failed");
      throw error;
    }

    // The actual redirection to Google will happen here.
    // The onboarding check will occur in onAuthStateChange after Google redirects back.
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const signOut = async () => {
    // Clear recent documents from localStorage
    localStorage.removeItem("recentDocuments");

    await supabase.auth.signOut();
    setUser(null);

    window.location.href = "/auth/login";
  };

  const forgotPassword = async (email: string) => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
      toast.error("Could not reset password");
      return { error: error.message };
    }

    toast.success("Check your email for a link to reset your password.");
    return {};
  };

  const resetPassword = async (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return { error: "Passwords do not match" };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error("Password update failed");
      return { error: error.message };
    }

    toast.success("Password updated successfully");
    redirect("/protected");
  };

  const refreshSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetchUserData(session?.user?.id);
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  const updateUserProfileAndCompleteOnboarding = async (
    data: ProfileCompletionFormData
  ) => {
    if (!user) throw new Error("User not authenticated");

    const updates = {
      ...data,
      username: data.username.toLowerCase(),
      onboarding_completed: true,
      role: user.role || "user",
    };

    const { error } = await supabase
      .from("user")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user profile:", error);
      toast.error(error.message || "Failed to update profile.");
      throw error;
    }

    await fetchUserData(user.id);
    toast.success("Profile updated successfully!");
    window.location.href = "/protected";
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        checkIfEmailExists,
        signInWithGoogle,
        signOut,
        forgotPassword,
        resetPassword,
        refreshSession,
        updateUserProfileAndCompleteOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
