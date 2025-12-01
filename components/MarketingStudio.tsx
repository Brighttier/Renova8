import React, { useState, useEffect } from 'react';
import { Lead, AspectRatio, HistoryItem } from '../types';
import { generateCampaignStrategy, generateSocialMediaImage, generateMarketingVideo, promptForKeySelection } from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';

interface Props {
  selectedLead: Lead | null;
  onUseCredit: (amount: number) => void;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

interface ContentItem {
    id: string;
    title: string;
    format: 'IMAGE' | 'VIDEO';
    platform: string;
    description: string;
    copy: string;
    generatedMediaUrl?: string;
    isLoading?: boolean;
}

interface Strategy {
    summary: string;
    items: ContentItem[];
}

export const MarketingStudio: React.FC<Props> = ({ selectedLead, onUseCredit, leads, onSelectLead, onUpdateLead }) => {
  const [goal, setGoal] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Instagram', 'Facebook']);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Filter leads
  const wonLeads = leads.filter(l => l.status === 'converted');
  const otherLeads = leads.filter(l => l.status !== 'converted');

  // Reset data when lead changes
  useEffect(() => {
      setStrategy(null);
      setGoal('');
  }, [selectedLead?.id]);

  const togglePlatform = (p: string) => {
      if (platforms.includes(p)) {
          setPlatforms(platforms.filter(plat => plat !== p));
      } else {
          setPlatforms([...platforms, p]);
      }
  }

  const handleGenerateStrategy = async () => {
      if (!selectedLead || !goal) return;
      setLoading(true);
      try {
          onUseCredit(5); // Strategy cost
          const result = await generateCampaignStrategy(selectedLead.businessName, goal, platforms, selectedLead.brandGuidelines);
          
          if (result && result.content_ideas) {
              const items: ContentItem[] = result.content_ideas.map((idea: any, idx: number) => ({
                  id: `idea-${Date.now()}-${idx}`,
                  title: idea.title,
                  format: (idea.format || 'IMAGE').toUpperCase() as 'IMAGE' | 'VIDEO',
                  platform: idea.platform,
                  description: idea.description,
                  copy: idea.copy
              }));
              
              setStrategy({
                  summary: result.strategy_summary,
                  items: items
              });

              // Save Strategy to History
              const historyItem: HistoryItem = {
                  id: `hist-${Date.now()}`,
                  type: 'STRATEGY',
                  timestamp: Date.now(),
                  content: result,
                  metadata: {
                      description: `Goal: ${goal}`,
                      platform: platforms.join(', ')
                  }
              };
              
              onUpdateLead({
                  ...selectedLead,
                  history: [...(selectedLead.history || []), historyItem]
              });
          }
      } catch (e) {
          console.error(e);
          alert("Could not generate strategy. Please try again.");
      } finally {
          setLoading(false);
      }
  }

  const handleCreateContent = async (itemId: string, skipKeyCheck = false) => {
      if (!strategy || !selectedLead) return;
      
      const itemIndex = strategy.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return;
      
      const item = strategy.items[itemIndex];
      
      // Update item loading state
      const updateItemState = (updates: Partial<ContentItem>) => {
          setStrategy(prev => {
              if (!prev) return null;
              const newItems = [...prev.items];
              newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
              return { ...prev, items: newItems };
          });
      };

      updateItemState({ isLoading: true });

      try {
          const brandContext = `Brand Colors: ${selectedLead.brandGuidelines?.colors?.join(', ') || 'Standard'}. Tone: ${selectedLead.brandGuidelines?.tone || 'Professional'}.`;
          
          let mediaUrl = '';
          
          if (item.format === 'VIDEO') {
              onUseCredit(20); // Video cost
              // Use Veo
              // Determine Aspect Ratio based on platform
              const isVertical = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Instagram Story'].some(p => item.platform.includes(p));
              const ratio = isVertical ? '9:16' : '16:9';
              
              mediaUrl = await generateMarketingVideo(
                  `${item.description}. ${brandContext}`, 
                  brandContext, 
                  ratio, 
                  skipKeyCheck
              );
          } else {
              onUseCredit(5); // Image cost
              // Use Nano Banana Pro
              const isVertical = ['Instagram Story', 'TikTok'].some(p => item.platform.includes(p));
              const ratio = isVertical ? AspectRatio.PORTRAIT : AspectRatio.SQUARE;

              mediaUrl = await generateSocialMediaImage(
                  selectedLead.businessName,
                  `${item.description}. ${brandContext}`,
                  ratio,
                  skipKeyCheck
              );
          }

          updateItemState({ generatedMediaUrl: mediaUrl, isLoading: false });

          // Save Media to History
          const historyItem: HistoryItem = {
              id: `hist-${Date.now()}`,
              type: item.format,
              timestamp: Date.now(),
              content: mediaUrl,
              metadata: {
                  prompt: item.description,
                  platform: item.platform,
                  description: item.title
              }
          };

          onUpdateLead({
              ...selectedLead,
              history: [...(selectedLead.history || []), historyItem]
          });

      } catch (err: any) {
          updateItemState({ isLoading: false });
          if (err.message.includes("API_KEY_REQUIRED")) {
              setPendingAction(() => () => handleCreateContent(itemId, true));
              setShowKeyModal(true);
          } else {
              console.error(err);
              alert("Generation failed. Please try again.");
          }
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

  return (
    <div className="space-y-6">
        {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}

        <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 font-serif">Marketing Campaign Manager</h1>
            <p className="text-gray-500">Plan, Strategize, and Create content to reach your customer's goals.</p>
        </div>

       {/* 1. Setup Section */}
       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Campaign For</label>
                        <div className="relative">
                            <select
                                className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={selectedLead?.id || ""}
                                onChange={(e) => {
                                    const lead = leads.find(l => l.id === e.target.value);
                                    if (lead) onSelectLead(lead);
                                }}
                            >
                                <option value="" disabled>Select a Customer...</option>
                                {wonLeads.length > 0 && (
                                    <optgroup label="🏆 Won Customers">
                                        {wonLeads.map(lead => (
                                            <option key={lead.id} value={lead.id}>🎉 {lead.businessName}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {otherLeads.length > 0 && (
                                    <optgroup label="Other Leads">
                                        {otherLeads.map(lead => (
                                            <option key={lead.id} value={lead.id}>{lead.businessName}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Campaign Goal</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Increase Christmas sales by 20%, Promote new yoga class"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase block">Platforms Package</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Email'].map(p => (
                            <button 
                                key={p}
                                onClick={() => togglePlatform(p)}
                                className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${platforms.includes(p) ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                <span>{p}</span>
                                {platforms.includes(p) && <span>✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={handleGenerateStrategy}
                    disabled={loading || !selectedLead || !goal || platforms.length === 0}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Developing Strategy...
                        </>
                    ) : (
                        <>
                            <span>✨</span> Generate Strategy (5 Credits)
                        </>
                    )}
                </button>
            </div>
       </div>

       {/* 2. Strategy & Content Section */}
       {strategy && (
           <div className="space-y-8 animate-fadeInUp">
               {/* Strategy Summary */}
               <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                   <h3 className="text-blue-900 font-bold text-lg mb-2 flex items-center">
                       <span className="text-2xl mr-2">🎯</span> Strategy Overview
                   </h3>
                   <p className="text-blue-800 leading-relaxed">
                       {strategy.summary}
                   </p>
               </div>

               <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold text-gray-800 font-serif">Content Production</h2>
                   <div className="text-sm text-gray-500">AI Powered by Gemini 3 & Veo</div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                   {strategy.items.map((item, idx) => (
                       <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex flex-col md:flex-row gap-6">
                               {/* Left: Text Content */}
                               <div className="flex-1 space-y-4">
                                   <div className="flex items-center gap-3 mb-2">
                                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.format === 'VIDEO' ? 'bg-orange-100 text-orange-700' : 'bg-pink-100 text-pink-700'}`}>
                                           {item.format}
                                       </span>
                                       <span className="text-gray-400 text-sm font-medium">{item.platform}</span>
                                   </div>
                                   
                                   <h3 className="font-bold text-xl text-gray-800">{item.title}</h3>
                                   <p className="text-gray-600 text-sm italic border-l-2 border-gray-200 pl-3">"{item.description}"</p>
                                   
                                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                       <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Caption / Script</span>
                                       <p className="text-gray-800 text-sm whitespace-pre-wrap">{item.copy}</p>
                                       <button 
                                            onClick={() => navigator.clipboard.writeText(item.copy)}
                                            className="text-purple-600 text-xs font-bold mt-2 hover:underline"
                                       >
                                           Copy Text
                                       </button>
                                   </div>
                               </div>

                               {/* Right: Media Generation */}
                               <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
                                   <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative min-h-[200px] flex items-center justify-center border border-gray-200">
                                       {item.isLoading ? (
                                           <div className="text-center p-4">
                                               <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2 ${item.format === 'VIDEO' ? 'border-orange-500' : 'border-purple-500'}`}></div>
                                               <p className="text-xs text-gray-500 font-bold">Creating {item.format === 'VIDEO' ? 'Veo Video' : 'HQ Image'}...</p>
                                               <p className="text-[10px] text-gray-400 mt-1">Applying Brand DNA...</p>
                                           </div>
                                       ) : item.generatedMediaUrl ? (
                                           item.format === 'VIDEO' ? (
                                               <video src={item.generatedMediaUrl} controls className="w-full h-full object-cover" />
                                           ) : (
                                               <img src={item.generatedMediaUrl} alt="Generated Content" className="w-full h-full object-cover" />
                                           )
                                       ) : (
                                           <div className="text-center p-4 text-gray-400">
                                               <span className="text-4xl block mb-2 opacity-30">{item.format === 'VIDEO' ? '🎥' : '📸'}</span>
                                               <p className="text-xs">Media not generated</p>
                                           </div>
                                       )}
                                   </div>
                                   
                                   {!item.generatedMediaUrl && (
                                       <button 
                                            onClick={() => handleCreateContent(item.id)}
                                            disabled={item.isLoading}
                                            className={`mt-3 w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${item.format === 'VIDEO' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                                       >
                                           Create {item.format === 'VIDEO' ? 'Video (20 Cr)' : 'Image (5 Cr)'}
                                       </button>
                                   )}
                                   
                                   {item.generatedMediaUrl && (
                                       <a 
                                            href={item.generatedMediaUrl} 
                                            download={`content-${item.id}.${item.format === 'VIDEO' ? 'mp4' : 'png'}`}
                                            className="mt-3 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-center text-sm hover:bg-gray-50"
                                       >
                                           Download
                                       </a>
                                   )}
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
};