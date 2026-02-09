import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../connection';

export interface Permission extends RowDataPacket {
  permission_id: number;
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
}

class PermissionModel {
  // Create new permission
  async create(permissionData: {
    permission_name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO permissions (permission_name, resource, action, description)
      VALUES (?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      permissionData.permission_name,
      permissionData.resource,
      permissionData.action,
      permissionData.description
    ]);
    return result.insertId;
  }

  // Find permission by ID
  async findById(permissionId: number): Promise<Permission | null> {
    const sql = 'SELECT * FROM permissions WHERE permission_id = ?';
    const permissions = await query<Permission[]>(sql, [permissionId]);
    return permissions[0] || null;
  }

  // Find permission by name
  async findByName(permissionName: string): Promise<Permission | null> {
    const sql = 'SELECT * FROM permissions WHERE permission_name = ?';
    const permissions = await query<Permission[]>(sql, [permissionName]);
    return permissions[0] || null;
  }

  // Get all permissions
  async findAll(): Promise<Permission[]> {
    const sql = 'SELECT * FROM permissions ORDER BY resource, action';
    return await query<Permission[]>(sql);
  }

  // Get permissions by resource
  async findByResource(resource: string): Promise<Permission[]> {
    const sql = 'SELECT * FROM permissions WHERE resource = ? ORDER BY action';
    return await query<Permission[]>(sql, [resource]);
  }

  // Update permission
  async update(permissionId: number, updateData: Partial<Permission>): Promise<boolean> {
    const fields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updateData);
    
    const sql = `UPDATE permissions SET ${fields} WHERE permission_id = ?`;
    const result = await query<ResultSetHeader>(sql, [...values, permissionId]);
    return result.affectedRows > 0;
  }

  // Delete permission
  async delete(permissionId: number): Promise<boolean> {
    const sql = 'DELETE FROM permissions WHERE permission_id = ?';
    const result = await query<ResultSetHeader>(sql, [permissionId]);
    return result.affectedRows > 0;
  }

  // Check if user has permission
  async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE ur.user_id = ? 
      AND p.permission_name = ?
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `;
    const result = await query<RowDataPacket[]>(sql, [userId, permissionName]);
    return result[0].count > 0;
  }

  // Get user permissions
  async getUserPermissions(userId: number): Promise<string[]> {
    const sql = `
      SELECT DISTINCT p.permission_name
FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE ur.user_id = ?
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `;
    const result = await query<RowDataPacket[]>(sql, [userId]);
    return result.map(row => row.permission_name);
  }
}

export default new PermissionModel();
