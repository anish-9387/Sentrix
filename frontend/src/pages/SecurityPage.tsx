import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import { Card, Button, Badge, Spinner, EmptyState, Input } from '../components/UI';
import { Shield, Ban, CheckCircle, Globe, Users } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { BlockedIP, ActiveSession } from '../types';

export const SecurityPage = () => {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: blockedIPsData, isLoading: loadingIPs } = useQuery({
    queryKey: ['blocked-ips'],
    queryFn: async () => await securityService.getBlockedIPs(),
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => await securityService.getActiveSessions(),
  });

  const unblockMutation = useMutation({
    mutationFn: (ipAddress: string) => securityService.unblockIP(ipAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP unblocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unblock IP');
    },
  });

  if (loadingIPs || loadingSessions) {
    return <Spinner />;
  }

  const blockedIPs = blockedIPsData?.data || [];
  const activeSessions = sessionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600">Manage IP blocks and active sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked IPs</p>
              <p className="text-3xl font-bold text-gray-900">{blockedIPs.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Ban size={32} className="text-red-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{activeSessions.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users size={32} className="text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Blocked IPs */}
      <Card
        title="Blocked IP Addresses"
        actions={
          <Button size="sm" icon={Ban} onClick={() => setShowBlockModal(true)}>
            Block IP
          </Button>
        }
      >
        {blockedIPs.length > 0 ? (
          <div className="space-y-3">
            {blockedIPs.map((ip: BlockedIP) => (
              <div
                key={ip.ip_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Globe size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{ip.ip_address}</p>
                    <p className="text-sm text-gray-600">{ip.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>Blocked: {format(new Date(ip.blocked_at), 'MMM dd, yyyy HH:mm')}</span>
                      {ip.expires_at && (
                        <span>Expires: {format(new Date(ip.expires_at), 'MMM dd, yyyy HH:mm')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => unblockMutation.mutate(ip.ip_address)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No blocked IPs" icon={Shield} />
        )}
      </Card>

      {/* Active Sessions */}
      <Card title="Active Sessions">
        {activeSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeSessions.map((session: ActiveSession, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Users size={16} className="text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">{session.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {session.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.last_login_ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(session.last_login), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No active sessions" icon={Users} />
        )}
      </Card>

      {/* Block IP Modal */}
      {showBlockModal && (
        <BlockIPModal
          onClose={() => setShowBlockModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
            setShowBlockModal(false);
          }}
        />
      )}
    </div>
  );
};

// Block IP Modal
const BlockIPModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    ip_address: '',
    reason: '',
    duration: '',
  });

  const blockMutation = useMutation({
    mutationFn: (data: any) => securityService.blockIP(data),
    onSuccess: () => {
      toast.success('IP blocked successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to block IP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
    };
    blockMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Block IP Address</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="IP Address"
            placeholder="192.168.1.1"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              required
            />
          </div>
          <Input
            label="Duration (hours, optional)"
            type="number"
            placeholder="24"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="danger" className="flex-1">
              Block IP
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
