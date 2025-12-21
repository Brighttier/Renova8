import React, { useState } from 'react';
import { generateMarketingVideo, promptForKeySelection } from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';
import { Lead, HistoryItem } from '../types';

interface Props {
  onUseCredit: () => void;
  selectedLead?: Lead | null;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

export const VideoStudio: React.FC<Props> = ({ onUseCredit, selectedLead, leads, onSelectLead, onUpdateLead }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Extract brand info if available
  const brandInfo = selectedLead?.brandGuidelines 
    ? `Colors: ${selectedLead.brandGuidelines.colors?.join(', ') || 'Standard'}. Tone: ${selectedLead.brandGuidelines.tone || 'Professional'}.` 
    : '';

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl(null);
    try {
        onUseCredit();
        const url = await generateMarketingVideo(prompt, brandInfo);
        setVideoUrl(url);

        if (selectedLead) {
            const historyItem: HistoryItem = {
                id: `hist-${Date.now()}`,
                type: 'VIDEO',
                timestamp: Date.now(),
                content: url,
                metadata: {
                    prompt: prompt,
                    platform: 'Commercial',
                }
            };

            onUpdateLead({
                ...selectedLead,
                history: [...(selectedLead.history || []), historyItem]
            });
        }
    } catch (err: any) {
        if (err.message.includes("API_KEY_REQUIRED")) {
            setShowKeyModal(true);
        } else {
            console.error(err);
            alert("Video generation failed. Please try again.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleKeyConfirm = async () => {
      setShowKeyModal(false);
      await promptForKeySelection();
      // Retry
      setLoading(true);
      try {
          // Pass '16:9' (default) and true to skip key check
          const url = await generateMarketingVideo(prompt, brandInfo, '16:9', true);
          setVideoUrl(url);
          
          if (selectedLead) {
            const historyItem: HistoryItem = {
                id: `hist-${Date.now()}`,
                type: 'VIDEO',
                timestamp: Date.now(),
                content: url,
                metadata: {
                    prompt: prompt,
                    platform: 'Commercial',
                }
            };

            onUpdateLead({
                ...selectedLead,
                history: [...(selectedLead.history || []), historyItem]
            });
        }
      } catch (e) {
          console.error(e);
          alert("Failed after key selection.");
      } finally {
          setLoading(false);
      }
  }

  return (
    <div className="space-y-6">
      {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}
      
      <div className="text-center space-y-2">
         <h1 className="text-3xl font-bold text-gray-800 font-serif">Video Commercial Studio</h1>
         <p className="text-gray-500">Create professional marketing videos with AI.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-purple-600 uppercase block mb-2">Creating Video For</label>
                    <div className="relative">
                        <select
                            className="appearance-none w-full bg-white border border-gray-200 text-gray-900 text-lg font-bold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm hover:border-purple-300 transition-colors"
                            value={selectedLead?.id || ""}
                            onChange={(e) => {
                                const lead = leads.find(l => l.id === e.target.value);
                                if (lead) onSelectLead(lead);
                            }}
                        >
                            <option value="" disabled>Select a Customer...</option>
                            {leads.length === 0 && <option disabled>No customers found yet</option>}
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>{lead.businessName}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-purple-600">
                            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                
                {selectedLead?.brandGuidelines && (
                     <div className="flex-shrink-0 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 block mb-1">Brand DNA</span>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {selectedLead.brandGuidelines.colors?.slice(0, 3).map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-gray-100" style={{backgroundColor: c}}></div>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-purple-700 bg-white border border-purple-100 px-2 py-0.5 rounded-full">{selectedLead.brandGuidelines.tone}</span>
                        </div>
                     </div>
                )}
            </div>
            
            {!selectedLead && leads.length > 0 && (
                <p className="text-sm text-purple-600 mt-2">Please select a customer above to start.</p>
            )}
            {!selectedLead && leads.length === 0 && (
                <p className="text-sm text-red-500 mt-2">You need to find and save customers first!</p>
            )}
      </div>

      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-orange-100 transition-opacity ${!selectedLead ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
         <div className="flex gap-4">
             <input 
                type="text" 
                placeholder="Describe your video... e.g. A slow motion shot of fresh coffee pouring into a cup, sunny morning light" 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-200"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
             />
             <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors disabled:opacity-50"
             >
                 {loading ? 'Filming...' : 'Create Video'}
             </button>
         </div>
         <p className="text-xs text-orange-400 mt-2 ml-1">* Takes about 1-2 minutes.</p>
      </div>

      <div className="flex justify-center">
          {loading ? (
              <div className="w-full max-w-2xl bg-black rounded-xl aspect-video flex flex-col items-center justify-center text-white">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Generating Video...</p>
                  <p className="text-xs text-gray-400 mt-2">Applying brand guidelines...</p>
              </div>
          ) : videoUrl ? (
              <div className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl">
                  <video controls className="w-full h-auto" src={videoUrl}></video>
              </div>
          ) : (
              <div className="w-full max-w-2xl bg-gray-100 rounded-xl aspect-video flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                  Video Preview Area
              </div>
          )}
      </div>
    </div>
  );
};