import { api } from '../lib/axios';
import { Role, Permission } from '../types';

export const roleService = {
  // Get all roles
  async getAllRoles() {
    const response = await api.get('/roles');
    return response.data;
  },

  // Get all permissions
  async getAllPermissions() {
    const response = await api.get('/roles/permissions');
    return response.data;
  },

  // Get role by ID
  async getRoleById(id: number) {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // Create role
  async createRole(roleData: { role_name: string; description?: string }) {
    const response = await api.post('/roles', roleData);
    return response.data;
  },

  // Update role
  async updateRole(id: number, roleData: Partial<Role>) {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },

  // Delete role
  async deleteRole(id: number) {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },

  // Assign permission to role
  async assignPermission(roleId: number, permissionId: number) {
    const response = await api.post(`/roles/${roleId}/permissions`, { permission_id: permissionId });
    return response.data;
  },

  // Remove permission from role
  async removePermission(roleId: number, permissionId: number) {
    const response = await api.delete(`/roles/${roleId}/permissions`, { 
      data: { permission_id: permissionId } 
    });
    return response.data;
  },
};
