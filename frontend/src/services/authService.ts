import { api } from '../lib/axios';
import { LoginRequest, LoginResponse, User, AuditLog } from '../types';

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Get current user
  async getCurrentUser(): Promise<{ success: boolean; data: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Get my activity
  async getMyActivity(): Promise<{ success: boolean; data: AuditLog[] }> {
    const response = await api.get('/auth/my-activity');
    return response.data;
  },

  // Refresh token
  async refreshToken(): Promise<{ success: boolean; data: { accessToken: string } }> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};
