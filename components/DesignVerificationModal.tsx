import React, { useState, useRef } from 'react';
import { VerificationResult, DesignSpecification } from '../types';

interface DesignVerificationModalProps {
  conceptImage: string;
  generatedHtml: string;
  verificationResult: VerificationResult;
  designSpec: DesignSpecification;
  onApprove: () => void;
  onRegenerate: () => void;
  onUploadAsset: (type: string, file: File) => void;
  onClose: () => void;
}

const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-12 text-right ${value >= 85 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
        {value}%
      </span>
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    major: 'bg-orange-100 text-orange-700',
    minor: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[severity as keyof typeof styles] || styles.minor}`}>
      {severity}
    </span>
  );
};

export const DesignVerificationModal: React.FC<DesignVerificationModalProps> = ({
  conceptImage,
  generatedHtml,
  verificationResult,
  designSpec,
  onApprove,
  onRegenerate,
  onUploadAsset,
  onClose
}) => {
  const [activeView, setActiveView] = useState<'comparison' | 'discrepancies' | 'assets'>('comparison');
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileSelect = (type: string) => {
    setUploadingAsset(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingAsset) {
      onUploadAsset(uploadingAsset, file);
      setUploadingAsset(null);
    }
    e.target.value = '';
  };

  const overallPassed = verificationResult.overallMatchScore >= 85;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overallPassed ? 'bg-green-100' : 'bg-orange-100'}`}>
              {overallPassed ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#4A4A4A]">Design Verification</h2>
              <p className={`text-sm ${overallPassed ? 'text-green-600' : 'text-orange-600'}`}>
                {overallPassed
                  ? 'Website matches design specifications!'
                  : `${verificationResult.discrepancies.length} discrepancies found`
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Score Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-6">
            <ScoreBar label="Overall" value={verificationResult.overallMatchScore} />
            <ScoreBar label="Colors" value={verificationResult.colorMatchScore} />
            <ScoreBar label="Layout" value={verificationResult.layoutMatchScore} />
            <ScoreBar label="Typography" value={verificationResult.typographyMatchScore} />
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'comparison', label: 'Side-by-Side', icon: '🔍' },
            { id: 'discrepancies', label: `Issues (${verificationResult.discrepancies.length})`, icon: '⚠️' },
            { id: 'assets', label: `Assets (${verificationResult.missingAssets.length})`, icon: '📁' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeView === tab.id
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Comparison View */}
          {activeView === 'comparison' && (
            <div className="h-full flex">
              {/* Concept Image */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Original Concept</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-100">
                  <img
                    src={conceptImage}
                    alt="Concept Design"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Generated Website */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Generated Website</h3>
                </div>
                <div className="flex-1 overflow-auto bg-white">
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatedHtml}
                    className="w-full h-full border-0"
                    title="Generated Website Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Discrepancies View */}
          {activeView === 'discrepancies' && (
            <div className="h-full overflow-auto p-6">
              {verificationResult.discrepancies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Discrepancies Found</h3>
                  <p className="text-sm text-gray-500 mt-1">The generated website matches the design specifications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationResult.discrepancies.map((d, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{d.element}</span>
                            <SeverityBadge severity={d.severity} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Expected:</span>
                              <span className="ml-2 font-mono text-gray-700">{d.expected}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Actual:</span>
                              <span className="ml-2 font-mono text-red-600">{d.actual}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Recommendations */}
                  {verificationResult.recommendations.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {verificationResult.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Assets View */}
          {activeView === 'assets' && (
            <div className="h-full overflow-auto p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {verificationResult.missingAssets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">All Assets Available</h3>
                  <p className="text-sm text-gray-500 mt-1">No missing assets detected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Upload the following assets to achieve exact design match:
                  </p>

                  {verificationResult.missingAssets.map((asset, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {asset.type === 'logo' ? (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 capitalize">{asset.type}</span>
                            {asset.required && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">Required</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{asset.description}</p>
                          <p className="text-xs text-gray-400">Placement: {asset.placement}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileSelect(asset.type)}
                        className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C4A030] transition-colors text-sm font-medium"
                      >
                        Upload
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Current Assets */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Current Assets</h4>
                <div className="grid grid-cols-2 gap-4">
                  {designSpec.assets.logo && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Logo</p>
                      {designSpec.assets.logo.url ? (
                        <img src={designSpec.assets.logo.url} alt="Logo" className="h-12 object-contain" />
                      ) : (
                        <span className="text-sm text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  )}
                  {designSpec.assets.heroImage && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Hero Image</p>
                      {designSpec.assets.heroImage.url ? (
                        <img src={designSpec.assets.heroImage.url} alt="Hero" className="h-16 object-cover rounded" />
                      ) : (
                        <span className="text-sm text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm">
            {overallPassed ? (
              <span className="text-green-600 font-medium">Ready to publish!</span>
            ) : (
              <span className="text-orange-600">Review discrepancies before approving</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onRegenerate}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
            <button
              onClick={onApprove}
              className={`px-5 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                overallPassed
                  ? 'bg-[#D4AF37] text-white hover:bg-[#C4A030]'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {overallPassed ? 'Approve & Continue' : 'Approve Anyway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
