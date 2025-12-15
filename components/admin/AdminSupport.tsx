/**
 * Admin Support Component
 *
 * Support ticket management for platform administrators.
 * View, respond to, and manage customer support tickets.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getSupportTickets,
  getTicket,
  updateTicketStatus,
  assignTicket,
  addTicketMessage,
} from '../../services/adminService';
import { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '../../types';
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

const TicketIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type StatusFilterType = 'all' | TicketStatus;
type PriorityFilterType = 'all' | TicketPriority;

export function AdminSupport() {
  const { admin, hasPermission } = useAdminAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterType>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    awaitingReply: 0,
    resolved: 0,
    avgResponseTime: 0,
  });

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSupportTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined,
      });
      setTickets(result);

      // Calculate stats
      const open = result.filter(t => t.status === 'open').length;
      const inProgress = result.filter(t => t.status === 'in_progress').length;
      const awaitingReply = result.filter(t => t.status === 'awaiting_reply').length;
      const resolved = result.filter(t => t.status === 'resolved' || t.status === 'closed').length;

      // Calculate avg response time for tickets with first response
      const ticketsWithResponse = result.filter(t => t.firstResponseAt);
      const avgResponseTime = ticketsWithResponse.length > 0
        ? ticketsWithResponse.reduce((sum, t) => sum + (t.firstResponseAt! - t.createdAt), 0) / ticketsWithResponse.length
        : 0;

      setStats({
        open,
        inProgress,
        awaitingReply,
        resolved,
        avgResponseTime: avgResponseTime / (1000 * 60), // Convert to minutes
      });
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSelectTicket = async (ticketId: string) => {
    try {
      const ticket = await getTicket(ticketId);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !admin) return;

    if (!hasPermission('support.respond')) {
      alert('You do not have permission to respond to tickets');
      return;
    }

    setActionLoading(true);
    try {
      await addTicketMessage(selectedTicket.id, {
        senderId: admin.id,
        senderName: admin.displayName,
        senderType: 'admin',
        content: replyMessage,
        isInternal: isInternalNote,
      });

      // Refresh ticket
      const updatedTicket = await getTicket(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      setReplyMessage('');
      setIsInternalNote(false);
      await loadTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;

    if (!hasPermission('support.respond')) {
      alert('You do not have permission to update tickets');
      return;
    }

    setActionLoading(true);
    try {
      await updateTicketStatus(selectedTicket.id, status);
      const updatedTicket = await getTicket(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      await loadTickets();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket || !admin) return;

    setActionLoading(true);
    try {
      await assignTicket(selectedTicket.id, admin.id, admin.displayName);
      const updatedTicket = await getTicket(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      await loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'awaiting_reply':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'billing': return 'Billing';
      case 'technical': return 'Technical';
      case 'account': return 'Account';
      case 'feature_request': return 'Feature Request';
      case 'general': return 'General';
      default: return category;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
          <p className="text-white/60 mt-1">Manage and respond to customer support requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Open</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.open}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Awaiting Reply</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.awaitingReply}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Resolved</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-white/60 text-sm">Avg Response</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.avgResponseTime.toFixed(0)}m</p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterIcon />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_reply">Awaiting Reply</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilterType)}
            className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Ticket List & Detail Split View */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Ticket List */}
        <div className={`${selectedTicket ? 'hidden lg:block lg:w-1/3' : 'w-full'} bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col`}>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <SpinnerIcon />
                <span className="ml-2 text-white/60">Loading tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon />
                <p className="text-white/40 mt-4">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket.id)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <ClockIcon />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-white font-medium line-clamp-1">{ticket.subject}</h4>
                    <p className="text-white/50 text-sm mt-1">#{ticket.ticketNumber} &middot; {ticket.userName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadge(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className="text-white/40 text-xs">{getCategoryLabel(ticket.category)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket && (
          <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            {/* Ticket Header */}
            <div className="flex-shrink-0 p-4 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getPriorityBadge(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusBadge(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className="text-white/40 text-sm">{getCategoryLabel(selectedTicket.category)}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg">{selectedTicket.subject}</h3>
                  <p className="text-white/50 text-sm mt-1">
                    #{selectedTicket.ticketNumber} &middot; {selectedTicket.userName} ({selectedTicket.userEmail})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden text-white/60 hover:text-white"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {!selectedTicket.assignedTo && (
                  <button
                    onClick={handleAssignToMe}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#B8963A] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Assign to Me
                  </button>
                )}
                {selectedTicket.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Start Working
                  </button>
                )}
                {(selectedTicket.status === 'in_progress' || selectedTicket.status === 'awaiting_reply') && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status === 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                )}
              </div>

              {selectedTicket.assignedTo && (
                <p className="text-white/50 text-sm mt-3 flex items-center gap-2">
                  <UserIcon />
                  Assigned to: {selectedTicket.assignedToName}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedTicket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.senderType === 'admin'
                        ? message.isInternal
                          ? 'bg-yellow-500/10 border border-yellow-500/30'
                          : 'bg-[#D4AF37]/20 border border-[#D4AF37]/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium text-sm">{message.senderName}</span>
                      {message.isInternal && (
                        <span className="text-yellow-400 text-xs">(Internal Note)</span>
                      )}
                      <span className="text-white/40 text-xs">{formatFullDate(message.createdAt)}</span>
                    </div>
                    <p className="text-white/80 whitespace-pre-wrap">{message.content}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D4AF37] text-sm hover:underline block"
                          >
                            {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            {hasPermission('support.respond') && selectedTicket.status !== 'closed' && (
              <div className="flex-shrink-0 p-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    Internal Note (not visible to customer)
                  </label>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={isInternalNote ? 'Add internal note...' : 'Type your reply...'}
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={actionLoading || !replyMessage.trim()}
                    className="px-4 bg-[#D4AF37] hover:bg-[#B8963A] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading ? <SpinnerIcon /> : <SendIcon />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSupport;
