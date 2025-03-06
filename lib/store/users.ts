import { create } from "zustand";

import type { User } from "@/types/auth";
import { supabaseAdmin } from "../supabase/client";

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
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: limit,
      });

      if (error) throw error;

      const totalUsers = data.total;
      const hasNextPage = data.nextPage !== null;
      const hasPreviousPage = page > 1;

      const formattedUsers: User[] = data.users?.map((user) => ({
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role || "User",
        application: user.user_metadata?.application || "Human Resource",
        lastActive: new Date(user.last_sign_in_at || user.created_at),
        // @ts-ignore
        isActive: !user.banned_until,
      }));

      set({
        users: formattedUsers,
        totalUsers,
        hasNextPage,
        hasPreviousPage,
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
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            role,
            application: "Human Resource",
          },
        }
      );

      if (error) throw error;

      // Add the new user to the state if we're on the first page
      const newUser: User = {
        id: data.user.id,
        email: data.user.email!,
        role,
        application: "Human Resource",
        lastActive: new Date(),
        isActive: true,
      };

      // Update total count
      const { totalUsers } = get();
      if (totalUsers !== null) {
        set({ totalUsers: totalUsers + 1 });
      }

      // Refresh the current page to show accurate data
      const currentUsers = get().users;
      if (currentUsers.length < 10) {
        set((state) => ({
          users: [...state.users, newUser],
        }));
      } else {
        // Just update the count but don't add to the current page
        // The user can be seen when navigating to the appropriate page
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
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;

      // Remove the user from state
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
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: isActive ? "none" : "876000h",
      });

      if (error) throw error;

      // Update user status in state
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
