import React, { useState } from 'react';
import { Lead, SocialPreset, AspectRatio, HistoryItem } from '../types';
import { generateSocialMediaImage, promptForKeySelection } from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';

interface Props {
  leads: Lead[];
  onUseCredit: () => void;
  selectedLead?: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

const SOCIAL_PRESETS: SocialPreset[] = [
    { id: 'insta_post', name: 'Instagram Post', icon: '📸', ratio: AspectRatio.SQUARE, description: 'Square (1:1)' },
    { id: 'insta_story', name: 'Instagram Story', icon: '📱', ratio: AspectRatio.PORTRAIT, description: 'Vertical (9:16)' },
    { id: 'fb_post', name: 'Facebook Post', icon: '📘', ratio: AspectRatio.LANDSCAPE, description: 'Landscape (16:9)' },
    { id: 'linkedin', name: 'LinkedIn Banner', icon: '💼', ratio: AspectRatio.WIDE, description: 'Wide Header' },
    { id: 'tiktok', name: 'TikTok Cover', icon: '🎵', ratio: AspectRatio.PORTRAIT, description: 'Vertical (9:16)' },
    { id: 'youtube', name: 'YouTube Thumb', icon: '▶️', ratio: AspectRatio.LANDSCAPE, description: 'Landscape (16:9)' },
    { id: 'pinterest', name: 'Pinterest Pin', icon: '📌', ratio: AspectRatio.PORTRAIT, description: 'Vertical' },
    { id: 'twitter', name: 'X / Twitter Header', icon: '🐦', ratio: AspectRatio.WIDE, description: 'Wide Header' },
];

export const ImageStudio: React.FC<Props> = ({ leads, onUseCredit, selectedLead, onSelectLead, onUpdateLead }) => {
  const [selectedPreset, setSelectedPreset] = useState<SocialPreset>(SOCIAL_PRESETS[0]);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const handleGenerate = async (skipKeyCheck = false) => {
    if (!selectedLead || !prompt) return;
    
    setLoading(true);
    setGeneratedImage(null);
    try {
        onUseCredit(); // Deduct 5 credits (handled in parent)
        
        const fullPrompt = `${prompt}. Brand Colors: ${selectedLead.brandGuidelines?.colors?.join(', ') || 'Standard'}. Tone: ${selectedLead.brandGuidelines?.tone || 'Professional'}`;
        
        const img = await generateSocialMediaImage(selectedLead.businessName, fullPrompt, selectedPreset.ratio, skipKeyCheck);
        setGeneratedImage(img);

        // Save to History
        const historyItem: HistoryItem = {
            id: `hist-${Date.now()}`,
            type: 'IMAGE',
            timestamp: Date.now(),
            content: img,
            metadata: {
                prompt: prompt,
                platform: selectedPreset.name,
                description: selectedPreset.description
            }
        };

        onUpdateLead({
            ...selectedLead,
            history: [...(selectedLead.history || []), historyItem]
        });

    } catch (err: any) {
        if (err.message.includes("API_KEY_REQUIRED")) {
            setShowKeyModal(true);
        } else {
            console.error(err);
            alert("Image generation failed. Please try again.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleKeyConfirm = async () => {
    setShowKeyModal(false);
    await promptForKeySelection();
    handleGenerate(true);
  }

  return (
    <div className="space-y-6">
       {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}

      <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 font-serif">Social Image Studio</h1>
            <p className="text-gray-500">Create perfectly sized social media assets with Nano Banana Pro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
               {/* 1. Select Customer */}
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2">1. For Customer</label>
                   <select
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl outline-none"
                        value={selectedLead?.id || ""}
                        onChange={(e) => {
                            const lead = leads.find(l => l.id === e.target.value);
                            if (lead) onSelectLead(lead);
                        }}
                    >
                        <option value="" disabled>Select Customer...</option>
                        {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>{lead.businessName}</option>
                        ))}
                    </select>

                    {/* Brand DNA Section */}
                    {selectedLead?.brandGuidelines && (
                        <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                            <h3 className="text-xs font-bold text-purple-800 uppercase mb-2 flex items-center">
                                <span className="mr-2">🧬</span> Brand DNA Active
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {selectedLead.brandGuidelines.colors?.map((c, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{backgroundColor: c}} title={c}></div>
                                    ))}
                                </div>
                                <div className="h-8 w-px bg-purple-200"></div>
                                <div>
                                    <span className="text-xs text-purple-600 font-bold uppercase block">Tone</span>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[100px] block">{selectedLead.brandGuidelines.tone}</span>
                                </div>
                            </div>
                        </div>
                    )}
               </div>

               {/* 2. Select Platform */}
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">2. Platform & Size</label>
                    <div className="grid grid-cols-2 gap-3 h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {SOCIAL_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => setSelectedPreset(preset)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedPreset.id === preset.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:border-purple-200'}`}
                            >
                                <div className="text-2xl mb-1">{preset.icon}</div>
                                <div className="font-bold text-gray-700 text-sm">{preset.name}</div>
                                <div className="text-xs text-gray-400">{preset.description.split(' - ')[0]}</div>
                            </button>
                        ))}
                    </div>
               </div>

               {/* 3. Describe */}
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">3. Describe Image</label>
                    <textarea 
                        className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-purple-200 text-sm"
                        placeholder="e.g. A happy family eating cupcakes in a bright modern bakery..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    ></textarea>
                    
                    <button 
                        onClick={() => handleGenerate(false)}
                        disabled={loading || !selectedLead || !prompt}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Designing...' : 'Generate (5 Credits)'}
                    </button>
               </div>
          </div>

          {/* Canvas / Result */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full min-h-[500px] flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                  {loading ? (
                      <div className="text-center">
                          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500 font-medium">Nano Banana Pro is painting...</p>
                          <p className="text-xs text-purple-400 mt-2">Applying Brand DNA...</p>
                      </div>
                  ) : generatedImage ? (
                      <div className="relative group max-w-full max-h-full">
                          <img 
                            src={generatedImage} 
                            alt="Generated Social Content" 
                            className="rounded-lg shadow-2xl max-h-[600px] object-contain" 
                          />
                          <a 
                            href={generatedImage} 
                            download={`social-${selectedPreset.id}.png`}
                            className="absolute bottom-4 right-4 bg-white text-purple-600 px-6 py-2 rounded-full font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                          >
                              Download PNG
                          </a>
                      </div>
                  ) : (
                      <div className="text-center text-gray-400">
                          <span className="text-6xl block mb-4 opacity-20">🎨</span>
                          <p>Select settings and click generate to see magic.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};