import { Router } from 'express';
import securityController from '../controllers/security.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middlewares/rbac.middleware';

const router : Router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard statistics
router.get(
  '/dashboard/stats',
  requireAnyPermission(['logs.read', 'audit.read', 'alerts.read']),
  securityController.getDashboardStats
);

// Login logs
router.get(
  '/logs/login',
  requirePermission('logs.read'),
  securityController.getLoginLogs
);

// Audit logs
router.get(
  '/logs/audit',
  requirePermission('audit.read'),
  securityController.getAuditLogs
);

// Security alerts
router.get(
  '/alerts',
  requirePermission('alerts.read'),
  securityController.getSecurityAlerts
);

router.get(
  '/alerts/unresolved',
  requirePermission('alerts.read'),
  securityController.getUnresolvedAlerts
);

router.put(
  '/alerts/:id/resolve',
  requirePermission('alerts.manage'),
  securityController.resolveAlert
);

// IP management
router.get(
  '/ips/blocked',
  requirePermission('ip.view'),
  securityController.getBlockedIPs
);

router.post(
  '/ips/block',
  requirePermission('ip.block'),
  securityController.blockIP
);

router.post(
  '/ips/unblock',
  requirePermission('ip.unblock'),
  securityController.unblockIP
);

// Active sessions
router.get(
  '/sessions/active',
  requirePermission('logs.read'),
  securityController.getActiveSessions
);

export default router;
