import LogModel from '../database/models/Log.model';
import SecurityModel from '../database/models/Security.model';

interface SuspiciousActivityCheck {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
  shouldBlock: boolean;
}

class SecurityService {
  private readonly FAILED_LOGIN_THRESHOLD = parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5');
  private readonly FAILED_LOGIN_WINDOW = parseInt(process.env.FAILED_LOGIN_WINDOW_MINUTES || '10');
  private readonly SUSPICIOUS_IP_THRESHOLD = parseInt(process.env.SUSPICIOUS_IP_THRESHOLD || '10');

  /**
   * Check for suspicious login activity
   */
  async checkSuspiciousActivity(
    ipAddress: string,
    username?: string,
    _userId?: number
  ): Promise<SuspiciousActivityCheck> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check failed login attempts from this IP
    const failedAttempts = await LogModel.getFailedLoginAttempts(
      ipAddress,
      this.FAILED_LOGIN_WINDOW
    );

    if (failedAttempts >= this.FAILED_LOGIN_THRESHOLD) {
      reasons.push(`${failedAttempts} failed login attempts in ${this.FAILED_LOGIN_WINDOW} minutes`);
      riskScore += 30;
    }

    // Check if IP is already blocked
    const isBlocked = await SecurityModel.isIPBlocked(ipAddress);
    if (isBlocked) {
      reasons.push('IP address is blocked');
      riskScore += 50;
      return {
        isSuspicious: true,
        reasons,
        riskScore,
        shouldBlock: true
      };
    }

    // Check total suspicious attempts from this IP
    const suspiciousAttempts = await SecurityModel.getAttemptsByIP(ipAddress, 24);
    if (suspiciousAttempts.length >= this.SUSPICIOUS_IP_THRESHOLD) {
      reasons.push(`${suspiciousAttempts.length} suspicious attempts in last 24 hours`);
      riskScore += 20;
    }

    // Determine if should block
    const shouldBlock = riskScore >= 50 || failedAttempts >= this.FAILED_LOGIN_THRESHOLD;

    // Log suspicious activity
    if (reasons.length > 0) {
      await SecurityModel.logAccessAttempt({
        username,
        ip_address: ipAddress,
        attempt_type: 'login',
        is_suspicious: true,
        risk_score: riskScore
      });
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      riskScore,
      shouldBlock
    };
  }

  /**
   * Check for new location login
   */
  async checkNewLocation(
    userId: number,
    currentCountry: string,
    _currentCity: string
  ): Promise<boolean> {
    // Get last successful login
    const recentLogins = await LogModel.getLoginLogsByUser(userId, 5);
    const successfulLogins = recentLogins.filter(log => log.login_status === 'success');

    if (successfulLogins.length === 0) {
      return false; // First login
    }

    const lastLogin = successfulLogins[0];
    
    // Check if location is significantly different
    if (lastLogin.country && lastLogin.country !== currentCountry) {
      // Create alert for new country
      await LogModel.createSecurityAlert({
        alert_type: 'new_location',
        severity: 'medium',
        user_id: userId,
        ip_address: currentCountry,
        description: `Login from new country: ${currentCountry} (Previous: ${lastLogin.country})`
      });
      return true;
    }

    return false;
  }

  /**
   * Check for unusual time login
   */
  checkUnusualTime(): boolean {
    const hour = new Date().getHours();
    // Consider 2 AM - 5 AM as unusual hours
    if (hour >= 2 && hour <= 5) {
      return true;
    }
    return false;
  }

  /**
   * Check for multiple IPs for same user
   */
  async checkMultipleIPs(userId: number, currentIP: string): Promise<boolean> {
    const recentLogins = await LogModel.getLoginLogsByUser(userId, 10);
    const uniqueIPs = new Set(recentLogins.map(log => log.ip_address));
    
    // If more than 3 different IPs in recent logins
    if (uniqueIPs.size > 3 && !uniqueIPs.has(currentIP)) {
      return true;
    }
    
    return false;
  }

  /**
   * Auto-block suspicious IP
   */
  async autoBlockIP(ipAddress: string, reason: string): Promise<void> {
    // Block for 1 hour temporarily
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await SecurityModel.blockIP({
      ip_address: ipAddress,
      reason,
      block_type: 'auto',
      expires_at: expiresAt
    });

    // Create security alert
    await LogModel.createSecurityAlert({
      alert_type: 'suspicious_activity',
      severity: 'high',
      ip_address: ipAddress,
      description: `IP automatically blocked: ${reason}`
    });
  }

  /**
   * Clean up expired sessions and blocks
   */
  async cleanup(): Promise<void> {
    await SecurityModel.cleanExpiredSessions();
    await SecurityModel.cleanExpiredBlocks();
  }
}

export default new SecurityService();
