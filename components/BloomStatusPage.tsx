import React, { useState } from 'react';

interface Props {
    onBack?: () => void;
}

export const BloomStatusPage: React.FC<Props> = ({ onBack }) => {
    const [integrations, setIntegrations] = useState({
        facebook: true,
        instagram: false
    });

    return (
        <div className="min-h-screen bg-cover bg-center font-sans relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")', fontFamily: "'Montserrat', sans-serif" }}>
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                
                {/* Header Navigation */}
                <nav className="bg-white/80 backdrop-blur-md border-b border-[#F9F6F0] shadow-sm px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        {onBack && (
                            <button 
                                onClick={onBack}
                                className="group flex items-center gap-2 text-[#4A4A4A]/60 hover:text-[#D4AF37] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full border border-[#4A4A4A]/20 group-hover:border-[#D4AF37] flex items-center justify-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </div>
                                <span className="text-sm font-semibold uppercase tracking-widest hidden sm:block">Back</span>
                            </button>
                        )}
                        <div className="text-2xl text-[#4A4A4A] tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                            Renova8.
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[#4A4A4A] text-sm font-semibold tracking-wide">Sarah | Concierge</p>
                        </div>
                        <div className="w-10 h-10 rounded-full p-0.5 border-2 border-[#D4AF37]">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-full h-full rounded-full bg-[#F9F6F0]" />
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="flex-1 flex flex-col items-center justify-start pt-12 pb-20 px-4">
                    <div className="text-center mb-10 animate-fadeIn">
                        <h1 className="text-3xl md:text-5xl text-[#4A4A4A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Making Magic in Willow Creek, Sarah
                        </h1>
                        <p className="text-[#4A4A4A]/80 text-lg font-light tracking-wide max-w-2xl mx-auto">
                            We are revitalizing the online presence of "Main Street Bakery." Sit tight, it's looking beautiful.
                        </p>
                    </div>

                    {/* Main Content Card */}
                    <div className="w-full max-w-4xl bg-[#F9F6F0] rounded-[2rem] shadow-2xl p-8 md:p-12 border border-white animate-fadeInUp">
                        
                        {/* Progress Stepper */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative mb-16 gap-6 md:gap-0">
                            
                            {/* Line Connector Background (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-12 right-12 h-[2px] bg-gray-200 -z-0"></div>

                            {/* Step 1: Completed */}
                            <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-0 flex-1">
                                <div className="w-12 h-12 rounded-full bg-[#2E7D32] flex items-center justify-center shadow-lg text-white mb-0 md:mb-4 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div className="text-left md:text-center">
                                    <h3 className="text-[#2E7D32] font-bold text-sm uppercase tracking-wider">Scouting & Discovery</h3>
                                    <p className="text-gray-500 text-xs mt-1">Complete. Found 3 candidates.</p>
                                </div>
                                {/* Mobile Connector Line */}
                                <div className="md:hidden absolute left-6 top-12 bottom-[-24px] w-[2px] bg-[#2E7D32]"></div>
                            </div>

                            {/* Connector 1 (Desktop) - Colored */}
                            <div className="hidden md:block absolute top-6 left-12 w-[calc(50%-24px)] h-[2px] bg-[#2E7D32] -z-0"></div>

                            {/* Step 2: Active */}
                            <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-0 flex-1">
                                <div className="w-12 h-12 rounded-full bg-white border-[3px] border-[#D4AF37] flex items-center justify-center shadow-lg mb-0 md:mb-4 relative shrink-0">
                                    <div className="absolute inset-0 rounded-full border border-[#D4AF37] animate-ping opacity-20"></div>
                                    <span className="text-xl">🎨</span>
                                </div>
                                <div className="text-left md:text-center">
                                    <h3 className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Modernizing & Crafting</h3>
                                    <p className="text-gray-500 text-xs mt-1">Currently designing homepage...</p>
                                </div>
                                {/* Mobile Connector Line */}
                                <div className="md:hidden absolute left-6 top-12 bottom-[-24px] w-[2px] bg-gray-200"></div>
                            </div>

                             {/* Step 3: Pending */}
                             <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-0 flex-1">
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center mb-0 md:mb-4 shrink-0">
                                    <span className="text-xl grayscale opacity-50">💌</span>
                                </div>
                                <div className="text-left md:text-center">
                                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider">Final Polish & Preview</h3>
                                    <p className="text-gray-400 text-xs mt-1">Waiting for craft</p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Actions */}
                        <div className="mb-12">
                            <h3 className="text-2xl text-[#4A4A4A] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Customizing the Build
                            </h3>
                            <div className="bg-white rounded-2xl p-1 border border-white shadow-sm">
                                {/* Toggle 1 */}
                                <div className="flex items-center justify-between p-6 border-b border-[#F9F6F0]">
                                    <div>
                                        <h4 className="font-bold text-[#4A4A4A] mb-1">Integrate Facebook Feed?</h4>
                                        <p className="text-xs text-gray-500">Automatically pull latest posts to the footer.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIntegrations({...integrations, facebook: !integrations.facebook})}
                                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${integrations.facebook ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${integrations.facebook ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                                {/* Toggle 2 */}
                                <div className="flex items-center justify-between p-6">
                                    <div>
                                        <h4 className="font-bold text-[#4A4A4A] mb-1">Integrate Instagram Gallery?</h4>
                                        <p className="text-xs text-gray-500">Create a grid of recent photos.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIntegrations({...integrations, instagram: !integrations.instagram})}
                                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${integrations.instagram ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${integrations.instagram ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Section: Up Next */}
                        <div>
                             <h3 className="text-xl text-[#4A4A4A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Up Next
                            </h3>
                            <div className="bg-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 opacity-75 cursor-not-allowed">
                                <div className="flex-1 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm flex items-center">
                                    <span className="mr-2 text-gray-300">🔒</span>
                                    https://renova8.preview/main-st-bakery
                                </div>
                                <div className="text-sm text-gray-500 italic">
                                    We will email this directly to sarah@example.com when ready!
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="mt-8 text-[#4A4A4A]/50 text-xs font-medium tracking-widest uppercase">
                        Powered by Renova8 Concierge
                    </div>
                </div>
            </div>
        </div>
    );
};