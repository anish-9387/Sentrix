import { api } from '../lib/axios';

export const securityService = {
  // Dashboard stats
  async getDashboardStats() {
    const response = await api.get('/security/dashboard/stats');
    return response.data;
  },

  // Login logs
  async getLoginLogs(params?: { limit?: number; offset?: number; status?: string }) {
    const response = await api.get('/security/logs/login', { params });
    return response.data;
  },

  // Audit logs
  async getAuditLogs(params?: { limit?: number; offset?: number }) {
    const response = await api.get('/security/logs/audit', { params });
    return response.data;
  },

  // Security alerts
  async getSecurityAlerts(params?: { limit?: number; offset?: number; severity?: string }) {
    const response = await api.get('/security/alerts', { params });
    return response.data;
  },

  // Get unresolved alerts
  async getUnresolvedAlerts() {
    const response = await api.get('/security/alerts/unresolved');
    return response.data;
  },

  // Resolve alert
  async resolveAlert(id: number) {
    const response = await api.put(`/security/alerts/${id}/resolve`);
    return response.data;
  },

  // Get blocked IPs
  async getBlockedIPs() {
    const response = await api.get('/security/ips/blocked');
    return response.data;
  },

  // Block IP
  async blockIP(ipData: { ip_address: string; reason: string; duration?: number }) {
    const response = await api.post('/security/ips/block', ipData);
    return response.data;
  },

  // Unblock IP
  async unblockIP(ipAddress: string) {
    const response = await api.post('/security/ips/unblock', { ip_address: ipAddress });
    return response.data;
  },

  // Get active sessions
  async getActiveSessions() {
    const response = await api.get('/security/sessions/active');
    return response.data;
  },
};
