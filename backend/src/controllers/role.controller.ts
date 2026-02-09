import { Request, Response } from 'express';
import RoleModel from '../database/models/Role.model';
import PermissionModel from '../database/models/Permission.model';

class RoleController {
  /**
   * Get all roles
   */
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await RoleModel.findAll();

      res.status(200).json({
        success: true,
        data: roles.map(role => ({
          id: role.role_id,
          name: role.role_name,
          description: role.description,
          priority: role.priority,
          isActive: role.is_active,
          permissions: role.permissions?.split(',') || [],
          createdAt: role.created_at
        }))
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching roles.'
      });
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);

      const role = await RoleModel.findWithPermissions(roleId);

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: role.role_id,
          name: role.role_name,
          description: role.description,
          priority: role.priority,
          isActive: role.is_active,
          permissions: role.permissions?.split(',') || []
        }
      });
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching role.'
      });
    }
  }

  /**
   * Create new role
   */
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleName, description, priority } = req.body;

      if (!roleName) {
        res.status(400).json({
          success: false,
          message: 'Role name is required.'
        });
        return;
      }

      // Check if role already exists
      const existing = await RoleModel.findByName(roleName);
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'Role already exists.'
        });
        return;
      }

      const roleId = await RoleModel.create({
        role_name: roleName,
        description,
        priority
      });

      const newRole = await RoleModel.findById(roleId);

      res.status(201).json({
        success: true,
        message: 'Role created successfully.',
        data: newRole
      });
    } catch (error) {
      console.error('Create role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating role.'
      });
    }
  }

  /**
   * Update role
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      const { roleName, description, priority, isActive } = req.body;

      const role = await RoleModel.findById(roleId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found.'
        });
        return;
      }

      const updateData: any = {};
      if (roleName) updateData.role_name = roleName;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (isActive !== undefined) updateData.is_active = isActive;

      await RoleModel.update(roleId, updateData);

      const updatedRole = await RoleModel.findById(roleId);

      res.status(200).json({
        success: true,
        message: 'Role updated successfully.',
        data: updatedRole
      });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating role.'
      });
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);

      const role = await RoleModel.findById(roleId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found.'
        });
        return;
      }

      await RoleModel.delete(roleId);

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully.'
      });
    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting role.'
      });
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermission(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionId } = req.body;

      const role = await RoleModel.findById(roleId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found.'
        });
        return;
      }

      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        res.status(404).json({
          success: false,
          message: 'Permission not found.'
        });
        return;
      }

      await RoleModel.assignPermission(roleId, permissionId, req.user?.userId);

      res.status(200).json({
        success: true,
        message: 'Permission assigned successfully.'
      });
    } catch (error) {
      console.error('Assign permission error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while assigning permission.'
      });
    }
  }

  /**
   * Remove permission from role
   */
  async removePermission(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionId } = req.body;

      await RoleModel.removePermission(roleId, permissionId);

      res.status(200).json({
        success: true,
        message: 'Permission removed successfully.'
      });
    } catch (error) {
      console.error('Remove permission error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while removing permission.'
      });
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await PermissionModel.findAll();

      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching permissions.'
      });
    }
  }
}

export default new RoleController();
