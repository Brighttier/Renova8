/**
 * Admin Settings Component
 *
 * Platform settings management for super administrators.
 * Manage admin accounts, platform configuration, and security settings.
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../../services/adminService';
import { PlatformAdmin, AdminRole, AdminPermission } from '../../types';

// Icons
const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'users.view', 'users.edit', 'users.delete', 'users.suspend',
    'revenue.view', 'revenue.refund', 'revenue.export',
    'hosting.view', 'hosting.suspend', 'hosting.delete',
    'support.view', 'support.respond', 'support.escalate',
    'analytics.view', 'analytics.export',
    'settings.view', 'settings.edit',
    'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
  ],
  finance_admin: [
    'users.view',
    'revenue.view', 'revenue.refund', 'revenue.export',
    'analytics.view',
  ],
  support_admin: [
    'users.view', 'users.suspend',
    'support.view', 'support.respond', 'support.escalate',
    'hosting.view',
  ],
  technical_admin: [
    'hosting.view', 'hosting.suspend',
    'analytics.view', 'analytics.export',
    'settings.view',
  ],
  analytics_admin: [
    'users.view',
    'analytics.view', 'analytics.export',
    'revenue.view',
  ],
};

export function AdminSettings() {
  const { admin: currentAdmin, hasPermission } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformAdmin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'support_admin' as AdminRole,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const adminList = await getAdmins();
      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasPermission('admins.create')) {
      setFormError('You do not have permission to create admins');
      return;
    }

    if (!formData.email || !formData.displayName || !formData.password) {
      setFormError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setActionLoading(true);
    try {
      const result = await createAdmin({
        email: formData.email,
        displayName: formData.displayName,
        password: formData.password,
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role],
        createdBy: currentAdmin?.id,
      });

      if (result.success) {
        await loadAdmins();
        setShowCreateModal(false);
        setFormData({ email: '', displayName: '', password: '', role: 'support_admin' });
      } else {
        setFormError(result.error || 'Failed to create admin');
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to create admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedAdmin || !hasPermission('admins.edit')) {
      setFormError('You do not have permission to edit admins');
      return;
    }

    setActionLoading(true);
    try {
      await updateAdmin(selectedAdmin.id, {
        displayName: formData.displayName,
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role],
      });
      await loadAdmins();
      setShowEditModal(false);
      setSelectedAdmin(null);
    } catch (error: any) {
      setFormError(error.message || 'Failed to update admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!hasPermission('admins.delete')) {
      alert('You do not have permission to delete admins');
      return;
    }

    if (adminId === currentAdmin?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteAdmin(adminId);
      await loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (admin: PlatformAdmin) => {
    if (!hasPermission('admins.edit')) {
      alert('You do not have permission to edit admins');
      return;
    }

    if (admin.id === currentAdmin?.id) {
      alert('You cannot deactivate your own account');
      return;
    }

    setActionLoading(true);
    try {
      await updateAdmin(admin.id, { isActive: !admin.isActive });
      await loadAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (admin: PlatformAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      displayName: admin.displayName,
      password: '',
      role: admin.role,
    });
    setShowEditModal(true);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'finance_admin':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'support_admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'technical_admin':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'analytics_admin':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleLabel = (role: AdminRole): string => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
          <p className="text-white/60 mt-1">Manage admin accounts and platform configuration</p>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <span className="text-purple-400"><ShieldIcon /></span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Admin Accounts</h3>
              <p className="text-white/60 text-sm">{admins.length} administrators</p>
            </div>
          </div>
          {hasPermission('admins.create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8963A] px-4 py-2 rounded-xl text-white transition-colors"
            >
              <PlusIcon />
              Add Admin
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerIcon />
            <span className="ml-2 text-white/60">Loading admins...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {admin.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{admin.displayName}</p>
                      {admin.isSuperAdmin && (
                        <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full">
                          Super Admin
                        </span>
                      )}
                      {!admin.isActive && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm">{admin.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadge(admin.role)}`}>
                        {getRoleLabel(admin.role)}
                      </span>
                      <span className="text-white/40 text-xs">
                        Joined {formatDate(admin.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {admin.id !== currentAdmin?.id && !admin.isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    {hasPermission('admins.edit') && (
                      <>
                        <button
                          onClick={() => openEditModal(admin)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            admin.isActive
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                    {hasPermission('admins.delete') && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Role Permissions Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(ROLE_PERMISSIONS) as AdminRole[]).map((role) => (
            <div key={role} className="bg-white/5 rounded-xl p-4">
              <h4 className={`font-medium mb-2 ${getRoleBadge(role).replace('bg-', 'text-').replace('/20', '')}`}>
                {getRoleLabel(role)}
              </h4>
              <ul className="space-y-1 text-sm text-white/60">
                {ROLE_PERMISSIONS[role].slice(0, 6).map((perm) => (
                  <li key={perm} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                    {perm.replace('.', ': ')}
                  </li>
                ))}
                {ROLE_PERMISSIONS[role].length > 6 && (
                  <li className="text-white/40">+{ROLE_PERMISSIONS[role].length - 6} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Create Admin Account</h3>
              <button
                onClick={() => { setShowCreateModal(false); setFormError(null); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="John Admin"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="support_admin">Support Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="technical_admin">Technical Admin</option>
                  <option value="analytics_admin">Analytics Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#B8963A] text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <><SpinnerIcon /> Creating...</> : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Edit Admin Account</h3>
              <button
                onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setFormError(null); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="support_admin">Support Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="technical_admin">Technical Admin</option>
                  <option value="analytics_admin">Analytics Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#B8963A] text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <><SpinnerIcon /> Saving...</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
