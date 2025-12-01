import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../types';

interface Props {
    onNavigate: (view: AppView) => void;
}

export const Header: React.FC<Props> = ({ onNavigate }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            <div className="flex items-center gap-2 md:gap-6">
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
                            <p className="text-sm font-bold text-[#4A4A4A]">Jane Doe</p>
                            <p className="text-xs text-[#D4AF37] font-medium tracking-wide">Pro Concierge</p>
                        </div>
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#D4AF37] p-0.5">
                            <div className="h-full w-full rounded-full bg-[#F9F6F0] flex items-center justify-center overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" alt="User" />
                            </div>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''} hidden md:block`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {/* Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EFEBE4] py-2 z-50 animate-fadeIn origin-top-right">
                            <div className="px-4 py-3 border-b border-[#F9F6F0] bg-[#F9F6F0]/50 rounded-t-2xl md:hidden">
                                <p className="text-sm font-bold text-[#4A4A4A]">Jane Doe</p>
                                <p className="text-xs text-[#D4AF37]">Pro Concierge</p>
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
                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2 font-medium">
                                    <span>🚪</span> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};