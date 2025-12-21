/**
 * SupportTickets Component
 *
 * Displays user's support ticket history with ability to view details,
 * reply to tickets, and create new tickets.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'support';
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'technical' | 'billing' | 'feature' | 'account' | 'other';
  description: string;
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  tags?: string[];
  jiraKey?: string; // Jira issue key (e.g., "SUPPORT-123")
}

interface SupportTicketsProps {
  /** Callback when user wants to go back */
  onBack?: () => void;
}

// Status styling
const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'open': { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Open' },
  'in-progress': { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Progress' },
  'waiting': { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Waiting for Reply' },
  'resolved': { color: 'text-green-600', bg: 'bg-green-100', label: 'Resolved' },
  'closed': { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Closed' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  'low': { color: 'text-gray-500', label: 'Low' },
  'medium': { color: 'text-blue-500', label: 'Medium' },
  'high': { color: 'text-orange-500', label: 'High' },
  'urgent': { color: 'text-red-500', label: 'Urgent' },
};

const categoryLabels: Record<string, string> = {
  'technical': 'Technical Issue',
  'billing': 'Billing & Payments',
  'feature': 'Feature Request',
  'account': 'Account',
  'other': 'Other',
};

export const SupportTickets: React.FC<SupportTicketsProps> = ({ onBack }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical' as const,
    description: '',
    priority: 'medium' as const,
  });

  const functions = getFunctions();

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  // Scroll to bottom of messages when viewing a ticket
  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const getUserTickets = httpsCallable(functions, 'getUserTickets');
      const result = await getUserTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const data = result.data as { success: boolean; tickets: SupportTicket[] };

      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const createTicket = httpsCallable(functions, 'createTicket');
      const result = await createTicket(newTicket);
      const data = result.data as { success: boolean; ticket: SupportTicket };

      if (data.success) {
        setTickets(prev => [data.ticket, ...prev]);
        setShowNewTicketForm(false);
        setNewTicket({
          subject: '',
          category: 'technical',
          description: '',
          priority: 'medium',
        });
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const addTicketMessage = httpsCallable(functions, 'addTicketMessage');
      const result = await addTicketMessage({
        ticketId: selectedTicket.id,
        message: replyMessage,
      });
      const data = result.data as { success: boolean; message: TicketMessage };

      if (data.success) {
        setSelectedTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          status: prev.status === 'resolved' || prev.status === 'waiting' ? 'open' : prev.status,
        } : null);
        setReplyMessage('');

        // Update ticket in list
        setTickets(prev => prev.map(t =>
          t.id === selectedTicket.id
            ? { ...t, messages: [...t.messages, data.message], updatedAt: data.message.createdAt }
            : t
        ));
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);

    try {
      const closeTicket = httpsCallable(functions, 'closeTicket');
      await closeTicket({ ticketId: selectedTicket.id });

      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id ? { ...t, status: 'closed' } : t
      ));
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError('Failed to close ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);

    try {
      const reopenTicket = httpsCallable(functions, 'reopenTicket');
      await reopenTicket({ ticketId: selectedTicket.id });

      setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id ? { ...t, status: 'open' } : t
      ));
    } catch (err) {
      console.error('Error reopening ticket:', err);
      setError('Failed to reopen ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-[#D4AF37] hover:text-[#B8962E]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Support Tickets
              </h1>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                View and manage your support requests
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white rounded-xl hover:shadow-md transition-all text-sm font-semibold"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            + New Ticket
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold">Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Ticket List */}
        <div className="w-96 bg-white border-r border-[#EFEBE4] flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-[#EFEBE4]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#EFEBE4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting">Waiting for Reply</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-semibold text-[#4A4A4A] mb-1">No Tickets</h3>
                <p className="text-sm text-gray-500">You haven't submitted any support tickets yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFEBE4]">
                {tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 hover:bg-[#F9F6F0] transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-[#F9F6F0]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        {ticket.jiraKey && (
                          <span className="font-mono text-xs text-[#D4AF37] mr-2">{ticket.jiraKey}</span>
                        )}
                        <span className="font-semibold text-[#4A4A4A] text-sm line-clamp-1">
                          {ticket.subject}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}>
                        {statusConfig[ticket.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{categoryLabels[ticket.category]}</span>
                      <span>{formatDate(ticket.updatedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail / New Ticket Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showNewTicketForm ? (
            // New Ticket Form
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Create New Ticket
                  </h2>
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-1">Subject *</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#4A4A4A] mb-1">Category</label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as typeof prev.category }))}
                        className="w-full px-4 py-2 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="feature">Feature Request</option>
                        <option value="account">Account</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#4A4A4A] mb-1">Priority</label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as typeof prev.priority }))}
                        className="w-full px-4 py-2 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-1">Description *</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-2 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowNewTicketForm(false)}
                      className="px-6 py-2 border border-[#EFEBE4] rounded-xl hover:bg-[#F9F6F0] text-[#4A4A4A] text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTicket}
                      disabled={submitting}
                      className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white rounded-xl hover:shadow-md transition-all text-sm font-semibold disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTicket ? (
            // Ticket Detail View
            <>
              {/* Ticket header */}
              <div className="p-6 border-b border-[#EFEBE4] bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[selectedTicket.status].bg} ${statusConfig[selectedTicket.status].color}`}>
                        {statusConfig[selectedTicket.status].label}
                      </span>
                      <span className={`text-xs font-medium ${priorityConfig[selectedTicket.priority].color}`}>
                        {priorityConfig[selectedTicket.priority].label} Priority
                      </span>
                      <span className="text-xs text-gray-400">
                        {categoryLabels[selectedTicket.category]}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedTicket.jiraKey && (
                        <span className="font-mono text-[#D4AF37] mr-2">{selectedTicket.jiraKey}</span>
                      )}
                      Created {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? (
                      <button
                        onClick={handleReopenTicket}
                        disabled={submitting}
                        className="px-3 py-1.5 border border-[#EFEBE4] rounded-lg hover:bg-[#F9F6F0] text-sm text-[#4A4A4A]"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={handleCloseTicket}
                        disabled={submitting}
                        className="px-3 py-1.5 border border-[#EFEBE4] rounded-lg hover:bg-[#F9F6F0] text-sm text-[#4A4A4A]"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md ${
                      msg.senderType === 'user'
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white'
                        : 'bg-white border border-[#EFEBE4]'
                    } rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${msg.senderType === 'user' ? 'text-white/80' : 'text-[#4A4A4A]'}`}>
                          {msg.senderType === 'support' ? '🎧 Support Team' : msg.senderName}
                        </span>
                        <span className={`text-xs ${msg.senderType === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm whitespace-pre-wrap ${msg.senderType === 'user' ? 'text-white' : 'text-[#4A4A4A]'}`}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t border-[#EFEBE4] bg-white">
                  <div className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="flex-1 px-4 py-2 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                    <button
                      onClick={handleReply}
                      disabled={submitting || !replyMessage.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50 self-end"
                    >
                      {submitting ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Select a Ticket
                </h3>
                <p className="text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Choose a ticket from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
