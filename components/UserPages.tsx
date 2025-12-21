import React from 'react';

const PageContainer: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 font-serif mb-2">{title}</h1>
            <p className="text-gray-500">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {children}
        </div>
    </div>
);

export const UserProfile = () => (
    <PageContainer title="My Profile" subtitle="Manage your personal information and account details.">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-400 to-pink-400 mb-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" alt="Profile" className="w-full h-full rounded-full bg-white p-1" />
                </div>
                <button className="text-purple-600 font-bold text-sm hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors">
                    Change Photo
                </button>
            </div>
            <div className="w-full md:w-2/3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                        <input type="text" defaultValue="Jane" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                        <input type="text" defaultValue="Doe" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input type="email" defaultValue="jane@mompreneur.com" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
                    <input type="text" defaultValue="Jane's Digital Agency" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div className="pt-4 flex justify-end">
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    </PageContainer>
);

export const GeneralSettings = () => (
    <PageContainer title="General Settings" subtitle="Configure application preferences and defaults.">
        <div className="space-y-6 divide-y divide-gray-100">
            <div className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                    <h3 className="font-bold text-gray-800">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive weekly summaries and lead alerts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
            </div>
            <div className="flex items-center justify-between pt-6">
                <div>
                    <h3 className="font-bold text-gray-800">Desktop Notifications</h3>
                    <p className="text-sm text-gray-500">Get notified when AI tasks complete.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
            </div>
             <div className="flex items-center justify-between pt-6">
                <div>
                    <h3 className="font-bold text-gray-800">Dark Mode</h3>
                    <p className="text-sm text-gray-500">Switch between light and dark themes.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
            </div>
            <div className="pt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                <select className="w-full md:w-1/2 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                </select>
            </div>
        </div>
    </PageContainer>
);

export const UserPassword = () => (
    <PageContainer title="Password Security" subtitle="Update your password to keep your account safe.">
        <div className="max-w-md space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
            </div>
            <div className="pt-4">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md">
                    Update Password
                </button>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <button className="text-gray-500 text-sm hover:text-gray-700 font-medium">Forgot your password?</button>
            </div>
        </div>
    </PageContainer>
);

export const PaymentSetup = () => (
    <PageContainer title="Payment Setup" subtitle="Manage your payment methods for subscriptions and credit top-ups.">
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg max-w-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                </div>
                <div className="flex justify-between items-start mb-8">
                    <div className="text-xs font-mono opacity-70">CURRENT METHOD</div>
                    <div className="font-bold italic text-xl">VISA</div>
                </div>
                <div className="font-mono text-xl tracking-widest mb-4">**** **** **** 4242</div>
                <div className="flex justify-between text-sm opacity-80">
                    <div>JANE DOE</div>
                    <div>EXP 12/25</div>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-gray-800 mb-4">Add New Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                        <input type="text" placeholder="MM/YY" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">CVC</label>
                        <input type="text" placeholder="123" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cardholder Name</label>
                        <input type="text" placeholder="Jane Doe" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                    </div>
                </div>
                 <div className="pt-6">
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md">
                        Add Card
                    </button>
                </div>
            </div>
        </div>
    </PageContainer>
);

export const EmailConfig = () => (
    <PageContainer title="Email Configuration" subtitle="How pitch emails work in the app.">
        <div className="space-y-6 max-w-2xl">
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-6 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#4A4A4A] text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Using Your Default Email App
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            When you click "Send Pitch" for a lead, the app opens your default email client
                            (Gmail, Outlook, Apple Mail, etc.) with the AI-generated pitch already filled in.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EFEBE4]">
                <h4 className="font-bold text-[#4A4A4A] mb-4">How It Works</h4>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">1</div>
                        <div>
                            <p className="font-medium text-[#4A4A4A]">Generate AI Pitch</p>
                            <p className="text-sm text-gray-500">Click "Generate Pitch" on any lead to create a personalized email</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">2</div>
                        <div>
                            <p className="font-medium text-[#4A4A4A]">Click Send</p>
                            <p className="text-sm text-gray-500">Your default mail app opens with subject and body pre-filled</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">3</div>
                        <div>
                            <p className="font-medium text-[#4A4A4A]">Review & Send</p>
                            <p className="text-sm text-gray-500">Review the email, make any edits, and hit send from your email app</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                <div className="text-green-500 text-xl">✓</div>
                <div className="text-sm text-green-800">
                    <strong>Benefits:</strong> Emails come from your actual email address, appear in your Sent folder,
                    and replies come directly to you. No complex setup required!
                </div>
            </div>
        </div>
    </PageContainer>
);

interface HelpSupportProps {
    onNavigateToKnowledgeBase?: () => void;
    onNavigateToTickets?: () => void;
    onNavigateToStatus?: () => void;
}

export const HelpSupport: React.FC<HelpSupportProps> = ({
    onNavigateToKnowledgeBase,
    onNavigateToTickets,
    onNavigateToStatus,
}) => (
    <PageContainer title="Help & Support" subtitle="We are here to help you succeed.">
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
                onClick={onNavigateToKnowledgeBase}
                className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-6 rounded-2xl border border-[#D4AF37]/20 hover:shadow-md hover:border-[#D4AF37]/40 transition-all text-left group"
            >
                <div className="text-3xl mb-3">📚</div>
                <h3 className="font-bold text-[#4A4A4A] text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Knowledge Base
                </h3>
                <p className="text-sm text-gray-500">Search help articles and guides</p>
                <div className="mt-3 text-[#D4AF37] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Browse Articles
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>

            <button
                onClick={onNavigateToTickets}
                className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-2xl border border-blue-500/20 hover:shadow-md hover:border-blue-500/40 transition-all text-left group"
            >
                <div className="text-3xl mb-3">🎫</div>
                <h3 className="font-bold text-[#4A4A4A] text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Support Tickets
                </h3>
                <p className="text-sm text-gray-500">View and manage your requests</p>
                <div className="mt-3 text-blue-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    My Tickets
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>

            <button
                onClick={onNavigateToStatus}
                className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-2xl border border-green-500/20 hover:shadow-md hover:border-green-500/40 transition-all text-left group"
            >
                <div className="text-3xl mb-3">🟢</div>
                <h3 className="font-bold text-[#4A4A4A] text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    System Status
                </h3>
                <p className="text-sm text-gray-500">Check service health and uptime</p>
                <div className="mt-3 text-green-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Status
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h3 className="font-bold text-gray-800 text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Frequently Asked Questions
                </h3>
                {[
                    { q: "How do I get more credits?", a: "You can purchase credit packs or upgrade your subscription in the Plans & Billing section." },
                    { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from the Billing page. You will keep access until the end of your billing period." },
                    { q: "How accurate is the lead finder?", a: "We use Google Maps real-time data to find businesses. Contact details are extracted where available publicly." },
                    { q: "Is the website code production ready?", a: "The code is a high-quality starting point using Tailwind CSS. You can host it anywhere (Netlify, Vercel, etc.)." }
                ].map((faq, i) => (
                    <div key={i} className="bg-[#F9F6F0] rounded-xl p-4 border border-[#EFEBE4]">
                        <h4 className="font-bold text-[#D4AF37] text-sm mb-1">{faq.q}</h4>
                        <p className="text-gray-600 text-sm">{faq.a}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-6 rounded-2xl border border-[#D4AF37]/20 h-fit">
                <h3 className="font-bold text-gray-800 text-xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Contact Support
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <select className="w-full px-4 py-2 rounded-xl border border-[#EFEBE4] focus:ring-2 focus:ring-[#D4AF37] outline-none bg-white">
                            <option>Technical Issue</option>
                            <option>Billing Question</option>
                            <option>Feature Request</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                        <textarea className="w-full h-32 px-4 py-2 rounded-xl border border-[#EFEBE4] focus:ring-2 focus:ring-[#D4AF37] outline-none resize-none bg-white" placeholder="Describe your issue..." />
                    </div>
                    <button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white px-6 py-3 rounded-xl font-bold hover:shadow-md transition-all">
                        Send Message
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">We typically reply within 24 hours.</p>
                </div>
            </div>
        </div>
    </PageContainer>
);
