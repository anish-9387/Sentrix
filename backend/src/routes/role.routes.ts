import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { auditAction } from '../middlewares/audit.middleware';

const router : Router = Router();

// All routes require authentication
router.use(authenticate);

// Get all roles
router.get(
  '/',
  requirePermission('role.read'),
  roleController.getAllRoles
);

// Get all permissions
router.get(
  '/permissions',
  requirePermission('permission.read'),
  roleController.getAllPermissions
);

// Get role by ID
router.get(
  '/:id',
  requirePermission('role.read'),
  roleController.getRoleById
);

// Create role
router.post(
  '/',
  requirePermission('role.create'),
  auditAction('CREATE_ROLE', 'role'),
  roleController.createRole
);

// Update role
router.put(
  '/:id',
  requirePermission('role.update'),
  auditAction('UPDATE_ROLE', 'role'),
  roleController.updateRole
);

// Delete role
router.delete(
  '/:id',
  requirePermission('role.delete'),
  auditAction('DELETE_ROLE', 'role'),
  roleController.deleteRole
);

// Assign permission to role
router.post(
  '/:id/permissions',
  requirePermission('permission.assign'),
  auditAction('ASSIGN_PERMISSION', 'role'),
  roleController.assignPermission
);

// Remove permission from role
router.delete(
  '/:id/permissions',
  requirePermission('permission.assign'),
  auditAction('REMOVE_PERMISSION', 'role'),
  roleController.removePermission
);

export default router;
