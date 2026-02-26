import { Request, Response } from 'express';
import LogModel from '../database/models/Log.model';
import SecurityModel from '../database/models/Security.model';
import { query } from '../database/connection';
import { RowDataPacket } from 'mysql2';

class SecurityController {
  /**
   * Get login logs
   */
  async getLoginLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const logs = await LogModel.getLoginLogs(limit, offset);

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Get login logs error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching login logs.'
      });
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const logs = await LogModel.getAuditLogs(limit, offset);

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching audit logs.'
      });
    }
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const alerts = await LogModel.getSecurityAlerts(limit, offset);

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Get security alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching security alerts.'
      });
    }
  }

  /**
   * Get unresolved alerts
   */
  async getUnresolvedAlerts(_req: Request, res: Response): Promise<void> {
    try {
      const alerts = await LogModel.getUnresolvedAlerts();

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Get unresolved alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching unresolved alerts.'
      });
    }
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const alertId = parseInt(req.params.id);

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
        return;
      }

      const resolved = await LogModel.resolveAlert(alertId, req.user.userId);

      if (!resolved) {
        res.status(404).json({
          success: false,
          message: 'Alert not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Alert resolved successfully.'
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while resolving alert.'
      });
    }
  }

  /**
   * Get blocked IPs
   */
  async getBlockedIPs(_req: Request, res: Response): Promise<void> {
    try {
      const blockedIPs = await SecurityModel.getAllBlockedIPs();

      res.status(200).json({
        success: true,
        data: blockedIPs
      });
    } catch (error) {
      console.error('Get blocked IPs error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching blocked IPs.'
      });
    }
  }

  /**
   * Block IP address
   */
  async blockIP(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress, reason } = req.body;

      if (!ipAddress || !reason) {
        res.status(400).json({
          success: false,
          message: 'IP address and reason are required.'
        });
        return;
      }

      await SecurityModel.blockIP({
        ip_address: ipAddress,
        reason,
        block_type: 'manual',
        blocked_by: req.user?.userId
      });

      res.status(200).json({
        success: true,
        message: 'IP blocked successfully.'
      });
    } catch (error) {
      console.error('Block IP error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while blocking IP.'
      });
    }
  }

  /**
   * Unblock IP address
   */
  async unblockIP(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress } = req.body;

      if (!ipAddress) {
        res.status(400).json({
          success: false,
          message: 'IP address is required.'
        });
        return;
      }

      const unblocked = await SecurityModel.unblockIP(ipAddress);

      if (!unblocked) {
        res.status(404).json({
          success: false,
          message: 'IP not found or already unblocked.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'IP unblocked successfully.'
      });
    } catch (error) {
      console.error('Unblock IP error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while unblocking IP.'
      });
    }
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(_req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT 
          s.*,
          u.username,
          u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.is_active = TRUE
        ORDER BY s.last_activity DESC
        LIMIT 100
      `;
      const sessions = await query<RowDataPacket[]>(sql);

      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching active sessions.'
      });
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      // Total users
      const totalUsersQuery = 'SELECT COUNT(*) as count FROM users';
      const totalUsers = await query<RowDataPacket[]>(totalUsersQuery);

      // Active sessions
      const activeSessionsQuery = 'SELECT COUNT(*) as count FROM sessions WHERE is_active = TRUE';
      const activeSessions = await query<RowDataPacket[]>(activeSessionsQuery);

      // Failed logins today
      const failedLoginsQuery = `
        SELECT COUNT(*) as count 
        FROM login_logs 
        WHERE login_status = 'failed' 
        AND DATE(attempted_at) = CURDATE()
      `;
      const failedLogins = await query<RowDataPacket[]>(failedLoginsQuery);

      // Unresolved alerts
      const unresolvedAlertsQuery = 'SELECT COUNT(*) as count FROM security_alerts WHERE is_resolved = FALSE';
      const unresolvedAlerts = await query<RowDataPacket[]>(unresolvedAlertsQuery);

      // Blocked IPs
      const blockedIPsQuery = 'SELECT COUNT(*) as count FROM blocked_ips WHERE is_active = TRUE';
      const blockedIPs = await query<RowDataPacket[]>(blockedIPsQuery);

      // Login stats by day (last 7 days)
      const loginStatsQuery = `
        SELECT 
          DATE(attempted_at) as date,
          login_status,
          COUNT(*) as count
        FROM login_logs
        WHERE attempted_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(attempted_at), login_status
        ORDER BY date DESC
      `;
      const loginStats = await query<RowDataPacket[]>(loginStatsQuery);

      // Top IPs
      const topIPsQuery = `
        SELECT 
          ip_address,
          COUNT(*) as count
        FROM login_logs
        WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY ip_address
        ORDER BY count DESC
        LIMIT 10
      `;
      const topIPs = await query<RowDataPacket[]>(topIPsQuery);

      // Alert distribution
      const alertDistributionQuery = `
        SELECT 
          severity,
          COUNT(*) as count
        FROM security_alerts
        WHERE is_resolved = FALSE
        GROUP BY severity
      `;
      const alertDistribution = await query<RowDataPacket[]>(alertDistributionQuery);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalUsers: totalUsers[0].count,
            activeSessions: activeSessions[0].count,
            failedLoginsToday: failedLogins[0].count,
            unresolvedAlerts: unresolvedAlerts[0].count,
            blockedIPs: blockedIPs[0].count
          },
          loginStats,
          topIPs,
          alertDistribution
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching dashboard statistics.'
      });
    }
  }
}

export default new SecurityController();
