import { api } from '../lib/axios';

export const securityService = {
  getDashboardStats: () =>
    api.get('/security/dashboard/stats').then((r) => r.data),

  getLoginLogs: (params?: { limit?: number; page?: number; status?: string }) =>
    api.get('/security/logs/login', { params }).then((r) => r.data),

  getAuditLogs: (params?: { limit?: number; page?: number }) =>
    api.get('/security/logs/audit', { params }).then((r) => r.data),

  getAlerts: (params?: { limit?: number; page?: number; severity?: string }) =>
    api.get('/security/alerts', { params }).then((r) => r.data),

  getUnresolvedAlerts: () =>
    api.get('/security/alerts/unresolved').then((r) => r.data),

  resolveAlert: (id: number) =>
    api.put(`/security/alerts/${id}/resolve`).then((r) => r.data),

  getBlockedIPs: () =>
    api.get('/security/ips/blocked').then((r) => r.data),

  blockIP: (data: { ipAddress: string; reason: string }) =>
    api.post('/security/ips/block', data).then((r) => r.data),

  unblockIP: (ipAddress: string) =>
    api.post('/security/ips/unblock', { ipAddress }).then((r) => r.data),

  getActiveSessions: () =>
    api.get('/security/sessions/active').then((r) => r.data),
};
