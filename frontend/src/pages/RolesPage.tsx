import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { roleService } from '../services/roleService';
import {
  Card, Button, Badge, Spinner, EmptyState, Input, Modal, PageHeader, TextArea,
} from '../components/UI';
import { ShieldCheck, Plus, Trash2, Key, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Role, Permission } from '../types';

export const RolesPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [permRole, setPermRole] = useState<Role | null>(null);
  const qc = useQueryClient();

  const { data: rolesRes, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
  });

  const { data: permsRes, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getAllPermissions(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => roleService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  if (loadingRoles || loadingPerms) return <Spinner />;

  const roles: Role[] = rolesRes?.data || [];
  const permissions: Permission[] = permsRes?.data || [];

  // Group permissions by resource/category
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.category || p.resource || 'other';
    (acc[key] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure access control and permission sets"
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create Role
          </Button>
        }
      />

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roles.length > 0 ? roles.map((role, idx) => (
          <motion.div
            key={role.role_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{role.role_name}</h3>
                      <p className="text-sm text-slate-500">{role.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {role.is_active && <Badge variant="emerald" dot>Active</Badge>}
                    {role.is_system_role && <Badge variant="indigo">System</Badge>}
                    <Badge variant="slate">Priority: {role.priority}</Badge>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions ? role.permissions.split(',').map((p, i) => (
                      <Badge key={i} variant="violet">{p.trim()}</Badge>
                    )) : <span className="text-xs text-slate-400">No permissions</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-50">
                  <Button size="sm" variant="secondary" icon={Key} onClick={() => setPermRole(role)}>
                    Permissions
                  </Button>
                  {!role.is_system_role && (
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => {
                      if (confirm(`Delete "${role.role_name}"?`)) deleteMut.mutate(role.role_id);
                    }}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )) : (
          <Card><EmptyState message="No roles found" icon={ShieldCheck} /></Card>
        )}
      </div>

      {/* Permissions Reference */}
      <Card title="Available Permissions" subtitle="All system permissions grouped by resource">
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, perms]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{cat}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {perms.map((p) => (
                  <div key={p.permission_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-slate-900">{p.permission_name}</p>
                    {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Create Role Modal */}
      <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Manage Permissions Modal */}
      {permRole && (
        <ManagePermModal role={permRole} permissions={permissions} onClose={() => setPermRole(null)} />
      )}
    </div>
  );
};

/* ─── Create Role Modal ─── */
const CreateRoleModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ roleName: '', description: '', priority: '' });
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => roleService.create({
      roleName: form.roleName,
      description: form.description || undefined,
      priority: form.priority ? parseInt(form.priority) : undefined,
    }),
    onSuccess: () => { toast.success('Role created'); qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Create failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create New Role">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <Input label="Role Name" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} required />
        <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Priority" type="number" placeholder="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" icon={Plus} loading={mut.isPending}>Create</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Manage Permissions Modal ─── */
const ManagePermModal = ({ role, permissions, onClose }: { role: Role; permissions: Permission[]; onClose: () => void }) => {
  const qc = useQueryClient();
  const rolePerms = role.permissions ? role.permissions.split(',').map((p) => p.trim()) : [];

  const assignMut = useMutation({
    mutationFn: (permId: number) => roleService.assignPermission(role.role_id, permId),
    onSuccess: () => { toast.success('Permission assigned'); qc.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Assign failed'),
  });

  const removeMut = useMutation({
    mutationFn: (permId: number) => roleService.removePermission(role.role_id, permId),
    onSuccess: () => { toast.success('Permission removed'); qc.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Remove failed'),
  });

  return (
    <Modal open title={`Permissions — ${role.role_name}`} onClose={onClose} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {permissions.map((p) => {
          const assigned = rolePerms.includes(p.permission_name);
          return (
            <div
              key={p.permission_id}
              className={`p-4 rounded-xl border-2 transition-all ${
                assigned ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{p.permission_name}</p>
                  {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                </div>
                <Button
                  size="xs"
                  variant={assigned ? 'danger' : 'primary'}
                  onClick={() => assigned ? removeMut.mutate(p.permission_id) : assignMut.mutate(p.permission_id)}
                >
                  {assigned ? 'Remove' : 'Add'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
};
