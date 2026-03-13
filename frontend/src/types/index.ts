// ─── User Types ───────────────────────────────────────────
export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  status: 'active' | 'inactive' | 'suspended' | 'blocked';
  is_email_verified: boolean;
  last_login?: string;
  last_login_ip?: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  roles?: string;
  permissions?: string;
}

// ─── Role Types ───────────────────────────────────────────
export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  priority: number;
  is_active: boolean;
  is_system_role?: boolean;
  created_at: string;
  updated_at: string;
  permissions?: string;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  created_at: string;
}

// ─── Security Types ──────────────────────────────────────
export interface SecurityAlert {
  alert_id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_id?: number;
  metadata?: unknown;
  is_resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  username?: string;
  resolved_by_username?: string;
}

export interface LoginLog {
  log_id: number;
  user_id?: number;
  username?: string;
  login_status: 'success' | 'failed' | 'blocked';
  ip_address: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  failure_reason?: string;
  attempted_at?: string;
  created_at: string;
}

export interface AuditLog {
  audit_id: number;
  log_id?: number;
  // The DB might return either field name for the PK
  user_id?: number;
  performed_by?: number;
  username?: string;
  performed_by_username?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  endpoint?: string;
  http_method?: string;
  method?: string;
  ip_address: string;
  user_agent?: string;
  request_body?: Record<string, unknown> | string;
  response_status?: number;
  status_code?: number;
  success?: boolean;
  error_message?: string;
  session_id?: number;
  changes?: Record<string, unknown> | string;
  performed_at?: string;
  created_at: string;
}

export interface BlockedIP {
  block_id: number;
  ip_id?: number;
  ip_address: string;
  reason?: string;
  block_type?: 'manual' | 'auto' | 'temporary';
  blocked_at?: string;
  created_at?: string;
  blocked_by?: number;
  expires_at?: string;
  blocked_until?: string;
  is_permanent?: boolean;
  is_active?: boolean;
  attempts_count?: number;
}

export interface ActiveSession {
  session_id?: number;
  user_id: number;
  username?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  is_active?: boolean;
  last_login?: string;
  last_login_ip?: string;
  last_activity?: string;
  last_active_at?: string;
  created_at?: string;
  expires_at?: string;
}

// ─── Dashboard Types ─────────────────────────────────────
export interface DashboardStats {
  overview?: {
    totalUsers: number;
    activeSessions: number;
    failedLoginsToday: number;
    unresolvedAlerts: number;
    blockedIPs: number;
  };
  loginStats?: Array<{ date: string; login_status: string; count: number }>;
  topIPs?: Array<{ ip_address: string; count: number }>;
  alertDistribution?: Array<{ severity: string; count: number }>;
  totalUsers?: number;
  activeUsers?: number;
  blockedUsers?: number;
  suspendedUsers?: number;
  totalLoginAttempts?: number;
  failedLoginAttempts?: number;
  successfulLogins?: number;
  unresolvedAlerts?: number;
  criticalAlerts?: number;
  blockedIPs?: number;
  activeSessions?: number;
  recentActivity?: Array<{
    type: string;
    message: string;
    timestamp: string;
    severity?: string;
  }>;
}

// ─── Auth Types ──────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      fullName: string;
      roles: string[];
    };
    accessToken: string;
    refreshToken: string;
    sessionId: number;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  full_name?: string;
  roles: string[];
  permissions?: string[];
  status?: string;
  lastLogin?: string;
  createdAt?: string;
  accessToken: string;
  refreshToken: string;
  sessionId?: number;
}

export interface MyActivity {
  loginLogs: LoginLog[];
  auditLogs: AuditLog[];
  activeSessions: ActiveSession[];
}

// ─── API Response Types ──────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
