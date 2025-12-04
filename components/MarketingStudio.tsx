import React from 'react';
import { Lead } from '../types';

interface Props {
  selectedLead: Lead | null;
  onUseCredit: (amount: number) => void;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

export const MarketingStudio: React.FC<Props> = ({ leads }) => {
  // Features to be implemented
  const upcomingFeatures = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'AI Campaign Strategy',
      description: 'Generate comprehensive marketing strategies tailored to your business goals and target audience.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Social Media Content',
      description: 'Create stunning visuals and engaging copy for Instagram, Facebook, LinkedIn, and more.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Video Generation',
      description: 'Transform your ideas into professional marketing videos with AI-powered video creation.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Content Calendar',
      description: 'Plan and schedule your marketing content across all platforms in one unified calendar.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: 'Performance Analytics',
      description: 'Track campaign performance and get AI-powered insights to optimize your marketing efforts.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Audience Targeting',
      description: 'Define and reach your ideal customers with precision targeting powered by AI analysis.'
    }
  ];

  return (
    <div className="min-h-full p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#4A4A4A] mb-3">Marketing Studio</h1>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#D4AF37]/10 rounded-full mb-4 border border-[#D4AF37]/30">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
          </span>
          <span className="text-2xl font-bold text-[#D4AF37] animate-pulse">Coming Soon</span>
        </div>
        <p className="text-[#4A4A4A]/70 max-w-2xl mx-auto text-lg">
          Our powerful AI-driven marketing suite is under development. Get ready to create, manage, and optimize your marketing campaigns with cutting-edge tools.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {upcomingFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-[#EFEBE4] shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#D4AF37]/30 group"
            >
              <div className="w-12 h-12 bg-[#F9F6F0] rounded-xl flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#4A4A4A]/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Newsletter/Notification Signup */}
        <div className="bg-gradient-to-br from-[#4A4A4A] to-[#2A2A2A] rounded-2xl p-8 text-center text-white">
          <div className="max-w-xl mx-auto">
            <svg className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="text-2xl font-serif font-bold mb-3">Stay Updated</h2>
            <p className="text-white/70 mb-6">
              We're working hard to bring you the best marketing tools. You'll be notified when these features become available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                disabled
                className="px-6 py-3 bg-[#D4AF37] text-[#4A4A4A] rounded-xl font-medium opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notify Me When Available
              </button>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-[#EFEBE4]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#4A4A4A]">Development Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4A4A4A]/70">Overall Progress</span>
              <span className="text-sm font-medium text-[#D4AF37]">In Development</span>
            </div>
            <div className="w-full h-2 bg-[#F9F6F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8963A] rounded-full transition-all duration-500"
                style={{ width: '35%' }}
              />
            </div>
            <p className="text-xs text-[#4A4A4A]/50">
              Our team is actively working on bringing you powerful marketing tools. Check back soon for updates!
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {leads.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#EFEBE4] text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{leads.length}</div>
              <div className="text-xs text-[#4A4A4A]/60">Total Leads</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#EFEBE4] text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{leads.filter(l => l.status === 'converted').length}</div>
              <div className="text-xs text-[#4A4A4A]/60">Customers</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#EFEBE4] text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">0</div>
              <div className="text-xs text-[#4A4A4A]/60">Campaigns</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#EFEBE4] text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">--</div>
              <div className="text-xs text-[#4A4A4A]/60">Engagement</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
