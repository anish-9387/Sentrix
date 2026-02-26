import { Request, Response, NextFunction } from 'express';
import LogModel from '../database/models/Log.model';

/**
 * Audit Logger Middleware
 * Logs all incoming requests to audit trail
 */
export const auditLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Store original send function
  const originalSend = res.send;
  let responseStatus = 200;

  // Override send to capture response status
  res.send = function (data: any): Response {
    responseStatus = res.statusCode;
    res.send = originalSend;
    return res.send(data);
  };

  // Get IP address (considering proxies)
  const ipAddress = (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    ''
  ).toString().split(',')[0].trim();

  // Continue with request
  res.on('finish', async () => {
    try {
      // Determine action based on method and path
      const action = `${req.method} ${req.path}`;
      
      // Get resource type from path
      const pathParts = req.path.split('/').filter(p => p);
      const resourceType = pathParts[2] || pathParts[1]; // /api/v1/resource

      // Sanitize request body (remove sensitive data)
      let requestBody: string | undefined = undefined;
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.currentPassword;
        delete sanitizedBody.newPassword;
        delete sanitizedBody.confirmPassword;
        requestBody = JSON.stringify(sanitizedBody);
      }

      // Create audit log
      await LogModel.createAuditLog({
        user_id: req.user?.userId,
        username: req.user?.username,
        action,
        resource_type: resourceType,
        endpoint: req.path,
        method: req.method,
        ip_address: ipAddress,
        user_agent: req.headers['user-agent'],
        request_body: requestBody,
        response_status: responseStatus,
        success: responseStatus < 400,
        session_id: req.sessionId
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request if audit logging fails
    }
  });

  next();
};

/**
 * Audit specific actions
 */
export const auditAction = (actionName: string, resourceType?: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ipAddress = (
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        ''
      ).toString().split(',')[0].trim();

      // Extract resource ID from params if available
      const resourceId = req.params.id ? parseInt(req.params.id) : null;

      await LogModel.createAuditLog({
        user_id: req.user?.userId,
        username: req.user?.username,
        action: actionName,
        resource_type: resourceType,
        resource_id: resourceId || undefined,
        endpoint: req.path,
        method: req.method,
        ip_address: ipAddress,
        user_agent: req.headers['user-agent'],
        success: true,
        session_id: req.sessionId
      });

      next();
    } catch (error) {
      console.error('Action audit error:', error);
      next();
    }
  };
};
