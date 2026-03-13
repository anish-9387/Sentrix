import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { securityService } from '../services/securityService';
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
} from 'lucide-react';
import { format } from 'date-fns';
import type { DashboardStats } from '../types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const DashboardPage = () => {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => securityService.getDashboardStats(),
    refetchInterval: 30000,
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
      <PageHeader title="Dashboard" subtitle="Security overview and real-time monitoring" />

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
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 font-mono">{ip.ip_address}</p>
                    </div>
                  </div>
                  <Badge variant="indigo">{ip.count} attempts</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {stats?.alertDistribution && stats.alertDistribution.length > 0 && (
          <Card title="Alert Distribution" subtitle="Alerts by type">
            <div className="space-y-3">
              {stats.alertDistribution.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-900 capitalize">
                      {a.severity}
                    </span>
                  </div>
                  <Badge variant="amber">{a.count}</Badge>
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
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
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
                      <div className="flex items-center gap-2 mt-1">
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
