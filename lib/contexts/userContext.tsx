import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type UserContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const showToastError = useCallback(
    (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const fetchUserData = useCallback(
    async (userId: string | undefined) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", userId)
        .single();
      if (error) showToastError("Failed to get user details");
      setUser(data ?? null);
    },
    [supabase, showToastError]
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await fetchUserData(session?.user?.id);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          fetchUserData(session?.user?.id);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase, fetchUserData]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      redirect("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetchUserData(session?.user?.id);
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  }, [supabase, fetchUserData]);

  const value = useMemo(
    () => ({ user, loading, signOut, refreshSession }),
    [user, loading, signOut, refreshSession]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
