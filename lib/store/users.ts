import { create } from "zustand";

import type { User } from "@/types/auth";

// Admin user management store. All privileged operations go through the
// server-side /api/admin/users routes (gated by requireAdmin) so the Supabase
// service-role key is never exposed to the browser. Previously this store
// imported `supabaseAdmin` directly, which bundled the service-role key client
// side — a critical leak that is now removed.

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalUsers: number | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  inviteUser: (email: string, role: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserStatus: (id: string, isActive: boolean) => Promise<void>;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  totalUsers: null,
  hasNextPage: false,
  hasPreviousPage: false,

  fetchUsers: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `/api/admin/users?page=${page}&perPage=${limit}`
      );
      if (!response.ok) throw new Error(await parseError(response));

      const data = await response.json();
      const formattedUsers: User[] = (data.users || []).map((user: any) => ({
        ...user,
        lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
      }));

      set({
        users: formattedUsers,
        totalUsers: data.totalUsers,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  inviteUser: async (email: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) throw new Error(await parseError(response));

      const { user } = await response.json();
      const newUser: User = {
        ...user,
        lastActive: user.lastActive ? new Date(user.lastActive) : new Date(),
      };

      const { totalUsers, users } = get();
      if (totalUsers !== null) {
        set({ totalUsers: totalUsers + 1 });
      }
      if (users.length < 10) {
        set((state) => ({ users: [...state.users, newUser] }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await parseError(response));

      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        totalUsers: state.totalUsers !== null ? state.totalUsers - 1 : null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await parseError(response));

      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, isActive } : user
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
