import React, { useState, useMemo } from 'react';
import type { ServiceItem, ServiceCategory, ServiceType } from '../types';
import type { SupportContext } from '../services/supportChatService';

interface ServiceCatalogProps {
  onOpenSupportChat?: (context: SupportContext, initialMessage?: string) => void;
}

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onOpenSupportChat }) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiyModal, setShowDiyModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Service catalog data
  const services: ServiceItem[] = [
    {
      id: 'lead-finder',
      name: 'Lead Finder',
      description: 'AI-powered local business lead discovery with Google Maps integration',
      category: 'data',
      icon: '🎯',
      iconBg: '#3B82F6',
      lastUpdate: 'May 18, 2024',
      source: 'Google Maps grounding',
      features: ['Google Maps integration', 'AI-powered search', 'Business details extraction', 'Contact information'],
      serviceType: 'hybrid',
      hybridNote: 'DIY creates a demo version with sample data. Get Assistance for production-ready Google Maps API integration with database storage.',
      diyPrompt: `Add a Lead Finder feature to my website that allows users to:
- Search for local businesses in [INDUSTRY/BUSINESS TYPE] within [LOCATION]
- Display business details including name, location, phone, and email
- Filter and sort search results
- Save leads to a customer list
- Export lead data to CSV

The interface should have:
- A search form with industry and location inputs
- A results grid showing business cards
- Save/bookmark functionality for each lead
- A clean, professional design matching my brand colors`
    },
    {
      id: 'crm-hub',
      name: 'CRM Hub',
      description: 'Complete customer relationship management with communications tracking',
      category: 'data',
      icon: '👥',
      iconBg: '#8B5CF6',
      lastUpdate: 'July 22, 2024',
      source: 'Built-in CRM system',
      features: ['Customer list management', 'Status tracking', 'Communication history', 'Invoice linking', 'Notes & tags'],
      serviceType: 'backend'
    },
    {
      id: 'website-builder',
      name: 'Website Builder',
      description: 'AI-generated professional websites with Tailwind CSS',
      category: 'tools',
      icon: '🌐',
      iconBg: '#10B981',
      lastUpdate: 'June 10, 2024',
      source: 'Gemini Pro + AI Studio',
      features: ['AI website generation', 'Responsive design', 'Tailwind CSS styling', 'Custom branding', 'One-click deployment'],
      serviceType: 'diy',
      diyPrompt: `Add an AI Website Builder feature that allows users to:
- Generate complete website HTML using AI
- Input business details: [BUSINESS NAME], [INDUSTRY], [DESCRIPTION]
- Choose from templates or start from scratch
- Preview websites in real-time
- Download website code or deploy directly
- Edit websites with visual editor

The builder should include:
- Step-by-step generation wizard
- Brand color and style customization
- Section selector (Hero, Features, Testimonials, Contact)
- Mobile-responsive preview
- Export/publish options`
    },
    {
      id: 'website-editor',
      name: 'Website Editor',
      description: 'Drag-and-drop visual editor with 20+ component types',
      category: 'tools',
      icon: '✏️',
      iconBg: '#F59E0B',
      lastUpdate: 'August 5, 2024',
      source: 'Custom editor engine',
      features: ['Drag-and-drop interface', '20+ components', 'Live preview', 'Undo/redo', 'Mobile responsive', 'Code export'],
      serviceType: 'diy',
      diyPrompt: `Add a Visual Website Editor with the following capabilities:
- Drag-and-drop component placement
- Component library: [LIST COMPONENT TYPES YOU NEED]
- Real-time preview with device switching (desktop/tablet/mobile)
- Style editor for colors, fonts, spacing
- Undo/redo functionality
- Save and version control
- Export clean HTML/CSS code

Editor interface should have:
- Left sidebar with component palette
- Center canvas for editing
- Right sidebar for properties/styles
- Top toolbar for actions (save, preview, export)
- Professional visual design matching my brand`
    },
    {
      id: 'marketing-studio',
      name: 'Marketing Studio',
      description: 'AI-powered marketing strategy and content generation',
      category: 'marketing',
      icon: '📱',
      iconBg: '#EF4444',
      lastUpdate: 'May 30, 2024',
      source: 'Gemini Flash',
      features: ['Campaign strategy', 'Content ideas', 'Social media posts', 'Email templates', 'SEO optimization'],
      serviceType: 'diy',
      diyPrompt: `Add a Marketing Studio that helps users create marketing campaigns:
- Generate marketing strategies for [PRODUCT/SERVICE]
- Create content calendars with posting schedules
- Write social media posts for platforms: [LIST PLATFORMS]
- Generate email marketing copy
- Provide SEO-optimized blog titles and outlines
- Track campaign performance metrics

Features should include:
- Campaign creation wizard
- AI content generator with tone selection
- Content calendar view (monthly/weekly)
- Platform-specific formatting
- Save and organize campaigns in archive
- Export content to various formats`
    },
    {
      id: 'image-studio',
      name: 'Image Studio',
      description: 'AI-generated social media graphics for 8+ platforms',
      category: 'marketing',
      icon: '🎨',
      iconBg: '#EC4899',
      lastUpdate: 'July 1, 2024',
      source: 'Gemini Pro Image',
      features: ['8+ platform presets', 'AI image generation', 'Custom sizing', 'Brand consistency', 'Bulk export'],
      serviceType: 'diy',
      diyPrompt: `Add an Image Studio for creating social media graphics:
- AI-powered image generation for social media
- Platform presets: Instagram, Facebook, Twitter, LinkedIn, Pinterest, TikTok, YouTube, Stories
- Custom image sizes and aspect ratios
- Input prompt and style preferences
- Brand color integration
- Bulk generate multiple variations
- Download in multiple formats (PNG, JPG, WebP)

Interface should include:
- Platform selector with preview dimensions
- Prompt input with style options
- Generated image grid view
- Edit and regenerate options
- Quick download and share buttons
- Image history and favorites`
    },
    {
      id: 'video-studio',
      name: 'Video Studio',
      description: 'AI video content generation for marketing campaigns',
      category: 'marketing',
      icon: '🎬',
      iconBg: '#6366F1',
      lastUpdate: 'August 12, 2024',
      source: 'Veo 3.1 Fast',
      features: ['AI video generation', 'Marketing videos', 'Product demos', 'Social media clips', 'Custom branding'],
      serviceType: 'diy',
      diyPrompt: `Add a Video Studio for AI-powered video creation:
- Generate marketing videos from text prompts
- Video types: Product demos, Explainers, Social clips, Testimonials
- Customize duration: [DURATION OPTIONS]
- Add brand elements (logo, colors, fonts)
- Background music and voiceover options
- Export in multiple resolutions (1080p, 720p, 4K)

Features to include:
- Video prompt builder with templates
- Style and mood selection
- Preview and editing timeline
- Text overlay and caption editor
- Download and direct social media sharing
- Video asset library`
    },
    {
      id: 'email-hub',
      name: 'Email Hub',
      description: 'Unified email and communication management center',
      category: 'tools',
      icon: '✉️',
      iconBg: '#14B8A6',
      lastUpdate: 'June 28, 2024',
      source: 'Built-in inbox system',
      features: ['Email inbox', 'AI draft generation', 'Templates', 'Thread tracking', 'Attachments', 'Categories'],
      serviceType: 'backend'
    },
    {
      id: 'invoice-manager',
      name: 'Invoice Manager',
      description: 'Professional invoice creation and payment tracking',
      category: 'finance',
      icon: '💰',
      iconBg: '#F97316',
      lastUpdate: 'July 15, 2024',
      source: 'Built-in invoicing system',
      features: ['Invoice creation', 'Payment tracking', 'Tax calculation', 'PDF export', 'Payment history', 'Reminders'],
      serviceType: 'backend'
    },
    {
      id: 'campaign-archive',
      name: 'Campaign Archive',
      description: 'Complete history of all generated marketing assets',
      category: 'data',
      icon: '📦',
      iconBg: '#8B5CF6',
      lastUpdate: 'August 20, 2024',
      source: 'Built-in archive system',
      features: ['Asset timeline', 'Search & filter', 'Type categorization', 'Download all', 'Restore versions', 'Share links'],
      serviceType: 'diy',
      diyPrompt: `Add a Campaign Archive for organizing all generated content:
- Timeline view of all created assets
- Asset types: Websites, Images, Videos, Strategies, Emails
- Filter by type, date, customer, or campaign
- Search functionality
- Preview assets before opening
- Download individual or bulk assets
- Version history for websites
- Share and export options

Interface should include:
- Timeline or grid view toggle
- Filter sidebar with date range picker
- Asset cards with thumbnails
- Quick actions (view, download, delete, share)
- Storage usage indicator
- Archive analytics (most used, recent activity)`
    },
    {
      id: 'analytics-dashboard',
      name: 'Analytics Dashboard',
      description: 'Comprehensive analytics and performance insights',
      category: 'analytics',
      icon: '📊',
      iconBg: '#0EA5E9',
      lastUpdate: 'August 25, 2024',
      source: 'Analytics engine',
      features: ['Usage metrics', 'Campaign performance', 'ROI tracking', 'Custom reports', 'Data visualization', 'Export'],
      serviceType: 'diy',
      diyPrompt: `Add an Analytics Dashboard for tracking business metrics:
- Overview cards with key metrics: [LIST YOUR KEY METRICS]
- Lead conversion funnel visualization
- Campaign performance tracking
- Revenue and invoice analytics
- Website visitor statistics
- Social media engagement metrics
- Custom date range selection
- Export reports to PDF and Excel

Dashboard should include:
- Top KPI cards with trend indicators
- Charts: Line, Bar, Pie, and Donut
- Filterable data tables
- Comparison views (this month vs last month)
- Goal tracking widgets
- Real-time data updates
- Professional data visualization design`
    },
    {
      id: 'automation-hub',
      name: 'Automation Hub',
      description: 'Workflow automation and task scheduling',
      category: 'automation',
      icon: '⚡',
      iconBg: '#A855F7',
      lastUpdate: 'September 1, 2024',
      source: 'Automation engine',
      features: ['Workflow builder', 'Task automation', 'Email sequences', 'Follow-up reminders', 'Trigger actions', 'Scheduling'],
      serviceType: 'backend'
    }
  ];

  // Helper function to get card styling based on service type
  const getCardStyling = (serviceType: ServiceType) => {
    switch (serviceType) {
      case 'diy':
        return {
          border: 'border-l-4 border-l-green-500',
          badge: { bg: 'bg-green-50', text: 'text-green-700', label: '✓ DIY Ready' }
        };
      case 'backend':
        return {
          border: 'border-l-4 border-l-blue-500',
          badge: { bg: 'bg-blue-50', text: 'text-blue-700', label: '🔧 Setup Required' }
        };
      case 'hybrid':
        return {
          border: 'border-l-4 border-l-purple-500',
          badge: { bg: 'bg-purple-50', text: 'text-purple-700', label: '🔀 DIY + Pro' }
        };
      default:
        return { border: '', badge: null };
    }
  };

  // Filter services based on category and search
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.features.some(f => f.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, services]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ServiceCategory | 'all', number> = {
      all: services.length,
      data: 0,
      tools: 0,
      automation: 0,
      analytics: 0,
      marketing: 0,
      finance: 0
    };

    services.forEach(service => {
      counts[service.category]++;
    });

    return counts;
  }, [services]);

  const handleDiyClick = (service: ServiceItem) => {
    setSelectedService(service);
    setShowDiyModal(true);
  };

  const handleGetAssistanceClick = (service: ServiceItem) => {
    // Build service context
    const context: SupportContext = {
      currentPage: 'Service Catalog',
      currentWebsiteName: service.name,
      recentActions: [{
        type: 'requested_assistance',
        timestamp: Date.now(),
        success: true,
        details: `User requested assistance for: ${service.name}`
      }]
    };

    // Pre-populated message
    const initialMessage = `Hi! I need help implementing ${service.name} for my client's website. Could you assist me with the setup and requirements?`;

    // Call support chat callback
    if (onOpenSupportChat) {
      onOpenSupportChat(context, initialMessage);
    } else {
      // Fallback if not wired up yet
      alert(`Support integration coming soon!\n\nService: ${service.name}\n\nOur team will help you implement this feature.`);
    }
  };

  const handleCopyPrompt = () => {
    if (selectedService) {
      navigator.clipboard.writeText(selectedService.diyPrompt);
      alert('Prompt copied to clipboard! Paste it into the Website AI Editor to add this feature.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-white">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                Service & Feature Catalog
              </h1>
              <p className="text-gray-600">
                Browse our complete collection of AI-powered services and features
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search services and features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Services', icon: '🔍' },
              { id: 'data', label: 'Data', icon: '💾' },
              { id: 'tools', label: 'Tools', icon: '🛠️' },
              { id: 'marketing', label: 'Marketing', icon: '📢' },
              { id: 'finance', label: 'Finance', icon: '💵' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'automation', label: 'Automation', icon: '🤖' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ServiceCategory | 'all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#D4AF37] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
                <span className="ml-2 text-xs opacity-75">
                  ({categoryCounts[cat.id as ServiceCategory | 'all']})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const cardStyle = getCardStyling(service.serviceType);

              return (
              <div
                key={service.id}
                className={`bg-white rounded-2xl border border-[#EFEBE4] ${cardStyle.border} p-6 hover:shadow-lg transition-all duration-300`}
              >
                {/* Service Type Badge */}
                {cardStyle.badge && (
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-3 ${cardStyle.badge.bg} ${cardStyle.badge.text}`}>
                    {cardStyle.badge.label}
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: service.iconBg + '15' }}
                >
                  {service.icon}
                </div>

                {/* Service Info */}
                <h3 className="text-xl font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  {service.source && (
                    <div className="bg-gray-100 px-2 py-1 rounded">
                      Source: {service.source}
                    </div>
                  )}
                  <div className="bg-gray-100 px-2 py-1 rounded">
                    {service.lastUpdate}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {service.features.length > 3 && (
                      <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">
                        +{service.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {/* DIY Button - Show for 'diy' and 'hybrid' */}
                  {(service.serviceType === 'diy' || service.serviceType === 'hybrid') && service.diyPrompt && (
                    <button
                      onClick={() => handleDiyClick(service)}
                      className={`${service.serviceType === 'hybrid' ? 'flex-1' : 'w-full'} bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-semibold py-2 px-4 rounded-lg hover:shadow-md transition-all`}
                    >
                      {service.serviceType === 'hybrid' ? 'DIY (Basic)' : 'DIY'}
                    </button>
                  )}

                  {/* Get Assistance Button - Show for 'backend' and 'hybrid' */}
                  {(service.serviceType === 'backend' || service.serviceType === 'hybrid') && (
                    <button
                      onClick={() => handleGetAssistanceClick(service)}
                      className={`${service.serviceType === 'hybrid' ? 'flex-1' : 'w-full'} bg-white text-[#D4AF37] border-2 border-[#D4AF37] font-semibold py-2 px-4 rounded-lg hover:bg-[#D4AF37] hover:text-white transition-all`}
                    >
                      {service.serviceType === 'hybrid' ? 'Pro Setup' : 'Get Assistance'}
                    </button>
                  )}
                </div>

                {/* Hybrid explanation note - Show only for hybrid services */}
                {service.serviceType === 'hybrid' && service.hybridNote && (
                  <div className="mt-3 text-xs text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <span className="font-semibold text-purple-700">💡 Note:</span> {service.hybridNote}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIY Prompt Modal */}
      {showDiyModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedService.iconBg + '15' }}
                >
                  {selectedService.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display' }}>
                    {selectedService.name} - DIY Prompt
                  </h2>
                  <p className="text-sm text-gray-500">Copy this prompt and paste it into the Website AI Editor</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiyModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  {selectedService.serviceType === 'hybrid'
                    ? 'How to use this DIY prompt (Basic Version):'
                    : 'How to use this prompt:'}
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 ml-6 list-decimal">
                  <li>Click "Copy Prompt" button below</li>
                  <li>Open the Website AI Editor in Renova8</li>
                  <li>Paste the prompt into the editor's chat input</li>
                  <li>Fill in the [BRACKETED] sections with your specific details</li>
                  <li>Let AI generate the feature for your website!</li>
                </ol>

                {/* Hybrid note */}
                {selectedService.serviceType === 'hybrid' && selectedService.hybridNote && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm text-blue-900">
                      <strong>⚠️ Note:</strong> {selectedService.hybridNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Generic DIY Prompt:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {selectedService.diyPrompt}
                  </pre>
                </div>
              </div>

              {/* Features Included */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Features Included:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyPrompt}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt
                </button>
                <button
                  onClick={() => setShowDiyModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalog;
