import { Request, Response } from 'express';
import UserModel from '../database/models/User.model';
import RoleModel from '../database/models/Role.model';
import LogModel from '../database/models/Log.model';
import passwordService from '../services/password.service';
import * as XLSX from 'xlsx';

class UserController {
  /**
   * Get all users with pagination
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const users = await UserModel.findAll(limit, offset);
      const total = await UserModel.count();

      res.status(200).json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user.user_id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            status: user.status,
            roles: user.roles?.split(',') || [],
            lastLogin: user.last_login,
            createdAt: user.created_at
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching users.'
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const user = await UserModel.findWithRoles(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          status: user.status,
          roles: user.roles?.split(',') || [],
          permissions: user.permissions?.split(',') || [],
          lastLogin: user.last_login,
          failedLoginAttempts: user.failed_login_attempts,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user.'
      });
    }
  }

  /**
   * Create new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName, roleIds } = req.body;

      // Validate input
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email, and password are required.'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = passwordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet requirements.',
          errors: passwordValidation.errors
        });
        return;
      }

      // Check if username exists
      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        res.status(400).json({
          success: false,
          message: 'Username already exists.'
        });
        return;
      }

      // Check if email exists
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'Email already exists.'
        });
        return;
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(password);

      // Create user
      const userId = await UserModel.create({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        created_by: req.user?.userId
      });

      // Assign roles if provided
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          await RoleModel.assignToUser(userId, roleId, req.user?.userId);
        }
      }

      const newUser = await UserModel.findWithRoles(userId);

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: {
          id: newUser?.user_id,
          username: newUser?.username,
          email: newUser?.email,
          fullName: newUser?.full_name,
          roles: newUser?.roles?.split(',') || []
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating user.'
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { fullName, email, status } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      // Check if new email already exists
      if (email && email !== user.email) {
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) {
          res.status(400).json({
            success: false,
            message: 'Email already exists.'
          });
          return;
        }
      }

      // Update user
      const updateData: any = {};
      if (fullName) updateData.full_name = fullName;
      if (email) updateData.email = email;
      if (status) updateData.status = status;

      await UserModel.update(userId, updateData);

      const updatedUser = await UserModel.findWithRoles(userId);

      res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating user.'
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      // Prevent self-deletion
      if (req.user?.userId === userId) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account.'
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      await UserModel.delete(userId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully.'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting user.'
      });
    }
  }

  /**
   * Block/Unblock user
   */
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['active', 'blocked', 'suspended'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Use: active, blocked, or suspended.'
        });
        return;
      }

      const updated = await UserModel.updateStatus(userId, status);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `User ${status} successfully.`
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating user status.'
      });
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { roleId } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      const role = await RoleModel.findById(roleId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found.'
        });
        return;
      }

      await RoleModel.assignToUser(userId, roleId, req.user?.userId);

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully.'
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while assigning role.'
      });
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { roleId } = req.body;

      await RoleModel.removeFromUser(userId, roleId);

      res.status(200).json({
        success: true,
        message: 'Role removed successfully.'
      });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while removing role.'
      });
    }
  }

  /**
   * Export user login history to Excel
   */
  async exportUserLoginHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);

      if (Number.isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.'
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      const logs = await LogModel.getLoginLogsByUser(userId);

      const rows: Array<Array<string | number>> = [
        ['Log ID', 'Username', 'Status', 'IP Address', 'Country', 'City', 'Browser', 'OS', 'Device', 'Failure Reason', 'Attempted At']
      ];

      logs.forEach((log) => {
        rows.push([
          log.log_id,
          log.username || user.username,
          log.login_status,
          log.ip_address,
          log.country || '',
          log.city || '',
          log.browser || '',
          log.os || '',
          log.device_type || '',
          log.failure_reason || '',
          log.attempted_at ? new Date(log.attempted_at).toISOString() : ''
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 40 },
        { wch: 24 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Login History');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const safeUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `${safeUsername}_login_history_${dateStamp}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (error) {
      console.error('Export user login history error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while exporting user login history.'
      });
    }
  }

  /**
   * Search users
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required.'
        });
        return;
      }

      const users = await UserModel.search(searchTerm);

      res.status(200).json({
        success: true,
        data: users.map(user => ({
          id: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          status: user.status,
          roles: user.roles?.split(',') || []
        }))
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while searching users.'
      });
    }
  }
}

export default new UserController();
