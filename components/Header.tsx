import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import { SupportChat } from './SupportChat';
import { SupportContext } from '../services/supportChatService';

interface Props {
    onNavigate: (view: AppView) => void;
    credits: number;
    onRestartTour?: () => void;
    currentView?: AppView;
    currentWebsiteId?: string;
    currentWebsiteName?: string;
    lastPublishError?: string;
}

export const Header: React.FC<Props> = ({
    onNavigate,
    credits: legacyCredits,
    onRestartTour,
    currentView,
    currentWebsiteId,
    currentWebsiteName,
    lastPublishError
}) => {
    const { user, signOut } = useAuth();
    const { credits: firebaseCredits, loading: creditsLoading } = useCredits();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use Firebase credits if logged in, otherwise fall back to legacy
    const credits = user ? firebaseCredits : legacyCredits;

    // Build support context
    const supportContext: SupportContext = {
        userId: user?.uid,
        userEmail: user?.email || undefined,
        userPlan: user ? 'pro' : 'free',
        currentPage: currentView ? getPageName(currentView) : undefined,
        currentWebsiteId,
        currentWebsiteName,
        systemStatus: lastPublishError ? { publishingAvailable: true, lastPublishError } : { publishingAvailable: true }
    };

    // Helper to get page name from view
    function getPageName(view: AppView): string {
        const pageNames: Record<AppView, string> = {
            [AppView.LANDING]: 'Landing Page',
            [AppView.WIZARD]: 'Wizard',
            [AppView.DASHBOARD]: 'Dashboard',
            [AppView.LEAD_FINDER]: 'Scout Customers',
            [AppView.MY_CUSTOMERS]: 'My Customers',
            [AppView.INBOX]: 'Inbox',
            [AppView.MARKETING]: 'Marketing Studio',
            [AppView.CAMPAIGN_HISTORY]: 'Campaign History',
            [AppView.WEBSITE_BUILDER]: 'Website Builder',
            [AppView.WEBSITE_EDITOR]: 'Website Editor',
            [AppView.IMAGE_STUDIO]: 'Image Studio',
            [AppView.VIDEO_STUDIO]: 'Video Studio',
            [AppView.INVOICING]: 'Invoicing',
            [AppView.SETTINGS]: 'Settings',
            [AppView.HELP_SUPPORT]: 'Help & Support',
            [AppView.PROFILE]: 'Profile',
            [AppView.GENERAL_SETTINGS]: 'General Settings',
            [AppView.PASSWORD]: 'Password',
            [AppView.PAYMENT_SETUP]: 'Payment Setup',
            [AppView.EMAIL_CONFIG]: 'Email Configuration',
            [AppView.SITES_MANAGER]: 'Sites Manager',
            [AppView.AI_WEBSITE_EDITOR]: 'AI Website Editor',
        };
        return pageNames[view] || 'Unknown';
    }

    // Get user display info
    const displayName = user?.displayName || 'Guest User';
    const userEmail = user?.email || '';
    const avatarSeed = user?.email || 'guest';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleNav = (view: AppView) => {
        onNavigate(view);
        setIsProfileOpen(false);
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-[#EFEBE4] h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl mr-4 hidden md:block">
                <div className="relative group">
                     <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                     </span>
                     <input 
                        type="text"
                        placeholder="Search workspace..."
                        className="w-full bg-[#F9F6F0] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white transition-all placeholder-gray-400 text-[#4A4A4A]"
                     />
                </div>
            </div>
            {/* Mobile Search Icon */}
             <div className="md:hidden mr-auto">
                 <button className="p-2 text-gray-400">
                     <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                 </button>
             </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 md:gap-4">
                 {/* Credits Display */}
                 <div data-walkthrough="credits" className="flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-[#D4AF37]/20">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[#4A4A4A]/60 uppercase tracking-wider font-medium hidden md:block">Tokens</span>
                        <span className="text-sm md:text-base font-bold text-[#D4AF37]">
                            {creditsLoading ? '...' : credits.toLocaleString()}
                        </span>
                    </div>
                 </div>

                 {/* Support Button */}
                 <button
                    onClick={() => setIsSupportOpen(true)}
                    className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-[#F9F6F0]"
                    title="Get Support"
                 >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                 </button>

                 {/* Notification Bell */}
                 <button className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-[#F9F6F0]">
                    <span className="absolute top-2 right-2 h-2 w-2 bg-[#D4AF37] rounded-full border border-white"></span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                 </button>

                {/* User Profile */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 hover:bg-[#F9F6F0] p-1.5 md:p-2 rounded-xl transition-colors border border-transparent hover:border-[#EFEBE4]"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-[#4A4A4A]">{displayName}</p>
                            <p className="text-xs text-[#D4AF37] font-medium tracking-wide">{user ? 'Pro Concierge' : 'Guest'}</p>
                        </div>
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#D4AF37] p-0.5">
                            <div className="h-full w-full rounded-full bg-[#F9F6F0] flex items-center justify-center overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt="User" />
                            </div>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''} hidden md:block`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {/* Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EFEBE4] py-2 z-50 animate-fadeIn origin-top-right">
                            <div className="px-4 py-3 border-b border-[#F9F6F0] bg-[#F9F6F0]/50 rounded-t-2xl md:hidden">
                                <p className="text-sm font-bold text-[#4A4A4A]">{displayName}</p>
                                <p className="text-xs text-[#D4AF37]">{user ? 'Pro Concierge' : 'Guest'}</p>
                            </div>
                            <div className="px-4 py-2 border-b border-[#F9F6F0] bg-[#F9F6F0]/30 hidden md:block">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Account</p>
                            </div>
                            
                            <div className="p-1">
                                <button onClick={() => handleNav(AppView.PROFILE)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>👤</span> My Profile
                                </button>
                                <button onClick={() => handleNav(AppView.GENERAL_SETTINGS)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>⚙️</span> Settings
                                </button>
                                <button onClick={() => handleNav(AppView.PASSWORD)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>🔒</span> Password
                                </button>
                            </div>
                            
                            <div className="px-4 py-2 border-t border-[#F9F6F0] mt-1 bg-[#F9F6F0]/30">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business & Billing</p>
                            </div>
                            <div className="p-1">
                                <button onClick={() => handleNav(AppView.INVOICING)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>💰</span> My Earnings
                                </button>
                                <button onClick={() => handleNav(AppView.PAYMENT_SETUP)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>💳</span> Payment Setup
                                </button>
                                <button onClick={() => handleNav(AppView.EMAIL_CONFIG)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>📧</span> Email Configuration
                                </button>
                                <button onClick={() => handleNav(AppView.SETTINGS)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>💎</span> Plans & Billing
                                </button>
                            </div>

                            <div className="my-1 border-t border-[#F9F6F0]"></div>
                            <div className="p-1">
                                <button onClick={() => handleNav(AppView.HELP_SUPPORT)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F9F6F0] hover:text-[#4A4A4A] rounded-lg flex items-center gap-2">
                                    <span>❓</span> Help & Support
                                </button>
                                {onRestartTour && (
                                    <button
                                        onClick={() => {
                                            onRestartTour();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] rounded-lg flex items-center gap-2"
                                    >
                                        <span>🎯</span> Restart Tour
                                    </button>
                                )}
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2 font-medium"
                                >
                                    <span>🚪</span> {user ? 'Logout' : 'Sign In'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Support Chat */}
            <SupportChat
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                context={supportContext}
                onNavigate={(path) => {
                    // Convert path to AppView
                    const pathMap: Record<string, AppView> = {
                        '/settings': AppView.SETTINGS,
                        '/settings/billing': AppView.SETTINGS,
                        '/website-builder': AppView.WEBSITE_BUILDER,
                        '/deploy': AppView.WEBSITE_BUILDER,
                        '/help/publishing': AppView.HELP_SUPPORT,
                    };
                    const view = pathMap[path];
                    if (view) {
                        onNavigate(view);
                    }
                }}
            />
        </header>
    );
};