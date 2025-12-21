/**
 * Admin Revenue Component
 *
 * Revenue monitoring and transaction management for platform administrators.
 * Displays MRR, transaction history, and subscription metrics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getRevenueMetrics,
  getTransactions,
  getSubscriptionPlans,
  processRefund,
} from '../../services/adminService';
import { RevenueMetrics, Transaction, SubscriptionPlan } from '../../types';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// Icons
const TrendUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

type TransactionFilter = 'all' | 'subscription' | 'credit_pack' | 'hosting' | 'refund';
type DateRange = '7d' | '30d' | '90d' | 'all';

export function AdminRevenue() {
  const { hasPermission } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const transactionsPerPage = 15;

  const getDateRangeTimestamp = (): number | undefined => {
    const now = Date.now();
    switch (dateRange) {
      case '7d': return now - 7 * 24 * 60 * 60 * 1000;
      case '30d': return now - 30 * 24 * 60 * 60 * 1000;
      case '90d': return now - 90 * 24 * 60 * 60 * 1000;
      default: return undefined;
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = getDateRangeTimestamp();
      const [metricsData, transactionsData, plansData] = await Promise.all([
        getRevenueMetrics(startDate ? { start: startDate, end: Date.now() } : undefined),
        getTransactions({
          type: typeFilter !== 'all' ? typeFilter as any : undefined,
          limit: transactionsPerPage * 10, // Get more to filter client-side
        }),
        getSubscriptionPlans(),
      ]);

      // Filter by date range client-side if needed
      let filteredTransactions = transactionsData;
      if (startDate) {
        filteredTransactions = transactionsData.filter(t => t.createdAt >= startDate);
      }

      // Simple client-side pagination
      const startIndex = (currentPage - 1) * transactionsPerPage;
      const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + transactionsPerPage);

      setMetrics(metricsData);
      setTransactions(paginatedTransactions);
      setTotalTransactions(filteredTransactions.length);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, dateRange, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason.trim()) return;

    if (!hasPermission('revenue.refund')) {
      alert('You do not have permission to process refunds');
      return;
    }

    setActionLoading(true);
    try {
      await processRefund(selectedTransaction.id, refundReason);
      await loadData();
      setShowRefundModal(false);
      setRefundReason('');
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (!hasPermission('revenue.export')) {
      alert('You do not have permission to export data');
      return;
    }

    // Create CSV export
    const headers = ['Date', 'User', 'Email', 'Type', 'Amount', 'Status'];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toISOString(),
      t.userName,
      t.userEmail,
      t.type,
      t.amount.toString(),
      t.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'credit_pack':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'hosting':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'refund':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <SpinnerIcon />
          <p className="mt-4 text-white/60">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue & Transactions</h2>
          <p className="text-white/60 mt-1">Monitor platform revenue and manage transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value as DateRange); setCurrentPage(1); }}
            className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          {hasPermission('revenue.export') && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-white transition-colors"
            >
              <DownloadIcon />
              Export
            </button>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8963A] px-4 py-2 rounded-xl text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? <SpinnerIcon /> : <RefreshIcon />}
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(metrics?.totalRevenue || 0)}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            (metrics?.revenueChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(metrics?.revenueChange || 0) >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
            <span>{Math.abs(metrics?.revenueChange || 0).toFixed(1)}% vs last period</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(metrics?.mrr || 0)}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            (metrics?.mrrChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(metrics?.mrrChange || 0) >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
            <span>{Math.abs(metrics?.mrrChange || 0).toFixed(1)}% change</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(metrics?.arr || 0)}</p>
          <p className="text-white/40 text-sm mt-2">Projected from MRR</p>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Churn Rate</p>
          <p className="text-3xl font-bold text-white mt-2">{(metrics?.churnRate || 0).toFixed(1)}%</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            (metrics?.churnChange || 0) <= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(metrics?.churnChange || 0) <= 0 ? <TrendDownIcon /> : <TrendUpIcon />}
            <span>{Math.abs(metrics?.churnChange || 0).toFixed(1)}% change</span>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown & Subscription Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">Subscriptions</span>
                <span className="text-white font-semibold">{formatCurrency(metrics?.subscriptionRevenue || 0)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${metrics?.totalRevenue ? (metrics.subscriptionRevenue / metrics.totalRevenue) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">Credit Packs</span>
                <span className="text-white font-semibold">{formatCurrency(metrics?.creditRevenue || 0)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${metrics?.totalRevenue ? (metrics.creditRevenue / metrics.totalRevenue) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">Hosting</span>
                <span className="text-white font-semibold">{formatCurrency(metrics?.hostingRevenue || 0)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${metrics?.totalRevenue ? (metrics.hostingRevenue / metrics.totalRevenue) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Refunds</span>
                <span className="text-red-400 font-semibold">-{formatCurrency(metrics?.refunds || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">{plan.name}</p>
                  <p className="text-white/50 text-sm">
                    {formatCurrency(plan.price)}/{plan.interval}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{plan.activeSubscriptions}</p>
                  <p className="text-white/50 text-sm">Active</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/60">ARPU</span>
              <span className="text-white font-semibold">{formatCurrency(metrics?.arpu || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl">
        <div className="p-6 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-white font-semibold">Transaction History</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as TransactionFilter); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscriptions</option>
                <option value="credit_pack">Credit Packs</option>
                <option value="hosting">Hosting</option>
                <option value="refund">Refunds</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Date</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">User</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Type</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Amount</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Status</th>
                <th className="text-left text-white/60 font-medium text-sm px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <SpinnerIcon />
                      <span className="ml-2 text-white/60">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/40">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white/80 text-sm">{formatDate(transaction.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{transaction.userName}</p>
                        <p className="text-white/50 text-sm">{transaction.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getTypeBadge(transaction.type)}`}>
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${transaction.type === 'refund' ? 'text-red-400' : 'text-white'}`}>
                        {transaction.type === 'refund' ? '-' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasPermission('revenue.refund') && transaction.status === 'succeeded' && transaction.type !== 'refund' && (
                        <button
                          onClick={() => { setSelectedTransaction(transaction); setShowRefundModal(true); }}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Refund
                        </button>
                      )}
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
              Showing {(currentPage - 1) * transactionsPerPage + 1} to {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions}
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

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Process Refund</h3>
              <button
                onClick={() => { setShowRefundModal(false); setRefundReason(''); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm">Transaction Details</p>
                <p className="text-white font-medium mt-1">{selectedTransaction.userName}</p>
                <p className="text-white/60 text-sm">{selectedTransaction.userEmail}</p>
                <p className="text-white font-semibold text-xl mt-2">{formatCurrency(selectedTransaction.amount)}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Refund Reason *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none"
                />
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">
                  This action will refund {formatCurrency(selectedTransaction.amount)} to the customer's original payment method. This cannot be undone.
                </p>
              </div>
              <button
                onClick={handleRefund}
                disabled={actionLoading || !refundReason.trim()}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <SpinnerIcon />
                    Processing Refund...
                  </>
                ) : (
                  `Refund ${formatCurrency(selectedTransaction.amount)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRevenue;
