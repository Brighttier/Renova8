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
    <PageContainer title="Email Configuration" subtitle="Configure how AI sends emails on your behalf.">
        <div className="space-y-6 max-w-2xl">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                 <div className="text-blue-500 text-xl">ℹ️</div>
                 <div className="text-sm text-blue-800">
                     Emails are currently sent via your default mail client (mailto: links). 
                     <br/>Connect your Gmail or Outlook to send directly from the app in the future.
                 </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sender Name</label>
                <input type="text" defaultValue="Jane from Digital Studio" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
                <p className="text-xs text-gray-400 mt-1">This name will appear in the generated email templates.</p>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reply-To Address</label>
                <input type="email" defaultValue="jane@mompreneur.com" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Signature</label>
                <textarea 
                    className="w-full h-32 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                    defaultValue={`Best,\nJane Doe\nFounder, Jane's Digital Agency\nwww.janesdigital.com`}
                />
            </div>
             <div className="pt-4 flex justify-end">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                    Save Configuration
                </button>
            </div>
        </div>
    </PageContainer>
);

export const HelpSupport = () => (
    <PageContainer title="Help & Support" subtitle="We are here to help you succeed.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h3 className="font-bold text-gray-800 text-xl">Frequently Asked Questions</h3>
                {[
                    { q: "How do I get more credits?", a: "You can purchase credit packs or upgrade your subscription in the Plans & Billing section." },
                    { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from the Billing page. You will keep access until the end of your billing period." },
                    { q: "How accurate is the lead finder?", a: "We use Google Maps real-time data to find businesses. Contact details are extracted where available publicly." },
                    { q: "Is the website code production ready?", a: "The code is a high-quality starting point using Tailwind CSS. You can host it anywhere (Netlify, Vercel, etc.)." }
                ].map((faq, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-purple-700 text-sm mb-1">{faq.q}</h4>
                        <p className="text-gray-600 text-sm">{faq.a}</p>
                    </div>
                ))}
            </div>

            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 h-fit">
                <h3 className="font-bold text-gray-800 text-xl mb-4">Contact Support</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none bg-white">
                            <option>Technical Issue</option>
                            <option>Billing Question</option>
                            <option>Feature Request</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                        <textarea className="w-full h-32 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-white" placeholder="Describe your issue..." />
                    </div>
                    <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md">
                        Send Message
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">We typically reply within 24 hours.</p>
                </div>
            </div>
        </div>
    </PageContainer>
);
