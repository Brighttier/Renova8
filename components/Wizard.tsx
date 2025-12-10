import React, { useState, useRef, useEffect } from 'react';
import { Lead, HistoryItem, AspectRatio, ImageSize, DesignSpecification, VerificationResult } from '../types';
import {
    findLeadsWithMaps,
    generateBrandAnalysis,
    generateWebsiteConceptImage,
    generateCampaignStrategy,
    generateWebsiteStructure,
    generatePitchEmail,
    promptForKeySelection
} from '../services/geminiService';
import { extractDesignSpecFromImage, createDefaultDesignSpec } from '../services/designExtractionService';
import { verifyWebsiteAgainstSpec } from '../services/verificationService';
import { ApiKeyModal } from './ApiKeyModal';
import { DesignSpecReview } from './DesignSpecReview';
import { DesignVerificationModal } from './DesignVerificationModal';
import WizardLoader from './WizardLoader';

interface Props {
    onUseCredit: (amount: number) => void;
    onSaveLead: (lead: Lead) => void;
    onUpdateLead: (lead: Lead) => void;
    existingLead?: Lead | null;
}

// All steps including Marketing Plan (kept for reference, used in Marketing Studio)
const ALL_STEPS = [
    { title: "Step 1: Find", icon: "🔍", desc: "Locate Customer" },
    { title: "Step 2: Analyze", icon: "🧠", desc: "Brand DNA" },
    { title: "Step 3: Visualize", icon: "🎨", desc: "Web Concept" },
    { title: "Step 4: Strategize", icon: "📈", desc: "Marketing Plan" },
    { title: "Step 5: Build", icon: "💻", desc: "Create Website" },
    { title: "Step 6: Pitch", icon: "💌", desc: "Send Email" }
];

// Steps shown in Concierge Wizard (excluding Marketing Plan - available in Marketing Studio)
const STEPS = [
    { title: "Step 1: Find", icon: "🔍", desc: "Locate Customer" },
    { title: "Step 2: Analyze", icon: "🧠", desc: "Brand DNA" },
    { title: "Step 3: Visualize", icon: "🎨", desc: "Web Concept" },
    { title: "Step 4: Build", icon: "💻", desc: "Create Website" },
    { title: "Step 5: Pitch", icon: "💌", desc: "Send Email" }
];

export const Wizard: React.FC<Props> = ({ onUseCredit, onSaveLead, onUpdateLead, existingLead }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeLead, setActiveLead] = useState<Lead | null>(existingLead || null);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Step 1 State: Search
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const [searchResults, setSearchResults] = useState<Lead[]>([]);

    // Step 4 State: Strategy
    const [strategyGoal, setStrategyGoal] = useState('Increase local awareness and sales');

    // Step 5 State: Builder
    const [generatedCode, setGeneratedCode] = useState('');

    // Design Consistency State
    const [extractedDesignSpec, setExtractedDesignSpec] = useState<DesignSpecification | null>(null);
    const [showDesignSpecReview, setShowDesignSpecReview] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isExtractingSpecs, setIsExtractingSpecs] = useState(false);

    // Update active lead if prop changes (sync from external updates)
    useEffect(() => {
        if (existingLead && existingLead.id === activeLead?.id) {
            setActiveLead(existingLead);
        }
    }, [existingLead]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
            scrollToTop();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
            scrollToTop();
        }
    };

    // --- ACTIONS ---

    // Step 1: Find
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            onUseCredit(5);
            const response = await findLeadsWithMaps(searchQuery, location);
            const mapped = response.leads.map((l: any, idx: number) => ({
                id: `lead-${Date.now()}-${idx}`,
                businessName: l.businessName,
                location: l.location,
                details: l.details,
                phone: l.phone,
                email: l.email,
                status: 'new' as const,
                sourceUrl: response.grounding?.[idx]?.maps?.uri
            }));
            setSearchResults(mapped);
        } catch (e) {
            alert("Search failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const selectLead = (lead: Lead) => {
        onSaveLead(lead);
        setActiveLead(lead);
        nextStep();
    };

    // Step 2: Analyze
    const handleAnalyze = async () => {
        if (!activeLead) return;
        setLoading(true);
        try {
            onUseCredit(2);
            const branding = await generateBrandAnalysis(activeLead.businessName, activeLead.details);
            const updated = { ...activeLead, brandGuidelines: branding };
            setActiveLead(updated);
            onUpdateLead(updated);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Visualize (Concept)
    const handleVisualize = async (skipKeyCheck = false) => {
        if (!activeLead) return;
        setLoading(true);
        try {
            onUseCredit(5);
            const brandColors = activeLead.brandGuidelines?.colors?.join(', ') || '';
            const prompt = `Modern website homepage for ${activeLead.businessName} (${activeLead.details}). Colors: ${brandColors}. Professional, inviting UI/UX.`;

            const img = await generateWebsiteConceptImage(prompt, AspectRatio.LANDSCAPE, ImageSize.S_1K, skipKeyCheck);

            const historyItem: HistoryItem = {
                id: `wiz-${Date.now()}`, type: 'WEBSITE_CONCEPT', timestamp: Date.now(), content: img,
                metadata: { prompt }
            };

            const updated = {
                ...activeLead,
                websiteConceptImage: img,
                history: [...(activeLead.history || []), historyItem]
            };
            setActiveLead(updated);
            onUpdateLead(updated);

            // Auto-extract design specifications from the concept image
            setIsExtractingSpecs(true);
            try {
                const designSpec = await extractDesignSpecFromImage(
                    img,
                    activeLead.businessName,
                    activeLead.brandGuidelines
                );
                setExtractedDesignSpec(designSpec);

                // Update lead with design spec
                const updatedWithSpec = {
                    ...updated,
                    brandGuidelines: {
                        ...updated.brandGuidelines,
                        designSpec
                    }
                };
                setActiveLead(updatedWithSpec);
                onUpdateLead(updatedWithSpec);

                // Show design spec review modal
                setShowDesignSpecReview(true);
            } catch (specError) {
                console.error('Failed to extract design specs:', specError);
                // Fallback to default design spec based on brand guidelines
                if (activeLead.brandGuidelines) {
                    const defaultSpec = createDefaultDesignSpec(activeLead.brandGuidelines);
                    setExtractedDesignSpec(defaultSpec);
                }
            } finally {
                setIsExtractingSpecs(false);
            }
        } catch (e: any) {
            if (e.message.includes("API_KEY_REQUIRED")) {
                setPendingAction(() => () => handleVisualize(true));
                setShowKeyModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle design spec confirmation
    const handleDesignSpecConfirm = (updatedSpec: DesignSpecification) => {
        setExtractedDesignSpec(updatedSpec);
        setShowDesignSpecReview(false);

        // Update lead with confirmed design spec
        if (activeLead) {
            const updated = {
                ...activeLead,
                brandGuidelines: {
                    ...activeLead.brandGuidelines,
                    designSpec: updatedSpec
                }
            };
            setActiveLead(updated);
            onUpdateLead(updated);
        }
    };

    // Step 4: Strategize
    const handleStrategize = async () => {
        if (!activeLead) return;
        setLoading(true);
        try {
            onUseCredit(5);
            const strategy = await generateCampaignStrategy(
                activeLead.businessName, 
                strategyGoal, 
                ['Instagram', 'Facebook', 'Google Maps'], 
                activeLead.brandGuidelines
            );
            
            const historyItem: HistoryItem = {
                id: `wiz-strat-${Date.now()}`, type: 'STRATEGY', timestamp: Date.now(), content: strategy,
                metadata: { description: strategyGoal }
            };

            const updated = { 
                ...activeLead, 
                history: [...(activeLead.history || []), historyItem]
            };
            setActiveLead(updated);
            onUpdateLead(updated);
        } finally {
            setLoading(false);
        }
    };

    // Step 5: Build (with strict design consistency)
    const handleBuild = async () => {
        if (!activeLead) return;
        setLoading(true);
        try {
            onUseCredit(10);
            const brandColors = activeLead.brandGuidelines?.colors?.join(', ') || '';
            const prompt = `A single page website for ${activeLead.businessName}. ${activeLead.details}.
            Style: ${activeLead.brandGuidelines?.tone || 'Professional'}.
            Primary Colors: ${brandColors}.
            Include Hero, Services, Reviews, Contact.`;

            // Use design spec if available for strict consistency
            const designSpec = activeLead.brandGuidelines?.designSpec || extractedDesignSpec;
            const code = await generateWebsiteStructure(prompt, designSpec || undefined);
            setGeneratedCode(code);

            // Verify the generated website against design specs
            if (designSpec && activeLead.websiteConceptImage) {
                try {
                    const verification = await verifyWebsiteAgainstSpec(
                        code,
                        designSpec,
                        activeLead.websiteConceptImage
                    );
                    setVerificationResult(verification);

                    // Show verification modal if there are issues
                    if (verification.overallMatchScore < 85 || verification.discrepancies.length > 0) {
                        setShowVerificationModal(true);
                    }
                } catch (verifyError) {
                    console.error('Verification failed:', verifyError);
                }
            }

            // Create blob url for preview/deploy
            const blob = new Blob([code], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const historyItem: HistoryItem = {
                id: `wiz-build-${Date.now()}`, type: 'WEBSITE_DEPLOY', timestamp: Date.now(), content: url,
                metadata: { prompt }
            };

            const updated = {
                ...activeLead,
                websiteUrl: url,
                history: [...(activeLead.history || []), historyItem]
            };
            setActiveLead(updated);
            onUpdateLead(updated);
        } finally {
            setLoading(false);
        }
    };

    // Handle verification approval
    const handleVerificationApprove = () => {
        setShowVerificationModal(false);
        // Website is already saved, just close the modal
    };

    // Handle regeneration request from verification
    const handleRegenerate = async () => {
        setShowVerificationModal(false);
        await handleBuild();
    };

    // Handle asset upload from verification modal
    const handleAssetUpload = (type: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            if (extractedDesignSpec) {
                const updatedSpec = { ...extractedDesignSpec };
                if (type === 'logo') {
                    updatedSpec.assets.logo = {
                        id: `logo-${Date.now()}`,
                        type: 'logo',
                        source: 'user',
                        url,
                        placement: 'header',
                        required: true
                    };
                } else if (type === 'hero-image') {
                    updatedSpec.assets.heroImage = {
                        id: `hero-${Date.now()}`,
                        type: 'image',
                        source: 'user',
                        url,
                        placement: 'hero section',
                        required: false
                    };
                }
                setExtractedDesignSpec(updatedSpec);

                // Update lead with new asset
                if (activeLead) {
                    const updated = {
                        ...activeLead,
                        brandGuidelines: {
                            ...activeLead.brandGuidelines,
                            designSpec: updatedSpec
                        }
                    };
                    setActiveLead(updated);
                    onUpdateLead(updated);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    // Step 6: Pitch (Generate Email)
    const handleDraftEmail = async () => {
        if (!activeLead) return;
        setLoading(true);
        try {
            onUseCredit(2);
            // Log for debugging
            console.log("Generating email for:", activeLead.businessName, "URL:", activeLead.websiteUrl);

            const email = await generatePitchEmail(
                activeLead.businessName, 
                activeLead.websiteUrl, 
                activeLead.brandGuidelines?.tone || 'Friendly',
                !!activeLead.websiteConceptImage
            );

            if (!email || !email.subject) {
                throw new Error("Failed to generate valid email content");
            }

            const updated = { ...activeLead, emailDraft: email };
            setActiveLead(updated);
            onUpdateLead(updated);
        } catch (e) {
            console.error("Email generation failed:", e);
            alert("Could not generate email draft. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyConfirm = async () => {
        setShowKeyModal(false);
        await promptForKeySelection();
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    }

    // Start Page - shown before wizard begins
    if (!hasStarted) {
        return (
            <div className="max-w-5xl mx-auto pb-20">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[#4A4A4A] font-serif mb-2">Business Builder Wizard</h1>
                    <p className="text-[#4A4A4A]/60 tracking-wide text-lg">Concierge service from zero to pitched customer.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-[#EFEBE4] p-12">
                    <div className="text-center">
                        <div className="text-7xl mb-6">🚀</div>
                        <h2 className="text-3xl font-bold font-serif text-[#4A4A4A] mb-4">Ready to Build Your Business?</h2>
                        <p className="text-[#4A4A4A]/70 text-lg max-w-xl mx-auto mb-10">
                            Follow our 6-step wizard to find customers, analyze their brand, create stunning visuals, and pitch your services.
                        </p>

                        {/* Start Button */}
                        <button
                            onClick={() => setHasStarted(true)}
                            className="bg-[#D4AF37] text-white px-12 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#C5A572] transition-all transform hover:scale-105 hover:-translate-y-1"
                        >
                            Start Wizard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}

            {/* Design Spec Review Modal */}
            {showDesignSpecReview && extractedDesignSpec && (
                <DesignSpecReview
                    designSpec={extractedDesignSpec}
                    conceptImage={activeLead?.websiteConceptImage}
                    onConfirm={handleDesignSpecConfirm}
                    onCancel={() => setShowDesignSpecReview(false)}
                />
            )}

            {/* Design Verification Modal */}
            {showVerificationModal && verificationResult && extractedDesignSpec && activeLead?.websiteConceptImage && (
                <DesignVerificationModal
                    conceptImage={activeLead.websiteConceptImage}
                    generatedHtml={generatedCode}
                    verificationResult={verificationResult}
                    designSpec={extractedDesignSpec}
                    onApprove={handleVerificationApprove}
                    onRegenerate={handleRegenerate}
                    onUploadAsset={handleAssetUpload}
                    onClose={() => setShowVerificationModal(false)}
                />
            )}

            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-[#4A4A4A] font-serif mb-2">Business Builder Wizard</h1>
                <p className="text-[#4A4A4A]/60 tracking-wide text-lg">Concierge service from zero to pitched customer.</p>
            </div>

            {/* Stepper - matching reference design */}
            <div className="mb-12 overflow-x-auto pb-4">
                <div className="flex items-center justify-center min-w-[700px] px-8 relative">
                    {STEPS.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;

                        return (
                            <React.Fragment key={idx}>
                                <div className="flex flex-col items-center relative z-10">
                                    {/* Circle with number or checkmark */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                                        ${isCompleted ? 'bg-[#2E7D32] text-white' : ''}
                                        ${isActive ? 'bg-[#D4AF37] text-white ring-4 ring-[#D4AF37]/30' : ''}
                                        ${!isActive && !isCompleted ? 'bg-white border-2 border-gray-200 text-gray-400' : ''}
                                    `}>
                                        {isCompleted ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span>{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* Step label */}
                                    <div className={`text-center mt-2 transition-colors duration-300`}>
                                        <div className={`text-sm font-medium ${isActive ? 'text-[#D4AF37] font-bold' : isCompleted ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
                                            {step.desc}
                                        </div>
                                    </div>
                                </div>

                                {/* Connecting line between steps */}
                                {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-[2px] mx-2 mt-[-20px] transition-colors duration-300 ${idx < currentStep ? 'bg-[#2E7D32]' : 'bg-gray-200'}`}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-[#EFEBE4] min-h-[600px] flex flex-col relative overflow-hidden">
                {/* Active Lead Banner */}
                {activeLead && currentStep > 0 && (
                    <div className="bg-[#F9F6F0]/50 border-b border-[#EFEBE4] p-4 flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-serif font-bold text-xl shadow-md border-2 border-white">
                                {activeLead.businessName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#4A4A4A] text-lg font-serif">{activeLead.businessName}</h3>
                                <p className="text-xs text-[#4A4A4A]/60 uppercase tracking-wide">{activeLead.location}</p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                             <span className="text-xs font-bold uppercase text-[#D4AF37] tracking-widest block mb-1">Current Phase</span>
                             <div className="text-sm font-bold text-[#4A4A4A] bg-white px-3 py-1 rounded-full shadow-sm border border-[#EFEBE4] inline-block">{STEPS[currentStep].desc}</div>
                        </div>
                    </div>
                )}

                <div className="p-8 md:p-12 flex-1 flex flex-col">
                    
                    {/* STEP 1: FIND */}
                    {currentStep === 0 && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn w-full">
                            <h2 className="text-3xl font-bold text-center font-serif text-[#4A4A4A]">Who are we helping today?</h2>
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div>
                                    <label className="font-bold text-[#4A4A4A] text-xs uppercase tracking-widest mb-2 block">Business Type</label>
                                    <input 
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-1 focus:ring-[#D4AF37] outline-none bg-[#F9F6F0] transition-all focus:bg-white" 
                                        placeholder="e.g. Italian Restaurant, Yoga Studio, Plumber"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-[#4A4A4A] text-xs uppercase tracking-widest mb-2 block">Location</label>
                                    <input 
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-1 focus:ring-[#D4AF37] outline-none bg-[#F9F6F0] transition-all focus:bg-white" 
                                        placeholder="e.g. Chicago, IL"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                </div>
                                <button disabled={loading} className="w-full bg-[#4A4A4A] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#333] transition-all border border-transparent hover:border-[#D4AF37] relative overflow-hidden group">
                                    <span className="relative z-10">{loading ? 'Scanning Map...' : 'Find Potential Customers'}</span>
                                    <div className="absolute inset-0 bg-[#D4AF37] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                                </button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="space-y-4 mt-8">
                                    <p className="font-bold text-[#D4AF37] text-xs uppercase tracking-widest text-center">Select a Business to Start</p>
                                    {searchResults.map(lead => (
                                        <button 
                                            key={lead.id} 
                                            onClick={() => selectLead(lead)}
                                            className="w-full text-left p-5 rounded-2xl border border-gray-100 hover:border-[#D4AF37] hover:bg-[#F9F6F0] transition-all flex justify-between items-center group bg-white shadow-sm"
                                        >
                                            <div>
                                                <div className="font-bold text-xl text-[#4A4A4A] font-serif">{lead.businessName}</div>
                                                <div className="text-gray-500 text-sm">{lead.location}</div>
                                            </div>
                                            <span className="bg-[#D4AF37] text-white px-5 py-2 rounded-full font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all text-sm transform translate-x-4 group-hover:translate-x-0">Select →</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ANALYZE */}
                    {currentStep === 1 && activeLead && (
                        <div className="max-w-3xl mx-auto animate-fadeIn text-center w-full">
                            <h2 className="text-3xl font-bold mb-8 font-serif text-[#4A4A4A]">Let's analyze their brand DNA</h2>
                            
                            {!activeLead.brandGuidelines ? (
                                <div className="py-12 bg-[#F9F6F0] rounded-3xl border border-dashed border-[#D4AF37]/30">
                                    <div className="text-7xl mb-6">🧬</div>
                                    <p className="text-[#4A4A4A]/70 mb-8 max-w-md mx-auto text-lg">We'll scan their details to determine the best color palette, tone of voice, and marketing angles.</p>
                                    <button onClick={handleAnalyze} disabled={loading} className="bg-[#4A4A4A] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#333] transition-all">
                                        {loading ? 'Analyzing...' : 'Generate Brand Analysis (2 Cr)'}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#F9F6F0] rounded-[2rem] p-10 border border-[#EFEBE4] text-left shadow-inner">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div>
                                            <h3 className="font-bold text-[#D4AF37] mb-4 uppercase text-xs tracking-widest">Recommended Colors</h3>
                                            <div className="flex gap-4">
                                                {activeLead.brandGuidelines.colors.map(c => (
                                                    <div key={c} className="w-14 h-14 rounded-full shadow-lg border-4 border-white transform hover:scale-110 transition-transform cursor-pointer" style={{backgroundColor: c}} title={c}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#D4AF37] mb-4 uppercase text-xs tracking-widest">Brand Tone</h3>
                                            <div className="text-2xl font-bold text-[#4A4A4A] font-serif border-l-4 border-[#D4AF37] pl-4">{activeLead.brandGuidelines.tone}</div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <h3 className="font-bold text-[#D4AF37] mb-4 uppercase text-xs tracking-widest">Strategic Insight</h3>
                                            <p className="text-[#4A4A4A] leading-relaxed font-serif italic text-lg bg-white p-6 rounded-xl shadow-sm border border-[#EFEBE4]">"{activeLead.brandGuidelines.suggestions}"</p>
                                        </div>
                                    </div>
                                    <div className="mt-10 text-right">
                                        <button onClick={nextStep} className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#256628] transition-all transform hover:-translate-y-1">
                                            Looks Good, Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: VISUALIZE */}
                    {currentStep === 2 && activeLead && (
                         <div className="max-w-4xl mx-auto animate-fadeIn text-center w-full">
                            <h2 className="text-3xl font-bold mb-8 font-serif text-[#4A4A4A]">Dream up a Concept</h2>
                            
                            {!activeLead.websiteConceptImage ? (
                                <div className="py-12 bg-[#F9F6F0] rounded-3xl border border-dashed border-[#D4AF37]/30">
                                    <div className="text-7xl mb-6">🎨</div>
                                    <p className="text-[#4A4A4A]/70 mb-8 max-w-md mx-auto text-lg">Create a stunning, high-fidelity website mockup using Nano Banana Pro AI.</p>
                                    <button onClick={() => handleVisualize(false)} disabled={loading} className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:opacity-90 transition-all transform hover:scale-105">
                                        {loading ? 'Painting...' : 'Generate Visual Concept (5 Cr)'}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white mb-8 bg-gray-100">
                                        <img src={activeLead.websiteConceptImage} alt="Concept" className="w-full h-auto" />
                                    </div>
                                    <div className="flex justify-center gap-6">
                                        <button onClick={() => handleVisualize(false)} className="px-8 py-3 text-[#4A4A4A] font-bold hover:bg-[#F9F6F0] rounded-xl transition-colors border border-transparent hover:border-[#EFEBE4]">
                                            ↻ Regenerate
                                        </button>
                                        <button onClick={nextStep} className="bg-[#2E7D32] text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-[#256628] transition-all transform hover:-translate-y-1">
                                            Love it, Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: BUILD (was Step 5, Strategy moved to Marketing Studio) */}
                    {currentStep === 3 && activeLead && (
                         <div className="max-w-6xl mx-auto animate-fadeIn h-full flex flex-col w-full">
                             <div className="flex justify-between items-center mb-6 shrink-0">
                                <h2 className="text-3xl font-bold font-serif text-[#4A4A4A]">Build the Website</h2>
                                {activeLead.websiteUrl && (
                                     <button onClick={nextStep} className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#256628] transition-all transform hover:-translate-y-1">
                                        Ready to Pitch →
                                    </button>
                                )}
                             </div>

                             {!generatedCode ? (
                                 loading ? (
                                     <div className="flex-1 flex items-center justify-center bg-white rounded-[2rem] border border-[#EFEBE4] shadow-xl">
                                         <WizardLoader
                                             title="Building your website..."
                                             subtitle="The AI wizard is crafting something magical"
                                         />
                                     </div>
                                 ) : (
                                     <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-[#F9F6F0] rounded-[2rem] border-2 border-dashed border-[#D4AF37]/30">
                                         <div className="text-7xl mb-6">💻</div>
                                         <p className="text-[#4A4A4A]/70 mb-8 max-w-md text-lg">We will generate a full HTML/Tailwind website based on the analysis and concept we created.</p>
                                         <button onClick={handleBuild} disabled={loading} className="bg-[#4A4A4A] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#333] transition-all">
                                            Build Website Now (10 Cr)
                                        </button>
                                     </div>
                                 )
                             ) : (
                                 <div className="flex-1 border-[6px] border-[#4A4A4A] rounded-[1.5rem] overflow-hidden relative min-h-[500px] shadow-2xl flex flex-col bg-white">
                                     <div className="bg-[#4A4A4A] text-white text-xs px-4 py-3 flex items-center justify-between shrink-0">
                                         <div className="flex gap-2">
                                             <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                                             <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                                             <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                                         </div>
                                         <span className="opacity-50 font-mono tracking-widest text-[10px] uppercase">Live Preview</span>
                                         <button 
                                            onClick={() => activeLead.websiteUrl && window.open(activeLead.websiteUrl, '_blank')}
                                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold hover:bg-white/10 px-2 py-1 rounded"
                                            title="Open in new tab"
                                        >
                                            ↗️ Full Screen
                                        </button>
                                     </div>
                                     <iframe src={activeLead.websiteUrl} className="w-full h-full bg-white flex-1" title="Preview" />
                                 </div>
                             )}
                         </div>
                    )}

                    {/* STEP 5: PITCH (was Step 6) */}
                    {currentStep === 4 && activeLead && (
                         <div className="max-w-2xl mx-auto animate-fadeIn w-full">
                             <h2 className="text-3xl font-bold mb-8 text-center font-serif text-[#4A4A4A]">Send the Pitch</h2>
                             
                             {!activeLead.emailDraft ? (
                                 <div className="text-center py-12 bg-[#F9F6F0] rounded-[2rem] border border-[#EFEBE4]">
                                     <p className="text-[#4A4A4A]/70 mb-8 text-lg px-8">Combine the visual concept, the live link, and the analysis into a perfect cold email.</p>
                                     <button onClick={handleDraftEmail} disabled={loading} className="bg-[#4A4A4A] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#333] transition-all">
                                        {loading ? 'Drafting...' : 'Write Email (2 Cr)'}
                                    </button>
                                 </div>
                             ) : (
                                 <div className="bg-white border border-[#EFEBE4] rounded-[2rem] p-8 shadow-xl">
                                     <div className="mb-6 border-b border-gray-100 pb-4">
                                         <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 block">Subject</label>
                                         <div className="font-bold text-[#4A4A4A] text-xl font-serif">{activeLead.emailDraft.subject}</div>
                                     </div>
                                     <div className="mb-8">
                                         <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 block">Body</label>
                                         <div className="text-gray-600 whitespace-pre-wrap mt-2 leading-relaxed text-lg">{activeLead.emailDraft.body}</div>
                                     </div>
                                     
                                     <div className="bg-[#F9F6F0] p-4 rounded-xl border border-[#EFEBE4] mb-8 text-sm text-[#4A4A4A] flex flex-col gap-2">
                                         {activeLead.websiteConceptImage && <div className="flex items-center gap-2"><span>📎</span> <strong>Attached:</strong> Website Concept Image</div>}
                                         {activeLead.websiteUrl && <div className="flex items-center gap-2"><span>🔗</span> <strong>Link:</strong> Live Website Demo</div>}
                                     </div>

                                     <div className="flex gap-4">
                                         <a 
                                            href={`mailto:${activeLead.email}?subject=${encodeURIComponent(activeLead.emailDraft.subject)}&body=${encodeURIComponent(activeLead.emailDraft.body)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 bg-[#D4AF37] text-white py-4 rounded-xl font-bold text-center shadow-lg hover:bg-[#C5A572] transition-all transform hover:-translate-y-1 text-lg"
                                         >
                                             Open in Mail App 🚀
                                         </a>
                                         <button 
                                            onClick={() => {
                                                const updated = { ...activeLead, status: 'contacted' as const };
                                                onUpdateLead(updated);
                                                setActiveLead(updated);
                                                alert("Marked as Contacted! Great work!");
                                            }}
                                            className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] py-4 rounded-xl font-bold hover:bg-[#F9F6F0] transition-all text-lg"
                                         >
                                             Mark Contacted
                                         </button>
                                     </div>
                                 </div>
                             )}
                         </div>
                    )}

                </div>

                {/* Footer Nav */}
                <div className="bg-[#F9F6F0] p-6 border-t border-[#EFEBE4] flex justify-between items-center shrink-0">
                    <button 
                        onClick={prevStep} 
                        disabled={currentStep === 0}
                        className="text-gray-400 font-bold hover:text-[#4A4A4A] px-4 py-2 disabled:opacity-30 transition-colors uppercase text-sm tracking-widest"
                    >
                        ← Back
                    </button>
                    <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>
                </div>
            </div>
        </div>
    );
};