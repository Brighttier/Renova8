import React, { useState } from 'react';
import { findLeadsWithMaps } from '../services/geminiService';
import { Lead } from '../types';
import { PageTour, SCOUT_TOUR_STEPS, usePageTour } from './PageTour';
import { HelpTooltip } from './HelpTooltip';

interface Props {
  onLeadsFound: (leads: Lead[]) => void;
  onUseCredit: () => void;
  onAnalyze: (lead: Lead) => void;
  savedLeads: Lead[];
  onSaveLead: (lead: Lead) => void;
}

export const LeadFinder: React.FC<Props> = ({ onLeadsFound, onUseCredit, onAnalyze, savedLeads, onSaveLead }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  // Page tour
  const { showTour, completeTour } = usePageTour('scout');

  const handleSearch = async (e?: React.FormEvent, isLoadMore: boolean = false) => {
    if (e) e.preventDefault();
    if (!query || !location) return;

    setLoading(true);
    try {
      onUseCredit();
      // If loading more, modify query slightly to get variety
      const searchQuery = isLoadMore ? `${query} (different businesses)` : query;
      const response = await findLeadsWithMaps(searchQuery, location);
      
      const parsedLeads = response.leads; // Leads are now already parsed

      const formattedLeads: Lead[] = parsedLeads.map((pl: any, idx: number) => ({
        id: `lead-${Date.now()}-${idx}`,
        businessName: pl.businessName,
        location: pl.location,
        details: pl.details,
        phone: pl.phone,
        email: pl.email,
        status: 'new',
        sourceUrl: response.grounding?.[idx]?.web?.uri || response.grounding?.[idx]?.maps?.uri
      }));

      // Combine if load more, replace if new search
      const newResults = isLoadMore ? [...results, ...formattedLeads] : formattedLeads;
      setResults(newResults);
      setGroundingChunks(response.grounding || []);
      onLeadsFound(newResults);
    } catch (error) {
      console.error("Search failed", error);
      alert("Oops! Something went wrong finding customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Tour */}
      {showTour && (
        <PageTour tourId="scout" steps={SCOUT_TOUR_STEPS} onComplete={completeTour} />
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Find Your Next Customer</h1>
        <p className="text-gray-500">Search for local businesses that need your help.</p>
      </div>

      <div data-tour="scout-search" className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
        <form onSubmit={(e) => handleSearch(e, false)} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              Business Type
              <HelpTooltip featureId="lead-finder-type" size="sm" />
            </label>
            <input
              type="text"
              placeholder="e.g. Bakeries, Yoga Studios"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              Location
              <HelpTooltip featureId="lead-finder-location" size="sm" />
            </label>
            <input
              type="text"
              placeholder="e.g. Seattle, WA"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Customers'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
          <div data-tour="scout-results" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((lead) => {
                    const isSaved = savedLeads.some(s => s.businessName === lead.businessName); // Simple check by name
                    const mapLink = groundingChunks.find(c => c.maps?.title === lead.businessName || c.web?.title.includes(lead.businessName))?.maps?.uri;

                    return (
                    <div key={lead.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all group relative ${isSaved ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                        {isSaved && (
                            <div className="absolute top-4 right-4 bg-purple-200 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                                Already in List
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        {mapLink && (
                            <a href={mapLink} target="_blank" rel="noreferrer" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 mr-8">
                                Maps 📍
                            </a>
                        )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2 flex-wrap">
                            {lead.businessName}
                            {lead.hasWebsite && (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    🌐 Has Website
                                </span>
                            )}
                            {!lead.hasWebsite && (
                                <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    📝 No Website
                                </span>
                            )}
                        </h3>
                        {lead.existingWebsiteUrl && (
                            <a
                                href={lead.existingWebsiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 inline-block mb-2"
                            >
                                🔗 View Their Site
                            </a>
                        )}
                        <p className="text-sm text-gray-500 mb-4">{lead.location}</p>
                        <p className="text-gray-600 text-sm mb-6 line-clamp-3">{lead.details}</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {isSaved ? (
                                <button 
                                    onClick={() => onAnalyze(savedLeads.find(s => s.businessName === lead.businessName) || lead)}
                                    className="col-span-2 w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                >
                                    Manage Customer
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => onSaveLead(lead)}
                                        className="py-2 border border-purple-200 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                                    >
                                        Save List
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onSaveLead(lead);
                                            onAnalyze(lead);
                                        }}
                                        className="py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-colors"
                                    >
                                        Start Work
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center">
                <button 
                    onClick={() => handleSearch(undefined, true)}
                    disabled={loading}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 font-medium shadow-sm transition-all"
                >
                    {loading ? 'Finding More...' : 'Search More Results ↻'}
                </button>
            </div>
          </div>
      )}
    </div>
  );
};