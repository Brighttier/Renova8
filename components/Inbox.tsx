import React, { useState, useMemo } from 'react';
import { Lead, Communication, EmailAttachment } from '../types';

interface Props {
    customers: Lead[];
    onUpdateCustomer: (customer: Lead) => void;
}

type FilterType = 'all' | 'unread' | 'starred' | 'sent' | 'received';
type CategoryFilter = 'all' | 'pitch' | 'followup' | 'response' | 'invoice' | 'general';

interface EmailThread {
    customer: Lead;
    email: Communication;
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const formatFullDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getCategoryColor = (category?: string): { bg: string; text: string } => {
    switch (category) {
        case 'pitch': return { bg: 'bg-blue-100', text: 'text-blue-700' };
        case 'followup': return { bg: 'bg-purple-100', text: 'text-purple-700' };
        case 'response': return { bg: 'bg-green-100', text: 'text-green-700' };
        case 'invoice': return { bg: 'bg-orange-100', text: 'text-orange-700' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
};

export const Inbox: React.FC<Props> = ({ customers, onUpdateCustomer }) => {
    const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [selectedCustomerForCompose, setSelectedCustomerForCompose] = useState<Lead | null>(null);
    const [composeForm, setComposeForm] = useState({
        subject: '',
        content: '',
        category: 'general' as Communication['category']
    });
    const [replyContent, setReplyContent] = useState('');
    const [showReplyBox, setShowReplyBox] = useState(false);

    // Get all emails from all customers
    const allEmails = useMemo((): EmailThread[] => {
        const emails: EmailThread[] = [];
        customers.forEach(customer => {
            customer.communications?.forEach(comm => {
                if (comm.type === 'email') {
                    emails.push({ customer, email: comm });
                }
            });
        });
        return emails.sort((a, b) => b.email.timestamp - a.email.timestamp);
    }, [customers]);

    // Filter emails based on search and filters
    const filteredEmails = useMemo(() => {
        return allEmails.filter(thread => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSubject = thread.email.subject.toLowerCase().includes(query);
                const matchesContent = thread.email.content.toLowerCase().includes(query);
                const matchesCustomer = thread.customer.businessName.toLowerCase().includes(query);
                if (!matchesSubject && !matchesContent && !matchesCustomer) return false;
            }

            // Type filter
            switch (filter) {
                case 'unread':
                    if (thread.email.read !== false) return false;
                    break;
                case 'starred':
                    if (!thread.email.starred) return false;
                    break;
                case 'sent':
                    if (thread.email.direction !== 'outbound') return false;
                    break;
                case 'received':
                    if (thread.email.direction !== 'inbound') return false;
                    break;
            }

            // Category filter
            if (categoryFilter !== 'all' && thread.email.category !== categoryFilter) {
                return false;
            }

            return true;
        });
    }, [allEmails, searchQuery, filter, categoryFilter]);

    // Get email counts
    const emailCounts = useMemo(() => {
        return {
            all: allEmails.length,
            unread: allEmails.filter(e => e.email.read === false).length,
            starred: allEmails.filter(e => e.email.starred).length,
            sent: allEmails.filter(e => e.email.direction === 'outbound').length,
            received: allEmails.filter(e => e.email.direction === 'inbound').length
        };
    }, [allEmails]);

    // Get conversation thread for selected email
    const conversationThread = useMemo(() => {
        if (!selectedEmail) return [];
        return allEmails
            .filter(thread => thread.customer.id === selectedEmail.customer.id)
            .sort((a, b) => a.email.timestamp - b.email.timestamp);
    }, [selectedEmail, allEmails]);

    // Toggle starred
    const handleToggleStar = (thread: EmailThread, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedComms = thread.customer.communications?.map(c =>
            c.id === thread.email.id ? { ...c, starred: !c.starred } : c
        );
        onUpdateCustomer({ ...thread.customer, communications: updatedComms });
    };

    // Mark as read
    const handleMarkAsRead = (thread: EmailThread) => {
        if (thread.email.read === false) {
            const updatedComms = thread.customer.communications?.map(c =>
                c.id === thread.email.id ? { ...c, read: true } : c
            );
            onUpdateCustomer({ ...thread.customer, communications: updatedComms });
        }
    };

    // Send new email
    const handleSendEmail = () => {
        if (!selectedCustomerForCompose || !composeForm.subject || !composeForm.content) return;

        const newEmail: Communication = {
            id: `email-${Date.now()}`,
            type: 'email',
            subject: composeForm.subject,
            content: composeForm.content,
            timestamp: Date.now(),
            direction: 'outbound',
            read: true,
            starred: false,
            category: composeForm.category
        };

        onUpdateCustomer({
            ...selectedCustomerForCompose,
            communications: [...(selectedCustomerForCompose.communications || []), newEmail]
        });

        setShowComposeModal(false);
        setSelectedCustomerForCompose(null);
        setComposeForm({ subject: '', content: '', category: 'general' });
    };

    // Send reply
    const handleSendReply = () => {
        if (!selectedEmail || !replyContent.trim()) return;

        const newReply: Communication = {
            id: `email-${Date.now()}`,
            type: 'email',
            subject: `Re: ${selectedEmail.email.subject}`,
            content: replyContent,
            timestamp: Date.now(),
            direction: 'outbound',
            read: true,
            starred: false,
            category: 'response'
        };

        onUpdateCustomer({
            ...selectedEmail.customer,
            communications: [...(selectedEmail.customer.communications || []), newReply]
        });

        setReplyContent('');
        setShowReplyBox(false);
    };

    // Select email and mark as read
    const handleSelectEmail = (thread: EmailThread) => {
        setSelectedEmail(thread);
        handleMarkAsRead(thread);
        setShowReplyBox(false);
        setReplyContent('');
    };

    return (
        <div className="h-full flex bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Compose Button */}
                <div className="p-4">
                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Compose
                    </button>
                </div>

                {/* Filters */}
                <nav className="flex-1 px-3 space-y-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${filter === 'all' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            All Mail
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{emailCounts.all}</span>
                    </button>

                    <button
                        onClick={() => setFilter('unread')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${filter === 'unread' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Unread
                        </span>
                        {emailCounts.unread > 0 && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{emailCounts.unread}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setFilter('starred')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${filter === 'starred' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Starred
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{emailCounts.starred}</span>
                    </button>

                    <button
                        onClick={() => setFilter('sent')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${filter === 'sent' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Sent
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{emailCounts.sent}</span>
                    </button>

                    <button
                        onClick={() => setFilter('received')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${filter === 'received' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Received
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{emailCounts.received}</span>
                    </button>

                    {/* Category Filters */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase px-3 mb-2">Categories</p>
                        {['all', 'pitch', 'followup', 'response', 'invoice', 'general'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat as CategoryFilter)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${categoryFilter === cat ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${getCategoryColor(cat === 'all' ? undefined : cat).bg.replace('100', '500')}`}></span>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Stats */}
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Total Conversations</p>
                        <p className="text-2xl font-bold text-purple-600">{customers.filter(c => c.communications?.some(comm => comm.type === 'email')).length}</p>
                        <p className="text-xs text-gray-400">customers contacted</p>
                    </div>
                </div>
            </div>

            {/* Email List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search emails..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-purple-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.length > 0 ? (
                        filteredEmails.map(thread => (
                            <div
                                key={thread.email.id}
                                onClick={() => handleSelectEmail(thread)}
                                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selectedEmail?.email.id === thread.email.id
                                        ? 'bg-purple-50 border-l-4 border-l-purple-500'
                                        : thread.email.read === false
                                            ? 'bg-blue-50/50 hover:bg-gray-50'
                                            : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                        style={{
                                            background: thread.customer.brandGuidelines?.colors?.[0] || '#667eea'
                                        }}
                                    >
                                        {thread.customer.businessName.charAt(0)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-medium truncate ${thread.email.read === false ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                {thread.customer.businessName}
                                            </span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={(e) => handleToggleStar(thread, e)}
                                                    className="text-gray-300 hover:text-yellow-400"
                                                >
                                                    <svg className={`w-4 h-4 ${thread.email.starred ? 'text-yellow-400 fill-yellow-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                </button>
                                                <span className="text-xs text-gray-400">{formatDate(thread.email.timestamp)}</span>
                                            </div>
                                        </div>

                                        <p className={`text-sm truncate mb-1 ${thread.email.read === false ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                            {thread.email.direction === 'outbound' && <span className="text-purple-500">You: </span>}
                                            {thread.email.subject}
                                        </p>

                                        <p className="text-xs text-gray-400 truncate">{thread.email.content}</p>

                                        <div className="flex items-center gap-2 mt-2">
                                            {thread.email.direction === 'outbound' ? (
                                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Sent</span>
                                            ) : (
                                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Received</span>
                                            )}
                                            {thread.email.category && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(thread.email.category).bg} ${getCategoryColor(thread.email.category).text}`}>
                                                    {thread.email.category}
                                                </span>
                                            )}
                                            {thread.email.attachments && thread.email.attachments.length > 0 && (
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-700 mb-1">No emails found</h3>
                            <p className="text-sm text-gray-400">
                                {searchQuery ? 'Try a different search term' : 'Start by composing a new email'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Detail / Conversation View */}
            <div className="flex-1 bg-white flex flex-col">
                {selectedEmail ? (
                    <>
                        {/* Email Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedEmail.email.subject}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Conversation with</span>
                                        <span className="font-medium text-purple-600">{selectedEmail.customer.businessName}</span>
                                        {selectedEmail.customer.email && (
                                            <span className="text-sm text-gray-400">&lt;{selectedEmail.customer.email}&gt;</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setShowReplyBox(!showReplyBox);
                                            setReplyContent('');
                                        }}
                                        className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        Reply
                                    </button>
                                    <button
                                        onClick={(e) => handleToggleStar(selectedEmail, e)}
                                        className={`p-2 rounded-lg ${selectedEmail.email.starred ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <svg className={`w-5 h-5 ${selectedEmail.email.starred ? 'fill-yellow-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Thread count */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                    {conversationThread.length} message{conversationThread.length !== 1 ? 's' : ''} in thread
                                </span>
                            </div>
                        </div>

                        {/* Conversation Thread */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {conversationThread.map((thread, index) => (
                                <div
                                    key={thread.email.id}
                                    className={`rounded-xl p-4 ${thread.email.direction === 'outbound'
                                            ? 'bg-purple-50 ml-12 border border-purple-100'
                                            : 'bg-gray-50 mr-12 border border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                            style={{
                                                background: thread.email.direction === 'outbound' ? '#8b5cf6' : (thread.customer.brandGuidelines?.colors?.[0] || '#667eea')
                                            }}
                                        >
                                            {thread.email.direction === 'outbound' ? 'Y' : thread.customer.businessName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm text-gray-800">
                                                    {thread.email.direction === 'outbound' ? 'You' : thread.customer.businessName}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatFullDate(thread.email.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{thread.email.subject}</p>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {thread.email.content}
                                    </div>

                                    {/* Attachments */}
                                    {thread.email.attachments && thread.email.attachments.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Attachments</p>
                                            <div className="flex flex-wrap gap-2">
                                                {thread.email.attachments.map(att => (
                                                    <div key={att.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-700">{att.name}</span>
                                                        <span className="text-xs text-gray-400">({formatFileSize(att.size)})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {thread.email.category && (
                                        <div className="mt-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(thread.email.category).bg} ${getCategoryColor(thread.email.category).text}`}>
                                                {thread.email.category}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        {showReplyBox && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100">
                                        <p className="text-sm text-gray-500">
                                            Reply to <span className="font-medium text-gray-700">{selectedEmail.customer.businessName}</span>
                                        </p>
                                    </div>
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write your reply..."
                                        className="w-full p-4 border-0 resize-none h-32 focus:ring-0"
                                    />
                                    <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowReplyBox(false);
                                                    setReplyContent('');
                                                }}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSendReply}
                                                disabled={!replyContent.trim()}
                                                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-700 text-lg mb-2">Select a conversation</h3>
                            <p className="text-sm text-gray-400 mb-6">Choose an email from the list to view the full conversation thread.</p>
                            <button
                                onClick={() => setShowComposeModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Compose New Email
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">New Message</h3>
                            <button
                                onClick={() => {
                                    setShowComposeModal(false);
                                    setSelectedCustomerForCompose(null);
                                    setComposeForm({ subject: '', content: '', category: 'general' });
                                }}
                                className="text-white/80 hover:text-white text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6">
                            {/* To Field */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">To</label>
                                <select
                                    value={selectedCustomerForCompose?.id || ''}
                                    onChange={(e) => {
                                        const customer = customers.find(c => c.id === e.target.value);
                                        setSelectedCustomerForCompose(customer || null);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.businessName} {customer.email ? `<${customer.email}>` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Email subject..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    value={composeForm.subject}
                                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                                />
                            </div>

                            {/* Category */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {['general', 'pitch', 'followup', 'invoice'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setComposeForm({ ...composeForm, category: cat as Communication['category'] })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${composeForm.category === cat
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Message</label>
                                <textarea
                                    placeholder="Write your email..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl h-48 resize-none focus:ring-2 focus:ring-purple-500"
                                    value={composeForm.content}
                                    onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowComposeModal(false);
                                            setSelectedCustomerForCompose(null);
                                            setComposeForm({ subject: '', content: '', category: 'general' });
                                        }}
                                        className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={!selectedCustomerForCompose || !composeForm.subject || !composeForm.content}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
