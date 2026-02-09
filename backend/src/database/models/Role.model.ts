import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../connection';

export interface Role extends RowDataPacket {
  role_id: number;
  role_name: string;
  description?: string;
  priority: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoleWithPermissions extends Role {
  permissions?: string;
}

class RoleModel {
  // Create new role
  async create(roleData: {
    role_name: string;
    description?: string;
    priority?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO roles (role_name, description, priority)
      VALUES (?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      roleData.role_name,
      roleData.description,
      roleData.priority || 0
    ]);
    return result.insertId;
  }

  // Find role by ID
  async findById(roleId: number): Promise<Role | null> {
    const sql = 'SELECT * FROM roles WHERE role_id = ?';
    const roles = await query<Role[]>(sql, [roleId]);
    return roles[0] || null;
  }

  // Find role by name
  async findByName(roleName: string): Promise<Role | null> {
    const sql = 'SELECT * FROM roles WHERE role_name = ?';
    const roles = await query<Role[]>(sql, [roleName]);
    return roles[0] || null;
  }

  // Get all roles with permissions
  async findAll(): Promise<RoleWithPermissions[]> {
    const sql = `
      SELECT 
        r.*,
        GROUP_CONCAT(p.permission_name) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      GROUP BY r.role_id
      ORDER BY r.priority DESC
    `;
    return await query<RoleWithPermissions[]>(sql);
  }

  // Get role with permissions
  async findWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
    const sql = `
      SELECT 
        r.*,
        GROUP_CONCAT(p.permission_name) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE r.role_id = ?
      GROUP BY r.role_id
    `;
    const roles = await query<RoleWithPermissions[]>(sql, [roleId]);
    return roles[0] || null;
  }

  // Update role
  async update(roleId: number, updateData: Partial<Role>): Promise<boolean> {
    const fields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updateData);
    
    const sql = `UPDATE roles SET ${fields} WHERE role_id = ?`;
    const result = await query<ResultSetHeader>(sql, [...values, roleId]);
    return result.affectedRows > 0;
  }

  // Delete role
  async delete(roleId: number): Promise<boolean> {
    const sql = 'DELETE FROM roles WHERE role_id = ?';
    const result = await query<ResultSetHeader>(sql, [roleId]);
    return result.affectedRows > 0;
  }

  // Assign permission to role
  async assignPermission(roleId: number, permissionId: number, grantedBy?: number): Promise<boolean> {
    const sql = `
      INSERT INTO role_permissions (role_id, permission_id, granted_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE granted_at = NOW()
    `;
    const result = await query<ResultSetHeader>(sql, [roleId, permissionId, grantedBy || null]);
    return result.affectedRows > 0;
  }

  // Remove permission from role
  async removePermission(roleId: number, permissionId: number): Promise<boolean> {
    const sql = 'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?';
    const result = await query<ResultSetHeader>(sql, [roleId, permissionId]);
    return result.affectedRows > 0;
  }

  // Get role permissions
  async getPermissions(roleId: number): Promise<string[]> {
    const sql = `
      SELECT p.permission_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE rp.role_id = ?
    `;
    const result = await query<RowDataPacket[]>(sql, [roleId]);
    return result.map(row => row.permission_name);
  }

  // Assign role to user
  async assignToUser(userId: number, roleId: number, assignedBy?: number): Promise<boolean> {
    const sql = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = NOW()
    `;
    const result = await query<ResultSetHeader>(sql, [userId, roleId, assignedBy || null]);
    return result.affectedRows > 0;
  }

  // Remove role from user
  async removeFromUser(userId: number, roleId: number): Promise<boolean> {
    const sql = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    const result = await query<ResultSetHeader>(sql, [userId, roleId]);
    return result.affectedRows > 0;
  }

  // Get user roles
  async getUserRoles(userId: number): Promise<Role[]> {
    const sql = `
      SELECT r.*
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY r.priority DESC
    `;
    return await query<Role[]>(sql, [userId]);
  }
}

export default new RoleModel();
