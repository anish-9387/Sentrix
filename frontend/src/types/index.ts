// User Types
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

// Role Types
export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions?: string;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
  description?: string;
  category: string;
  created_at: string;
}

// Security Types
export interface SecurityAlert {
  alert_id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_id?: number;
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
  login_status: 'success' | 'failed';
  ip_address: string;
  user_agent?: string;
  country?: string;
  city?: string;
  failure_reason?: string;
  created_at: string;
}

export interface AuditLog {
  log_id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  changes?: string;
  ip_address: string;
  created_at: string;
}

export interface BlockedIP {
  ip_id: number;
  ip_address: string;
  reason: string;
  blocked_by?: number;
  blocked_at: string;
  expires_at?: string;
}

export interface ActiveSession {
  user_id: number;
  username: string;
  email: string;
  last_login: string;
  last_login_ip: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  suspendedUsers: number;
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  blockedIPs: number;
  activeSessions: number;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    severity?: string;
  }>;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}