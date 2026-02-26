import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import { Card, Button, Badge, Spinner, EmptyState, Input } from '../components/UI';
import { Shield, Plus, Edit, Trash2, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role, Permission } from '../types';

export const RolesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => await roleService.getAllRoles(),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => await roleService.getAllPermissions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleDelete = (role: Role) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system role');
      return;
    }
    if (confirm(`Are you sure you want to delete the role "${role.role_name}"?`)) {
      deleteMutation.mutate(role.role_id);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc: any, perm: Permission) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage access control and permissions</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Create Role
        </Button>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.length > 0 ? (
          roles.map((role: Role) => (
            <Card key={role.role_id} title={role.role_name}>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{role.description || 'No description'}</p>
                  <div className="mt-2">
                    {role.is_system_role && (
                      <Badge variant="blue">System Role</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions ? (
                      role.permissions.split(',').map((perm, idx) => (
                        <Badge key={idx} variant="purple">
                          {perm}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No permissions</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Key}
                    onClick={() => {
                      setSelectedRole(role);
                      setShowPermissionModal(true);
                    }}
                  >
                    Manage Permissions
                  </Button>
                  {!role.is_system_role && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      onClick={() => handleDelete(role)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState message="No roles found" icon={Shield} />
          </Card>
        )}
      </div>

      {/* Permissions Reference */}
      <Card title="Available Permissions">
        <div className="space-y-4">
          {Object.keys(permissionsByCategory).map((category) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase">{category}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {permissionsByCategory[category].map((perm: Permission) => (
                  <div
                    key={perm.permission_id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <p className="font-medium text-sm text-gray-900">{perm.permission_name}</p>
                    {perm.description && (
                      <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Manage Permissions Modal */}
      {showPermissionModal && selectedRole && (
        <ManagePermissionsModal
          role={selectedRole}
          permissions={permissions}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}
    </div>
  );
};

// Create Role Modal
const CreateRoleModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => roleService.createRole(data),
    onSuccess: () => {
      toast.success('Role created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
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
          <h3 className="text-lg font-semibold">Create New Role</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Role Name"
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Create Role
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

// Manage Permissions Modal
const ManagePermissionsModal = ({
  role,
  permissions,
  onClose,
  onSuccess,
}: {
  role: Role;
  permissions: Permission[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const rolePermissions = role.permissions ? role.permissions.split(',') : [];

  const assignMutation = useMutation({
    mutationFn: (permissionId: number) => roleService.assignPermission(role.role_id, permissionId),
    onSuccess: () => {
      toast.success('Permission assigned');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign permission');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (permissionId: number) => roleService.removePermission(role.role_id, permissionId),
    onSuccess: () => {
      toast.success('Permission removed');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove permission');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">Manage Permissions - {role.role_name}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((perm) => {
              const isAssigned = rolePermissions.includes(perm.permission_name);
              return (
                <div
                  key={perm.permission_id}
                  className={`p-4 rounded-lg border-2 ${
                    isAssigned ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{perm.permission_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                      <Badge variant="gray" className="mt-2">
                        {perm.category}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={isAssigned ? 'danger' : 'primary'}
                      onClick={() =>
                        isAssigned
                          ? removeMutation.mutate(perm.permission_id)
                          : assignMutation.mutate(perm.permission_id)
                      }
                    >
                      {isAssigned ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-6">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
