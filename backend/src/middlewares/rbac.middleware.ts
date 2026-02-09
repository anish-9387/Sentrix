import { Request, Response, NextFunction } from 'express';
import PermissionModel from '../database/models/Permission.model';
import RoleModel from '../database/models/Role.model';

/**
 * Check if user has specific permission
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      // Check if user has the required permission
      const hasPermission = await PermissionModel.userHasPermission(
        req.user.userId,
        permissionName
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Permission denied. Required permission: ${permissionName}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission verification failed.'
      });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await PermissionModel.userHasPermission(
          req.user.userId,
          permission
        );
        
        if (hasPermission) {
          next();
          return;
        }
      }

      res.status(403).json({
        success: false,
        message: `Permission denied. Required one of: ${permissions.join(', ')}`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission verification failed.'
      });
    }
  };
};

/**
 * Check if user has all specified permissions
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      // Check if user has all required permissions
      for (const permission of permissions) {
        const hasPermission = await PermissionModel.userHasPermission(
          req.user.userId,
          permission
        );
        
        if (!hasPermission) {
          res.status(403).json({
            success: false,
            message: `Permission denied. Missing permission: ${permission}`
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission verification failed.'
      });
    }
  };
};

/**
 * Check if user has specific role
 */
export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      const userRoles = await RoleModel.getUserRoles(req.user.userId);
      const hasRole = userRoles.some(role => role.role_name === roleName);

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roleName}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role verification failed.'
      });
    }
  };
};

/**
 * Check if user has any of the specified roles
 */
export const requireAnyRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      const userRoles = await RoleModel.getUserRoles(req.user.userId);
      const hasAnyRole = userRoles.some(role => roles.includes(role.role_name));

      if (!hasAnyRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required one of: ${roles.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role verification failed.'
      });
    }
  };
};

/**
 * Check if user is admin (has admin or super admin role)
 */
export const requireAdmin = requireAnyRole(['Admin', 'Super Admin']);

/**
 * Check if user is super admin only
 */
export const requireSuperAdmin = requireRole('Super Admin');
