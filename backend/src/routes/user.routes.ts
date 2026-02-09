import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { auditAction } from '../middlewares/audit.middleware';

const router : Router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users
router.get(
  '/',
  requirePermission('user.read'),
  userController.getAllUsers
);

// Search users
router.get(
  '/search',
  requirePermission('user.read'),
  userController.searchUsers
);

// Get user by ID
router.get(
  '/:id',
  requirePermission('user.read'),
  userController.getUserById
);

// Create user
router.post(
  '/',
  requirePermission('user.create'),
  auditAction('CREATE_USER', 'user'),
  userController.createUser
);

// Update user
router.put(
  '/:id',
  requirePermission('user.update'),
  auditAction('UPDATE_USER', 'user'),
  userController.updateUser
);

// Delete user
router.delete(
  '/:id',
  requirePermission('user.delete'),
  auditAction('DELETE_USER', 'user'),
  userController.deleteUser
);

// Toggle user status (block/unblock)
router.patch(
  '/:id/status',
  requirePermission('user.block'),
  auditAction('CHANGE_USER_STATUS', 'user'),
  userController.toggleUserStatus
);

// Assign role to user
router.post(
  '/:id/roles',
  requirePermission('role.assign'),
  auditAction('ASSIGN_ROLE', 'user'),
  userController.assignRole
);

// Remove role from user
router.delete(
  '/:id/roles',
  requirePermission('role.assign'),
  auditAction('REMOVE_ROLE', 'user'),
  userController.removeRole
);

export default router;
