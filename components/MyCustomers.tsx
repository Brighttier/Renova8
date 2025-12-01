import React, { useState } from 'react';
import { Lead } from '../types';
import { generateBrandAnalysis, generatePitchEmail, generateWebsiteConceptImage, promptForKeySelection } from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';

interface Props {
  customers: Lead[];
  onUpdateCustomer: (lead: Lead) => void;
  onUseCredit: (amount: number) => void;
  onBuildWebsite: (lead: Lead) => void;
}

export const MyCustomers: React.FC<Props> = ({ customers, onUpdateCustomer, onUseCredit, onBuildWebsite }) => {
  const [selectedId, setSelectedId] = useState<string | null>(customers.length > 0 ? customers[0].id : null);
  const [loading, setLoading] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedId);

  // The Magic "One-Click" Setup
  const handleAutoPitchKit = async (skipKeyCheck = false) => {
      if (!selectedCustomer) return;
      setPitchLoading(true);
      
      try {
          // 1. Deduct Credits (Analysis + Concept + Email = ~10 credits)
          onUseCredit(10); 

          // 2. Generate Brand Analysis
          const branding = await generateBrandAnalysis(selectedCustomer.businessName, selectedCustomer.details);
          
          let conceptImage = selectedCustomer.websiteConceptImage;
          
          // 3. Generate Concept Image (if not already there)
          // Try/Catch for Key requirement on image gen
          try {
             if (!conceptImage) {
                conceptImage = await generateWebsiteConceptImage(
                    `Homepage for ${selectedCustomer.businessName} (${selectedCustomer.details}). Colors: ${branding.colors?.join(', ')}`,
                    undefined,
                    undefined,
                    skipKeyCheck
                );
             }
          } catch (err: any) {
              if (err.message.includes("API_KEY_REQUIRED")) {
                  setPendingAction(() => () => handleAutoPitchKit(true));
                  setShowKeyModal(true);
                  setPitchLoading(false);
                  return; // Stop here, modal will resume
              }
              console.warn("Image gen failed, proceeding with email only", err);
          }

          // 4. Generate Email (aware of the image)
          const email = await generatePitchEmail(
              selectedCustomer.businessName, 
              selectedCustomer.websiteUrl,
              branding.tone || 'Professional',
              !!conceptImage
          );

          // 5. Update All Data
          onUpdateCustomer({
              ...selectedCustomer,
              brandGuidelines: branding,
              websiteConceptImage: conceptImage,
              emailDraft: email,
              status: 'contacted'
          });

      } catch (e) {
          console.error("Auto Pitch Failed", e);
          alert("Something went wrong creating the pitch kit.");
      } finally {
          setPitchLoading(false);
      }
  };

  const handleRegenerateConcept = async (skipKeyCheck = false) => {
      if (!selectedCustomer) return;
      setConceptLoading(true);
      try {
          onUseCredit(5);
          const branding = selectedCustomer.brandGuidelines;
          const tone = branding?.tone || 'Professional';
          const colors = branding?.colors?.join(', ') || 'Standard';

          const newImage = await generateWebsiteConceptImage(
             `Modern homepage website design for ${selectedCustomer.businessName}. Style: ${tone}. Colors: ${colors}. High quality UI/UX mockup.`,
             undefined,
             undefined,
             skipKeyCheck
          );

          onUpdateCustomer({
              ...selectedCustomer,
              websiteConceptImage: newImage
          });
      } catch (err: any) {
          if (err.message.includes("API_KEY_REQUIRED")) {
              setPendingAction(() => () => handleRegenerateConcept(true));
              setShowKeyModal(true);
          } else {
              console.error(err);
              alert("Failed to regenerate image.");
          }
      } finally {
          setConceptLoading(false);
      }
  }

  const handleKeyConfirm = async () => {
      setShowKeyModal(false);
      await promptForKeySelection();
      if (pendingAction) {
          pendingAction();
          setPendingAction(null);
      }
  }

  const handleEmailEdit = (field: 'subject' | 'body', value: string) => {
      if (!selectedCustomer || !selectedCustomer.emailDraft) return;
      onUpdateCustomer({
          ...selectedCustomer,
          emailDraft: {
              ...selectedCustomer.emailDraft,
              [field]: value
          }
      });
  }

  const toggleConverted = () => {
      if (!selectedCustomer) return;
      onUpdateCustomer({
          ...selectedCustomer,
          status: selectedCustomer.status === 'converted' ? 'contacted' : 'converted'
      });
  }

  if (customers.length === 0) {
      return (
          <div className="text-center py-20">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">👥</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">No customers yet!</h2>
              <p className="text-gray-500 mt-2">Go to "Find Customers" to start building your list.</p>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
        {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}
        
        {/* List Sidebar */}
        <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-700">My List ({customers.length})</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {customers.map(customer => (
                    <div 
                        key={customer.id}
                        onClick={() => setSelectedId(customer.id)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedId === customer.id ? 'bg-purple-50 border-purple-200 border' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                        <h3 className="font-bold text-gray-800">{customer.businessName}</h3>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500 truncate max-w-[120px]">{customer.location}</span>
                            {customer.emailDraft && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Pitch Ready</span>}
                            {customer.status === 'converted' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Won 🏆</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Detail Panel */}
        <div className="w-2/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
            {selectedCustomer ? (
                <>
                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 relative overflow-hidden flex-shrink-0">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{selectedCustomer.businessName}</h1>
                                <p className="text-gray-500">{selectedCustomer.location}</p>
                                <div className="flex flex-col mt-2 gap-1">
                                    {selectedCustomer.phone && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="w-5 text-center mr-2">📞</span> {selectedCustomer.phone}
                                        </div>
                                    )}
                                    {selectedCustomer.email && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="w-5 text-center mr-2">✉️</span> {selectedCustomer.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedCustomer.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {selectedCustomer.status}
                                </span>
                                <button 
                                    onClick={toggleConverted}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition-colors ${selectedCustomer.status === 'converted' ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                >
                                    {selectedCustomer.status === 'converted' ? 'Undo' : 'Mark Won'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* AUTO PITCH ACTION */}
                {!selectedCustomer.brandGuidelines && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-xl font-bold mb-1">✨ Create Pitch Kit</h3>
                            <p className="text-purple-100 text-sm opacity-90">Auto-generate Brand Analysis, Website Concept & Pitch Email.</p>
                        </div>
                        <button 
                            onClick={() => handleAutoPitchKit(false)}
                            disabled={pitchLoading}
                            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-50 disabled:opacity-75 transition-all"
                        >
                            {pitchLoading ? 'Creating Magic...' : 'Generate All (10 Credits)'}
                        </button>
                    </div>
                )}

                {/* New Section: Business Intelligence (Analysis + Link) */}
                {(selectedCustomer.brandGuidelines || selectedCustomer.websiteUrl) && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-shrink-0">
                        <h3 className="font-bold text-gray-700 flex items-center">
                            <span className="bg-indigo-100 p-1.5 rounded mr-2">📊</span> Business Intelligence
                        </h3>
                        
                        {/* Live Website Link */}
                        {selectedCustomer.websiteUrl && (
                             <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-800 text-sm">Live Website Deployed</p>
                                        <a href={selectedCustomer.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline">{selectedCustomer.websiteUrl}</a>
                                    </div>
                                </div>
                                <a href={selectedCustomer.websiteUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-green-600 text-xs font-bold rounded-lg shadow-sm border border-green-100 hover:bg-green-50">Visit Site</a>
                             </div>
                        )}

                        {/* Analysis Text */}
                        {selectedCustomer.brandGuidelines?.suggestions && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">AI Strategic Insight</span>
                                <p className="text-gray-700 text-sm leading-relaxed">{selectedCustomer.brandGuidelines.suggestions}</p>
                            </div>
                        )}
                        
                        {/* Original Details fallback */}
                        {!selectedCustomer.brandGuidelines?.suggestions && (
                            <p className="text-gray-600 text-sm leading-relaxed">{selectedCustomer.details}</p>
                        )}
                    </div>
                )}

                {/* 2-Column Grid for DNA & Product */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                    {/* Brand Analysis */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[240px]">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                            <span className="bg-blue-100 p-1.5 rounded mr-2">🧬</span> Business DNA
                        </h3>
                        {selectedCustomer.brandGuidelines ? (
                            <div className="space-y-4 text-sm flex-1">
                                <div>
                                    <span className="text-gray-500 font-bold text-xs uppercase">Brand Tone</span>
                                    <p className="text-gray-800 font-medium mt-1">{selectedCustomer.brandGuidelines.tone || 'Professional'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-bold text-xs uppercase">Identity Colors</span>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {Array.isArray(selectedCustomer.brandGuidelines.colors) ? selectedCustomer.brandGuidelines.colors.map((c, i) => (
                                            <div key={i} className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c }}></div>
                                                <span className="text-[10px] text-gray-400 font-mono">{c}</span>
                                            </div>
                                        )) : <span className="text-gray-400 text-xs">No colors generated</span>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-2xl opacity-20 mb-2">🧬</span>
                                <p className="text-gray-400 text-sm">Run Pitch Kit to analyze.</p>
                            </div>
                        )}
                    </div>

                    {/* Website Action */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[240px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 flex items-center">
                                <span className="bg-purple-100 p-1.5 rounded mr-2">💻</span> The Product
                            </h3>
                            {selectedCustomer.websiteConceptImage && (
                                <button 
                                    onClick={() => handleRegenerateConcept(false)}
                                    disabled={conceptLoading}
                                    title="Regenerate Concept (5 Cr)"
                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${conceptLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {selectedCustomer.websiteConceptImage ? (
                            <div className="flex-1 flex flex-col">
                                <div className="relative group rounded-lg overflow-hidden mb-3 border border-gray-200 aspect-video shadow-sm">
                                    {conceptLoading && (
                                        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <img src={selectedCustomer.websiteConceptImage} alt="Concept" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <a 
                                            href={selectedCustomer.websiteConceptImage} 
                                            download={`concept-${selectedCustomer.businessName.replace(/\s+/g, '-').toLowerCase()}.png`} 
                                            className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => onBuildWebsite(selectedCustomer)} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-md transition-all">
                                        Open Builder
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-2xl opacity-20 mb-2">💻</span>
                                <p className="text-gray-400 text-sm mb-4">Run Pitch Kit to generate a concept.</p>
                                <button onClick={() => onBuildWebsite(selectedCustomer)} className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-bold hover:bg-purple-50 text-sm">
                                    Manual Build
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Card (Full Width) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center">
                            <span className="bg-pink-100 p-1.5 rounded mr-2">💌</span> The Pitch Email
                        </h3>
                    </div>

                    {selectedCustomer.emailDraft ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Subject Line</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                    value={selectedCustomer.emailDraft.subject || ''}
                                    onChange={(e) => handleEmailEdit('subject', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Body</label>
                                <textarea 
                                    className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-pink-200 resize-none leading-relaxed"
                                    value={selectedCustomer.emailDraft.body || ''}
                                    onChange={(e) => handleEmailEdit('body', e.target.value)}
                                />
                            </div>
                            {selectedCustomer.websiteConceptImage && (
                                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 font-medium">
                                    <span className="text-lg">📎</span>
                                    <span>Auto-attached: <strong>Website Concept Image</strong></span>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button className="px-4 py-2 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors" onClick={() => onUpdateCustomer({...selectedCustomer, emailDraft: undefined})}>Delete Draft</button>
                                <a 
                                    href={`mailto:?subject=${encodeURIComponent(selectedCustomer.emailDraft.subject)}&body=${encodeURIComponent(selectedCustomer.emailDraft.body)}`}
                                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all text-sm flex items-center gap-2"
                                >
                                    <span>🚀</span> Open in Mail App
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <span className="text-3xl block mb-2 opacity-30">✉️</span>
                            <p className="text-gray-400 text-sm">Run Pitch Kit to draft email automatically.</p>
                        </div>
                    )}
                </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Select a customer</div>
            )}
        </div>
    </div>
  );
};