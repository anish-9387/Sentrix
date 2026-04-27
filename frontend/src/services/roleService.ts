/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../lib/axios';
import type { Permission, Role } from '../types';

const toCsv = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
      .join(',');
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

const normalizeRole = (raw: any): Role => ({
  role_id: Number(raw?.role_id ?? raw?.id ?? 0),
  role_name: raw?.role_name ?? raw?.name ?? 'Unknown Role',
  description: raw?.description ?? undefined,
  priority: Number(raw?.priority ?? 0),
  is_active: Boolean(raw?.is_active ?? raw?.isActive ?? true),
  is_system_role: Boolean(raw?.is_system_role ?? raw?.isSystemRole ?? false),
  created_at: raw?.created_at ?? raw?.createdAt ?? '',
  updated_at: raw?.updated_at ?? raw?.updatedAt ?? '',
  permissions: toCsv(raw?.permissions),
});

const normalizePermission = (raw: any): Permission => ({
  permission_id: Number(raw?.permission_id ?? raw?.id ?? 0),
  permission_name: raw?.permission_name ?? raw?.name ?? '',
  resource: raw?.resource ?? 'system',
  action: raw?.action ?? 'read',
  description: raw?.description ?? undefined,
  category: raw?.category ?? undefined,
  created_at: raw?.created_at ?? raw?.createdAt ?? '',
});

export const roleService = {
  getAll: () =>
    api.get('/roles').then((r) => {
      const rows = Array.isArray(r.data?.data) ? r.data.data : [];
      return {
        ...r.data,
        data: rows.map(normalizeRole),
      };
    }),

  getById: (id: number) =>
    api.get(`/roles/${id}`).then((r) => ({
      ...r.data,
      data: r.data?.data ? normalizeRole(r.data.data) : r.data?.data,
    })),

  create: (data: { roleName: string; description?: string; priority?: number }) =>
    api.post('/roles', data).then((r) => ({
      ...r.data,
      data: r.data?.data ? normalizeRole(r.data.data) : r.data?.data,
    })),

  update: (id: number, data: { roleName?: string; description?: string; priority?: number; isActive?: boolean }) =>
    api.put(`/roles/${id}`, data).then((r) => ({
      ...r.data,
      data: r.data?.data ? normalizeRole(r.data.data) : r.data?.data,
    })),

  delete: (id: number) =>
    api.delete(`/roles/${id}`).then((r) => r.data),

  getAllPermissions: () =>
    api.get('/roles/permissions').then((r) => {
      const rows = Array.isArray(r.data?.data) ? r.data.data : [];
      return {
        ...r.data,
        data: rows.map(normalizePermission),
      };
    }),

  assignPermission: (roleId: number, permissionId: number) =>
    api.post(`/roles/${roleId}/permissions`, { permissionId }).then((r) => r.data),

  removePermission: (roleId: number, permissionId: number) =>
    api.delete(`/roles/${roleId}/permissions`, { data: { permissionId } }).then((r) => r.data),
};
