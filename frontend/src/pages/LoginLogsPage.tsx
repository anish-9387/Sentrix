import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import { Card, Badge, Spinner, EmptyState } from '../components/UI';
import { Activity, CheckCircle, XCircle, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { LoginLog } from '../types';

export const LoginLogsPage = () => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['login-logs', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? { status: filter } : undefined;
      return await securityService.getLoginLogs(params);
    },
  });

  if (isLoading) {
    return <Spinner />;
  }

  const logs = logsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Login Logs</h1>
        <p className="text-gray-600">Monitor authentication attempts</p>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Failed
          </button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: LoginLog) => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.login_status === 'success' ? (
                        <Badge variant="green">
                          <CheckCircle size={14} className="mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="red">
                          <XCircle size={14} className="mr-1" />
                          Failed
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.username || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.ip_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Globe size={14} />
                        {log.city && log.country
                          ? `${log.city}, ${log.country}`
                          : log.country || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      {log.failure_reason ? (
                        <span className="text-sm text-red-600">{log.failure_reason}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
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