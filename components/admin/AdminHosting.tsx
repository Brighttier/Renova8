/**
 * Admin Hosting Component
 *
 * Website hosting management for platform administrators.
 * Monitor hosted sites, usage metrics, and manage site status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getWebsites, updateWebsiteStatus } from '../../services/adminService';
import { HostedWebsite } from '../../types';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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

const ServerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted';

export function AdminHosting() {
  const { hasPermission } = useAdminAuth();
  const [websites, setWebsites] = useState<HostedWebsite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWebsites, setTotalWebsites] = useState(0);
  const [selectedWebsite, setSelectedWebsite] = useState<HostedWebsite | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const websitesPerPage = 12;

  // Aggregate stats
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalBandwidth: 0,
    totalStorage: 0,
    totalPageViews: 0,
    avgUptime: 0,
  });

  const loadWebsites = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWebsites({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: websitesPerPage,
      });
      setWebsites(result.websites);
      setTotalWebsites(result.total);

      // Calculate stats from results
      const activeSites = result.websites.filter(w => w.status === 'active').length;
      const totalBandwidth = result.websites.reduce((sum, w) => sum + w.bandwidth, 0);
      const totalStorage = result.websites.reduce((sum, w) => sum + w.storage, 0);
      const totalPageViews = result.websites.reduce((sum, w) => sum + w.pageViews, 0);
      const avgUptime = result.websites.length > 0
        ? result.websites.reduce((sum, w) => sum + w.uptime, 0) / result.websites.length
        : 0;

      setStats({
        totalSites: result.total,
        activeSites,
        totalBandwidth,
        totalStorage,
        totalPageViews,
        avgUptime,
      });
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  const handleStatusChange = async (websiteId: string, status: 'active' | 'suspended') => {
    if (!hasPermission('hosting.suspend')) {
      alert('You do not have permission to suspend sites');
      return;
    }

    setActionLoading(true);
    try {
      await updateWebsiteStatus(websiteId, status);
      await loadWebsites();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error updating website status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const getSSLBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalPages = Math.ceil(totalWebsites / websitesPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Hosted Websites</h2>
          <p className="text-white/60 mt-1">Manage and monitor all hosted sites</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Total Sites</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalSites}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Active Sites</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.activeSites}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Total Bandwidth</p>
          <p className="text-2xl font-bold text-white mt-1">{formatBytes(stats.totalBandwidth)}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Total Storage</p>
          <p className="text-2xl font-bold text-white mt-1">{formatBytes(stats.totalStorage)}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Page Views</p>
          <p className="text-2xl font-bold text-white mt-1">{formatNumber(stats.totalPageViews)}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Avg Uptime</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.avgUptime.toFixed(1)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by site name, domain, or owner..."
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>
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

      {/* Websites Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon />
          <span className="ml-2 text-white/60">Loading websites...</span>
        </div>
      ) : websites.length === 0 ? (
        <div className="text-center py-12">
          <GlobeIcon />
          <p className="text-white/40 mt-4">No websites found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((website) => (
            <div
              key={website.id}
              className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              {/* Site Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-xl flex items-center justify-center">
                    <GlobeIcon />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{website.name}</h4>
                    <p className="text-white/50 text-sm">{website.subdomain}.renova8.com</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === website.id ? null : website.id)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreIcon />
                  </button>
                  {showActionMenu === website.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-10">
                      <button
                        onClick={() => { setSelectedWebsite(website); setShowActionMenu(null); }}
                        className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                      >
                        View Details
                      </button>
                      <a
                        href={`https://${website.subdomain}.renova8.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                      >
                        Visit Site <ExternalLinkIcon />
                      </a>
                      {hasPermission('hosting.suspend') && website.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(website.id, 'suspended')}
                          disabled={actionLoading}
                          className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                        >
                          Suspend Site
                        </button>
                      )}
                      {hasPermission('hosting.suspend') && website.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(website.id, 'active')}
                          disabled={actionLoading}
                          className="w-full text-left px-4 py-2 text-green-400 hover:bg-green-500/10 transition-colors"
                        >
                          Reactivate Site
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status & SSL */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(website.status)}`}>
                  {website.status.charAt(0).toUpperCase() + website.status.slice(1)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getSSLBadge(website.sslStatus)}`}>
                  <ShieldCheckIcon />
                  SSL {website.sslStatus}
                </span>
              </div>

              {/* Owner */}
              <div className="mb-4">
                <p className="text-white/60 text-sm">Owner</p>
                <p className="text-white">{website.userName}</p>
                <p className="text-white/50 text-sm">{website.userEmail}</p>
              </div>

              {/* Custom Domain */}
              {website.customDomain && (
                <div className="mb-4">
                  <p className="text-white/60 text-sm">Custom Domain</p>
                  <p className="text-[#D4AF37]">{website.customDomain}</p>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-white font-semibold">{formatNumber(website.pageViews)}</p>
                  <p className="text-white/50 text-xs">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{formatBytes(website.bandwidth)}</p>
                  <p className="text-white/50 text-xs">Bandwidth</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{website.uptime.toFixed(1)}%</p>
                  <p className="text-white/50 text-xs">Uptime</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Showing {(currentPage - 1) * websitesPerPage + 1} to {Math.min(currentPage * websitesPerPage, totalWebsites)} of {totalWebsites}
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

      {/* Website Detail Modal */}
      {selectedWebsite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Site Details</h3>
              <button
                onClick={() => setSelectedWebsite(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Site Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl flex items-center justify-center">
                  <GlobeIcon />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">{selectedWebsite.name}</h4>
                  <a
                    href={`https://${selectedWebsite.subdomain}.renova8.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    {selectedWebsite.subdomain}.renova8.com <ExternalLinkIcon />
                  </a>
                </div>
              </div>

              {/* Status & SSL */}
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusBadge(selectedWebsite.status)}`}>
                  {selectedWebsite.status.charAt(0).toUpperCase() + selectedWebsite.status.slice(1)}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${getSSLBadge(selectedWebsite.sslStatus)}`}>
                  <ShieldCheckIcon /> SSL {selectedWebsite.sslStatus}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Owner</p>
                  <p className="text-white font-medium mt-1">{selectedWebsite.userName}</p>
                  <p className="text-white/50 text-sm">{selectedWebsite.userEmail}</p>
                </div>
                {selectedWebsite.customDomain && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm">Custom Domain</p>
                    <p className="text-[#D4AF37] font-medium mt-1">{selectedWebsite.customDomain}</p>
                  </div>
                )}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Created</p>
                  <p className="text-white mt-1">{formatDate(selectedWebsite.createdAt)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Last Deployed</p>
                  <p className="text-white mt-1">
                    {selectedWebsite.lastDeployedAt ? formatDate(selectedWebsite.lastDeployedAt) : 'Never'}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                  <ChartIcon /> Performance Metrics
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(selectedWebsite.pageViews)}</p>
                    <p className="text-white/60 text-sm">Page Views</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{formatBytes(selectedWebsite.bandwidth)}</p>
                    <p className="text-white/60 text-sm">Bandwidth</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{formatBytes(selectedWebsite.storage)}</p>
                    <p className="text-white/60 text-sm">Storage</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedWebsite.uptime.toFixed(1)}%</p>
                    <p className="text-white/60 text-sm">Uptime</p>
                  </div>
                </div>
              </div>

              {/* Server Info */}
              <div>
                <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                  <ServerIcon /> Server Information
                </h5>
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Avg Response Time</span>
                    <span className="text-white">{selectedWebsite.avgResponseTime.toFixed(0)} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">SSL Certificate</span>
                    <span className={selectedWebsite.sslStatus === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                      {selectedWebsite.sslStatus === 'active' ? 'Valid' : selectedWebsite.sslStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Site ID</span>
                    <span className="text-white/50 font-mono text-sm">{selectedWebsite.id}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <a
                  href={`https://${selectedWebsite.subdomain}.renova8.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-white transition-colors"
                >
                  <ExternalLinkIcon /> Visit Site
                </a>
                {hasPermission('hosting.suspend') && (
                  selectedWebsite.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(selectedWebsite.id, 'suspended')}
                      disabled={actionLoading}
                      className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Suspend Site'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(selectedWebsite.id, 'active')}
                      disabled={actionLoading}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Reactivate Site'}
                    </button>
                  )
                )}
              </div>
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

export default AdminHosting;
