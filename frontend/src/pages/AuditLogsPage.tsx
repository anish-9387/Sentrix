/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import { Card, Badge, Spinner, EmptyState } from '../components/UI';
import { FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditLog } from '../types';

export const AuditLogsPage = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => await securityService.getAuditLogs(),
  });

  if (isLoading) {
    return <Spinner />;
  }

  const logs = logsData?.data || [];

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'green';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('DELETE')) return 'red';
    if (action.includes('ASSIGN') || action.includes('REMOVE')) return 'purple';
    return 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">Track all system activities and changes</p>
      </div>

      {/* Logs */}
      <Card>
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log: AuditLog) => (
              <div
                key={log.log_id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FileText size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getActionColor(log.action) as any}>{log.action}</Badge>
                        <Badge variant="gray">{log.resource_type}</Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.username || 'System'} performed {log.action.toLowerCase().replace('_', ' ')} on{' '}
                        {log.resource_type}
                        {log.resource_id && ` #${log.resource_id}`}
                      </p>
                    </div>
                  </div>
                  
                  {log.changes && (
                    <div className="mb-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
                          View Changes
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {typeof log.changes === 'string' 
                              ? log.changes 
                              : JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                    <span>IP: {log.ip_address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No audit logs found" icon={FileText} />
        )}
      </Card>
    </div>
  );
};