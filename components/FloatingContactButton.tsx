import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface TicketData {
  subject: string;
  category: 'support' | 'billing' | 'feedback';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  userEmail?: string;
  userName?: string;
}

interface TicketResponse {
  success: boolean;
  ticketId: string;
  jiraKey?: string;
}

export const FloatingContactButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketKey, setTicketKey] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'support' | 'billing' | 'feedback'>('support');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');

  const handleClose = () => {
    setIsOpen(false);
    // Reset form after animation
    setTimeout(() => {
      setSubmitted(false);
      setTicketKey('');
      setError('');
      setSubject('');
      setCategory('support');
      setPriority('medium');
      setDescription('');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createTicket = httpsCallable(functions, 'createTicket');
      const ticketData: TicketData = {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        userEmail: user?.email || undefined,
        userName: user?.displayName || undefined,
      };

      const result = await createTicket(ticketData);
      const response = result.data as TicketResponse;

      if (response.success) {
        setTicketKey(response.jiraKey || response.ticketId);
        setSubmitted(true);
      } else {
        setError('Failed to create ticket. Please try again.');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabels = {
    support: 'Technical Support',
    billing: 'Billing Question',
    feedback: 'Feedback / Suggestion',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#D4AF37] rounded-full shadow-lg
                   hover:shadow-xl hover:scale-105 transition-all duration-200
                   flex items-center justify-center text-white group"
        title="Contact Support"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-[#D4AF37] animate-ping opacity-25 group-hover:opacity-0"></span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden
                          animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Contact Support
                    </h2>
                    <p className="text-white/80 text-sm">Create a support ticket</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {submitted ? (
                /* Success State */
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Ticket Created!
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Your reference number is:
                  </p>
                  <div className="inline-block bg-[#F9F6F0] border border-[#EFEBE4] rounded-lg px-4 py-2 mb-4">
                    <span className="font-mono font-bold text-[#D4AF37] text-lg">{ticketKey}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    We'll respond within 24 hours to your email.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white px-6 py-2.5 rounded-xl
                               font-bold hover:shadow-md transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-[#4A4A4A] mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFEBE4]
                                 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]
                                 outline-none transition-all text-[#4A4A4A]"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Category & Priority Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-bold text-[#4A4A4A] mb-1.5">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as typeof category)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EFEBE4]
                                   focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]
                                   outline-none bg-white text-[#4A4A4A]"
                        disabled={isSubmitting}
                      >
                        <option value="support">Support</option>
                        <option value="billing">Billing</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-bold text-[#4A4A4A] mb-1.5">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as typeof priority)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EFEBE4]
                                   focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]
                                   outline-none bg-white text-[#4A4A4A]"
                        disabled={isSubmitting}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-[#4A4A4A] mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe your issue or question in detail..."
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFEBE4]
                                 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]
                                 outline-none resize-none text-[#4A4A4A]"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* User Info Display */}
                  {user && (
                    <div className="bg-[#F9F6F0] rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center gap-2 text-[#4A4A4A]/70">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Submitting as: <strong className="text-[#4A4A4A]">{user.email}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#EFEBE4]
                                 text-[#4A4A4A] font-medium hover:bg-[#F9F6F0] transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !subject.trim() || !description.trim()}
                      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white
                                 px-4 py-2.5 rounded-xl font-bold hover:shadow-md transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Ticket'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
