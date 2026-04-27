import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { securityService } from '../services/securityService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { StatCard, Card, Spinner, Badge, PageHeader } from '../components/UI';
import {
  Users,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Clock,
  Globe,
  ShieldAlert,
  Wifi,
  CheckCircle2,
  XCircle,
  UserCheck,
  MapPin,
  Monitor,
} from 'lucide-react';
import { format } from 'date-fns';
import type { DashboardStats, MyActivity } from '../types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const isAdminUser = (roles?: string[]) =>
  (roles || []).some((role) => role.toLowerCase().includes('admin'));

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const isAdmin = useMemo(() => isAdminUser(user?.roles), [user?.roles]);

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

const AdminDashboard = () => {
  const hasAccessToken = !!localStorage.getItem('accessToken');
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => securityService.getDashboardStats(),
    refetchInterval: 30000,
    enabled: hasAccessToken,
  });

  if (isLoading) return <Spinner />;

  const stats = statsRes?.data as DashboardStats | undefined;
  const ov = stats?.overview;

  // Support both response shapes
  const totalUsers = ov?.totalUsers ?? stats?.totalUsers ?? 0;
  const activeSessions = ov?.activeSessions ?? stats?.activeSessions ?? 0;
  const failedLogins = ov?.failedLoginsToday ?? stats?.failedLoginAttempts ?? 0;
  const unresolvedAlerts = ov?.unresolvedAlerts ?? stats?.unresolvedAlerts ?? 0;
  const blockedIPs = ov?.blockedIPs ?? stats?.blockedIPs ?? 0;

  // loginStats is an array of { date, login_status, count } rows — aggregate totals
  const loginStatsRows: Array<{ date: string; login_status: string; count: number }> = stats?.loginStats || [];
  const loginTotal = loginStatsRows.reduce((s, r) => s + Number(r.count), 0) || stats?.totalLoginAttempts || 0;
  const loginSuccess = loginStatsRows.filter((r) => r.login_status === 'success').reduce((s, r) => s + Number(r.count), 0) || stats?.successfulLogins || 0;
  const loginFailed = loginStatsRows.filter((r) => r.login_status === 'failed').reduce((s, r) => s + Number(r.count), 0) || stats?.failedLoginAttempts || 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Security overview and real-time monitoring" />

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="indigo" />
        <StatCard icon={Wifi} label="Active Sessions" value={activeSessions} color="emerald" />
        <StatCard icon={ShieldAlert} label="Failed Logins Today" value={failedLogins} color="rose" />
        <StatCard icon={AlertTriangle} label="Unresolved Alerts" value={unresolvedAlerts} color="amber" />
        <StatCard icon={Globe} label="Blocked IPs" value={blockedIPs} color="violet" />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Login Activity */}
        <Card title="Login Activity" subtitle="Authentication metrics">
          <div className="space-y-5">
            {[
              { label: 'Total Attempts', value: loginTotal, color: 'text-slate-900' },
              { label: 'Successful', value: loginSuccess, color: 'text-emerald-600' },
              { label: 'Failed', value: loginFailed, color: 'text-rose-600' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{r.label}</span>
                <span className={`text-2xl font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
            {/* Progress bar */}
            {loginTotal > 0 && (
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${(loginSuccess / loginTotal) * 100}%` }}
                />
                <div
                  className="bg-rose-500 transition-all"
                  style={{ width: `${(loginFailed / loginTotal) * 100}%` }}
                />
              </div>
            )}
          </div>
        </Card>

        {/* User Status */}
        <Card title="User Status" subtitle="Account distribution">
          <div className="space-y-4">
            {[
              { label: 'Active', value: stats?.activeUsers ?? 0, color: 'bg-emerald-500' },
              { label: 'Blocked', value: stats?.blockedUsers ?? 0, color: 'bg-rose-500' },
              { label: 'Suspended', value: stats?.suspendedUsers ?? 0, color: 'bg-amber-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  <span className="text-sm text-slate-500">{s.label}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Posture */}
        <Card title="Security Posture" subtitle="Threat indicators">
          <div className="space-y-4">
            {[
              { label: 'Critical Alerts', value: stats?.criticalAlerts ?? 0, variant: 'rose' as const },
              { label: 'Blocked IPs', value: blockedIPs, variant: 'amber' as const },
              { label: 'Active Sessions', value: activeSessions, variant: 'emerald' as const },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{s.label}</span>
                <Badge variant={s.variant} dot>{s.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Top IPs & Alert Distribution */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats?.topIPs && stats.topIPs.length > 0 && (
          <Card title="Top IP Addresses" subtitle="Most active login sources">
            <div className="space-y-3">
              {stats.topIPs.map((ip, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate break-all text-sm font-medium text-slate-900 font-mono sm:break-normal">{ip.ip_address}</p>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto">
                    <Badge variant="indigo">{ip.count} attempts</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {stats?.alertDistribution && stats.alertDistribution.length > 0 && (
          <Card title="Alert Distribution" subtitle="Alerts by type">
            <div className="space-y-3">
              {stats.alertDistribution.map((a, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <span className="truncate text-sm font-medium text-slate-900 capitalize">
                      {a.severity}
                    </span>
                  </div>
                  <div className="self-start sm:self-auto">
                    <Badge variant="amber">{a.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <motion.div variants={item}>
          <Card title="Recent Activity" subtitle="Latest security events">
            <div className="space-y-2">
              {stats.recentActivity.map((act, idx) => {
                const severityColor =
                  act.severity === 'critical' || act.severity === 'high'
                    ? 'rose'
                    : act.severity === 'medium'
                    ? 'amber'
                    : 'sky';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex flex-col gap-3 rounded-xl p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-start sm:gap-4"
                  >
                    <div className={`self-start p-2 rounded-lg ${
                      severityColor === 'rose' ? 'bg-rose-50' : severityColor === 'amber' ? 'bg-amber-50' : 'bg-sky-50'
                    }`}>
                      {act.type === 'alert' ? (
                        <AlertTriangle size={18} className={`${
                          severityColor === 'rose' ? 'text-rose-500' : severityColor === 'amber' ? 'text-amber-500' : 'text-sky-500'
                        }`} />
                      ) : (
                        <Activity size={18} className="text-sky-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{act.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-400">{format(new Date(act.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                        {act.severity && <Badge variant={severityColor as any}>{act.severity}</Badge>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

const UserDashboard = () => {
  const { user } = useAuthStore();
  const hasAccessToken = !!localStorage.getItem('accessToken');

  const { data: activityRes, isLoading } = useQuery({
    queryKey: ['my-dashboard-activity'],
    queryFn: () => authService.myActivity(30),
    refetchInterval: 30000,
    enabled: hasAccessToken,
  });

  if (isLoading) return <Spinner />;

  const data = activityRes?.data as MyActivity | undefined;
  const loginLogs = data?.loginLogs || [];
  const auditLogs = data?.auditLogs || [];
  const activeSessions = data?.activeSessions || [];

  const successfulLogins = loginLogs.filter((log) => log.login_status === 'success').length;
  const failedLogins = loginLogs.filter((log) => log.login_status === 'failed').length;
  const blockedLogins = loginLogs.filter((log) => log.login_status === 'blocked').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="User Dashboard"
        subtitle={`Welcome back, ${user?.fullName || user?.username || 'User'}. Here is your personal security activity.`}
      />

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Login Attempts" value={loginLogs.length} color="indigo" />
        <StatCard icon={CheckCircle2} label="Successful Logins" value={successfulLogins} color="emerald" />
        <StatCard icon={XCircle} label="Failed Logins" value={failedLogins + blockedLogins} color="rose" />
        <StatCard icon={UserCheck} label="Active Sessions" value={activeSessions.length} color="violet" />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Recent Sign-ins" subtitle="Latest authentication activity">
          <div className="space-y-3">
            {loginLogs.length > 0 ? (
              loginLogs.slice(0, 8).map((log, idx) => {
                const statusVariant =
                  log.login_status === 'success'
                    ? 'emerald'
                    : log.login_status === 'blocked'
                    ? 'amber'
                    : 'rose';

                return (
                  <motion.div
                    key={log.log_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Monitor size={14} className="text-slate-400" />
                        <span className="truncate text-slate-700">
                          {[log.browser, log.os].filter(Boolean).join(' / ') || 'Unknown device'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <MapPin size={12} />
                        <span className="truncate">
                          {log.city && log.country ? `${log.city}, ${log.country}` : log.country || log.ip_address || 'Unknown location'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(log.attempted_at || log.created_at)}</p>
                    </div>
                    <Badge variant={statusVariant} dot>
                      {log.login_status}
                    </Badge>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No recent sign-in records found.</p>
            )}
          </div>
        </Card>

        <Card title="Recent Account Actions" subtitle="Your latest audit events">
          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 8).map((log, idx) => (
                <motion.div
                  key={log.audit_id ?? `${log.action}-${idx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{log.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {log.resource_type}
                        {log.endpoint ? ` • ${log.endpoint}` : ''}
                      </p>
                    </div>
                    <Badge variant={log.success === false ? 'rose' : 'sky'}>
                      {log.success === false ? 'failed' : 'ok'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(log.performed_at || log.created_at)}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No recent account actions found.</p>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card title="Active Sessions" subtitle="Devices currently signed into your account">
          <div className="space-y-3">
            {activeSessions.length > 0 ? (
              activeSessions.slice(0, 6).map((session, idx) => (
                <motion.div
                  key={session.session_id ?? `${session.ip_address}-${idx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {[session.browser, session.os].filter(Boolean).join(' / ') || 'Unknown client'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{session.ip_address || 'Unknown IP'}</p>
                  </div>
                  <Badge variant="indigo">{formatDateTime(session.last_active_at || session.last_activity)}</Badge>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No active sessions found.</p>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
