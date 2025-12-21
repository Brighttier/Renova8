import React, { useState } from 'react';
import { Lead, HistoryItem } from '../types';
import { PageTour, ARCHIVES_TOUR_STEPS, usePageTour } from './PageTour';

interface Props {
  leads: Lead[];
  onUpdateLead?: (lead: Lead) => void;
}

export const CampaignHistory: React.FC<Props> = ({ leads, onUpdateLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads.length > 0 ? leads[0].id : '');
  const [previewWebsite, setPreviewWebsite] = useState<HistoryItem | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const history = selectedLead?.history?.sort((a, b) => b.timestamp - a.timestamp) || [];

  // Filter for website HTML history items
  const websiteHistory = history.filter(item => item.type === 'WEBSITE_HTML');

  // Handler to restore a previous website
  const handleRestoreWebsite = (historyItem: HistoryItem) => {
    if (selectedLead && historyItem.content && onUpdateLead) {
      // Create blob URL for the restored website
      const blob = new Blob([historyItem.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Update lead with restored website
      const updatedLead = {
        ...selectedLead,
        websiteUrl: url,
        websiteCode: historyItem.content,
        websiteMetadata: {
          ...selectedLead.websiteMetadata,
          restoredFrom: historyItem.id,
          restoredAt: Date.now(),
          version: historyItem.metadata?.version || 1
        }
      };

      onUpdateLead(updatedLead);
      alert(`Website version ${historyItem.metadata?.version || 'unknown'} restored successfully!`);
    }
    setPreviewWebsite(null);
  };

  // Handler to preview a website
  const handlePreviewWebsite = (item: HistoryItem) => {
    setPreviewWebsite(item);
  };

  // Page tour
  const { showTour, completeTour } = usePageTour('archives');

  return (
    <div className="space-y-6">
      {/* Page Tour */}
      {showTour && (
        <PageTour tourId="archives" steps={ARCHIVES_TOUR_STEPS} onComplete={completeTour} />
      )}

      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Campaign Archives</h1>
        <p className="text-gray-500">Access and reuse all your generated content, timestamped and organized.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div data-tour="archives-customers" className="lg:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-y-auto">
             <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Select Customer</h3>
             {leads.length === 0 ? (
                 <p className="text-sm text-gray-400 text-center py-4">No customers yet.</p>
             ) : (
                 <div className="space-y-2">
                     {leads.map(lead => (
                         <button
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedLeadId === lead.id ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                         >
                             <div className="font-bold">{lead.businessName}</div>
                             <div className={`text-xs ${selectedLeadId === lead.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                 {lead.history?.length || 0} Assets
                             </div>
                         </button>
                     ))}
                 </div>
             )}
        </div>

        {/* Timeline */}
        <div data-tour="archives-timeline" className="lg:w-3/4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {selectedLead ? (
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedLead.businessName}</h2>
                            <p className="text-gray-500 text-sm">Campaign Timeline</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium">
                            Total Assets: {history.length}
                        </div>
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <span className="text-4xl block mb-2">📂</span>
                            <p>No campaign history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {history.map((item) => (
                                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        {item.type === 'STRATEGY' && '🎯'}
                                        {item.type === 'IMAGE' && '📸'}
                                        {item.type === 'VIDEO' && '🎥'}
                                        {item.type === 'EMAIL' && '💌'}
                                        {item.type === 'WEBSITE_CONCEPT' && '🎨'}
                                        {item.type === 'WEBSITE_DEPLOY' && '🚀'}
                                        {item.type === 'WEBSITE_HTML' && '🌐'}
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-gray-700 text-sm">{item.type.replace('_', ' ')}</span>
                                            <time className="font-mono text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</time>
                                        </div>
                                        
                                        {item.metadata?.prompt && (
                                            <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-purple-100 pl-2 line-clamp-2">
                                                "{item.metadata.prompt}"
                                            </p>
                                        )}

                                        {/* Content Display based on Type */}
                                        {item.type === 'STRATEGY' && (
                                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                                {item.content.strategy_summary && <p className="mb-2">{item.content.strategy_summary.substring(0, 100)}...</p>}
                                                <div className="text-xs font-bold text-blue-600">
                                                    {item.content.content_ideas?.length} Ideas Generated
                                                </div>
                                            </div>
                                        )}

                                        {(item.type === 'IMAGE' || item.type === 'WEBSITE_CONCEPT') && (
                                            <div className="rounded-lg overflow-hidden border border-gray-100">
                                                <img src={item.content} alt="Generated" className="w-full h-auto" />
                                            </div>
                                        )}

                                        {item.type === 'VIDEO' && (
                                            <div className="rounded-lg overflow-hidden border border-gray-100">
                                                <video src={item.content} controls className="w-full h-auto" />
                                            </div>
                                        )}
                                        
                                        {item.type === 'EMAIL' && (
                                            <div className="text-sm bg-gray-50 p-3 rounded-lg">
                                                <p className="font-bold text-gray-800 mb-1">{item.content.subject}</p>
                                                <p className="text-gray-500 line-clamp-3">{item.content.body}</p>
                                            </div>
                                        )}

                                         {item.type === 'WEBSITE_DEPLOY' && (
                                            <div className="text-sm bg-green-50 p-3 rounded-lg flex items-center justify-between">
                                                <span className="text-green-700 font-bold">Live Link</span>
                                                <a href={item.content} target="_blank" rel="noreferrer" className="text-xs bg-white border border-green-200 px-2 py-1 rounded text-green-600 hover:underline">Visit</a>
                                            </div>
                                        )}

                                        {item.type === 'WEBSITE_HTML' && (
                                            <div className="text-sm bg-purple-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-purple-700 font-bold">
                                                        Website Version {item.metadata?.version || '?'}
                                                    </span>
                                                    <span className="text-xs text-purple-500">
                                                        {item.content?.length ? `${Math.round(item.content.length / 1024)}KB` : ''}
                                                    </span>
                                                </div>
                                                {/* Mini preview iframe */}
                                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-purple-200 mb-3">
                                                    <iframe
                                                        srcDoc={item.content}
                                                        className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                                                        style={{ width: '200%', height: '200%' }}
                                                        title={`Version ${item.metadata?.version || '?'}`}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePreviewWebsite(item)}
                                                        className="flex-1 text-xs bg-white border border-purple-200 px-3 py-1.5 rounded text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                                                    >
                                                        Preview
                                                    </button>
                                                    {onUpdateLead && (
                                                        <button
                                                            onClick={() => handleRestoreWebsite(item)}
                                                            className="flex-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors font-medium"
                                                        >
                                                            Restore
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-3 flex justify-end gap-2">
                                            {typeof item.content === 'string' && (item.content.startsWith('http') || item.content.startsWith('data:')) && (
                                                 <a href={item.content} download={`asset-${item.id}`} className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                                                    Download
                                                 </a>
                                            )}
                                            {item.type === 'STRATEGY' && (
                                                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(item.content, null, 2))} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 py-1">
                                                    Copy JSON
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                    Select a customer to view their timeline
                </div>
            )}
        </div>
      </div>

      {/* Website Preview Modal */}
      {previewWebsite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-800">
                  Website Preview - Version {previewWebsite.metadata?.version || '?'}
                </h3>
                <p className="text-xs text-gray-500">
                  Created: {new Date(previewWebsite.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {onUpdateLead && (
                  <button
                    onClick={() => handleRestoreWebsite(previewWebsite)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Restore This Version
                  </button>
                )}
                <button
                  onClick={() => setPreviewWebsite(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden" style={{ height: '70vh' }}>
              <iframe
                srcDoc={previewWebsite.content}
                className="w-full h-full"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};