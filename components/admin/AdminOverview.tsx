/**
 * Admin Overview Component
 *
 * Displays key platform metrics, recent activity, and quick actions.
 * Main dashboard view for platform administrators.
 */

import React, { useState, useEffect } from 'react';
import {
  getRevenueMetrics,
  getUsers,
  getWebsites,
  getSupportTickets,
  getAnalytics,
} from '../../services/adminService';
import {
  RevenueMetrics,
  PlatformUser,
  HostedWebsite,
  SupportTicket,
  PlatformAnalytics,
} from '../../types';

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

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const RevenueIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export function AdminOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<PlatformUser[]>([]);
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSites, setTotalSites] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [revenue, usersData, ticketsData, analyticsData, sitesData] = await Promise.all([
        getRevenueMetrics(),
        getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        getSupportTickets({ status: 'open', limit: 5 }),
        getAnalytics(),
        getWebsites({ limit: 1 }), // Just to get total count
      ]);

      setRevenueMetrics(revenue);
      setRecentUsers(usersData.users);
      setTotalUsers(usersData.total);
      setOpenTickets(ticketsData);
      setAnalytics(analyticsData);
      setTotalSites(sitesData.total);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'trialing': return 'text-blue-400';
      case 'past_due': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <SpinnerIcon />
          <p className="mt-4 text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(revenueMetrics?.totalRevenue || 0)}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                (revenueMetrics?.revenueChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(revenueMetrics?.revenueChange || 0) >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                <span>{Math.abs(revenueMetrics?.revenueChange || 0).toFixed(1)}% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <span className="text-green-400"><RevenueIcon /></span>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatNumber(totalUsers)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                <TrendUpIcon />
                <span>+{analytics?.newUsersThisMonth || 0} this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <span className="text-blue-400"><UsersIcon /></span>
            </div>
          </div>
        </div>

        {/* Sites Card */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Active Sites</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatNumber(totalSites)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-white/60">
                <span>Hosted on platform</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <span className="text-purple-400"><GlobeIcon /></span>
            </div>
          </div>
        </div>

        {/* Open Tickets Card */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Open Tickets</p>
              <p className="text-3xl font-bold text-white mt-2">
                {openTickets.length}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                openTickets.filter(t => t.priority === 'urgent').length > 0 ? 'text-red-400' : 'text-white/60'
              }`}>
                {openTickets.filter(t => t.priority === 'urgent').length > 0 ? (
                  <>
                    <AlertIcon />
                    <span>{openTickets.filter(t => t.priority === 'urgent').length} urgent</span>
                  </>
                ) : (
                  <span>No urgent tickets</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <span className="text-orange-400"><TicketIcon /></span>
            </div>
          </div>
        </div>
      </div>

      {/* MRR & Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Stats */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">MRR</span>
              <span className="text-white font-semibold">{formatCurrency(revenueMetrics?.mrr || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">ARR</span>
              <span className="text-white font-semibold">{formatCurrency(revenueMetrics?.arr || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Subscriptions</span>
              <span className="text-white font-semibold">{formatCurrency(revenueMetrics?.subscriptionRevenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Credits</span>
              <span className="text-white font-semibold">{formatCurrency(revenueMetrics?.creditRevenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Hosting</span>
              <span className="text-white font-semibold">{formatCurrency(revenueMetrics?.hostingRevenue || 0)}</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <span className="text-white/60">Refunds</span>
              <span className="text-red-400 font-semibold">-{formatCurrency(revenueMetrics?.refunds || 0)}</span>
            </div>
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Platform Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">ARPU</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(revenueMetrics?.arpu || 0)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">Churn Rate</p>
              <p className="text-xl font-bold text-white mt-1">
                {(revenueMetrics?.churnRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">DAU</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatNumber(analytics?.dau || 0)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">MAU</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatNumber(analytics?.mau || 0)}
              </p>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="mt-6">
            <h4 className="text-white/80 text-sm font-medium mb-3">Conversion Funnel</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="h-20 bg-gradient-to-t from-blue-500/40 to-blue-500/10 rounded-t-lg relative">
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                    {formatNumber(analytics?.visitors || 0)}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-2">Visitors</p>
              </div>
              <div className="text-center">
                <div className="h-16 bg-gradient-to-t from-green-500/40 to-green-500/10 rounded-t-lg relative mt-4">
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                    {formatNumber(analytics?.signups || 0)}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-2">Signups</p>
              </div>
              <div className="text-center">
                <div className="h-12 bg-gradient-to-t from-yellow-500/40 to-yellow-500/10 rounded-t-lg relative mt-8">
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                    {formatNumber(analytics?.trials || 0)}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-2">Trials</p>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gradient-to-t from-purple-500/40 to-purple-500/10 rounded-t-lg relative mt-12">
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                    {formatNumber(analytics?.paidUsers || 0)}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-2">Paid</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Signups</h3>
            <button className="text-[#D4AF37] text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-white/40 text-center py-4">No recent signups</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {user.displayName || user.email.split('@')[0]}
                    </p>
                    <p className="text-white/50 text-sm truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(user.planStatus)}`}>
                      {user.planId === 'free' ? 'Free' : user.planId.charAt(0).toUpperCase() + user.planId.slice(1)}
                    </p>
                    <p className="text-white/40 text-xs flex items-center justify-end gap-1">
                      <ClockIcon />
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Support Tickets */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Open Tickets</h3>
            <button className="text-[#D4AF37] text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {openTickets.length === 0 ? (
              <p className="text-white/40 text-center py-4">No open tickets</p>
            ) : (
              openTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{ticket.subject}</p>
                    <p className="text-white/50 text-sm truncate">
                      {ticket.userName} &middot; #{ticket.ticketNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-xs flex items-center justify-end gap-1">
                      <ClockIcon />
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Feature Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(analytics?.featureUsage || []).slice(0, 6).map((feature, index) => (
            <div key={index} className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-2xl font-bold text-white">{formatNumber(feature.count)}</p>
              <p className="text-white/60 text-sm mt-1">{feature.feature}</p>
              <p className={`text-xs mt-1 ${feature.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {feature.change >= 0 ? '+' : ''}{feature.change}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
