import { api } from '../lib/axios';
import type { User } from '../types';

export const userService = {
  getAll: (params?: { limit?: number; page?: number }) =>
    api.get('/users', { params }).then((r) => r.data),

  search: (q: string) =>
    api.get('/users/search', { params: { q } }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data),

  create: (data: { username: string; email: string; password: string; fullName?: string; roleIds?: number[] }) =>
    api.post('/users', data).then((r) => r.data),

  update: (id: number, data: Partial<User>) =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/users/${id}`).then((r) => r.data),

  toggleStatus: (id: number, status: 'active' | 'blocked' | 'suspended') =>
    api.patch(`/users/${id}/status`, { status }).then((r) => r.data),

  assignRole: (userId: number, roleId: number) =>
    api.post(`/users/${userId}/roles`, { roleId }).then((r) => r.data),

  removeRole: (userId: number, roleId: number) =>
    api.delete(`/users/${userId}/roles`, { data: { roleId } }).then((r) => r.data),
};
