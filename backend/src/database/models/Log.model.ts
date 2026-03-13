import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../connection';

export interface LoginLog extends RowDataPacket {
  log_id: number;
  user_id?: number;
  username?: string;
  ip_address: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  login_status: 'success' | 'failed' | 'blocked';
  failure_reason?: string;
  attempted_at: Date;
}

export interface AuditTrail extends RowDataPacket {
  audit_id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type?: string;
  resource_id?: number;
  endpoint?: string;
  method?: string;
  ip_address?: string;
  user_agent?: string;
  request_body?: string;
  response_status?: number;
  success: boolean;
  error_message?: string;
  session_id?: number;
  created_at: Date;
}

export interface SecurityAlert extends RowDataPacket {
  alert_id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: number;
  ip_address?: string;
  description: string;
  metadata?: any;
  is_resolved: boolean;
  resolved_by?: number;
  resolved_at?: Date;
  created_at: Date;
}

class LogModel {
  // ============================================
  // LOGIN LOGS
  // ============================================

  // Create login log
  async createLoginLog(logData: {
    user_id?: number;
    username?: string;
    ip_address: string;
    user_agent?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    login_status: 'success' | 'failed' | 'blocked';
    failure_reason?: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO login_logs (
        user_id, username, ip_address, user_agent, device_type, browser, os,
        country, city, latitude, longitude, login_status, failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      logData.user_id ?? null,
      logData.username ?? null,
      logData.ip_address,
      logData.user_agent ?? null,
      logData.device_type ?? null,
      logData.browser ?? null,
      logData.os ?? null,
      logData.country ?? null,
      logData.city ?? null,
      logData.latitude ?? null,
      logData.longitude ?? null,
      logData.login_status,
      logData.failure_reason ?? null
    ]);
    return result.insertId;
  }

  // Get login logs with pagination
  async getLoginLogs(limit: number = 100, offset: number = 0): Promise<LoginLog[]> {
    const sql = `
      SELECT * FROM login_logs 
      ORDER BY attempted_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await query<LoginLog[]>(sql, [limit, offset]);
  }

  // Get login logs by user
  async getLoginLogsByUser(userId: number, limit: number = 50): Promise<LoginLog[]> {
    const sql = `
      SELECT * FROM login_logs 
      WHERE user_id = ? 
      ORDER BY attempted_at DESC 
      LIMIT ?
    `;
    return await query<LoginLog[]>(sql, [userId, limit]);
  }

  // Get failed login attempts
  async getFailedLoginAttempts(ipAddress: string, minutes: number = 10): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM login_logs
      WHERE ip_address = ?
      AND login_status = 'failed'
      AND attempted_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;
    const result = await query<RowDataPacket[]>(sql, [ipAddress, minutes]);
    return result[0].count;
  }

  // Get failed login attempts by username
  async getFailedLoginAttemptsByUsername(username: string, minutes: number = 10): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM login_logs
      WHERE username = ?
      AND login_status = 'failed'
      AND attempted_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;
    const result = await query<RowDataPacket[]>(sql, [username, minutes]);
    return result[0].count;
  }

  // ============================================
  // AUDIT TRAILS
  // ============================================

  // Create audit log
  async createAuditLog(auditData: {
    user_id?: number;
    username?: string;
    action: string;
    resource_type?: string;
    resource_id?: number;
    endpoint?: string;
    method?: string;
    ip_address?: string;
    user_agent?: string;
    request_body?: string;
    response_status?: number;
    success?: boolean;
    error_message?: string;
    session_id?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO audit_trails (
        user_id, username, action, resource_type, resource_id, endpoint, method,
        ip_address, user_agent, request_body, response_status, success, error_message, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      auditData.user_id ?? null,
      auditData.username ?? null,
      auditData.action,
      auditData.resource_type ?? null,
      auditData.resource_id ?? null,
      auditData.endpoint ?? null,
      auditData.method ?? null,
      auditData.ip_address ?? null,
      auditData.user_agent ?? null,
      auditData.request_body ?? null,
      auditData.response_status ?? null,
      auditData.success !== undefined ? auditData.success : true,
      auditData.error_message ?? null,
      auditData.session_id ?? null
    ]);
    return result.insertId;
  }

  // Get audit logs with pagination
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditTrail[]> {
    const sql = `
      SELECT * FROM audit_trails 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await query<AuditTrail[]>(sql, [limit, offset]);
  }

  // Get audit logs by user
  async getAuditLogsByUser(userId: number, limit: number = 50): Promise<AuditTrail[]> {
    const sql = `
      SELECT * FROM audit_trails 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return await query<AuditTrail[]>(sql, [userId, limit]);
  }

  // Get audit logs by action
  async getAuditLogsByAction(action: string, limit: number = 50): Promise<AuditTrail[]> {
    const sql = `
      SELECT * FROM audit_trails 
      WHERE action = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return await query<AuditTrail[]>(sql, [action, limit]);
  }

  // ============================================
  // SECURITY ALERTS
  // ============================================

  // Create security alert
  async createSecurityAlert(alertData: {
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    user_id?: number;
    ip_address?: string;
    description: string;
    metadata?: any;
  }): Promise<number> {
    const sql = `
      INSERT INTO security_alerts (
        alert_type, severity, user_id, ip_address, description, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      alertData.alert_type,
      alertData.severity,
      alertData.user_id || null,
      alertData.ip_address,
      alertData.description,
      alertData.metadata ? JSON.stringify(alertData.metadata) : null
    ]);
    return result.insertId;
  }

  // Get security alerts
  async getSecurityAlerts(limit: number = 100, offset: number = 0): Promise<SecurityAlert[]> {
    const sql = `
      SELECT * FROM security_alerts 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await query<SecurityAlert[]>(sql, [limit, offset]);
  }

  // Get unresolved alerts
  async getUnresolvedAlerts(): Promise<SecurityAlert[]> {
    const sql = `
      SELECT * FROM security_alerts 
      WHERE is_resolved = FALSE 
      ORDER BY severity DESC, created_at DESC
    `;
    return await query<SecurityAlert[]>(sql);
  }

  // Resolve alert
  async resolveAlert(alertId: number, resolvedBy: number): Promise<boolean> {
    const sql = `
      UPDATE security_alerts 
      SET is_resolved = TRUE, resolved_by = ?, resolved_at = NOW()
      WHERE alert_id = ?
    `;
    const result = await query<ResultSetHeader>(sql, [resolvedBy, alertId]);
    return result.affectedRows > 0;
  }

  // Get alerts by user
  async getAlertsByUser(userId: number): Promise<SecurityAlert[]> {
    const sql = `
      SELECT * FROM security_alerts 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    return await query<SecurityAlert[]>(sql, [userId]);
  }

  // Get alerts by severity
  async getAlertsBySeverity(severity: string): Promise<SecurityAlert[]> {
    const sql = `
      SELECT * FROM security_alerts 
      WHERE severity = ? 
      ORDER BY created_at DESC
    `;
    return await query<SecurityAlert[]>(sql, [severity]);
  }
}

export default new LogModel();
