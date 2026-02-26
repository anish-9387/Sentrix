import { api } from '../lib/axios';
import { User } from '../types';

export const userService = {
  // Get all users
  async getAllUsers(params?: { limit?: number; offset?: number }) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Search users
  async searchUsers(params: { q: string; limit?: number; offset?: number }) {
    const response = await api.get('/users/search', { params });
    return response.data;
  },

  // Get user by ID
  async getUserById(id: number) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(id: number, userData: Partial<User>) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  async deleteUser(id: number) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle user status
  async toggleUserStatus(id: number, status: string) {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Assign role to user
  async assignRole(userId: number, roleId: number) {
    const response = await api.post(`/users/${userId}/roles`, { role_id: roleId });
    return response.data;
  },

  // Remove role from user
  async removeRole(userId: number, roleId: number) {
    const response = await api.delete(`/users/${userId}/roles`, { data: { role_id: roleId } });
    return response.data;
  },
};
