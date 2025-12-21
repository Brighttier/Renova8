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
import { WebsiteEditor } from './components/WebsiteEditor';
import { SitesManager } from './components/SitesManager';
import { AIWebsiteEditor } from './components/AIWebsiteEditor';
import { UserProfile, GeneralSettings, UserPassword, PaymentSetup, EmailConfig, HelpSupport } from './components/UserPages';
import { KnowledgeBase } from './components/KnowledgeBase';
import { SupportTickets } from './components/SupportTickets';
import { StatusPage } from './components/StatusPage';
import { StatusBadge } from './components/StatusBadge';
import { LandingPage } from './components/LandingPage';
import { GuidedWalkthrough } from './components/GuidedWalkthrough';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useCredits } from './hooks/useCredits';
import { AuthPage } from './components/AuthPage';
import WizardLoaderPreview from './components/WizardLoaderPreview';
import { SupportChat } from './components/SupportChat';
import { SupportContext } from './services/supportChatService';
import ServiceCatalog from './components/ServiceCatalog';
import ErrorBoundary from './components/ErrorBoundary';
import * as Sentry from '@sentry/react';

// Test button component for Sentry error tracking verification
function SentryTestButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 z-50"
    >
      Test Sentry Error
    </button>
  );
}

// Admin Panel Imports
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';
import { AdminLoginPage, AdminDashboard } from './components/admin';

// PREVIEW MODE - Set to true to see WizardLoader preview
const PREVIEW_WIZARD_LOADER = false;

// Sidebar Icons (Styled for Bloom/Renova8)
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MagicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const WebsiteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const CatalogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;

// Inner component that uses auth and credits hooks
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [leads, setLeads] = useState<Lead[]>([]); // Search results
  // Load saved customers from localStorage on mount
  const [myCustomers, setMyCustomers] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('renova8_customers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);

  // Support chat state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportContext, setSupportContext] = useState<any>(null);
  const [supportInitialMessage, setSupportInitialMessage] = useState<string | undefined>(undefined);

  // Walkthrough state - check localStorage for completion status
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(() => {
    return localStorage.getItem('renova8_walkthrough_complete') === 'true';
  });

  // Set Sentry user context when user changes
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

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

  // Auto-save customers to localStorage with debounce
  useEffect(() => {
    // Skip saving on initial load (empty array)
    if (myCustomers.length === 0 && !localStorage.getItem('renova8_customers')) {
      return;
    }

    setSaveStatus('saving');
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('renova8_customers', JSON.stringify(myCustomers));
        setSaveStatus('saved');
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (e) {
        console.error('Failed to save customers to localStorage:', e);
        setSaveStatus(null);
      }
    }, 500); // Debounce: wait 500ms before saving

    return () => clearTimeout(timeoutId);
  }, [myCustomers]);

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
        onBack={() => setCurrentView(AppView.SITES_MANAGER)}
      />
    );
  }


  // AI Website Editor is a full-screen view (Lovable/Bolt style)
  if (currentView === AppView.AI_WEBSITE_EDITOR) {
    return (
      <AIWebsiteEditor
        customers={myCustomers}
        selectedCustomer={selectedLead}
        onUpdateCustomer={updateCustomer}
        onBack={() => setCurrentView(AppView.SITES_MANAGER)}
        onUseCredit={deductCredit}
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
                    RMS
                </div>
                {!isSidebarCollapsed && <span className="font-serif font-bold text-lg text-[#4A4A4A] hidden lg:block tracking-tight">RenovateMySite</span>}
             </div>
          </div>

          <nav className="px-4 space-y-1">
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
            <NavButton
              active={currentView === AppView.SERVICE_CATALOG}
              onClick={() => setCurrentView(AppView.SERVICE_CATALOG)}
              icon={<CatalogIcon />}
              label="Service Catalog"
              collapsed={isSidebarCollapsed}
            />
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
                active={currentView === AppView.SITES_MANAGER || currentView === AppView.WEBSITE_EDITOR || currentView === AppView.AI_WEBSITE_EDITOR}
                onClick={() => setCurrentView(AppView.SITES_MANAGER)}
                icon={<EditIcon />}
                label="Website Studio"
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

            <button
                onClick={() => setIsSupportOpen(true)}
                className={`group bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-xl p-4 ${isSidebarCollapsed ? 'flex flex-col items-center justify-center' : 'text-center'} border border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300 cursor-pointer w-full`}
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
            </button>
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
            {currentView === AppView.SERVICE_CATALOG && (
              <ServiceCatalog
                onOpenSupportChat={(context, initialMessage) => {
                  // Set support context
                  setSupportContext(context);

                  // Set initial message if provided
                  if (initialMessage) {
                    setSupportInitialMessage(initialMessage);
                  }

                  // Open support chat
                  setIsSupportOpen(true);
                }}
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
            {currentView === AppView.SITES_MANAGER && (
                <SitesManager
                    customers={myCustomers}
                    onEditSite={(customer) => {
                        setSelectedLead(customer);
                        setCurrentView(AppView.WEBSITE_EDITOR);
                    }}
                    onPreviewSite={(customer) => {
                        if (customer.websiteUrl) {
                            window.open(customer.websiteUrl, '_blank');
                        }
                    }}
                    onDeleteSite={(customer) => {
                        if (confirm(`Are you sure you want to delete the website for ${customer.businessName}?`)) {
                            updateCustomer({
                                ...customer,
                                websiteUrl: undefined,
                                websiteConceptImage: undefined
                            });
                        }
                    }}
                    onBack={() => setCurrentView(AppView.MY_CUSTOMERS)}
                    onGoToWizard={() => setCurrentView(AppView.WIZARD)}
                    onAIEditor={(customer) => {
                        setSelectedLead(customer);
                        setCurrentView(AppView.AI_WEBSITE_EDITOR);
                    }}
                />
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
            {currentView === AppView.HELP_SUPPORT && (
              <HelpSupport
                onNavigateToKnowledgeBase={() => setCurrentView(AppView.KNOWLEDGE_BASE)}
                onNavigateToTickets={() => setCurrentView(AppView.SUPPORT_TICKETS)}
                onNavigateToStatus={() => setCurrentView(AppView.STATUS_PAGE)}
              />
            )}

            {/* Help & Support Views */}
            {currentView === AppView.KNOWLEDGE_BASE && (
              <KnowledgeBase
                onContactSupport={() => setIsSupportOpen(true)}
              />
            )}
            {currentView === AppView.SUPPORT_TICKETS && (
              <SupportTickets
                onBack={() => setCurrentView(AppView.HELP_SUPPORT)}
              />
            )}
            {currentView === AppView.STATUS_PAGE && (
              <StatusPage
                onBack={() => setCurrentView(AppView.HELP_SUPPORT)}
              />
            )}
            </div>
        </main>
      </div>

      {/* Support Chat */}
      <SupportChat
        isOpen={isSupportOpen}
        onClose={() => {
          setIsSupportOpen(false);
          setSupportInitialMessage(undefined); // Clear initial message
        }}
        context={supportContext || {
          userId: user?.uid,
          userEmail: user?.email || undefined,
          userPlan: user ? 'pro' : 'free',
          currentPage: getPageName(currentView),
          systemStatus: { publishingAvailable: true }
        }}
        initialMessage={supportInitialMessage}
        onNavigate={(path) => {
          const pathMap: Record<string, AppView> = {
            '/settings': AppView.SETTINGS,
            '/settings/billing': AppView.SETTINGS,
            '/website-builder': AppView.WEBSITE_BUILDER,
            '/deploy': AppView.WEBSITE_BUILDER,
            '/help/publishing': AppView.HELP_SUPPORT,
          };
          const view = pathMap[path];
          if (view) {
            setCurrentView(view);
          }
        }}
      />
    </div>
  );

  // Helper to get page name from view
  function getPageName(view: AppView): string {
    const pageNames: Record<AppView, string> = {
      [AppView.LANDING]: 'Landing Page',
      [AppView.WIZARD]: 'Wizard',
      [AppView.DASHBOARD]: 'Dashboard',
      [AppView.LEAD_FINDER]: 'Scout Customers',
      [AppView.MY_CUSTOMERS]: 'My Customers',
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
      [AppView.SERVICE_CATALOG]: 'Service Catalog',
      [AppView.KNOWLEDGE_BASE]: 'Knowledge Base',
      [AppView.SUPPORT_TICKETS]: 'Support Tickets',
      [AppView.STATUS_PAGE]: 'System Status',
    };
    return pageNames[view] || 'Unknown';
  }
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

// Admin Panel Component
function AdminPanel() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [showLogin, setShowLogin] = useState(true);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-white/70">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard; otherwise show login
  if (isAuthenticated) {
    return (
      <AdminDashboard onLogout={() => setShowLogin(true)} />
    );
  }

  return (
    <AdminLoginPage onLoginSuccess={() => setShowLogin(false)} />
  );
}

// Route handler to determine if we're on admin route
function useIsAdminRoute(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current URL is /admin
    const checkRoute = () => {
      const path = window.location.pathname;
      setIsAdmin(path === '/admin' || path.startsWith('/admin/'));
    };

    checkRoute();

    // Listen for route changes
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  return isAdmin;
}

// Main App component wrapped with AuthProvider and ErrorBoundary
export default function App() {
  // Preview mode for WizardLoader component
  if (PREVIEW_WIZARD_LOADER) {
    return <WizardLoaderPreview />;
  }

  const isAdminRoute = useIsAdminRoute();

  // Render Admin Panel if on /admin route
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <AdminAuthProvider>
          <AdminPanel />
        </AdminAuthProvider>
      </ErrorBoundary>
    );
  }

  // Render main app
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        {/* Temporary test button - remove after verifying Sentry works */}
        <SentryTestButton />
      </AuthProvider>
    </ErrorBoundary>
  );
}