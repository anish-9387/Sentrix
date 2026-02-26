/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import { Card, Button, Badge, Spinner, EmptyState } from '../components/UI';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { SecurityAlert } from '../types';

export const AlertsPage = () => {
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => await securityService.getSecurityAlerts(),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => securityService.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Alert resolved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve alert');
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getSeverityIcon = (_severity: string) => {
    return <AlertTriangle size={20} />;
  };

  if (isLoading) {
    return <Spinner />;
  }

  const alerts = alertsData?.data || [];
  const unresolvedAlerts = alerts.filter((alert: SecurityAlert) => !alert.is_resolved);
  const resolvedAlerts = alerts.filter((alert: SecurityAlert) => alert.is_resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Alerts</h1>
        <p className="text-gray-600">Monitor and manage security threats</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{alerts.length}</div>
            <div className="text-sm text-gray-600">Total Alerts</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{unresolvedAlerts.length}</div>
            <div className="text-sm text-gray-600">Unresolved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {alerts.filter((a: SecurityAlert) => a.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </Card>
      </div>

      {/* Unresolved Alerts */}
      <Card title="Unresolved Alerts">
        {unresolvedAlerts.length > 0 ? (
          <div className="space-y-3">
            {unresolvedAlerts.map((alert: SecurityAlert) => (
              <div
                key={alert.alert_id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className={`p-3 rounded-lg ${
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'bg-red-100'
                      : alert.severity === 'medium'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
                  }`}
                >
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{alert.alert_type}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    </div>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {alert.ip_address && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">IP:</span> {alert.ip_address}
                      </span>
                    )}
                    {alert.username && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">User:</span> {alert.username}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle}
                      onClick={() => resolveMutation.mutate(alert.alert_id)}
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No unresolved alerts" icon={CheckCircle} />
        )}
      </Card>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card title="Resolved Alerts">
          <div className="space-y-3">
            {resolvedAlerts.map((alert: SecurityAlert) => (
              <div
                key={alert.alert_id}
                className="flex items-start gap-4 p-4 bg-green-50 rounded-lg opacity-75"
              >
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{alert.alert_type}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    </div>
                    <Badge variant="green">Resolved</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {alert.resolved_by_username && (
                      <span>Resolved by: {alert.resolved_by_username}</span>
                    )}
                    {alert.resolved_at && (
                      <span>{format(new Date(alert.resolved_at), 'MMM dd, yyyy HH:mm')}</span>
                    )}
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