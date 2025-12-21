/**
 * Admin Settings Component
 *
 * Platform settings management for super administrators.
 * Includes: API Keys, Rate Limits, Token Settings, and Admin Accounts.
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPlatformAPISettings,
  addPlatformApiKey,
  removePlatformApiKey,
  updatePlatformApiKey,
  updateRotationStrategy,
  updatePlatformRateLimits,
  updatePlatformTokenLimits,
} from '../../services/adminService';
import {
  PlatformAdmin,
  AdminRole,
  AdminPermission,
  PlatformAPISettings,
  ApiKeyConfig,
  ApiKeyRotationStrategy,
  RateLimitConfig,
  TokenLimitConfig,
} from '../../types';

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

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SpeedometerIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CoinIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Tab type
type SettingsTab = 'api-keys' | 'rate-limits' | 'token-settings' | 'admins';

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin state
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformAdmin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // API Settings state
  const [apiSettings, setApiSettings] = useState<PlatformAPISettings | null>(null);
  const [apiStats, setApiStats] = useState<{
    totalKeys: number;
    activeKeys: number;
    totalUsageToday: number;
    totalUsageAllTime: number;
  } | null>(null);

  // Add API Key modal
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  // Form state for admin creation
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'support_admin' as AdminRole,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminList, settingsData] = await Promise.all([
        getAdmins(),
        getPlatformAPISettings(),
      ]);
      setAdmins(adminList);
      setApiSettings(settingsData.settings);
      setApiStats(settingsData.stats);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // API Key Handlers
  // ============================================

  const handleAddApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setKeyError('Please enter both a name and API key');
      return;
    }

    setActionLoading(true);
    setKeyError(null);

    try {
      const result = await addPlatformApiKey(newKeyValue, newKeyName);
      if (result.success) {
        setShowAddKeyModal(false);
        setNewKeyName('');
        setNewKeyValue('');
        await loadData();
        showSaveSuccess();
      } else {
        setKeyError(result.error || 'Failed to add API key');
      }
    } catch (error: any) {
      setKeyError(error.message || 'Failed to add API key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to remove the API key "${keyName}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await removePlatformApiKey(keyId);
      if (result.success) {
        await loadData();
        showSaveSuccess();
      }
    } catch (error) {
      console.error('Error removing API key:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleApiKey = async (keyId: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      const result = await updatePlatformApiKey(keyId, { isActive: !currentActive });
      if (result.success) {
        await loadData();
        showSaveSuccess();
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRotationStrategy = async (strategy: ApiKeyRotationStrategy) => {
    setIsSaving(true);
    try {
      const result = await updateRotationStrategy(strategy);
      if (result.success) {
        setApiSettings(prev => prev ? { ...prev, rotationStrategy: strategy } : null);
        showSaveSuccess();
      }
    } catch (error) {
      console.error('Error updating rotation strategy:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Rate Limit Handlers
  // ============================================

  const handleUpdateRateLimits = async (updates: Partial<RateLimitConfig>) => {
    setIsSaving(true);
    try {
      const result = await updatePlatformRateLimits(updates);
      if (result.success) {
        setApiSettings(prev => prev ? {
          ...prev,
          rateLimits: { ...prev.rateLimits, ...updates },
        } : null);
        showSaveSuccess();
      }
    } catch (error) {
      console.error('Error updating rate limits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Token Limit Handlers
  // ============================================

  const handleUpdateTokenLimits = async (updates: Partial<TokenLimitConfig>) => {
    setIsSaving(true);
    try {
      const result = await updatePlatformTokenLimits(updates);
      if (result.success) {
        setApiSettings(prev => prev ? {
          ...prev,
          tokenLimits: { ...prev.tokenLimits, ...updates },
        } : null);
        showSaveSuccess();
      }
    } catch (error) {
      console.error('Error updating token limits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Admin Handlers
  // ============================================

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
        await loadData();
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
      await loadData();
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
      await loadData();
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
      await loadData();
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

  // ============================================
  // Utility Functions
  // ============================================

  const showSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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

  // ============================================
  // Render Functions
  // ============================================

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      {/* Rotation Strategy */}
      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-white/60 text-sm mb-2 block">Rotation Strategy</label>
        <select
          value={apiSettings?.rotationStrategy || 'round-robin'}
          onChange={(e) => handleUpdateRotationStrategy(e.target.value as ApiKeyRotationStrategy)}
          disabled={isSaving}
          className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
        >
          <option value="round-robin">Round Robin</option>
          <option value="failover">Failover (Primary First)</option>
          <option value="usage-based">Usage Based (Lowest Usage)</option>
        </select>
        <p className="text-white/40 text-xs mt-2">
          {apiSettings?.rotationStrategy === 'round-robin' && 'Cycles through keys sequentially'}
          {apiSettings?.rotationStrategy === 'failover' && 'Uses primary key until it fails, then switches'}
          {apiSettings?.rotationStrategy === 'usage-based' && 'Always uses the key with lowest daily usage'}
        </p>
      </div>

      {/* Stats */}
      {apiStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Total Keys</p>
            <p className="text-2xl font-bold text-white">{apiStats.totalKeys}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Active Keys</p>
            <p className="text-2xl font-bold text-green-400">{apiStats.activeKeys}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Usage Today</p>
            <p className="text-2xl font-bold text-white">{apiStats.totalUsageToday.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Total Usage</p>
            <p className="text-2xl font-bold text-white">{apiStats.totalUsageAllTime.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">API Keys</h4>
          {hasPermission('settings.edit') && (
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8963A] px-4 py-2 rounded-xl text-white text-sm transition-colors"
            >
              <PlusIcon />
              Add Key
            </button>
          )}
        </div>

        {apiSettings?.geminiApiKeys.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center">
            <KeyIcon />
            <p className="text-white/60 mt-2">No API keys configured</p>
            <p className="text-white/40 text-sm mt-1">Add your first API key to enable AI features</p>
          </div>
        ) : (
          <div className="space-y-2">
            {apiSettings?.geminiApiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${key.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-white font-medium">{key.name}</p>
                    <p className="text-white/50 text-sm font-mono">{key.key}</p>
                    <p className="text-white/40 text-xs mt-1">
                      Usage today: {key.usageCount.toLocaleString()}
                      {key.dailyLimit && ` / ${key.dailyLimit.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                {hasPermission('settings.edit') && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleApiKey(key.id, key.isActive)}
                      disabled={actionLoading}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        key.isActive
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {key.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleRemoveApiKey(key.id, key.name)}
                      disabled={actionLoading}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRateLimitsTab = () => (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Enable Rate Limiting</p>
            <p className="text-white/60 text-sm">Control API request limits for users</p>
          </div>
          <button
            onClick={() => handleUpdateRateLimits({ enabled: !apiSettings?.rateLimits.enabled })}
            disabled={isSaving}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              apiSettings?.rateLimits.enabled ? 'bg-[#D4AF37]' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                apiSettings?.rateLimits.enabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Rate Limit Settings */}
      <div className={`space-y-4 ${!apiSettings?.rateLimits.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-white/5 rounded-xl p-4">
          <label className="text-white/60 text-sm mb-2 block">Global Requests Per Minute</label>
          <input
            type="number"
            value={apiSettings?.rateLimits.globalRequestsPerMinute || 60}
            onChange={(e) => handleUpdateRateLimits({ globalRequestsPerMinute: parseInt(e.target.value) || 60 })}
            min={1}
            max={1000}
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
          />
          <p className="text-white/40 text-xs mt-2">Maximum requests across all users per minute</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <label className="text-white/60 text-sm mb-2 block">Per-User Requests Per Minute</label>
          <input
            type="number"
            value={apiSettings?.rateLimits.perUserRequestsPerMinute || 10}
            onChange={(e) => handleUpdateRateLimits({ perUserRequestsPerMinute: parseInt(e.target.value) || 10 })}
            min={1}
            max={100}
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
          />
          <p className="text-white/40 text-xs mt-2">Maximum requests per user per minute</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <label className="text-white/60 text-sm mb-2 block">Per-User Requests Per Day</label>
          <input
            type="number"
            value={apiSettings?.rateLimits.perUserRequestsPerDay || 1000}
            onChange={(e) => handleUpdateRateLimits({ perUserRequestsPerDay: parseInt(e.target.value) || 1000 })}
            min={1}
            max={100000}
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
          />
          <p className="text-white/40 text-xs mt-2">Maximum requests per user per day (resets at midnight UTC)</p>
        </div>
      </div>
    </div>
  );

  const renderTokenSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-white/60 text-sm mb-2 block">Initial Signup Tokens</label>
        <input
          type="number"
          value={apiSettings?.tokenLimits.initialSignupTokens || 2000}
          onChange={(e) => handleUpdateTokenLimits({ initialSignupTokens: parseInt(e.target.value) || 0 })}
          min={0}
          max={100000}
          className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
        />
        <p className="text-white/40 text-xs mt-2">Tokens granted to new users upon signup</p>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-white/60 text-sm mb-2 block">Max Tokens Per User</label>
        <input
          type="number"
          value={apiSettings?.tokenLimits.maxTokensPerUser || 0}
          onChange={(e) => handleUpdateTokenLimits({ maxTokensPerUser: parseInt(e.target.value) || 0 })}
          min={0}
          className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
        />
        <p className="text-white/40 text-xs mt-2">Maximum tokens a user can hold (0 = unlimited)</p>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-white/60 text-sm mb-2 block">Minimum Balance for API Call</label>
        <input
          type="number"
          value={apiSettings?.tokenLimits.minBalanceForCall || 10}
          onChange={(e) => handleUpdateTokenLimits({ minBalanceForCall: parseInt(e.target.value) || 0 })}
          min={0}
          max={1000}
          className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
        />
        <p className="text-white/40 text-xs mt-2">Minimum token balance required to make AI calls</p>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-white/60 text-sm mb-2 block">
          Profit Margin: {Math.round((apiSettings?.tokenLimits.profitMargin || 0.45) * 100)}%
        </label>
        <input
          type="range"
          value={(apiSettings?.tokenLimits.profitMargin || 0.45) * 100}
          onChange={(e) => handleUpdateTokenLimits({ profitMargin: parseInt(e.target.value) / 100 })}
          min={0}
          max={100}
          className="w-full md:w-64 accent-[#D4AF37]"
        />
        <p className="text-white/40 text-xs mt-2">Markup on AI API costs for token pricing</p>
      </div>
    </div>
  );

  const renderAdminsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <SpinnerIcon />
        <span className="ml-2 text-white/60">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
          <p className="text-white/60 mt-1">Manage API configuration, rate limits, tokens, and administrators</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-xl">
            <CheckIcon />
            Settings saved
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'api-keys'
              ? 'bg-[#D4AF37] text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <KeyIcon />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('rate-limits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'rate-limits'
              ? 'bg-[#D4AF37] text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <SpeedometerIcon />
          Rate Limits
        </button>
        <button
          onClick={() => setActiveTab('token-settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'token-settings'
              ? 'bg-[#D4AF37] text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <CoinIcon />
          Token Settings
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'admins'
              ? 'bg-[#D4AF37] text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserIcon />
          Admins
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        {activeTab === 'api-keys' && renderApiKeysTab()}
        {activeTab === 'rate-limits' && renderRateLimitsTab()}
        {activeTab === 'token-settings' && renderTokenSettingsTab()}
        {activeTab === 'admins' && renderAdminsTab()}
      </div>

      {/* Add API Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add API Key</h3>
              <button
                onClick={() => { setShowAddKeyModal(false); setKeyError(null); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {keyError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{keyError}</p>
                </div>
              )}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Primary, Backup 1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">API Key</label>
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 font-mono"
                />
              </div>
              <button
                onClick={handleAddApiKey}
                disabled={actionLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#B8963A] text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <><SpinnerIcon /> Adding...</> : 'Add API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

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
