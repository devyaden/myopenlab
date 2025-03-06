import { create } from "zustand";
import type { User } from "@/types/auth";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  // For demo purposes, we'll hardcode a user
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  login: () => {
    // Hardcoded user for demo
    set({
      user: {
        id: "1",
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        isActive: true,
        application: "Human Resource",
      },
    });
  },
  logout: () => set({ user: null }),
}));
