import { useQuery } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import { StatCard, Card, Spinner, Badge } from '../components/UI';
import {
  Users,
  Shield,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await securityService.getDashboardStats();
      return response.data;
    },
  });

  if (isLoading) {
    return <Spinner />;
  }

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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Users"
          value={stats?.activeUsers || 0}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Unresolved Alerts"
          value={stats?.unresolvedAlerts || 0}
          color="red"
        />
        <StatCard
          icon={Activity}
          label="Active Sessions"
          value={stats?.activeSessions || 0}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Login Activity">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Successful Logins</span>
              <span className="text-2xl font-bold text-green-600">{stats?.successfulLogins || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Failed Attempts</span>
              <span className="text-2xl font-bold text-red-600">{stats?.failedLoginAttempts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Attempts</span>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalLoginAttempts || 0}</span>
            </div>
          </div>
        </Card>

        <Card title="User Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <span className="text-xl font-bold">{stats?.activeUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Blocked</span>
              </div>
              <span className="text-xl font-bold">{stats?.blockedUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Suspended</span>
              </div>
              <span className="text-xl font-bold">{stats?.suspendedUsers || 0}</span>
            </div>
          </div>
        </Card>

        <Card title="Security Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Critical Alerts</span>
              <Badge variant="red">{stats?.criticalAlerts || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blocked IPs</span>
              <Badge variant="yellow">{stats?.blockedIPs || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Sessions</span>
              <Badge variant="green">{stats?.activeSessions || 0}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Security Activity">
        <div className="space-y-3">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.severity === 'critical' || activity.severity === 'high'
                    ? 'bg-red-100'
                    : activity.severity === 'medium'
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}>
                  {activity.type === 'alert' ? (
                    <AlertTriangle
                      size={20}
                      className={
                        activity.severity === 'critical' || activity.severity === 'high'
                          ? 'text-red-600'
                          : activity.severity === 'medium'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }
                    />
                  ) : (
                    <Activity size={20} className="text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {activity.severity && (
                      <Badge variant={getSeverityColor(activity.severity) as any}>
                        {activity.severity}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
};