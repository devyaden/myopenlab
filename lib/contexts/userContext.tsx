import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../supabase/client";
import { SignupFormData } from "../types/forms.types";
import { User } from "@/types/auth";
import { z } from "zod";
import { AuthEvent } from "@/lib/posthog/events";

// Safe browser API access
const safeRemoveItem = (
  storage: "localStorage" | "sessionStorage",
  key: string
): void => {
  if (typeof window === "undefined") return;
  try {
    window[storage].removeItem(key);
  } catch {
    // Silently fail
  }
};

// Safe tracking functions
const safeTrackAuth = (event: AuthEvent, properties: any = {}): void => {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/posthog/tracker")
      .then(({ tracker }) => {
        tracker.trackAuth(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeTrackError = (
  type: string,
  message: string,
  context: any = {}
): void => {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/posthog/errors")
      .then(({ errorTracker }) => {
        switch (type) {
          case "api":
            errorTracker.trackAPIError(
              context.endpoint || "",
              message,
              context.statusCode,
              context
            );
            break;
          case "auth":
            errorTracker.trackAuthenticationError(
              context.method || "",
              message,
              context
            );
            break;
          case "network":
            errorTracker.trackNetworkError(
              context.endpoint || "",
              message,
              context
            );
            break;
          case "validation":
            errorTracker.trackValidationError(
              context.formName || "",
              context.fieldName || "",
              message,
              context
            );
            break;
          case "system":
            errorTracker.trackSystemError(
              message,
              context.component || "",
              context
            );
            break;
        }
      })
      .catch(() => {
        // Silently fail if error tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeSessionSetUser = (userId: string, userEmail?: string): void => {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/posthog/session")
      .then(({ sessionManager }) => {
        sessionManager.setUser(userId, userEmail);
      })
      .catch(() => {
        // Silently fail if session manager not available
      });
  } catch {
    // Silently fail
  }
};

const safeSessionClearUser = (): void => {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/posthog/session")
      .then(({ sessionManager }) => {
        sessionManager.clearUser();
      })
      .catch(() => {
        // Silently fail if session manager not available
      });
  } catch {
    // Silently fail
  }
};

const safeSessionExtend = (): void => {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/posthog/session")
      .then(({ sessionManager }) => {
        sessionManager.extendSession();
      })
      .catch(() => {
        // Silently fail if session manager not available
      });
  } catch {
    // Silently fail
  }
};

// Define Zod schema and type for profile completion
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
        safeTrackError("api", error.message, {
          endpoint: "/user",
          statusCode: 500,
          userId,
          action: "fetch_user_data",
        });
      }

      setUser(data);

      // Update session with user info if data exists
      if (data) {
        safeSessionSetUser(data.id, data.email);
      }

      return data;
    } catch (error: any) {
      safeTrackError("api", error.message || "Failed to fetch user data", {
        endpoint: "/user",
        statusCode: 500,
        userId,
        action: "fetch_user_data",
      });
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
              await fetchUserData(session?.user?.id);
            });
          } else {
            // User logged out or session ended, clear everything properly
            setUser(null);
            safeSessionClearUser();
          }
        });

        return () => subscription.unsubscribe();
      } catch (error: any) {
        console.error("Error getting user:", error);
        safeTrackError(
          "system",
          error.message || "Failed to initialize user session",
          {
            component: "UserProvider",
          }
        );
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const signUp = async (data: SignupFormData, password: string) => {
    // Track signup start
    safeTrackAuth(AuthEvent.SIGNUP_STARTED, {
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

    const origin = typeof window !== "undefined" ? window.location.origin : "";

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
        safeTrackAuth(AuthEvent.SIGNUP_FAILED, {
          auth_method: "email",
          error_message: error.message,
          email_domain: data?.personalInfo?.email?.split("@")[1],
        });

        safeTrackError("auth", error.message, {
          method: "email_signup",
          formData: userAdditionalAttributes,
        });

        toast.error(error.message ?? "Sign up failed. Please try again later.");
        return { error: error.message, user: null };
      }

      // Track successful signup
      safeTrackAuth(AuthEvent.SIGNUP_COMPLETED, {
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
      safeTrackAuth(AuthEvent.SIGNUP_FAILED, {
        auth_method: "email",
        error_message: error.message || "Network error",
        email_domain: data?.personalInfo?.email?.split("@")[1],
      });

      safeTrackError(
        "network",
        error.message || "Network error during signup",
        {
          endpoint: "/auth/signup",
        }
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
        safeTrackError("api", error.message, {
          endpoint: "/user",
          statusCode: 500,
          action: "check_email_exists",
        });
        toast.error("Error checking email");
        return false;
      }

      return data.length > 0;
    } catch (error: any) {
      safeTrackError(
        "network",
        error.message || "Failed to check email existence",
        {
          endpoint: "/user",
        }
      );
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Track login start
    safeTrackAuth(AuthEvent.LOGIN_STARTED, {
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
        safeTrackAuth(AuthEvent.LOGIN_FAILED, {
          auth_method: "email",
          error_message: error.message,
          email_domain: email.split("@")[1],
        });

        safeTrackError("auth", error.message, {
          method: "email_login",
          formData: { email },
        });

        toast.error(error.message);
        throw error;
      }

      if (signInData?.user) {
        await fetchUserData(signInData.user.id);

        // Track successful login
        safeTrackAuth(AuthEvent.LOGIN_COMPLETED, {
          auth_method: "email",
          email_domain: email.split("@")[1],
        });
      }

      if (typeof window !== "undefined") {
        window.location.href = "/protected";
      }
    } catch (error: any) {
      if (!error.message?.includes("Invalid login credentials")) {
        safeTrackError(
          "network",
          error.message || "Network error during login",
          {
            endpoint: "/auth/signin",
          }
        );
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    // Track Google auth start
    safeTrackAuth(AuthEvent.GOOGLE_AUTH_STARTED, {
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
        safeTrackAuth(AuthEvent.GOOGLE_AUTH_FAILED, {
          auth_method: "google",
          error_message: error.message,
        });

        safeTrackError("auth", error.message, {
          method: "google_auth",
        });

        toast.error("Google sign-in failed");
        throw error;
      }

      if (data.url && typeof window !== "undefined") {
        window.location.href = data.url;
      }
    } catch (error: any) {
      safeTrackError(
        "network",
        error.message || "Network error during Google auth",
        {
          endpoint: "/auth/google",
        }
      );
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Track logout BEFORE clearing user data so we still have user context
      safeTrackAuth(AuthEvent.LOGOUT, {
        auth_method: user ? "authenticated" : "anonymous",
      });

      // Clear recent documents from localStorage safely
      safeRemoveItem("localStorage", "recentDocuments");

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear user state
      setUser(null);

      // This will reset PostHog identity and start a new anonymous session
      safeSessionClearUser();

      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    } catch (error: any) {
      safeTrackError("system", error.message || "Failed to sign out", {
        component: "signOut",
      });
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    // Track password reset request
    safeTrackAuth(AuthEvent.PASSWORD_RESET_REQUESTED, {
      auth_method: "email",
      email_domain: email.split("@")[1],
    });

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
      });

      if (error) {
        safeTrackError("auth", error.message, {
          method: "password_reset",
          formData: { email },
        });

        toast.error("Could not reset password");
        return { error: error.message };
      }

      toast.success("Check your email for a link to reset your password.");
      return {};
    } catch (error: any) {
      safeTrackError(
        "network",
        error.message || "Network error during password reset",
        {
          endpoint: "/auth/reset-password",
        }
      );
      throw error;
    }
  };

  const resetPassword = async (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match";
      safeTrackError("validation", errorMessage, {
        formName: "reset_password_form",
        fieldName: "password_confirmation",
        userId: user?.id,
      });

      toast.error(errorMessage);
      return { error: errorMessage };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        safeTrackError("auth", error.message, {
          method: "password_update",
          userId: user?.id,
        });

        toast.error("Password update failed");
        throw new Error(error?.message || "Failed to update password");
      }

      // Track successful password reset
      safeTrackAuth(AuthEvent.PASSWORD_RESET_COMPLETED, {
        auth_method: "email",
      });
    } catch (error: any) {
      safeTrackError(
        "network",
        error.message || "Network error during password update",
        {
          endpoint: "/auth/update-password",
        }
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
        safeSessionExtend();
      }
    } catch (error: any) {
      console.error("Error refreshing session:", error);
      safeTrackError("system", error.message || "Failed to refresh session", {
        component: "refreshSession",
      });
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
        safeTrackError("api", error.message, {
          endpoint: "/user",
          statusCode: 500,
          userId: user.id,
          action: "profile_completion",
        });

        toast.error(error.message || "Failed to update profile.");
        throw error;
      }

      await fetchUserData(user.id);
      toast.success("Profile updated successfully!");

      if (typeof window !== "undefined") {
        window.location.href = "/protected";
      }
    } catch (error: any) {
      safeTrackError(
        "network",
        error.message || "Network error during profile update",
        {
          endpoint: "/user",
        }
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
