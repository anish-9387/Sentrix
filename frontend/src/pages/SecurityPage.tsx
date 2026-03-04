import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { securityService } from '../services/securityService';
import { Card, Badge, Button, Input, Modal, Spinner, EmptyState, PageHeader, StatCard } from '../components/UI';
import {
  Shield, Wifi, WifiOff, Globe, Clock, Monitor, User, Ban, Plus, Trash2,
  Activity, X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { BlockedIP, ActiveSession } from '../types';

export const SecurityPage = () => {
  const queryClient = useQueryClient();
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Queries
  const { data: blockedRes, isLoading: loadingBlocked } = useQuery({
    queryKey: ['blocked-ips'],
    queryFn: securityService.getBlockedIPs,
  });

  const { data: sessionsRes, isLoading: loadingSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: securityService.getActiveSessions,
  });

  // Mutations
  const blockIPMut = useMutation({
    mutationFn: securityService.blockIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP blocked successfully');
      setShowBlockModal(false);
    },
    onError: () => toast.error('Failed to block IP'),
  });

  const unblockIPMut = useMutation({
    mutationFn: securityService.unblockIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP unblocked');
    },
    onError: () => toast.error('Failed to unblock IP'),
  });

  if (loadingBlocked || loadingSessions) return <Spinner />;

  const blockedIPs: BlockedIP[] = blockedRes?.data || [];
  const sessions: ActiveSession[] = sessionsRes?.data || [];

  const permanent = blockedIPs.filter((b) => b.is_permanent);
  const temporary = blockedIPs.filter((b) => !b.is_permanent);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Management"
        subtitle="Manage blocked IPs and monitor active sessions"
        action={
          <Button onClick={() => setShowBlockModal(true)} icon={Plus}>
            Block IP
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ban} label="Blocked IPs" value={blockedIPs.length} color="rose" />
        <StatCard icon={Shield} label="Permanent Blocks" value={permanent.length} color="amber" />
        <StatCard icon={Clock} label="Temporary Blocks" value={temporary.length} color="sky" />
        <StatCard icon={Wifi} label="Active Sessions" value={sessions.length} color="emerald" />
      </div>

      {/* Blocked IPs */}
      <Card title="Blocked IPs" subtitle={`${blockedIPs.length} addresses currently blocked`} noPadding>
        {blockedIPs.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {blockedIPs.map((ip, idx) => (
              <motion.div
                key={ip.ip_address + idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <WifiOff size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">{ip.ip_address}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {ip.reason || 'No reason specified'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {ip.is_permanent ? (
                    <Badge variant="rose" dot>Permanent</Badge>
                  ) : ip.expires_at || ip.blocked_until ? (
                    <Badge variant="amber" dot>
                      Until {format(new Date(ip.expires_at || ip.blocked_until!), 'MMM dd HH:mm')}
                    </Badge>
                  ) : (
                    <Badge variant="amber" dot>Temporary</Badge>
                  )}
                  <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {format(new Date(ip.blocked_at || ip.created_at || new Date()), 'MMM dd, yyyy')}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => unblockIPMut.mutate(ip.ip_address)}
                    loading={unblockIPMut.isPending}
                  >
                    <Trash2 size={14} className="text-rose-500" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState message="No blocked IPs" icon={Shield} />
        )}
      </Card>

      {/* Active sessions */}
      <Card title="Active Sessions" subtitle={`${sessions.length} active sessions`} noPadding>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'IP Address', 'Location', 'Browser / OS', 'Started', 'Last Active', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map((s, idx) => (
                  <motion.tr
                    key={s.session_id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{s.username || `User #${s.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{s.ip_address}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Globe size={14} />
                        {s.city && s.country ? `${s.city}, ${s.country}` : s.country || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Monitor size={14} />
                        {[s.browser, s.os].filter(Boolean).join(' / ') || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {s.created_at ? format(new Date(s.created_at), 'MMM dd HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {s.last_active_at ? format(new Date(s.last_active_at), 'MMM dd HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="emerald" dot>Active</Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No active sessions" icon={Activity} />
        )}
      </Card>

      {/* Block IP Modal */}
      <BlockIPModal
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSubmit={(data) => blockIPMut.mutate(data)}
        loading={blockIPMut.isPending}
      />
    </div>
  );
};

/* ────────────────── Block IP Modal ────────────────── */

interface BlockModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { ip_address: string; reason?: string; duration_hours?: number; is_permanent?: boolean }) => void;
  loading: boolean;
}

const BlockIPModal = ({ open, onClose, onSubmit, loading }: BlockModalProps) => {
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [duration, setDuration] = useState('24');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ip_address: ip,
      reason: reason || undefined,
      is_permanent: isPermanent,
      duration_hours: isPermanent ? undefined : Number(duration),
    });
    setIp('');
    setReason('');
    setIsPermanent(false);
    setDuration('24');
  };

  return (
    <Modal open={open} onClose={onClose} title="Block IP Address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="IP Address"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="e.g. 192.168.1.100"
          icon={Globe}
          required
        />
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for blocking (optional)"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Permanent block</span>
          </label>
        </div>

        <AnimatePresence>
          {!isPermanent && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Input
                label="Duration (hours)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                icon={Clock}
                min={1}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={loading} icon={Ban}>Block IP</Button>
        </div>
      </form>
    </Modal>
  );
};
