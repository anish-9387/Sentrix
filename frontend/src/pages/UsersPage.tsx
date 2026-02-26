import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { Card, Button, Badge, Spinner, EmptyState, Input } from '../components/UI';
import { Users, Plus, Edit, Trash2, Search, UserPlus, Shield, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { User, Role } from '../types';

export const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return await userService.searchUsers({ q: searchQuery });
      }
      return await userService.getAllUsers();
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => await roleService.getAllRoles(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      userService.toggleUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    toggleStatusMutation.mutate({ id: user.user_id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'blocked':
        return 'red';
      case 'suspended':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their access</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Create User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Input
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: User) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="text-indigo-600" size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(user.status) as any}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles ? (
                          user.roles.split(',').map((role, idx) => (
                            <Badge key={idx} variant="purple">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? format(new Date(user.last_login), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          icon={Shield}
                        >
                          Roles
                        </Button>
                        <Button
                          size="sm"
                          variant={user.status === 'active' ? 'danger' : 'success'}
                          onClick={() => handleToggleStatus(user)}
                          icon={user.status === 'active' ? Ban : CheckCircle}
                        >
                          {user.status === 'active' ? 'Block' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(user.user_id)}
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No users found" icon={Users} />
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Assign Role Modal */}
      {showRoleModal && selectedUser && (
        <AssignRoleModal
          user={selectedUser}
          roles={rolesData?.data || []}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => userService.createUser(data),
    onSuccess: () => {
      toast.success('User created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Create New User</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Create User
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

// Assign Role Modal Component
const AssignRoleModal = ({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: User;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: (roleId: number) => userService.assignRole(user.user_id, roleId),
    onSuccess: () => {
      toast.success('Role assigned successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign role');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (roleId: number) => userService.removeRole(user.user_id, roleId),
    onSuccess: () => {
      toast.success('Role removed successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove role');
    },
  });

  const userRoles = user.roles ? user.roles.split(',') : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Manage Roles - {user.username}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Roles</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {userRoles.length > 0 ? (
                userRoles.map((roleName, idx) => {
                  const role = roles.find((r) => r.role_name === roleName);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                      <span className="text-sm">{roleName}</span>
                      {role && (
                        <button
                          onClick={() => removeMutation.mutate(role.role_id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-sm text-gray-400">No roles assigned</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign New Role</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedRoleId || ''}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={() => selectedRoleId && assignMutation.mutate(selectedRoleId)}
              disabled={!selectedRoleId}
              className="flex-1"
            >
              Assign Role
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
