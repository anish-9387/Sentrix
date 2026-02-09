import { Request, Response } from 'express';
import UserModel from '../database/models/User.model';
import SecurityModel from '../database/models/Security.model';
import LogModel from '../database/models/Log.model';
import passwordService from '../services/password.service';
import jwtService from '../services/jwt.service';
import geoipService from '../services/geoip.service';
import securityService from '../services/security.service';

class AuthController {
  /**
   * User login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: 'Username and password are required.'
        });
        return;
      }

      // Get IP address and user agent
      const ipAddress = (
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        ''
      ).toString().split(',')[0].trim();

      const userAgent = req.headers['user-agent'] || '';

      // Check for suspicious activity
      const suspiciousCheck = await securityService.checkSuspiciousActivity(ipAddress, username);

      if (suspiciousCheck.shouldBlock) {
        // Auto-block the IP
        await securityService.autoBlockIP(ipAddress, suspiciousCheck.reasons.join(', '));

        // Log failed attempt
        await LogModel.createLoginLog({
          username,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'blocked',
          failure_reason: 'Suspicious activity detected'
        });

        res.status(403).json({
          success: false,
          message: 'Access blocked due to suspicious activity.'
        });
        return;
      }

      // Find user
      const user = await UserModel.findByUsername(username);

      if (!user) {
        // Log failed attempt
        await LogModel.createLoginLog({
          username,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: 'Invalid credentials'
        });

        res.status(401).json({
          success: false,
          message: 'Invalid username or password.'
        });
        return;
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        res.status(403).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
          locked_until: user.locked_until
        });
        return;
      }

      // Check account status
      if (user.status !== 'active') {
        await LogModel.createLoginLog({
          user_id: user.user_id,
          username,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: `Account is ${user.status}`
        });

        res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Please contact administrator.`
        });
        return;
      }

      // Verify password
      const isPasswordValid = await passwordService.comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        // Increment failed attempts
        await UserModel.incrementFailedAttempts(user.user_id);

        // Lock account if too many failed attempts
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
        if (user.failed_login_attempts + 1 >= maxAttempts) {
          const lockTime = parseInt(process.env.LOCK_TIME_MINUTES || '30');
          await UserModel.lockAccount(user.user_id, lockTime);

          // Create security alert
          await LogModel.createSecurityAlert({
            alert_type: 'failed_login',
            severity: 'high',
            user_id: user.user_id,
            ip_address: ipAddress,
            description: `Account locked after ${maxAttempts} failed login attempts`
          });
        }

        // Log failed attempt
        await LogModel.createLoginLog({
          user_id: user.user_id,
          username,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: 'Invalid password'
        });

        res.status(401).json({
          success: false,
          message: 'Invalid username or password.'
        });
        return;
      }

      // Get geolocation
      const location = geoipService.getLocation(ipAddress);
      const deviceInfo = geoipService.parseUserAgent(userAgent);

      // Check for new location
      if (location.country) {
        await securityService.checkNewLocation(user.user_id, location.country, location.city || '');
      }

      // Check for unusual time
      if (securityService.checkUnusualTime()) {
        await LogModel.createSecurityAlert({
          alert_type: 'unusual_time',
          severity: 'low',
          user_id: user.user_id,
          ip_address: ipAddress,
          description: `Login at unusual hour: ${new Date().toLocaleString()}`
        });
      }

      // Generate tokens
      const userWithRoles = await UserModel.findWithRoles(user.user_id);
      const tokenPayload = {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        roles: userWithRoles?.roles?.split(',') || []
      };

      const { accessToken, refreshToken } = jwtService.generateTokenPair(tokenPayload);

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const sessionId = await SecurityModel.createSession({
        user_id: user.user_id,
        token_hash: jwtService.hashToken(accessToken),
        refresh_token_hash: jwtService.hashToken(refreshToken),
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt
      });

      // Update last login
      await UserModel.updateLastLogin(user.user_id, ipAddress);

      // Log successful login
      await LogModel.createLoginLog({
        user_id: user.user_id,
        username,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country: location.country,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        login_status: 'success'
      });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.user_id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            roles: userWithRoles?.roles?.split(',') || []
          },
          accessToken,
          refreshToken,
          sessionId
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login.'
      });
    }
  }

  /**
   * User logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.sessionId) {
        await SecurityModel.invalidateSession(req.sessionId);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout.'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token.'
        });
        return;
      }

      // Generate new access token
      const userWithRoles = await UserModel.findWithRoles(req.user.userId);
      const tokenPayload = {
        userId: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        roles: userWithRoles?.roles?.split(',') || []
      };

      const accessToken = jwtService.generateAccessToken(tokenPayload);

      res.status(200).json({
        success: true,
        data: {
          accessToken
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during token refresh.'
      });
    }
  }

  /**
   * Get current user info
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated.'
        });
        return;
      }

      const user = await UserModel.findWithRoles(req.user.userId);

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
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user information.'
      });
    }
  }

  /**
   * Get user activity logs
   */
  async myActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated.'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const loginLogs = await LogModel.getLoginLogsByUser(req.user.userId, limit);
      const auditLogs = await LogModel.getAuditLogsByUser(req.user.userId, limit);
      const sessions = await SecurityModel.getUserSessions(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          loginLogs,
          auditLogs,
          activeSessions: sessions
        }
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching activity.'
      });
    }
  }
}

export default new AuthController();
