import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { securityService } from '../services/securityService';
import { Card, Badge, Spinner, EmptyState, PageHeader, StatCard } from '../components/UI';
import {
  Activity, CheckCircle, XCircle, Globe, Clock, Monitor, Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import type { LoginLog } from '../types';

const filters = [
  { key: 'all', label: 'All Logs', color: 'bg-indigo-600' },
  { key: 'success', label: 'Successful', color: 'bg-emerald-600' },
  { key: 'failed', label: 'Failed', color: 'bg-rose-600' },
  { key: 'blocked', label: 'Blocked', color: 'bg-amber-600' },
] as const;

export const LoginLogsPage = () => {
  const [filter, setFilter] = useState<string>('all');

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['login-logs', filter],
    queryFn: () => securityService.getLoginLogs(filter !== 'all' ? { status: filter } : undefined),
  });

  if (isLoading) return <Spinner />;

  const logs: LoginLog[] = logsRes?.data || [];
  const success = logs.filter((l) => l.login_status === 'success').length;
  const failed = logs.filter((l) => l.login_status === 'failed').length;
  const blocked = logs.filter((l) => l.login_status === 'blocked').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Login Logs" subtitle="Monitor all authentication attempts across the system" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Attempts" value={logs.length} color="indigo" />
        <StatCard icon={CheckCircle} label="Successful" value={success} color="emerald" />
        <StatCard icon={XCircle} label="Failed" value={failed} color="rose" />
        <StatCard icon={Ban} label="Blocked" value={blocked} color="amber" />
      </div>

      {/* Filter tabs */}
      <Card>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                filter === f.key
                  ? `${f.color} text-white shadow-sm`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Status', 'User', 'IP Address', 'Location', 'Browser / OS', 'Time', 'Details'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log, idx) => (
                  <motion.tr
                    key={log.log_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {log.login_status === 'success' ? (
                        <Badge variant="emerald" dot>Success</Badge>
                      ) : log.login_status === 'blocked' ? (
                        <Badge variant="amber" dot>Blocked</Badge>
                      ) : (
                        <Badge variant="rose" dot>Failed</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {log.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{log.ip_address}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Globe size={14} />
                        {log.city && log.country ? `${log.city}, ${log.country}` : log.country || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Monitor size={14} />
                        {[log.browser, log.os].filter(Boolean).join(' / ') || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={12} />
                        {format(new Date(log.attempted_at || log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.failure_reason ? (
                        <span className="text-xs text-rose-600 font-medium">{log.failure_reason}</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No login logs found" icon={Activity} />
        )}
      </Card>
    </div>
  );
};
