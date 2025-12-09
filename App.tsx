import React, { useState, useEffect } from 'react';
import { AppView, Lead } from './types';
import { LeadFinder } from './components/LeadFinder';
import { MarketingStudio } from './components/MarketingStudio';
import { WebsiteBuilder } from './components/WebsiteBuilder';
import { Invoicing } from './components/Invoicing';
import { VideoStudio } from './components/VideoStudio';
import { MyCustomers } from './components/MyCustomers';
import { ImageStudio } from './components/ImageStudio';
import { CampaignHistory } from './components/CampaignHistory';
import { Settings } from './components/Settings';
import { Header } from './components/Header';
import { Wizard } from './components/Wizard';
import { Inbox } from './components/Inbox';
import { WebsiteEditor } from './components/WebsiteEditor';
import { UserProfile, GeneralSettings, UserPassword, PaymentSetup, EmailConfig, HelpSupport } from './components/UserPages';
import { LandingPage } from './components/LandingPage';
import { GuidedWalkthrough } from './components/GuidedWalkthrough';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useCredits } from './hooks/useCredits';
import { AuthPage } from './components/AuthPage';

// Sidebar Icons (Styled for Bloom/Renova8)
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MagicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const WebsiteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const InboxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;

// Inner component that uses auth and credits hooks
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [leads, setLeads] = useState<Lead[]>([]); // Search results
  const [myCustomers, setMyCustomers] = useState<Lead[]>([]); // Saved customers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Walkthrough state - check localStorage for completion status
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(() => {
    return localStorage.getItem('renova8_walkthrough_complete') === 'true';
  });

  // Trigger walkthrough when user enters the app from landing page for the first time
  useEffect(() => {
    if (currentView !== AppView.LANDING && !hasSeenWalkthrough && !showWalkthrough) {
      // Small delay to let the main UI render first
      const timer = setTimeout(() => {
        setShowWalkthrough(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentView, hasSeenWalkthrough, showWalkthrough]);

  const completeWalkthrough = () => {
    localStorage.setItem('renova8_walkthrough_complete', 'true');
    setHasSeenWalkthrough(true);
    setShowWalkthrough(false);
  };

  const restartWalkthrough = () => {
    localStorage.removeItem('renova8_walkthrough_complete');
    // Also clear page-specific tours
    localStorage.removeItem('renova8_tour_scout');
    localStorage.removeItem('renova8_tour_editor');
    localStorage.removeItem('renova8_tour_archives');
    setHasSeenWalkthrough(false);
    setShowWalkthrough(true);
  };

  // Add leads from Search to "My Customers"
  const saveCustomer = (lead: Lead) => {
    if (!myCustomers.find(c => c.id === lead.id)) {
      setMyCustomers([...myCustomers, { ...lead, status: 'new', addedAt: Date.now(), history: [] }]);
    }
  };

  const updateCustomer = (updatedLead: Lead) => {
      setMyCustomers(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      if (selectedLead?.id === updatedLead.id) {
          setSelectedLead(updatedLead);
      }
  };

  const handleLeadAction = (lead: Lead) => {
      setSelectedLead(lead);
      saveCustomer(lead);
      setCurrentView(AppView.MY_CUSTOMERS);
  };

  // Credit operations - now using Firebase credits
  // Note: Actual deduction happens on the backend when using Gemini
  // This is for local UI feedback; real credits are managed by Cloud Functions
  const deductCredit = (amount: number) => {
    // Refresh credits from server after operations that use credits
    refreshCredits();
  };

  const addCredits = (amount: number) => {
    // Credits are added via Stripe checkout on the backend
    // This is kept for legacy compatibility but refreshes from server
    refreshCredits();
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#4A4A4A] text-[#F9F6F0] rounded-full flex items-center justify-center font-serif font-bold text-xl shadow-md mx-auto mb-4 animate-pulse">
            R8.
          </div>
          <p className="text-[#4A4A4A]/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing Page is a full-screen view
  if (currentView === AppView.LANDING) {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  // Website Editor is a full-screen view
  if (currentView === AppView.WEBSITE_EDITOR) {
    return (
      <WebsiteEditor
        customers={myCustomers}
        selectedCustomer={selectedLead}
        onUpdateCustomer={updateCustomer}
        onBack={() => setCurrentView(AppView.MY_CUSTOMERS)}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F9F6F0] font-sans text-[#4A4A4A]">
      {/* Guided Walkthrough Overlay */}
      {showWalkthrough && (
        <GuidedWalkthrough
          onComplete={completeWalkthrough}
          onNavigate={setCurrentView}
        />
      )}

      {/* Sidebar */}
      <aside
        data-walkthrough="sidebar"
        className={`${isSidebarCollapsed ? 'w-20' : 'w-20 lg:w-64'} bg-white border-r border-[#EFEBE4] flex-shrink-0 flex flex-col justify-between transition-all duration-300 relative z-30 shadow-sm`}
      >
        <div>
          <div className={`h-24 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-8'} transition-all mb-4`}>
             {/* Logo Area */}
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4A4A4A] text-[#F9F6F0] rounded-full flex items-center justify-center font-serif font-bold text-lg shadow-md">
                    R8.
                </div>
                {!isSidebarCollapsed && <span className="font-serif font-bold text-2xl text-[#4A4A4A] hidden lg:block tracking-tight">Renova8.</span>}
             </div>
          </div>

          <nav className="px-4 space-y-1">
            <NavButton
              active={currentView === AppView.INBOX}
              onClick={() => setCurrentView(AppView.INBOX)}
              icon={<InboxIcon />}
              label="Inbox"
              collapsed={isSidebarCollapsed}
            />
            <div data-walkthrough="wizard">
              <NavButton
                active={currentView === AppView.WIZARD}
                onClick={() => setCurrentView(AppView.WIZARD)}
                icon={<RocketIcon />}
                label="Concierge Wizard"
                collapsed={isSidebarCollapsed}
              />
            </div>
            <div className="my-3 border-t border-[#F9F6F0] mx-2"></div>
            <div data-walkthrough="scout">
              <NavButton
                active={currentView === AppView.LEAD_FINDER}
                onClick={() => setCurrentView(AppView.LEAD_FINDER)}
                icon={<SearchIcon />}
                label="Scout Customers"
                collapsed={isSidebarCollapsed}
              />
            </div>
            <div data-walkthrough="clients">
              <NavButton
                active={currentView === AppView.MY_CUSTOMERS}
                onClick={() => setCurrentView(AppView.MY_CUSTOMERS)}
                icon={<HeartIcon />}
                label="Client List"
                collapsed={isSidebarCollapsed}
              />
            </div>
            {/* Hidden for now - Website Atelier
            <NavButton
              active={currentView === AppView.WEBSITE_BUILDER}
              onClick={() => setCurrentView(AppView.WEBSITE_BUILDER)}
              icon={<WebsiteIcon />}
              label="Website Atelier"
              collapsed={isSidebarCollapsed}
            />
            */}
            <div data-walkthrough="editor">
              <NavButton
                active={currentView === AppView.WEBSITE_EDITOR}
                onClick={() => setCurrentView(AppView.WEBSITE_EDITOR)}
                icon={<EditIcon />}
                label="Website Editor"
                collapsed={isSidebarCollapsed}
              />
            </div>
            <div data-walkthrough="archives">
              <NavButton
                active={currentView === AppView.CAMPAIGN_HISTORY}
                onClick={() => setCurrentView(AppView.CAMPAIGN_HISTORY)}
                icon={<ArchiveIcon />}
                label="Archives"
                collapsed={isSidebarCollapsed}
              />
            </div>
            <div className="my-3 border-t border-[#F9F6F0] mx-2"></div>
            <NavButton
              active={currentView === AppView.MARKETING}
              onClick={() => setCurrentView(AppView.MARKETING)}
              icon={<MagicIcon />}
              label="Marketing Studio"
              collapsed={isSidebarCollapsed}
            />
            {/* Hidden for now - Visual Assets
             <NavButton
              active={currentView === AppView.IMAGE_STUDIO}
              onClick={() => setCurrentView(AppView.IMAGE_STUDIO)}
              icon={<ImageIcon />}
              label="Visual Assets"
              collapsed={isSidebarCollapsed}
            />
            */}
            {/* Hidden for now - Cinematic Video
            <NavButton
              active={currentView === AppView.VIDEO_STUDIO}
              onClick={() => setCurrentView(AppView.VIDEO_STUDIO)}
              icon={<VideoIcon />}
              label="Cinematic Video"
              collapsed={isSidebarCollapsed}
            />
            */}
          </nav>
        </div>

        <div className="p-4 border-t border-[#F9F6F0]">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`hidden lg:flex items-center w-full mb-6 text-[#4A4A4A]/50 hover:text-[#D4AF37] transition-all ${isSidebarCollapsed ? 'justify-center' : 'justify-start px-2'}`}
                title={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
                {isSidebarCollapsed ? <ChevronRightIcon /> : <div className="flex items-center"><ChevronLeftIcon /><span className="ml-2 text-xs font-medium uppercase tracking-widest">Collapse</span></div>}
            </button>

            <a
                href="mailto:support@renova8.com?subject=Professional%20Help%20Request"
                className={`group bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-xl p-4 ${isSidebarCollapsed ? 'flex flex-col items-center justify-center' : 'text-center'} border border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300 cursor-pointer block`}
                title="Professional Help Needed – Contact Us"
            >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} mb-2`}>
                    <svg className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} text-white group-hover:scale-110 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {!isSidebarCollapsed && <span className="text-white font-semibold text-sm hidden lg:inline">Contact Us</span>}
                </div>
                {!isSidebarCollapsed && (
                    <div className="text-[10px] text-white/80 uppercase tracking-wider font-medium hidden lg:block">
                        Professional Help Needed?
                    </div>
                )}
                {isSidebarCollapsed && (
                    <div className="text-[9px] text-white/80 uppercase tracking-wider font-bold">
                        Help
                    </div>
                )}
            </a>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header */}
        <Header onNavigate={setCurrentView} credits={credits} onRestartTour={restartWalkthrough} />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth bg-[#F9F6F0]">
            <div className="max-w-7xl mx-auto">
            {currentView === AppView.WIZARD && (
                <Wizard 
                    onUseCredit={deductCredit} 
                    onSaveLead={saveCustomer}
                    onUpdateLead={updateCustomer}
                    existingLead={selectedLead}
                />
            )}
            {currentView === AppView.LEAD_FINDER && (
                <LeadFinder 
                    onLeadsFound={(newLeads) => setLeads(newLeads)} 
                    onUseCredit={() => deductCredit(5)}
                    onAnalyze={handleLeadAction}
                    savedLeads={myCustomers}
                    onSaveLead={saveCustomer}
                />
            )}
            {currentView === AppView.MY_CUSTOMERS && (
                <MyCustomers
                    customers={myCustomers}
                    onUpdateCustomer={updateCustomer}
                    onUseCredit={deductCredit}
                    onBuildWebsite={(lead) => {
                        setSelectedLead(lead);
                        setCurrentView(AppView.WEBSITE_BUILDER);
                    }}
                    onEditWebsite={(lead) => {
                        setSelectedLead(lead);
                        setCurrentView(AppView.WEBSITE_EDITOR);
                    }}
                />
            )}
            {currentView === AppView.INBOX && (
                <Inbox
                    customers={myCustomers}
                    onUpdateCustomer={updateCustomer}
                />
            )}
            {currentView === AppView.MARKETING && (
                <MarketingStudio 
                    selectedLead={selectedLead} 
                    onUseCredit={() => deductCredit(2)}
                    leads={myCustomers}
                    onSelectLead={setSelectedLead}
                    onUpdateLead={updateCustomer}
                />
            )}
            {currentView === AppView.CAMPAIGN_HISTORY && (
                <CampaignHistory leads={myCustomers} />
            )}
            {currentView === AppView.IMAGE_STUDIO && (
                <ImageStudio 
                    selectedLead={selectedLead} 
                    onUseCredit={() => deductCredit(5)}
                    leads={myCustomers}
                    onSelectLead={setSelectedLead}
                    onUpdateLead={updateCustomer}
                />
            )}
            {currentView === AppView.WEBSITE_BUILDER && (
                <WebsiteBuilder 
                    onUseCredit={() => deductCredit(10)} 
                    selectedLead={selectedLead}
                    onUpdateLead={updateCustomer}
                />
            )}
            {currentView === AppView.VIDEO_STUDIO && (
                <VideoStudio 
                    onUseCredit={() => deductCredit(20)} 
                    selectedLead={selectedLead}
                    leads={myCustomers}
                    onSelectLead={setSelectedLead}
                    onUpdateLead={updateCustomer}
                />
            )}
            {currentView === AppView.INVOICING && (
                <Invoicing leads={myCustomers} />
            )}
            
            {/* User Account Views */}
            {currentView === AppView.SETTINGS && (
                <Settings credits={credits} onAddCredits={addCredits} />
            )}
            {currentView === AppView.PROFILE && <UserProfile />}
            {currentView === AppView.GENERAL_SETTINGS && <GeneralSettings />}
            {currentView === AppView.PASSWORD && <UserPassword />}
            {currentView === AppView.PAYMENT_SETUP && <PaymentSetup />}
            {currentView === AppView.EMAIL_CONFIG && <EmailConfig />}
            {currentView === AppView.HELP_SUPPORT && <HelpSupport />}
            </div>
        </main>
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, collapsed }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, collapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
      active
        ? 'bg-white shadow-sm border border-[#EFEBE4]'
        : 'hover:bg-[#F9F6F0] hover:text-[#4A4A4A]'
    } ${collapsed ? 'justify-center w-full' : 'w-full'}`}
    title={collapsed ? label : undefined}
  >
    <span className={`flex-shrink-0 transition-colors ${active ? 'text-[#D4AF37]' : 'text-[#4A4A4A]/40 group-hover:text-[#4A4A4A]'}`}>{icon}</span>
    {!collapsed && <span className={`ml-3 font-medium hidden lg:block whitespace-nowrap text-sm ${active ? 'text-[#4A4A4A] font-semibold' : 'text-[#4A4A4A]/70 group-hover:text-[#4A4A4A]'}`}>{label}</span>}
  </button>
);

// Main App component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}