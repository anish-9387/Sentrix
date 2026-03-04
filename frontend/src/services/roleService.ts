import { api } from '../lib/axios';

export const roleService = {
  getAll: () =>
    api.get('/roles').then((r) => r.data),

  getById: (id: number) =>
    api.get(`/roles/${id}`).then((r) => r.data),

  create: (data: { roleName: string; description?: string; priority?: number }) =>
    api.post('/roles', data).then((r) => r.data),

  update: (id: number, data: { roleName?: string; description?: string; priority?: number; isActive?: boolean }) =>
    api.put(`/roles/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/roles/${id}`).then((r) => r.data),

  getAllPermissions: () =>
    api.get('/roles/permissions').then((r) => r.data),

  assignPermission: (roleId: number, permissionId: number) =>
    api.post(`/roles/${roleId}/permissions`, { permissionId }).then((r) => r.data),

  removePermission: (roleId: number, permissionId: number) =>
    api.delete(`/roles/${roleId}/permissions`, { data: { permissionId } }).then((r) => r.data),
};
