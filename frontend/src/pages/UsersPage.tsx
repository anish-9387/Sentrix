import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import {
  Card, Button, Badge, Spinner, EmptyState, Input, Modal, PageHeader, Select,
} from '../components/UI';
import {
  Users, Plus, Trash2, Search, ShieldCheck, Ban, CheckCircle, UserRoundPlus, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { User, Role } from '../types';

export const UsersPage = () => {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const qc = useQueryClient();

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => (search ? userService.search(search) : userService.getAll()),
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'blocked' | 'suspended' }) =>
      userService.toggleStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Status update failed'),
  });

  const statusColor = (s: string) =>
    s === 'active' ? 'emerald' : s === 'blocked' ? 'rose' : s === 'suspended' ? 'amber' : 'slate';

  if (isLoading) return <Spinner />;
  const users: User[] = usersRes?.data?.users || usersRes?.data || [];
  const roles: Role[] = rolesRes?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''} in total`}
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create User
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <Input
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </Card>

      {/* Table */}
      <Card noPadding>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'Status', 'Roles', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u, idx) => (
                  <motion.tr
                    key={u.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(u.full_name || u.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u.full_name || u.username}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusColor(u.status)} dot>{u.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles ? u.roles.split(',').map((r, i) => (
                          <Badge key={i} variant="violet">{r.trim()}</Badge>
                        )) : <span className="text-xs text-slate-400">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.last_login ? format(new Date(u.last_login), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Button size="xs" variant="ghost" icon={Eye} onClick={() => setDetailUser(u)}>
                          View
                        </Button>
                        <Button size="xs" variant="ghost" icon={ShieldCheck} onClick={() => setRoleModalUser(u)}>
                          Roles
                        </Button>
                        <Button
                          size="xs"
                          variant={u.status === 'active' ? 'danger' : 'success'}
                          icon={u.status === 'active' ? Ban : CheckCircle}
                          onClick={() => statusMut.mutate({ id: u.user_id, status: u.status === 'active' ? 'blocked' : 'active' })}
                        >
                          {u.status === 'active' ? 'Block' : 'Activate'}
                        </Button>
                        <Button size="xs" variant="ghost" icon={Trash2} onClick={() => {
                          if (confirm('Delete this user?')) deleteMut.mutate(u.user_id);
                        }}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No users found" icon={Users} />
        )}
      </Card>

      {/* Create User Modal */}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Assign Role Modal */}
      {roleModalUser && (
        <AssignRoleModal
          user={roleModalUser}
          roles={roles}
          onClose={() => setRoleModalUser(null)}
        />
      )}

      {/* Detail Modal */}
      {detailUser && (
        <Modal open title={`User Details — ${detailUser.username}`} onClose={() => setDetailUser(null)} size="lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Username', detailUser.username],
              ['Email', detailUser.email],
              ['Full Name', detailUser.full_name || '—'],
              ['Status', detailUser.status],
              ['Failed Attempts', detailUser.failed_login_attempts],
              ['Last Login IP', detailUser.last_login_ip || '—'],
              ['Last Login', detailUser.last_login ? format(new Date(detailUser.last_login), 'MMM dd, yyyy HH:mm') : 'Never'],
              ['Created', format(new Date(detailUser.created_at), 'MMM dd, yyyy HH:mm')],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-slate-400 text-xs mb-0.5">{k}</p>
                <p className="font-medium text-slate-900">{String(v)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-1">Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {detailUser.roles ? detailUser.roles.split(',').map((r, i) => (
                <Badge key={i} variant="violet">{r.trim()}</Badge>
              )) : <span className="text-xs text-slate-400">None</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ─── Create User Modal ─── */
const CreateUserModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => userService.create(form),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Create failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create New User">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" icon={UserRoundPlus} loading={mut.isPending}>Create</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Assign Role Modal ─── */
const AssignRoleModal = ({ user, roles, onClose }: { user: User; roles: Role[]; onClose: () => void }) => {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const qc = useQueryClient();

  const assignMut = useMutation({
    mutationFn: (roleId: number) => userService.assignRole(user.user_id, roleId),
    onSuccess: () => { toast.success('Role assigned'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Assign failed'),
  });

  const removeMut = useMutation({
    mutationFn: (roleId: number) => userService.removeRole(user.user_id, roleId),
    onSuccess: () => { toast.success('Role removed'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Remove failed'),
  });

  const userRoles = user.roles ? user.roles.split(',').map((r) => r.trim()) : [];

  return (
    <Modal open title={`Manage Roles — ${user.username}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Current Roles</p>
          <div className="flex flex-wrap gap-2">
            {userRoles.length > 0 ? userRoles.map((name) => {
              const role = roles.find((r) => r.role_name === name);
              return (
                <div key={name} className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {name}
                  {role && (
                    <button onClick={() => removeMut.mutate(role.role_id)} className="hover:text-violet-900 cursor-pointer">&times;</button>
                  )}
                </div>
              );
            }) : <span className="text-sm text-slate-400">No roles assigned</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            label="Add Role"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
            placeholder="Select a role..."
          />
        </div>
        {selectedRoleId && (
          <Button
            size="sm"
            icon={ShieldCheck}
            onClick={() => { assignMut.mutate(Number(selectedRoleId)); setSelectedRoleId(''); }}
          >
            Assign Role
          </Button>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
