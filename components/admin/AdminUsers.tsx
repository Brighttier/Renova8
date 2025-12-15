/**
 * Admin Users Component
 *
 * User management panel for platform administrators.
 * Displays user list with filtering, searching, and user details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserStatus, updateUserCredits } from '../../services/adminService';
import { PlatformUser } from '../../types';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CreditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted';
type PlanFilter = 'all' | 'free' | 'starter' | 'pro' | 'enterprise';

export function AdminUsers() {
  const { hasPermission } = useAdminAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const usersPerPage = 10;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
        page: currentPage,
        limit: usersPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, planFilter, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended') => {
    if (!hasPermission('users.suspend')) {
      alert('You do not have permission to suspend users');
      return;
    }

    setActionLoading(true);
    try {
      await updateUserStatus(userId, status);
      await loadUsers();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || creditAmount === 0) return;

    if (!hasPermission('users.edit')) {
      alert('You do not have permission to edit users');
      return;
    }

    setActionLoading(true);
    try {
      await updateUserCredits(selectedUser.id, creditAmount);
      await loadUsers();
      setShowCreditModal(false);
      setCreditAmount(0);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating credits:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'deleted':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro':
        return 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30';
      case 'starter':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-white/60 mt-1">{totalUsers} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-white/40"><FilterIcon /></span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
            className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value as PlanFilter); setCurrentPage(1); }}
          className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">User</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Status</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Plan</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Credits</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">LTV</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Joined</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <SpinnerIcon />
                      <span className="ml-2 text-white/60">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/40">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-white font-semibold">
                              {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.displayName || user.email.split('@')[0]}
                          </p>
                          <p className="text-white/50 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadge(user.planId)}`}>
                        {user.planId.charAt(0).toUpperCase() + user.planId.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{user.credits}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{formatCurrency(user.lifetimeValue)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreIcon />
                        </button>

                        {showActionMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-10">
                            <button
                              onClick={() => { setSelectedUser(user); setShowActionMenu(null); }}
                              className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                            >
                              View Details
                            </button>
                            {hasPermission('users.edit') && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowCreditModal(true);
                                  setShowActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                              >
                                Add Credits
                              </button>
                            )}
                            {hasPermission('users.suspend') && user.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                              >
                                Suspend User
                              </button>
                            )}
                            {hasPermission('users.suspend') && user.status === 'suspended' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="w-full text-left px-4 py-2 text-green-400 hover:bg-green-500/10 transition-colors"
                              >
                                Reactivate User
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-white/60 text-sm">
              Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#D4AF37] text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && !showCreditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
                  ) : (
                    <span className="text-white text-2xl font-semibold">
                      {selectedUser.displayName?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">
                    {selectedUser.displayName || selectedUser.email.split('@')[0]}
                  </h4>
                  <p className="text-white/60 flex items-center gap-2">
                    <MailIcon />
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedUser.status)}`}>
                    {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Plan</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadge(selectedUser.planId)}`}>
                    {selectedUser.planId.charAt(0).toUpperCase() + selectedUser.planId.slice(1)}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm flex items-center gap-2">
                    <CreditIcon /> Credits
                  </p>
                  <p className="text-white text-xl font-semibold mt-1">{selectedUser.credits}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Lifetime Value</p>
                  <p className="text-white text-xl font-semibold mt-1">{formatCurrency(selectedUser.lifetimeValue)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm flex items-center gap-2">
                    <CalendarIcon /> Joined
                  </p>
                  <p className="text-white mt-1">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Last Login</p>
                  <p className="text-white mt-1">
                    {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Websites Created</p>
                  <p className="text-white text-xl font-semibold mt-1">
                    {selectedUser.websitesCreated} / {selectedUser.websitesLimit}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Plan Status</p>
                  <p className="text-white mt-1 capitalize">{selectedUser.planStatus}</p>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedUser.adminNotes && (
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-2">Admin Notes</p>
                  <p className="text-white">{selectedUser.adminNotes}</p>
                </div>
              )}

              {/* Tags */}
              {selectedUser.tags && selectedUser.tags.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add Credits</h3>
              <button
                onClick={() => { setShowCreditModal(false); setCreditAmount(0); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-white/60 text-sm mb-2">User</p>
                <p className="text-white font-medium">{selectedUser.displayName || selectedUser.email}</p>
                <p className="text-white/60 text-sm">Current credits: {selectedUser.credits}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Credits to Add/Remove</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  placeholder="Enter amount (negative to remove)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <p className="text-white/40 text-xs mt-2">
                  Use negative numbers to remove credits
                </p>
              </div>
              <button
                onClick={handleAddCredits}
                disabled={actionLoading || creditAmount === 0}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <SpinnerIcon />
                    Processing...
                  </>
                ) : (
                  creditAmount >= 0 ? `Add ${creditAmount} Credits` : `Remove ${Math.abs(creditAmount)} Credits`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
}

export default AdminUsers;
