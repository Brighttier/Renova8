/**
 * AI Support Chat Component with Voice Conversation
 *
 * A slide-out chat panel that provides intelligent support through AI.
 * Features voice-first interaction with Gemini Live, context awareness,
 * intent classification, and escalation options.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  generateSupportResponse,
  createSupportTicket,
  QUICK_REPLIES,
  ChatMessage,
  SupportContext,
  SupportIntent,
  SuggestedAction,
} from '../services/supportChatService';
import {
  VoiceChatSession,
  VoiceSession,
  TranscriptEntry,
  checkVoiceChatAvailability,
  forwardConversationToAdmin
} from '../services/voiceChatService';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  context: SupportContext;
  onNavigate?: (path: string) => void;
  initialMessage?: string;
}

type ChatMode = 'text' | 'voice';

export const SupportChat: React.FC<SupportChatProps> = ({
  isOpen,
  onClose,
  context,
  onNavigate,
  initialMessage
}) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<SupportIntent | null>(null);

  // Voice chat state
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const [voiceSession, setVoiceSession] = useState<VoiceChatSession | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceSession['status']>('ended');
  const [voiceTranscripts, setVoiceTranscripts] = useState<TranscriptEntry[]>([]);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean>(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showForwardForm, setShowForwardForm] = useState(false);
  const [forwardNotes, setForwardNotes] = useState('');
  const [detectedIntents, setDetectedIntents] = useState<SupportIntent[]>([]);
  const [lastSessionData, setLastSessionData] = useState<VoiceSession | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceTranscripts, scrollToBottom]);

  // Check voice availability on mount
  useEffect(() => {
    checkVoiceChatAvailability().then(result => {
      setVoiceAvailable(result.available);
      if (!result.available) {
        setVoiceError(result.reason || 'Voice chat unavailable');
      }
    });
  }, []);

  // Auto-send initial message when chat opens
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSend(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && chatMode === 'text') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, chatMode]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: getContextualGreeting(context),
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, context]);

  // Cleanup voice session on unmount or close
  useEffect(() => {
    return () => {
      if (voiceSession) {
        voiceSession.end();
      }
    };
  }, [voiceSession]);

  // Generate contextual greeting
  function getContextualGreeting(ctx: SupportContext): string {
    let greeting = "Hi there! I'm your AI support assistant. ";

    if (ctx.currentPage) {
      const pageGreetings: Record<string, string> = {
        'Website Builder': "I see you're working on building a website. ",
        'Website Editor': "I see you're editing a website. ",
        'Deploy': "I see you're in the deployment section. ",
        'Scout': "I see you're looking for customers. ",
        'Settings': "I see you're in settings. "
      };
      greeting += pageGreetings[ctx.currentPage] || '';
    }

    if (ctx.systemStatus?.lastPublishError) {
      greeting += "I noticed your last publish attempt had an issue - I can help with that! ";
    }

    if (ctx.systemStatus?.domainStatus === 'pending') {
      greeting += "I see you have a domain pending verification. ";
    }

    greeting += "\n\nHow can I help you today? You can type or click the microphone to talk.";
    return greeting;
  }

  // Handle sending a text message
  const handleSend = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate AI response
      const { response, intent, actions } = await generateSupportResponse(
        text,
        messages,
        context
      );

      setCurrentIntent(intent);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        intent,
        actions
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error generating response:', error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Would you like to create a support ticket instead?",
        timestamp: Date.now(),
        actions: [{ label: 'Create Support Ticket', type: 'escalate', target: 'create_ticket' }]
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // Voice Chat Functions
  // ============================================

  const startVoiceChat = async () => {
    if (!voiceAvailable) {
      setVoiceError('Voice chat is not available. Please check microphone permissions.');
      return;
    }

    setChatMode('voice');
    setVoiceTranscripts([]);
    setDetectedIntents([]);
    setVoiceError(null);

    const session = new VoiceChatSession(context, {
      enableAudioRecording: true,
      enableTranscription: true
    });

    // Set up callbacks
    session.onStatusChange = (status) => {
      setVoiceStatus(status);
      if (status === 'error') {
        setVoiceError('Voice session encountered an error');
      }
    };

    session.onTranscript = (entry) => {
      setVoiceTranscripts(prev => [...prev, entry]);
    };

    session.onIntentDetected = (intent) => {
      setDetectedIntents(prev => {
        if (!prev.includes(intent)) {
          return [...prev, intent];
        }
        return prev;
      });
    };

    session.onError = (error) => {
      console.error('Voice session error:', error);
      setVoiceError(error.message);
      setVoiceStatus('error');
    };

    setVoiceSession(session);

    const started = await session.start();
    if (!started) {
      setChatMode('text');
      setVoiceError('Failed to start voice chat. Please try again.');
    }
  };

  const toggleMute = () => {
    if (!voiceSession) return;

    if (isMuted) {
      voiceSession.resume();
      setIsMuted(false);
    } else {
      voiceSession.pause();
      setIsMuted(true);
    }
  };

  const endVoiceChat = async () => {
    if (!voiceSession) return;

    const sessionData = await voiceSession.end();
    setLastSessionData(sessionData);

    // Convert voice transcripts to chat messages
    const voiceMessages: ChatMessage[] = voiceTranscripts.map(t => ({
      id: t.id,
      role: t.role,
      content: t.text,
      timestamp: t.timestamp
    }));

    setMessages(prev => [...prev, ...voiceMessages]);
    setVoiceSession(null);
    setVoiceTranscripts([]);
    setChatMode('text');

    // Show option to forward conversation
    if (voiceTranscripts.length > 0) {
      const forwardMessage: ChatMessage = {
        id: `forward-option-${Date.now()}`,
        role: 'assistant',
        content: "Voice conversation ended. Would you like me to forward this conversation to our support team for follow-up?",
        timestamp: Date.now(),
        actions: [
          { label: 'Forward to Support', type: 'action', target: 'forward_conversation' },
          { label: 'No, thanks', type: 'action', target: 'dismiss' }
        ]
      };
      setMessages(prev => [...prev, forwardMessage]);
    }
  };

  const handleForwardConversation = () => {
    setShowForwardForm(true);
  };

  const submitForward = async () => {
    const sessionData = lastSessionData || voiceSession?.getSession();
    if (!sessionData) return;

    try {
      await forwardConversationToAdmin(sessionData, 'normal', forwardNotes);

      const confirmMessage: ChatMessage = {
        id: `forward-confirm-${Date.now()}`,
        role: 'assistant',
        content: "Your conversation has been forwarded to our support team. They will review it and follow up via email within 24 hours.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, confirmMessage]);
      setShowForwardForm(false);
      setForwardNotes('');
      setLastSessionData(null);
    } catch (error) {
      console.error('Failed to forward conversation:', error);
    }
  };

  // Handle quick reply click
  const handleQuickReply = (message: string) => {
    handleSend(message);
  };

  // Handle action button click
  const handleAction = (action: SuggestedAction) => {
    switch (action.type) {
      case 'link':
        if (action.target?.startsWith('/')) {
          onNavigate?.(action.target);
          onClose();
        } else if (action.target?.startsWith('mailto:')) {
          window.open(action.target);
        }
        break;

      case 'action':
        if (action.target === 'create_ticket') {
          setShowTicketForm(true);
        } else if (action.target === 'forward_conversation') {
          handleForwardConversation();
        } else if (action.target === 'retry_publish') {
          onNavigate?.('/website-builder');
          onClose();
        } else if (action.target === 'show_dns' || action.target === 'verify_domain') {
          onNavigate?.('/deploy');
          onClose();
        } else if (action.target === 'buy_credits') {
          onNavigate?.('/settings');
          onClose();
        }
        break;

      case 'escalate':
        setShowTicketForm(true);
        break;
    }
  };

  // Handle ticket submission
  const handleSubmitTicket = () => {
    if (!ticketDescription.trim()) return;

    const ticket = createSupportTicket(
      currentIntent || 'general_question',
      ticketDescription,
      context,
      messages
    );

    // In production, this would send to backend
    console.log('Support ticket created:', ticket);

    // Store in localStorage for demo
    const existingTickets = JSON.parse(localStorage.getItem('support_tickets') || '[]');
    existingTickets.push(ticket);
    localStorage.setItem('support_tickets', JSON.stringify(existingTickets));

    setTicketSubmitted(true);
    setShowTicketForm(false);

    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `Your support ticket has been created (ID: ${ticket.id.slice(-8)}). Our team will respond within 24 hours via email. Is there anything else I can help you with?`,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, confirmMessage]);
    setTicketDescription('');
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    setCurrentIntent(null);
    setTicketSubmitted(false);
    setVoiceTranscripts([]);
    setDetectedIntents([]);
    setLastSessionData(null);

    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: getContextualGreeting(context),
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D4AF37] to-[#C4A030] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {chatMode === 'voice' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-white font-bold">
                {chatMode === 'voice' ? 'Voice Support' : 'Support Chat'}
              </h2>
              <p className="text-white/80 text-xs">
                {chatMode === 'voice'
                  ? voiceStatus === 'active' ? 'Listening...' : voiceStatus
                  : 'AI-powered assistance'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context Banner */}
        {context.currentPage && (
          <div className="bg-[#F9F6F0] px-4 py-2 text-xs text-gray-600 border-b border-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Context: {context.currentPage}</span>
            {context.currentWebsiteName && (
              <span className="text-gray-400">| {context.currentWebsiteName}</span>
            )}
          </div>
        )}

        {/* Voice Chat UI */}
        {chatMode === 'voice' && (
          <div className="flex-1 flex flex-col">
            {/* Voice Status Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Animated Voice Circle */}
              <div className={`relative w-32 h-32 mb-6 ${voiceStatus === 'active' && !isMuted ? 'animate-pulse' : ''}`}>
                <div className={`absolute inset-0 rounded-full ${
                  voiceStatus === 'active' && !isMuted
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8963A] animate-ping opacity-30'
                    : 'bg-gray-200'
                }`} />
                <div className={`absolute inset-2 rounded-full flex items-center justify-center ${
                  voiceStatus === 'active' && !isMuted
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8963A]'
                    : isMuted
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </div>
              </div>

              {/* Status Text */}
              <p className="text-lg font-medium text-gray-700 mb-2">
                {voiceStatus === 'connecting' && 'Connecting...'}
                {voiceStatus === 'active' && !isMuted && 'Speak now...'}
                {voiceStatus === 'active' && isMuted && 'Muted'}
                {voiceStatus === 'paused' && 'Paused'}
                {voiceStatus === 'error' && 'Connection Error'}
              </p>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                {voiceStatus === 'active' && !isMuted && "I'm listening. Ask me anything about RenovateMySite or describe your issue."}
                {voiceStatus === 'active' && isMuted && "Click the mute button to resume speaking."}
                {voiceStatus === 'connecting' && "Setting up voice connection..."}
              </p>

              {/* Error Message */}
              {voiceError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 max-w-xs text-center">
                  {voiceError}
                </div>
              )}

              {/* Detected Intents */}
              {detectedIntents.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {detectedIntents.map((intent, i) => (
                    <span key={i} className="px-2 py-1 bg-[#D4AF37]/10 text-[#B8963A] text-xs rounded-full">
                      {intent.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Live Transcript */}
            {voiceTranscripts.length > 0 && (
              <div className="border-t border-gray-100 max-h-48 overflow-y-auto p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Live Transcript</p>
                <div className="space-y-2">
                  {voiceTranscripts.slice(-5).map((t) => (
                    <div key={t.id} className={`text-sm ${t.role === 'user' ? 'text-right' : ''}`}>
                      <span className={`inline-block px-3 py-1.5 rounded-lg ${
                        t.role === 'user'
                          ? 'bg-[#D4AF37] text-white'
                          : 'bg-white text-gray-700'
                      }`}>
                        {t.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Controls */}
            <div className="border-t border-gray-100 p-4 bg-white flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>

              <button
                onClick={endVoiceChat}
                className="px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Call
              </button>

              <button
                onClick={() => setChatMode('text')}
                className="p-4 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                title="Switch to text"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Text Chat UI */}
        {chatMode === 'text' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#D4AF37] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    {/* Message content */}
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>

                    {/* Action buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleAction(action)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                              action.type === 'escalate'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick replies (show only at start) */}
              {messages.length === 1 && !isLoading && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 text-center">Quick options:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_REPLIES.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply.message)}
                        className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-[#F9F6F0] hover:border-[#D4AF37] transition-colors"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-4 bg-white">
              {/* Voice unavailable notice */}
              {!voiceAvailable && voiceError && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{voiceError}</span>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Voice Button */}
                <div className="relative group">
                  <button
                    onClick={startVoiceChat}
                    disabled={!voiceAvailable}
                    className={`p-3 rounded-2xl transition-colors ${
                      voiceAvailable
                        ? 'bg-[#F9F6F0] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={voiceAvailable ? 'Start voice chat' : (voiceError || 'Voice chat unavailable')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-colors"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-[#D4AF37] text-white rounded-2xl hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                {voiceAvailable ? 'Press Enter to send, or click the mic for voice' : 'Press Enter to send'}
              </p>
            </div>
          </>
        )}

        {/* Ticket Form Modal */}
        {showTicketForm && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="bg-[#D4AF37] px-4 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Create Support Ticket</h3>
              <button
                onClick={() => setShowTicketForm(false)}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                  {currentIntent?.replace('_', ' ') || 'General Question'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your issue
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please provide details about your issue..."
                  className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>Our conversation history will be attached to this ticket.</p>
                <p>We'll respond within 24 hours via email{context.userEmail ? ` at ${context.userEmail}` : ''}.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSubmitTicket}
                disabled={!ticketDescription.trim()}
                className="w-full py-3 bg-[#D4AF37] text-white rounded-lg font-medium hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        )}

        {/* Forward Conversation Form Modal */}
        {showForwardForm && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="bg-[#D4AF37] px-4 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Forward to Support Team</h3>
              <button
                onClick={() => setShowForwardForm(false)}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  Your voice conversation transcript and audio recording will be forwarded to our support team.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="Any additional context or details..."
                  className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Conversation includes:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Full transcript ({voiceTranscripts.length || (lastSessionData?.transcripts.length || 0)} messages)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Audio recording
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Page context & detected intents
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={submitForward}
                className="w-full py-3 bg-[#D4AF37] text-white rounded-lg font-medium hover:bg-[#C4A030] transition-colors"
              >
                Forward Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SupportChat;
