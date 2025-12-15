/**
 * Admin Analytics Component
 *
 * Platform analytics and insights for administrators.
 * Displays user engagement, feature usage, and AI costs.
 */

import React, { useState, useEffect } from 'react';
import { getAnalytics, getSystemHealth } from '../../services/adminService';
import { PlatformAnalytics, SystemHealth } from '../../types';

// Icons
const SpinnerIcon = () => (
  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

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

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CpuIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

type DateRange = '7d' | '30d' | '90d';

export function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, healthData] = await Promise.all([
        getAnalytics(),
        getSystemHealth(),
      ]);
      setAnalytics(analyticsData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <SpinnerIcon />
          <p className="mt-4 text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Analytics</h2>
          <p className="text-white/60 mt-1">User engagement and platform performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics?.totalUsers || 0)}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                (analytics?.userGrowthRate || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(analytics?.userGrowthRate || 0) >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                <span>{Math.abs(analytics?.userGrowthRate || 0).toFixed(1)}% growth</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <span className="text-blue-400"><UsersIcon /></span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Active Users (DAU)</p>
          <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics?.dau || 0)}</p>
          <p className="text-white/40 text-sm mt-2">Daily active users</p>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">MAU</p>
          <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics?.mau || 0)}</p>
          <p className="text-white/40 text-sm mt-2">Monthly active users</p>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <p className="text-white/60 text-sm">Avg Session</p>
          <p className="text-3xl font-bold text-white mt-2">{formatDuration(analytics?.avgSessionDuration || 0)}</p>
          <p className="text-white/40 text-sm mt-2">{(analytics?.actionsPerSession || 0).toFixed(1)} actions/session</p>
        </div>
      </div>

      {/* Conversion Funnel & Feature Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ChartIcon /> Conversion Funnel
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Visitors', value: analytics?.visitors || 0, color: 'bg-blue-500' },
              { label: 'Signups', value: analytics?.signups || 0, color: 'bg-green-500' },
              { label: 'Trials', value: analytics?.trials || 0, color: 'bg-yellow-500' },
              { label: 'Paid Users', value: analytics?.paidUsers || 0, color: 'bg-purple-500' },
            ].map((stage, index, arr) => {
              const prevValue = index > 0 ? arr[index - 1].value : stage.value;
              const conversionRate = prevValue > 0 ? (stage.value / prevValue * 100) : 0;
              const percentage = arr[0].value > 0 ? (stage.value / arr[0].value * 100) : 0;

              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{formatNumber(stage.value)}</span>
                      {index > 0 && (
                        <span className="text-white/40 text-sm">({conversionRate.toFixed(1)}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Feature Usage</h3>
          <div className="space-y-3">
            {(analytics?.featureUsage || []).map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">{feature.feature}</p>
                  <p className="text-white/50 text-sm">{formatNumber(feature.count)} uses</p>
                </div>
                <div className={`text-sm flex items-center gap-1 ${feature.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {feature.change >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                  {Math.abs(feature.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Usage & Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Generations */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CpuIcon /> AI Generation Usage
          </h3>
          <div className="space-y-3">
            {(analytics?.aiGenerations || []).map((gen, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium capitalize">{gen.type.replace('_', ' ')}</p>
                  <p className="text-white/50 text-sm">{formatNumber(gen.count)} generations</p>
                </div>
                <p className="text-[#D4AF37] font-semibold">{formatCurrency(gen.cost)}</p>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Total API Cost</span>
                <span className="text-white text-xl font-bold">{formatCurrency(analytics?.totalApiCost || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            {/* Web Vitals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{systemHealth?.webVitals.lcp || 0}ms</p>
                <p className="text-white/60 text-sm">LCP</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{systemHealth?.webVitals.fid || 0}ms</p>
                <p className="text-white/60 text-sm">FID</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{systemHealth?.webVitals.cls?.toFixed(3) || 0}</p>
                <p className="text-white/60 text-sm">CLS</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{systemHealth?.webVitals.ttfb || 0}ms</p>
                <p className="text-white/60 text-sm">TTFB</p>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <p className="text-white/60 text-sm">Services</p>
              {(systemHealth?.services || []).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      service.status === 'online' ? 'bg-green-400' :
                      service.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className="text-white text-sm">{service.name}</span>
                  </div>
                  <span className="text-white/60 text-sm">{service.uptime.toFixed(1)}% uptime</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Resource Usage & Costs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Firebase */}
          <div>
            <p className="text-white/60 text-sm mb-3">Firebase Services</p>
            <div className="space-y-3">
              {(systemHealth?.resourceUsage.firebase || []).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{item.service}</span>
                    <span className="text-white/60 text-sm">
                      {formatNumber(item.usage)} / {formatNumber(item.limit)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (item.usage / item.limit) > 0.9 ? 'bg-red-500' :
                        (item.usage / item.limit) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((item.usage / item.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External APIs */}
          <div>
            <p className="text-white/60 text-sm mb-3">External APIs</p>
            <div className="space-y-3">
              {(systemHealth?.resourceUsage.externalApis || []).map((api, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white text-sm">{api.api}</p>
                    <p className="text-white/50 text-xs">{formatNumber(api.requests)} / {formatNumber(api.quota)} requests</p>
                  </div>
                  <span className="text-[#D4AF37] font-semibold">{formatCurrency(api.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Projected Monthly Cost</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(systemHealth?.resourceUsage.projectedCost || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Budget</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(systemHealth?.resourceUsage.budget || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
