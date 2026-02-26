import { Request, Response, NextFunction } from 'express';
import jwtService from '../services/jwt.service';
import UserModel from '../database/models/User.model';
import SecurityModel from '../database/models/Security.model';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
        roles?: string[];
        permissions?: string[];
      };
      sessionId?: number;
    }
  }
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
      return;
    }

    // Check if user still exists
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact administrator.`
      });
      return;
    }

    // Check if account is locked
    const isLocked = await UserModel.isLocked(user.user_id);
    if (isLocked) {
      res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
      return;
    }

    // Get user with roles and permissions
    const userWithRoles = await UserModel.findWithRoles(decoded.userId);
    
    // Attach user to request
    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      roles: userWithRoles?.roles?.split(',') || [],
      permissions: userWithRoles?.permissions?.split(',') || []
    };

    // Check for active session
    const tokenHash = jwtService.hashToken(token);
    const session = await SecurityModel.findSessionByToken(tokenHash);
    
    if (session) {
      req.sessionId = session.session_id;
      // Update session activity
      await SecurityModel.updateSessionActivity(session.session_id);
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is provided, but doesn't fail if not
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwtService.verifyAccessToken(token);
    
    if (decoded) {
      const userWithRoles = await UserModel.findWithRoles(decoded.userId);
      
      if (userWithRoles && userWithRoles.status === 'active') {
        req.user = {
          userId: userWithRoles.user_id,
          username: userWithRoles.username,
          email: userWithRoles.email,
          roles: userWithRoles.roles?.split(',') || [],
          permissions: userWithRoles.permissions?.split(',') || []
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Refresh Token Middleware
 * Validates refresh token for token renewal
 */
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required.'
      });
      return;
    }

    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
      return;
    }

    // Check if user still exists
    const user = await UserModel.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
      return;
    }

    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed.'
    });
  }
};
