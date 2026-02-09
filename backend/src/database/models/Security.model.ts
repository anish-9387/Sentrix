import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../connection';

export interface Session extends RowDataPacket {
  session_id: number;
  user_id: number;
  token_hash: string;
  refresh_token_hash?: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  is_active: boolean;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
}

export interface BlockedIP extends RowDataPacket {
  block_id: number;
  ip_address: string;
  reason: string;
  block_type: 'manual' | 'auto' | 'temporary';
  blocked_at: Date;
  blocked_by?: number;
  expires_at?: Date;
  is_active: boolean;
  attempts_count: number;
}

class SecurityModel {
  // ============================================
  // SESSIONS
  // ============================================

  // Create new session
  async createSession(sessionData: {
    user_id: number;
    token_hash: string;
    refresh_token_hash?: string;
    ip_address: string;
    user_agent?: string;
    device_fingerprint?: string;
    expires_at: Date;
  }): Promise<number> {
    const sql = `
      INSERT INTO sessions (
        user_id, token_hash, refresh_token_hash, ip_address, user_agent, device_fingerprint, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      sessionData.user_id,
      sessionData.token_hash,
      sessionData.refresh_token_hash || null,
      sessionData.ip_address,
      sessionData.user_agent,
      sessionData.device_fingerprint,
      sessionData.expires_at
    ]);
    return result.insertId;
  }

  // Find session by token hash
  async findSessionByToken(tokenHash: string): Promise<Session | null> {
    const sql = `
      SELECT * FROM sessions 
      WHERE token_hash = ? AND is_active = TRUE AND expires_at > NOW()
    `;
    const sessions = await query<Session[]>(sql, [tokenHash]);
    return sessions[0] || null;
  }

  // Get user sessions
  async getUserSessions(userId: number): Promise<Session[]> {
    const sql = `
      SELECT * FROM sessions 
      WHERE user_id = ? AND is_active = TRUE 
      ORDER BY last_activity DESC
    `;
    return await query<Session[]>(sql, [userId]);
  }

  // Update session activity
  async updateSessionActivity(sessionId: number): Promise<boolean> {
    const sql = 'UPDATE sessions SET last_activity = NOW() WHERE session_id = ?';
    const result = await query<ResultSetHeader>(sql, [sessionId]);
    return result.affectedRows > 0;
  }

  // Invalidate session
  async invalidateSession(sessionId: number): Promise<boolean> {
    const sql = 'UPDATE sessions SET is_active = FALSE WHERE session_id = ?';
    const result = await query<ResultSetHeader>(sql, [sessionId]);
    return result.affectedRows > 0;
  }

  // Invalidate all user sessions
  async invalidateUserSessions(userId: number): Promise<boolean> {
    const sql = 'UPDATE sessions SET is_active = FALSE WHERE user_id = ?';
    const result = await query<ResultSetHeader>(sql, [userId]);
    return result.affectedRows > 0;
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<number> {
    const sql = 'DELETE FROM sessions WHERE expires_at < NOW()';
    const result = await query<ResultSetHeader>(sql);
    return result.affectedRows;
  }

  // ============================================
  // BLOCKED IPs
  // ============================================

  // Block IP address
  async blockIP(blockData: {
    ip_address: string;
    reason: string;
    block_type?: 'manual' | 'auto' | 'temporary';
    blocked_by?: number;
    expires_at?: Date;
  }): Promise<number> {
    const sql = `
      INSERT INTO blocked_ips (ip_address, reason, block_type, blocked_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        reason = VALUES(reason),
        block_type = VALUES(block_type),
        is_active = TRUE,
        attempts_count = attempts_count + 1
    `;
    const result = await query<ResultSetHeader>(sql, [
      blockData.ip_address,
      blockData.reason,
      blockData.block_type || 'manual',
      blockData.blocked_by || null,
      blockData.expires_at || null
    ]);
    return result.insertId || result.affectedRows;
  }

  // Check if IP is blocked
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const sql = `
      SELECT * FROM blocked_ips 
      WHERE ip_address = ? 
      AND is_active = TRUE 
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const result = await query<BlockedIP[]>(sql, [ipAddress]);
    return result.length > 0;
  }

  // Get blocked IP details
  async getBlockedIP(ipAddress: string): Promise<BlockedIP | null> {
    const sql = 'SELECT * FROM blocked_ips WHERE ip_address = ?';
    const result = await query<BlockedIP[]>(sql, [ipAddress]);
    return result[0] || null;
  }

  // Get all blocked IPs
  async getAllBlockedIPs(): Promise<BlockedIP[]> {
    const sql = `
      SELECT * FROM blocked_ips 
      WHERE is_active = TRUE 
      ORDER BY blocked_at DESC
    `;
    return await query<BlockedIP[]>(sql);
  }

  // Unblock IP
  async unblockIP(ipAddress: string): Promise<boolean> {
    const sql = 'UPDATE blocked_ips SET is_active = FALSE WHERE ip_address = ?';
    const result = await query<ResultSetHeader>(sql, [ipAddress]);
    return result.affectedRows > 0;
  }

  // Clean expired blocks
  async cleanExpiredBlocks(): Promise<number> {
    const sql = `
      UPDATE blocked_ips 
      SET is_active = FALSE 
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `;
    const result = await query<ResultSetHeader>(sql);
    return result.affectedRows;
  }

  // ============================================
  // ACCESS ATTEMPTS
  // ============================================

  // Log access attempt
  async logAccessAttempt(attemptData: {
    username?: string;
    ip_address: string;
    attempt_type?: 'login' | 'api' | 'admin';
    endpoint?: string;
    method?: string;
    status_code?: number;
    is_suspicious?: boolean;
    risk_score?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO access_attempts (
        username, ip_address, attempt_type, endpoint, method, status_code, is_suspicious, risk_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query<ResultSetHeader>(sql, [
      attemptData.username,
      attemptData.ip_address,
      attemptData.attempt_type || 'login',
      attemptData.endpoint,
      attemptData.method,
      attemptData.status_code,
      attemptData.is_suspicious || false,
      attemptData.risk_score || 0
    ]);
    return result.insertId;
  }

  // Get suspicious attempts
  async getSuspiciousAttempts(limit: number = 100): Promise<RowDataPacket[]> {
    const sql = `
      SELECT * FROM access_attempts 
      WHERE is_suspicious = TRUE 
      ORDER BY attempted_at DESC 
      LIMIT ?
    `;
    return await query<RowDataPacket[]>(sql, [limit]);
  }

  // Get attempts by IP
  async getAttemptsByIP(ipAddress: string, hours: number = 24): Promise<RowDataPacket[]> {
    const sql = `
      SELECT * FROM access_attempts 
      WHERE ip_address = ? 
      AND attempted_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY attempted_at DESC
    `;
    return await query<RowDataPacket[]>(sql, [ipAddress, hours]);
  }
}

export default new SecurityModel();
