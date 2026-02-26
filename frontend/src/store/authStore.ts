import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, User } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          const { accessToken, refreshToken, user } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          const authUser: AuthUser = { ...user, accessToken, refreshToken };
          set({ user: authUser, isAuthenticated: true, isLoading: false });
          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Login failed');
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
          toast.success('Logged out successfully');
        }
      },

      refreshUser: async () => {
        try {
          const response = await authService.getCurrentUser();
          const user = response.data;
          const accessToken = localStorage.getItem('accessToken') || '';
          const refreshToken = localStorage.getItem('refreshToken') || '';
          const authUser: AuthUser = { ...user, accessToken, refreshToken };
          set({ user: authUser, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      setUser: (user: AuthUser | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
