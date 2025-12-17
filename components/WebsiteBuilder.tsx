import React, { useState, useEffect } from 'react';
import { generateWebsiteConceptImage, generateWebsiteStructure, refineWebsiteCode, promptForKeySelection } from '../services/geminiService';
import { ImageSize, AspectRatio, Lead, HistoryItem, DesignSpecification, VerificationResult } from '../types';
import { extractDesignSpecFromImage, createDefaultDesignSpec } from '../services/designExtractionService';
import { verifyWebsiteAgainstSpec } from '../services/verificationService';
import { publishWebsite, isPublishingAvailable } from '../services/publishingService';
import { ApiKeyModal } from './ApiKeyModal';
import { DesignSpecReview } from './DesignSpecReview';
import { DesignVerificationModal } from './DesignVerificationModal';
import { CustomDomainSetup } from './CustomDomainSetup';

interface Props {
  onUseCredit: () => void;
  selectedLead?: Lead | null;
  onUpdateLead?: (lead: Lead) => void;
}

type Tab = 'concept' | 'builder' | 'deploy';

export const WebsiteBuilder: React.FC<Props> = ({ onUseCredit, selectedLead, onUpdateLead }) => {
  const [activeTab, setActiveTab] = useState<Tab>('concept');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [deployedUrl, setDeployedUrl] = useState<string | null>(selectedLead?.websiteUrl || null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Concept options
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [size, setSize] = useState<ImageSize>(ImageSize.S_1K);

  // Proposal State
  const [proposalSent, setProposalSent] = useState(false);

  // Publishing State
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Design Consistency State
  const [designSpec, setDesignSpec] = useState<DesignSpecification | null>(null);
  const [showDesignSpecReview, setShowDesignSpecReview] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isExtractingSpecs, setIsExtractingSpecs] = useState(false);
  const [isFixingIssues, setIsFixingIssues] = useState(false);

  useEffect(() => {
    if (selectedLead) {
        setPrompt(`Create a website for ${selectedLead.businessName}, a business located in ${selectedLead.location}. Details: ${selectedLead.details}. Make it modern, inviting, and professional.`);
        
        // If this lead already has a website, jump to deploy/share view
        if (selectedLead.websiteUrl) {
            setDeployedUrl(selectedLead.websiteUrl);
            setActiveTab('deploy');
        } else {
            // Reset if new lead has no site
            setDeployedUrl(null);
            setGeneratedCode(null);
            setGeneratedImage(null);
            setActiveTab('concept');
        }
    }
  }, [selectedLead]);

  const handleGenerateConcept = async () => {
    setLoading(true);
    try {
      onUseCredit();
      // Try Image Gen
      try {
          const img = await generateWebsiteConceptImage(prompt, aspectRatio, size);
          setGeneratedImage(img);

          if (selectedLead && onUpdateLead) {
              const historyItem: HistoryItem = {
                  id: `hist-${Date.now()}`,
                  type: 'WEBSITE_CONCEPT',
                  timestamp: Date.now(),
                  content: img,
                  metadata: {
                      prompt: prompt,
                  }
              };
              onUpdateLead({
                  ...selectedLead,
                  websiteConceptImage: img,
                  history: [...(selectedLead.history || []), historyItem]
              });
          }

          // Extract design specifications from the generated concept
          setIsExtractingSpecs(true);
          try {
              const extractedSpec = await extractDesignSpecFromImage(
                  img,
                  selectedLead?.businessName || 'Business',
                  selectedLead?.brandGuidelines
              );
              setDesignSpec(extractedSpec);

              // Update lead with design spec
              if (selectedLead && onUpdateLead) {
                  onUpdateLead({
                      ...selectedLead,
                      websiteConceptImage: img,
                      brandGuidelines: {
                          ...selectedLead.brandGuidelines,
                          designSpec: extractedSpec
                      }
                  });
              }

              // Show design spec review
              setShowDesignSpecReview(true);
          } catch (specError) {
              console.error('Failed to extract design specs:', specError);
              // Fallback to default
              if (selectedLead?.brandGuidelines) {
                  const defaultSpec = createDefaultDesignSpec(selectedLead.brandGuidelines);
                  setDesignSpec(defaultSpec);
              }
          } finally {
              setIsExtractingSpecs(false);
          }
      } catch (err: any) {
          if (err.message.includes("API_KEY_REQUIRED")) {
              setShowKeyModal(true);
          }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySelected = async () => {
      setShowKeyModal(false);
      await promptForKeySelection();
      // Retry
      try {
        setLoading(true);
        const img = await generateWebsiteConceptImage(prompt, aspectRatio, size, true);
        setGeneratedImage(img);
        
        if (selectedLead && onUpdateLead) {
             const historyItem: HistoryItem = {
                  id: `hist-${Date.now()}`,
                  type: 'WEBSITE_CONCEPT',
                  timestamp: Date.now(),
                  content: img,
                  metadata: {
                      prompt: prompt,
                  }
              };
              onUpdateLead({
                  ...selectedLead,
                  history: [...(selectedLead.history || []), historyItem]
              });
        }
      } finally {
        setLoading(false);
      }
  }

  const handleStartBuilding = async () => {
      setActiveTab('builder');
      if (!generatedCode) {
          setLoading(true);
          try {
              // Use design spec for strict generation if available
              // IMPORTANT: Pass the concept image so the hero background can be extracted
              const code = await generateWebsiteStructure(prompt, designSpec || undefined, generatedImage || undefined);
              setGeneratedCode(code);

              // Verify the generated code against design spec
              if (designSpec && generatedImage) {
                  try {
                      const result = await verifyWebsiteAgainstSpec(code, designSpec, generatedImage);
                      setVerificationResult(result);

                      // Show verification modal if score is below threshold
                      if (result.overallMatchScore < 85) {
                          setShowVerificationModal(true);
                      }
                  } catch (verifyError) {
                      console.error('Verification failed:', verifyError);
                  }
              }
          } finally {
              setLoading(false);
          }
      }
  }

  // Handle design spec confirmation
  const handleDesignSpecConfirm = (updatedSpec: DesignSpecification) => {
      setDesignSpec(updatedSpec);
      setShowDesignSpecReview(false);

      // Update lead with confirmed spec
      if (selectedLead && onUpdateLead) {
          onUpdateLead({
              ...selectedLead,
              brandGuidelines: {
                  ...selectedLead.brandGuidelines,
                  designSpec: updatedSpec
              }
          });
      }
  };

  // Handle verification approval
  const handleVerificationApprove = () => {
      setShowVerificationModal(false);
  };

  // Handle regeneration request
  const handleRegenerate = async () => {
      setShowVerificationModal(false);
      setGeneratedCode(null);
      setLoading(true);

      try {
          // Pass the concept image for hero background extraction
          const code = await generateWebsiteStructure(prompt, designSpec || undefined, generatedImage || undefined);
          setGeneratedCode(code);

          // Re-verify
          if (designSpec && generatedImage) {
              const result = await verifyWebsiteAgainstSpec(code, designSpec, generatedImage);
              setVerificationResult(result);

              if (result.overallMatchScore < 85) {
                  setShowVerificationModal(true);
              }
          }
      } finally {
          setLoading(false);
      }
  };

  // Handle asset upload from verification modal
  const handleAssetUpload = (assetType: string, file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const dataUrl = e.target?.result as string;

          if (designSpec) {
              const updatedSpec = { ...designSpec };

              if (assetType === 'logo') {
                  updatedSpec.assets.logo = {
                      id: `logo-${Date.now()}`,
                      type: 'logo',
                      source: 'user',
                      url: dataUrl,
                      placement: 'header',
                      required: true
                  };
              } else if (assetType === 'hero-image') {
                  updatedSpec.assets.heroImage = {
                      id: `hero-${Date.now()}`,
                      type: 'image',
                      source: 'user',
                      url: dataUrl,
                      placement: 'hero section',
                      required: false
                  };
              }

              setDesignSpec(updatedSpec);

              // Update lead
              if (selectedLead && onUpdateLead) {
                  onUpdateLead({
                      ...selectedLead,
                      brandGuidelines: {
                          ...selectedLead.brandGuidelines,
                          designSpec: updatedSpec
                      }
                  });
              }
          }
      };
      reader.readAsDataURL(file);
  };

  // Handle fix issues - Apply fixes directly to the code
  const handleFixIssues = async () => {
      if (!generatedCode || !designSpec || !verificationResult) return;

      setIsFixingIssues(true);
      try {
          let fixedCode = generatedCode;

          // Apply color fixes directly
          const colorDiscrepancies = verificationResult.discrepancies.filter(d => d.element.includes('color'));
          for (const disc of colorDiscrepancies) {
              // Add missing colors to Tailwind config if not present
              if (disc.expected && !fixedCode.includes(disc.expected)) {
                  // Find Tailwind config section
                  const tailwindConfigMatch = fixedCode.match(/tailwind\.config\s*=\s*{[\s\S]*?colors:\s*{([\s\S]*?)}/);
                  if (tailwindConfigMatch) {
                      const colorName = disc.element.toLowerCase().replace(' color', '');
                      const newColorEntry = `\n      '${colorName}': '${disc.expected}',`;
                      fixedCode = fixedCode.replace(
                          /(tailwind\.config\s*=\s*{[\s\S]*?colors:\s*{)/,
                          `$1${newColorEntry}`
                      );
                  }
              }
          }

          // Apply font fixes directly
          const fontDiscrepancies = verificationResult.discrepancies.filter(d => d.element.includes('font'));
          for (const disc of fontDiscrepancies) {
              if (disc.expected && !fixedCode.includes(disc.expected)) {
                  // Add missing font import
                  const fontFamily = disc.expected.replace(/ /g, '+');
                  const fontImport = `<link href="https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;

                  if (!fixedCode.includes(fontFamily)) {
                      fixedCode = fixedCode.replace('</head>', `  ${fontImport}\n</head>`);
                  }

                  // Add font family to CSS
                  const fontType = disc.element.toLowerCase().includes('heading') ? 'heading' : 'body';
                  const cssRule = fontType === 'heading'
                      ? `\n    h1, h2, h3, h4, h5, h6 { font-family: '${disc.expected}', serif; }`
                      : `\n    body, p, span, div { font-family: '${disc.expected}', sans-serif; }`;

                  if (fixedCode.includes('<style>')) {
                      fixedCode = fixedCode.replace('</style>', `${cssRule}\n  </style>`);
                  } else {
                      fixedCode = fixedCode.replace('</head>', `  <style>${cssRule}\n  </style>\n</head>`);
                  }
              }
          }

          // Apply section fixes - add missing sections
          const sectionDiscrepancies = verificationResult.discrepancies.filter(d => d.element.includes('section'));
          if (sectionDiscrepancies.length > 0) {
              // Add missing sections before closing body tag
              let missingSection = '';
              for (const disc of sectionDiscrepancies) {
                  const sectionType = disc.element.toLowerCase();
                  if (sectionType.includes('contact')) {
                      missingSection += `
  <!-- Contact Section -->
  <section id="contact" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-4xl font-bold text-center mb-12">Contact Us</h2>
      <div class="max-w-xl mx-auto">
        <form class="space-y-6">
          <div><input type="text" placeholder="Name" class="w-full px-4 py-3 rounded-lg border"></div>
          <div><input type="email" placeholder="Email" class="w-full px-4 py-3 rounded-lg border"></div>
          <div><textarea placeholder="Message" rows="4" class="w-full px-4 py-3 rounded-lg border"></textarea></div>
          <button type="submit" class="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:opacity-90">Send Message</button>
        </form>
      </div>
    </div>
  </section>
`;
                  }
              }
              if (missingSection) {
                  fixedCode = fixedCode.replace('</body>', `${missingSection}\n</body>`);
              }
          }

          setGeneratedCode(fixedCode);

          // Re-verify after fix
          if (generatedImage) {
              const newResult = await verifyWebsiteAgainstSpec(fixedCode, designSpec, generatedImage);
              setVerificationResult(newResult);

              // Close modal if issues are significantly improved
              if (newResult.overallMatchScore >= 85 ||
                  newResult.discrepancies.length < verificationResult.discrepancies.length / 2) {
                  setShowVerificationModal(false);
                  alert('Issues have been fixed! Your website now matches the design better.');
              } else {
                  alert(`Issues partially fixed. Score improved from ${verificationResult.overallMatchScore}% to ${newResult.overallMatchScore}%. You can try fixing again or manually adjust.`);
              }
          }
      } catch (error) {
          console.error('Failed to fix issues:', error);
          alert('Failed to fix issues. Please try regenerating the website or manually editing the code.');
      } finally {
          setIsFixingIssues(false);
      }
  };

  const handleRefineCode = async () => {
      if (!generatedCode || !refinementPrompt) return;
      setLoading(true);
      try {
          const newCode = await refineWebsiteCode(generatedCode, refinementPrompt);
          setGeneratedCode(newCode);
          setRefinementPrompt('');
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }

  const handleDeploy = async () => {
      if (!generatedCode) return;

      setLoading(true);
      setPublishError(null);

      // Check if real publishing is available (Firebase configured)
      if (isPublishingAvailable()) {
          try {
              // Publish to Firebase Hosting
              const result = await publishWebsite(
                  generatedCode,
                  selectedLead?.businessName || 'my-website',
                  selectedLead?.id
              );

              setDeployedUrl(result.firebaseUrl);
              setWebsiteId(result.websiteId);

              // Save back to lead with real URL
              if (selectedLead && onUpdateLead) {
                  const historyItem: HistoryItem = {
                      id: `hist-${Date.now()}`,
                      type: 'WEBSITE_DEPLOY',
                      timestamp: Date.now(),
                      content: result.firebaseUrl,
                      metadata: {
                          prompt: 'Live Website Deployment',
                          websiteId: result.websiteId
                      }
                  };

                  onUpdateLead({
                      ...selectedLead,
                      websiteUrl: result.firebaseUrl,
                      history: [...(selectedLead.history || []), historyItem]
                  });
              }

              setActiveTab('deploy');
          } catch (error) {
              console.error('Publishing failed:', error);
              setPublishError(error instanceof Error ? error.message : 'Failed to publish website');

              // Fallback to blob URL for preview
              const blob = new Blob([generatedCode], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              setDeployedUrl(url);
              setActiveTab('deploy');
          }
      } else {
          // Fallback: Use blob URL when Firebase isn't configured (demo mode)
          const blob = new Blob([generatedCode], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          setDeployedUrl(url);

          // Save back to lead
          if (selectedLead && onUpdateLead) {
              const historyItem: HistoryItem = {
                  id: `hist-${Date.now()}`,
                  type: 'WEBSITE_DEPLOY',
                  timestamp: Date.now(),
                  content: url,
                  metadata: {
                      prompt: 'Live Website Deployment (Demo Mode)'
                  }
              };

              onUpdateLead({
                  ...selectedLead,
                  websiteUrl: url,
                  history: [...(selectedLead.history || []), historyItem]
              });
          }

          setActiveTab('deploy');
      }

      setLoading(false);
  }

  const handleSendProposal = () => {
      setProposalSent(true);
      setTimeout(() => setProposalSent(false), 3000);
  }

  return (
    <div className="space-y-6">
        {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeySelected} />}

        {/* Design Spec Review Modal */}
        {showDesignSpecReview && designSpec && (
            <DesignSpecReview
                designSpec={designSpec}
                conceptImage={generatedImage || undefined}
                onConfirm={handleDesignSpecConfirm}
                onCancel={() => setShowDesignSpecReview(false)}
            />
        )}

        {/* Design Verification Modal */}
        {showVerificationModal && verificationResult && designSpec && (
            <DesignVerificationModal
                verificationResult={verificationResult}
                designSpec={designSpec}
                conceptImage={generatedImage || ''}
                generatedHtml={generatedCode || ''}
                onApprove={handleVerificationApprove}
                onRegenerate={handleRegenerate}
                onFixIssues={handleFixIssues}
                onUploadAsset={handleAssetUpload}
                onClose={() => setShowVerificationModal(false)}
                isFixing={isFixingIssues}
            />
        )}

        {/* Design Spec Extraction Loading Indicator */}
        {isExtractingSpecs && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Extracting Design Specifications</h3>
                    <p className="text-gray-500">Analyzing colors, fonts, layout, and sections from your concept...</p>
                </div>
            </div>
        )}

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Dream Website Builder</h1>
        <p className="text-gray-500">From concept to live website in minutes.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('concept')}
                className={`px-4 py-2 rounded-full font-bold transition-all ${activeTab === 'concept' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-500'}`}
              >
                  1. Visual Concept
              </button>
              <div className="w-12 h-1 bg-gray-200 rounded"></div>
              <button 
                onClick={() => generatedCode && setActiveTab('builder')}
                disabled={!generatedCode && activeTab === 'concept'}
                className={`px-4 py-2 rounded-full font-bold transition-all ${activeTab === 'builder' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-500'}`}
              >
                  2. Live Builder
              </button>
              <div className="w-12 h-1 bg-gray-200 rounded"></div>
              <button 
                onClick={() => deployedUrl && setActiveTab('deploy')}
                disabled={!deployedUrl}
                className={`px-4 py-2 rounded-full font-bold transition-all ${activeTab === 'deploy' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-500'}`}
              >
                  3. Launch & Sell
              </button>
          </div>
      </div>

      {activeTab === 'concept' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 animate-fadeIn">
            <div className="flex flex-col gap-4">
            <label className="text-gray-700 font-medium">Describe the website vision:</label>
            <textarea
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none h-32"
                placeholder="A pastel colored bakery website with a large hero image of cupcakes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
            
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
                    >
                        <option value={AspectRatio.LANDSCAPE}>Landscape (16:9)</option>
                        <option value={AspectRatio.PORTRAIT}>Mobile (9:16)</option>
                    </select>
                    <select 
                        value={size} 
                        onChange={(e) => setSize(e.target.value as ImageSize)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
                    >
                        <option value={ImageSize.S_1K}>Standard Quality</option>
                        <option value={ImageSize.S_2K}>High Quality (2K)</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleGenerateConcept}
                        disabled={loading || !prompt}
                        className="px-6 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all"
                    >
                        {loading && !generatedImage ? 'Dreaming...' : 'Generate Concept'} 
                    </button>
                    <button 
                        onClick={handleStartBuilding}
                        disabled={loading || !prompt}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-md hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        Start Building Website →
                    </button>
                </div>
            </div>

            {/* Visual Preview */}
            <div className="mt-6">
                <h3 className="font-bold text-gray-700 mb-2">Visual Mockup</h3>
                <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 min-h-[400px] flex items-center justify-center relative group">
                    {loading && !generatedImage ? (
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 animate-pulse">Designing visual concept...</p>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Website Concept" className="w-full h-full object-cover" />
                    ) : (
                        <p className="text-gray-400">Generate a concept first, or skip to building.</p>
                    )}
                </div>
            </div>
            </div>
        </div>
      )}

      {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left Panel: Controls */}
              <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3">AI Assistant</h3>
                      <p className="text-sm text-gray-500 mb-3">Ask for changes (e.g. "Change the nav bar to black", "Add a pricing section")</p>
                      <textarea 
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm h-32 mb-3 focus:ring-2 focus:ring-purple-200 outline-none"
                        placeholder="What should we change?"
                      />
                      <button 
                        onClick={handleRefineCode}
                        disabled={loading || !refinementPrompt}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
                      >
                          {loading ? 'Refining...' : 'Apply Changes'}
                      </button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
                      <h3 className="font-bold text-green-800 mb-2">Ready to Launch?</h3>
                      <p className="text-sm text-green-700 mb-4">Once you are happy with the preview, deploy it to a live link.</p>
                      <button 
                        onClick={handleDeploy}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all flex justify-center items-center gap-2"
                      >
                         {loading ? (
                             <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Deploying...
                             </>
                         ) : (
                             <>
                                🚀 Deploy Website
                             </>
                         )}
                      </button>
                  </div>
              </div>

              {/* Right Panel: Live Preview */}
              <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
                      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center justify-between">
                          <div className="flex space-x-2">
                              <div className="w-3 h-3 rounded-full bg-red-400"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="bg-white px-4 py-1 rounded-full text-xs text-gray-500 shadow-sm border border-gray-200">
                              Live Preview
                          </div>
                          <div className="w-10"></div>
                      </div>
                      <div className="flex-1 bg-white relative">
                          {loading && !refinementPrompt ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                  <div className="flex flex-col items-center">
                                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                      <p className="text-gray-500 font-medium">Coding your website...</p>
                                  </div>
                              </div>
                          ) : null}
                          <iframe 
                            srcDoc={generatedCode || ''} 
                            className="w-full h-full border-0" 
                            title="Website Preview"
                          ></iframe>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'deploy' && deployedUrl && (
          <div className="max-w-3xl mx-auto animate-fadeInUp space-y-6">
              {/* Error Banner */}
              {publishError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                          <p className="font-medium text-yellow-800">Publishing to live hosting failed</p>
                          <p className="text-sm text-yellow-700 mt-1">{publishError}</p>
                          <p className="text-sm text-yellow-600 mt-2">Your website is available for preview below. Try publishing again or contact support.</p>
                      </div>
                  </div>
              )}

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100">
                  <div className="bg-green-500 p-8 text-white text-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                          <span className="text-4xl">🎉</span>
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Website is Live!</h2>
                      <p className="text-green-50 opacity-90">Your custom website is ready to be shared with the world.</p>
                  </div>

                  <div className="p-8 space-y-8">
                      {/* Link Section */}
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Public Link</label>
                          <div className="flex gap-2">
                              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 font-mono text-sm truncate">
                                  {deployedUrl.startsWith('blob:') ? `https://preview.renova8.app/sites/${selectedLead ? selectedLead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'site'}` : deployedUrl}
                              </div>
                              <button
                                onClick={() => navigator.clipboard.writeText(deployedUrl.startsWith('blob:') ? `Demo preview only` : deployedUrl)}
                                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                title="Copy Link"
                              >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                              </button>
                              <a
                                href={deployedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                              >
                                  Open Site
                              </a>
                          </div>
                          {deployedUrl.startsWith('blob:') && (
                              <p className="text-xs text-gray-500 mt-1">
                                  This is a local preview. Sign in with Firebase to publish to a permanent URL.
                              </p>
                          )}
                      </div>

                      <hr className="border-gray-100" />

                      {/* Custom Domain Section - Only show if published to Firebase */}
                      {websiteId && !deployedUrl.startsWith('blob:') && (
                          <>
                              <CustomDomainSetup
                                  websiteId={websiteId}
                                  onDomainConfigured={(domain) => {
                                      console.log('Custom domain configured:', domain);
                                  }}
                                  onDomainRemoved={() => {
                                      console.log('Custom domain removed');
                                  }}
                              />
                              <hr className="border-gray-100" />
                          </>
                      )}

                      {/* CRM Section */}
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-4">Send to Customer</h3>
                          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                              <div className="flex items-start gap-4 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                      {selectedLead?.businessName.charAt(0) || 'C'}
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-bold text-gray-800">{selectedLead?.businessName || 'Valued Customer'}</p>
                                      <p className="text-sm text-gray-500">{selectedLead?.location || 'Local Business'}</p>
                                  </div>
                              </div>

                              <textarea
                                className="w-full p-4 rounded-xl border border-blue-200 bg-white mb-4 text-sm text-gray-700 h-32 resize-none focus:ring-2 focus:ring-blue-200 outline-none"
                                defaultValue={`Hi there! \n\nI created a mock-up for a new website for ${selectedLead?.businessName || 'your business'}. \n\nCheck it out here: ${deployedUrl.startsWith('blob:') ? '[Live URL will be available after publishing]' : deployedUrl} \n\nLet me know what you think!`}
                              />

                              <div className="flex justify-end">
                                  <button
                                    onClick={handleSendProposal}
                                    className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-2 ${proposalSent ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                                  >
                                      {proposalSent ? (
                                          <><span>✓</span> Sent!</>
                                      ) : (
                                          <>Send Proposal</>
                                      )}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};