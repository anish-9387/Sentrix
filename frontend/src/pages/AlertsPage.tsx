/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { securityService } from '../services/securityService';
import { Card, Button, Badge, Spinner, EmptyState, PageHeader, StatCard } from '../components/UI';
import {
  AlertTriangle, CheckCircle, Clock, ShieldAlert, ShieldCheck, Shield, AlertOctagon,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { SecurityAlert } from '../types';

const severityMap = {
  critical: { variant: 'rose' as const, icon: AlertOctagon },
  high: { variant: 'rose' as const, icon: AlertTriangle },
  medium: { variant: 'amber' as const, icon: ShieldAlert },
  low: { variant: 'sky' as const, icon: Shield },
};

export const AlertsPage = () => {
  const qc = useQueryClient();

  const { data: alertsRes, isLoading } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: () => securityService.getAlerts(),
  });

  const resolveMut = useMutation({
    mutationFn: (id: number) => securityService.resolveAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security-alerts'] });
      qc.invalidateQueries({ queryKey: ['unresolved-alerts-count'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Alert resolved');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Resolve failed'),
  });

  if (isLoading) return <Spinner />;

  const alerts: SecurityAlert[] = alertsRes?.data || [];
  const unresolved = alerts.filter((a) => !a.is_resolved);
  const resolved = alerts.filter((a) => a.is_resolved);
  const critical = alerts.filter((a) => a.severity === 'critical');

  return (
    <div className="space-y-6">
      <PageHeader title="Security Alerts" subtitle="Monitor and manage security threats in real-time" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Total Alerts" value={alerts.length} color="indigo" />
        <StatCard icon={ShieldAlert} label="Unresolved" value={unresolved.length} color="rose" />
        <StatCard icon={CheckCircle} label="Resolved" value={resolved.length} color="emerald" />
        <StatCard icon={AlertOctagon} label="Critical" value={critical.length} color="amber" />
      </div>

      {/* Unresolved */}
      <Card title="Unresolved Alerts" subtitle={`${unresolved.length} alert${unresolved.length !== 1 ? 's' : ''} need attention`}>
        {unresolved.length > 0 ? (
          <div className="space-y-3">
            {unresolved.map((alert, idx) => {
              const info = severityMap[alert.severity] || severityMap.low;
              const SevIcon = info.icon;
              return (
                <motion.div
                  key={alert.alert_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50"
                >
                  <div className={`p-2.5 rounded-xl ${
                    info.variant === 'rose' ? 'bg-rose-50' : info.variant === 'amber' ? 'bg-amber-50' : 'bg-sky-50'
                  }`}>
                    <SevIcon size={20} className={
                      info.variant === 'rose' ? 'text-rose-500' : info.variant === 'amber' ? 'text-amber-500' : 'text-sky-500'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 capitalize">{alert.alert_type.replace(/_/g, ' ')}</h4>
                      <Badge variant={info.variant}>{alert.severity}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{alert.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {alert.ip_address && <span className="font-mono">IP: {alert.ip_address}</span>}
                      {alert.username && <span>User: {alert.username}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="success"
                        icon={CheckCircle}
                        loading={resolveMut.isPending}
                        onClick={() => resolveMut.mutate(alert.alert_id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState message="All clear — no unresolved alerts!" icon={ShieldCheck} />
        )}
      </Card>

      {/* Resolved */}
      {resolved.length > 0 && (
        <Card title="Resolved Alerts" subtitle={`${resolved.length} resolved`}>
          <div className="space-y-2">
            {resolved.map((alert) => (
              <div key={alert.alert_id} className="flex items-start gap-4 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-slate-900 text-sm capitalize">{alert.alert_type.replace(/_/g, ' ')}</h4>
                    <Badge variant="emerald">Resolved</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    {alert.resolved_by_username && <span>by {alert.resolved_by_username}</span>}
                    {alert.resolved_at && <span>{format(new Date(alert.resolved_at), 'MMM dd HH:mm')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
