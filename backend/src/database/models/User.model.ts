import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../database/connection';

export interface User extends RowDataPacket {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  status: 'active' | 'inactive' | 'suspended' | 'blocked';
  is_email_verified: boolean;
  last_login?: Date;
  last_login_ip?: string;
  failed_login_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

export interface UserWithRoles extends User {
  roles?: string;
  permissions?: string;
}

class UserModel {
  // Create new user
  async create(userData: {
    username: string;
    email: string;
    password_hash: string;
    full_name?: string;
    created_by?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO users (username, email, password_hash, full_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      userData.username,
      userData.email,
      userData.password_hash,
      userData.full_name,
      userData.created_by || null
    ]);
    return result.insertId;
  }

  // Find user by ID
  async findById(userId: number): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    const users = await query<User[]>(sql, [userId]);
    return users[0] || null;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await query<User[]>(sql, [email]);
    return users[0] || null;
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const users = await query<User[]>(sql, [username]);
    return users[0] || null;
  }

  // Find user with roles and permissions
  async findWithRoles(userId: number): Promise<UserWithRoles | null> {
    const sql = `
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.role_name) as roles,
        GROUP_CONCAT(DISTINCT p.permission_name) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `;
    const users = await query<UserWithRoles[]>(sql, [userId]);
    return users[0] || null;
  }

  // Get all users with pagination
  async findAll(limit: number = 50, offset: number = 0): Promise<UserWithRoles[]> {
    const sql = `
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    return await query<UserWithRoles[]>(sql, [limit, offset]);
  }

  // Update user
  async update(userId: number, updateData: Partial<User>): Promise<boolean> {
    const fields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updateData);
    
    const sql = `UPDATE users SET ${fields} WHERE user_id = ?`;
    const result = await query<ResultSetHeader>(sql, [...values, userId]);
    return result.affectedRows > 0;
  }

  // Update last login
  async updateLastLogin(userId: number, ipAddress: string): Promise<void> {
    const sql = `
      UPDATE users 
      SET last_login = NOW(), last_login_ip = ?, failed_login_attempts = 0
      WHERE user_id = ?
    `;
    await query(sql, [ipAddress, userId]);
  }

  // Increment failed login attempts
  async incrementFailedAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1
      WHERE user_id = ?
    `;
    await query(sql, [userId]);
  }

  // Lock user account
  async lockAccount(userId: number, minutes: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
      WHERE user_id = ?
    `;
    await query(sql, [minutes, userId]);
  }

  // Check if account is locked
  async isLocked(userId: number): Promise<boolean> {
    const sql = `
      SELECT locked_until FROM users 
      WHERE user_id = ? AND locked_until > NOW()
    `;
    const result = await query<RowDataPacket[]>(sql, [userId]);
    return result.length > 0;
  }

  // Update user status
  async updateStatus(userId: number, status: string): Promise<boolean> {
    const sql = 'UPDATE users SET status = ? WHERE user_id = ?';
    const result = await query<ResultSetHeader>(sql, [status, userId]);
    return result.affectedRows > 0;
  }

  // Delete user
  async delete(userId: number): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE user_id = ?';
    const result = await query<ResultSetHeader>(sql, [userId]);
    return result.affectedRows > 0;
  }

  // Count total users
  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as total FROM users';
    const result = await query<RowDataPacket[]>(sql);
    return result[0].total;
  }

  // Search users
  async search(searchTerm: string): Promise<UserWithRoles[]> {
    const sql = `
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    return await query<UserWithRoles[]>(sql, [searchPattern, searchPattern, searchPattern]);
  }
}

export default new UserModel();
