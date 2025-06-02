import { User } from "@/types/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { supabase } from "../supabase/client";
import { SignupFormData } from "../types/forms.types";
// Import tracking utilities
import { errorTracker } from "@/lib/posthog/errors";
import { AuthEvent } from "@/lib/posthog/events";
import { sessionManager } from "@/lib/posthog/session";
import { tracker } from "@/lib/posthog/tracker";

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
  resetPassword: (password: string, confirmPassword: string) => Promise<any>;
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

    try {
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("---- error while fetching user ----", error);
        errorTracker.trackAPIError("/user", error.message, 500, {
          userId,
          action: "fetch_user_data",
        });
      }

      setUser(data);

      // Update session with user info if data exists
      if (data) {
        sessionManager.setUser(data.id, data.email);
      }

      return data;
    } catch (error: any) {
      errorTracker.trackAPIError(
        "/user",
        error.message || "Failed to fetch user data",
        500,
        { userId, action: "fetch_user_data" }
      );
      throw error;
    }
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
        } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          } else {
            // User logged out or session ended, clear everything properly
            setUser(null);
            sessionManager.clearUser();
          }
        });

        return () => subscription.unsubscribe();
      } catch (error: any) {
        console.error("Error getting user:", error);
        errorTracker.trackSystemError(
          error.message || "Failed to initialize user session",
          "UserProvider"
        );
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  const signUp = async (data: SignupFormData, password: string) => {
    // Track signup start
    tracker.trackAuth(AuthEvent.SIGNUP_STARTED, {
      auth_method: "email",
      email_domain: data?.personalInfo?.email?.split("@")[1],
    });

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

    try {
      const { data: signupUser, error } = await supabase.auth.signUp({
        email: data?.personalInfo?.email as string,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: userAdditionalAttributes,
        },
      });

      if (error) {
        // Track signup failure
        tracker.trackAuth(AuthEvent.SIGNUP_FAILED, {
          auth_method: "email",
          error_message: error.message,
          email_domain: data?.personalInfo?.email?.split("@")[1],
        });

        errorTracker.trackAuthenticationError("email_signup", error.message, {
          formData: userAdditionalAttributes,
        });

        toast.error(error.message ?? "Sign up failed. Please try again later.");
        return { error: error.message, user: null };
      }

      // Track successful signup
      tracker.trackAuth(AuthEvent.SIGNUP_COMPLETED, {
        auth_method: "email",
        email_domain: data?.personalInfo?.email?.split("@")[1],
      });

      toast.success(
        "Success. Please check your email for a verification link."
      );
      return {
        error: null,
        user: signupUser?.user,
      };
    } catch (error: any) {
      tracker.trackAuth(AuthEvent.SIGNUP_FAILED, {
        auth_method: "email",
        error_message: error.message || "Network error",
        email_domain: data?.personalInfo?.email?.split("@")[1],
      });

      errorTracker.trackNetworkError(
        "/auth/signup",
        error.message || "Network error during signup"
      );

      throw error;
    }
  };

  const checkIfEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("email", email);

      if (error) {
        errorTracker.trackAPIError("/user", error.message, 500, {
          action: "check_email_exists",
        });
        toast.error("Error checking email");
        return false;
      }

      return data.length > 0;
    } catch (error: any) {
      errorTracker.trackNetworkError(
        "/user",
        error.message || "Failed to check email existence"
      );
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Track login start
    tracker.trackAuth(AuthEvent.LOGIN_STARTED, {
      auth_method: "email",
      email_domain: email.split("@")[1],
    });

    try {
      const { error, data: signInData } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        // Track login failure
        tracker.trackAuth(AuthEvent.LOGIN_FAILED, {
          auth_method: "email",
          error_message: error.message,
          email_domain: email.split("@")[1],
        });

        errorTracker.trackAuthenticationError("email_login", error.message, {
          formData: { email },
        });

        toast.error(error.message);
        throw error;
      }

      if (signInData?.user) {
        await fetchUserData(signInData.user.id);

        // Track successful login
        tracker.trackAuth(AuthEvent.LOGIN_COMPLETED, {
          auth_method: "email",
          email_domain: email.split("@")[1],
        });

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
    } catch (error: any) {
      if (!error.message?.includes("Invalid login credentials")) {
        errorTracker.trackNetworkError(
          "/auth/signin",
          error.message || "Network error during login"
        );
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    // Track Google auth start
    tracker.trackAuth(AuthEvent.GOOGLE_AUTH_STARTED, {
      auth_method: "google",
    });

    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/callback`,
        },
      });

      if (error) {
        // Track Google auth failure
        tracker.trackAuth(AuthEvent.GOOGLE_AUTH_FAILED, {
          auth_method: "google",
          error_message: error.message,
        });

        errorTracker.trackAuthenticationError("google_auth", error.message);

        toast.error("Google sign-in failed");
        throw error;
      }

      // The actual redirection to Google will happen here.
      // The onboarding check will occur in onAuthStateChange after Google redirects back.
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      errorTracker.trackNetworkError(
        "/auth/google",
        error.message || "Network error during Google auth"
      );
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Track logout BEFORE clearing user data so we still have user context
      tracker.trackAuth(AuthEvent.LOGOUT, {
        auth_method: user ? "authenticated" : "anonymous",
      });

      // Clear recent documents from localStorage
      localStorage.removeItem("recentDocuments");

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear user state
      setUser(null);

      // This will reset PostHog identity and start a new anonymous session
      sessionManager.clearUser();

      // Redirect to login
      window.location.href = "/auth/login";
    } catch (error: any) {
      errorTracker.trackSystemError(
        error.message || "Failed to sign out",
        "signOut"
      );
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    // Track password reset request
    tracker.trackAuth(AuthEvent.PASSWORD_RESET_REQUESTED, {
      auth_method: "email",
      email_domain: email.split("@")[1],
    });

    const origin = window.location.origin;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
      });

      if (error) {
        errorTracker.trackAuthenticationError("password_reset", error.message, {
          formData: { email },
        });

        toast.error("Could not reset password");
        return { error: error.message };
      }

      toast.success("Check your email for a link to reset your password.");
      return {};
    } catch (error: any) {
      errorTracker.trackNetworkError(
        "/auth/reset-password",
        error.message || "Network error during password reset"
      );
      throw error;
    }
  };

  const resetPassword = async (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match";
      errorTracker.trackValidationError(
        "reset_password_form",
        "password_confirmation",
        errorMessage,
        { userId: user?.id }
      );

      toast.error(errorMessage);
      return { error: errorMessage };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        errorTracker.trackAuthenticationError(
          "password_update",
          error.message,
          { userId: user?.id }
        );

        toast.error("Password update failed");
        throw new Error(error?.message || "Failed to update password");
      }

      // Track successful password reset
      tracker.trackAuth(AuthEvent.PASSWORD_RESET_COMPLETED, {
        auth_method: "email",
      });
    } catch (error: any) {
      errorTracker.trackNetworkError(
        "/auth/update-password",
        error.message || "Network error during password update"
      );
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetchUserData(session?.user?.id);

      if (session?.user) {
        sessionManager.extendSession();
      }
    } catch (error: any) {
      console.error("Error refreshing session:", error);
      errorTracker.trackSystemError(
        error.message || "Failed to refresh session",
        "refreshSession"
      );
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

    try {
      const { error } = await supabase
        .from("user")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user profile:", error);
        errorTracker.trackAPIError("/user", error.message, 500, {
          userId: user.id,
          action: "profile_completion",
        });

        toast.error(error.message || "Failed to update profile.");
        throw error;
      }

      await fetchUserData(user.id);
      toast.success("Profile updated successfully!");
      window.location.href = "/protected";
    } catch (error: any) {
      errorTracker.trackNetworkError(
        "/user",
        error.message || "Network error during profile update"
      );
      throw error;
    }
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
