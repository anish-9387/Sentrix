import { api } from '../lib/axios';
import type { User } from '../types';

// Backend controllers return camelCase fields (id, fullName, lastLogin…).
// Normalize to the snake_case User type so all templates work unchanged.
const normalizeUser = (u: any): User => ({
  user_id: u.id ?? u.user_id,
  username: u.username,
  email: u.email,
  full_name: u.fullName ?? u.full_name,
  status: u.status,
  is_email_verified: u.isEmailVerified ?? u.is_email_verified ?? false,
  last_login: u.lastLogin ?? u.last_login,
  last_login_ip: u.lastLoginIp ?? u.last_login_ip,
  failed_login_attempts: u.failedLoginAttempts ?? u.failed_login_attempts ?? 0,
  locked_until: u.lockedUntil ?? u.locked_until,
  created_at: u.createdAt ?? u.created_at ?? '',
  updated_at: u.updatedAt ?? u.updated_at ?? '',
  roles: Array.isArray(u.roles) ? u.roles.join(',') : (u.roles ?? ''),
  permissions: Array.isArray(u.permissions) ? u.permissions.join(',') : (u.permissions ?? ''),
});

export const userService = {
  // getAllUsers → { data: { users: User[], pagination: {...} } }
  getAll: (params?: { limit?: number; page?: number }) =>
    api.get('/users', { params }).then((r) => ({
      ...r.data,
      data: r.data?.data
        ? { ...r.data.data, users: (r.data.data.users || []).map(normalizeUser) }
        : r.data?.data,
    })),

  // searchUsers → { data: User[] }
  search: (q: string) =>
    api.get('/users/search', { params: { q } }).then((r) => ({
      ...r.data,
      data: Array.isArray(r.data?.data) ? r.data.data.map(normalizeUser) : r.data?.data,
    })),

  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => ({
      ...r.data,
      data: r.data?.data ? normalizeUser(r.data.data) : r.data?.data,
    })),

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
