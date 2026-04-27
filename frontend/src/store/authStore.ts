/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const res = await authService.login({ username, password });
          const { accessToken, refreshToken, user, sessionId } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // Fetch profile to include permission list right after login.
          let permissions: string[] | undefined;
          try {
            const meRes = await authService.me();
            permissions = Array.isArray(meRes?.data?.permissions) ? meRes.data.permissions : undefined;
          } catch {
            // Keep login successful even if profile enrichment fails.
          }

          const authUser: AuthUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            roles: user.roles,
            permissions,
            accessToken,
            refreshToken,
            sessionId,
          };
          set({ user: authUser, isAuthenticated: true, isLoading: false });
          toast.success(`Welcome back, ${user.fullName || user.username}!`);
        } catch (err: any) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Login failed');
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // ignore
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
          toast.success('Logged out');
        }
      },

      refreshUser: async () => {
        try {
          const res = await authService.me();
          const u = res.data;
          const accessToken = localStorage.getItem('accessToken') || '';
          const refreshToken = localStorage.getItem('refreshToken') || '';
          set({
            user: {
              id: u.id,
              username: u.username,
              email: u.email,
              fullName: u.fullName || u.full_name,
              roles: u.roles || [],
              permissions: u.permissions || [],
              status: u.status,
              lastLogin: u.lastLogin,
              createdAt: u.createdAt,
              accessToken,
              refreshToken,
            },
            isAuthenticated: true,
          });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'sentrix-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
