import { Request, Response, NextFunction } from 'express';
import SecurityModel from '../database/models/Security.model';

/**
 * IP Blocking Middleware
 * Checks if IP is blocked before processing request
 */
export const checkBlockedIP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get IP address
    const ipAddress = (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      ''
    ).toString().split(',')[0].trim();

    // Check if IP is blocked
    const isBlocked = await SecurityModel.isIPBlocked(ipAddress);

    if (isBlocked) {
      const blockInfo = await SecurityModel.getBlockedIP(ipAddress);
      
      res.status(403).json({
        success: false,
        message: 'Access denied. Your IP address has been blocked.',
        reason: blockInfo?.reason,
        blocked_at: blockInfo?.blocked_at,
        expires_at: blockInfo?.expires_at
      });
      return;
    }

    next();
  } catch (error) {
    console.error('IP block check error:', error);
    next(); // Continue on error to not break legitimate requests
  }
};

/**
 * Rate limiting by IP using in-memory store
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitByIP = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ipAddress = (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      ''
    ).toString().split(',')[0].trim();

    const now = Date.now();
    const requestData = requestCounts.get(ipAddress);

    if (!requestData || now > requestData.resetTime) {
      // Reset counter
      requestCounts.set(ipAddress, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (requestData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
      return;
    }

    requestData.count++;
    requestCounts.set(ipAddress, requestData);
    next();
  };
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60000); // Clean every minute
