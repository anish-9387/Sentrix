import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { securityService } from '../services/securityService';
import { Card, Badge, Spinner, EmptyState, PageHeader, StatCard } from '../components/UI';
import {
  FileText, Plus, Edit, Trash2, UserPlus, LinkIcon, Clock, ChevronDown, ChevronRight,
  Server, Shield, Globe, Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AuditLog } from '../types';

const methodColors: Record<string, string> = {
  GET: 'sky',
  POST: 'emerald',
  PUT: 'amber',
  PATCH: 'amber',
  DELETE: 'rose',
};

const actionIcons: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  ASSIGN: UserPlus,
  REMOVE: LinkIcon,
  LOGIN: Shield,
  LOGOUT: Shield,
  BLOCK: Shield,
  UNBLOCK: Shield,
  RESOLVE: Shield,
};

export const AuditLogsPage = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => securityService.getAuditLogs(),
  });

  if (isLoading) return <Spinner />;

  const logs: AuditLog[] = logsRes?.data || [];

  const uniqueUsers = new Set(logs.map((l) => l.performed_by)).size;
  const actions = logs.reduce<Record<string, number>>((acc, l) => {
    const a = l.action?.split('_')[0] || 'OTHER';
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Track all administrative actions and system changes" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Actions" value={logs.length} color="indigo" />
        <StatCard icon={Activity} label="Active Users" value={uniqueUsers} color="emerald" />
        <StatCard icon={Plus} label="Creates" value={actions['CREATE'] || 0} color="sky" />
        <StatCard icon={Trash2} label="Deletes" value={actions['DELETE'] || 0} color="rose" />
      </div>

      {/* Log list */}
      <Card noPadding>
        {logs.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {logs.map((log, idx) => {
              const Icon = actionIcons[log.action?.split('_')[0]] || Activity;
              const isOpen = expandedId === log.log_id;

              return (
                <motion.div
                  key={log.log_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : log.log_id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <Icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{log.action}</span>
                        <Badge variant={(methodColors[log.http_method] || 'slate') as any}>
                          {log.http_method}
                        </Badge>
                        {log.resource_type && (
                          <span className="text-xs text-slate-400">{log.resource_type}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {log.endpoint}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-600">{log.performed_by_username || `User #${log.performed_by}`}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                          <Globe size={10} />
                          {log.ip_address}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} />
                        {format(new Date(log.performed_at || log.created_at), 'MMM dd HH:mm')}
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Detail label="Method" value={log.http_method} />
                            <Detail label="Endpoint" value={log.endpoint} />
                            <Detail label="Resource Type" value={log.resource_type || '—'} />
                            <Detail label="Resource ID" value={log.resource_id?.toString() || '—'} />
                            <Detail label="IP Address" value={log.ip_address} />
                            <Detail label="Status Code" value={log.status_code?.toString() || '—'} />
                            <Detail label="Performed By" value={log.performed_by_username || `User #${log.performed_by}`} />
                            <Detail
                              label="Date"
                              value={format(new Date(log.performed_at || log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                            />
                          </div>

                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Changes</span>
                              <pre className="mt-1 text-xs font-mono bg-slate-50 rounded-xl p-3 overflow-x-auto text-slate-600 max-h-48">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.request_body && Object.keys(log.request_body).length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Body</span>
                              <pre className="mt-1 text-xs font-mono bg-slate-50 rounded-xl p-3 overflow-x-auto text-slate-600 max-h-48">
                                {JSON.stringify(log.request_body, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState message="No audit logs found" icon={FileText} />
        )}
      </Card>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-50 rounded-lg p-2.5">
    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
    <div className="text-sm text-slate-700 mt-0.5 truncate">{value}</div>
  </div>
);
