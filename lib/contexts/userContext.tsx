import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type UserContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  resetPassword: (
    password: string,
    confirmPassword: string
  ) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserData = async (userId: string | undefined) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", userId)
      .single();
    if (error) toast.error("Failed to get user details");
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
          await fetchUserData(session?.user?.id);
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

  const signUp = async (email: string, password: string) => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      return { error: error.message };
    }

    toast.success("Please check your email for a verification link.");
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    redirect("/protected");
  };

  const signInWithGoogle = async () => {
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

    if (data.url) {
      window.location.href = data.url;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    redirect("/authentication");
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

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        forgotPassword,
        resetPassword,
        refreshSession,
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
