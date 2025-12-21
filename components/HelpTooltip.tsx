/**
 * HelpTooltip Component
 *
 * A reusable contextual help icon that displays explanatory tooltips
 * when hovered or clicked. Matches the RenovateMySite brand styling.
 */

import React, { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  /** Unique identifier for looking up tooltip content */
  featureId: string;
  /** Custom tooltip text (overrides featureId lookup) */
  text?: string;
  /** Position of tooltip relative to icon */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Optional link to related KB article */
  articleLink?: string;
  /** Callback when "Learn more" is clicked */
  onLearnMore?: () => void;
}

// Tooltip content lookup by feature ID
const tooltipContent: Record<string, { title: string; text: string; articleId?: string }> = {
  // Lead Finder
  'lead-finder-radius': {
    title: 'Search Radius',
    text: 'Set the distance from your target location to find businesses. Larger radius = more results but less targeted.',
    articleId: 'lead-finder-basics',
  },
  'lead-finder-type': {
    title: 'Business Type',
    text: 'Enter specific business types like "dentist", "restaurant", or "auto repair" to find relevant leads.',
    articleId: 'lead-finder-basics',
  },
  'lead-finder-location': {
    title: 'Target Location',
    text: 'Enter a city, zip code, or address. We use Google Maps to find businesses in that area.',
    articleId: 'lead-finder-basics',
  },

  // Website Builder
  'website-template': {
    title: 'Website Template',
    text: 'Choose a starting template for your website. AI will customize it based on the business details.',
    articleId: 'website-builder-guide',
  },
  'website-publish': {
    title: 'Publish Website',
    text: 'Publishing makes your website live on the internet. You\'ll get a free URL, or you can connect a custom domain.',
    articleId: 'publishing-websites',
  },
  'website-preview': {
    title: 'Preview Mode',
    text: 'See how your website looks on desktop and mobile before publishing.',
    articleId: 'website-builder-guide',
  },

  // Custom Domain
  'dns-records': {
    title: 'DNS Records',
    text: 'DNS records tell the internet where to find your website. Add these records at your domain registrar (like GoDaddy or Namecheap).',
    articleId: 'custom-domain-setup',
  },
  'ssl-certificate': {
    title: 'SSL Certificate',
    text: 'SSL encrypts data between visitors and your website. We automatically provision a free SSL certificate for all domains.',
    articleId: 'custom-domain-setup',
  },
  'txt-verification': {
    title: 'TXT Verification',
    text: 'A TXT record proves you own the domain. This is a one-time verification step.',
    articleId: 'custom-domain-setup',
  },

  // Marketing
  'campaign-strategy': {
    title: 'Campaign Strategy',
    text: 'AI analyzes the business and suggests marketing approaches based on their industry and target audience.',
    articleId: 'marketing-studio',
  },
  'content-types': {
    title: 'Content Types',
    text: 'Choose between social posts, email campaigns, blog articles, and more based on your marketing goals.',
    articleId: 'marketing-studio',
  },

  // Billing
  'credit-system': {
    title: 'Credit System',
    text: 'Credits are used for AI operations like finding leads, generating websites, and creating content. Different actions cost different amounts.',
    articleId: 'billing-credits',
  },
  'subscription-tiers': {
    title: 'Subscription Plans',
    text: 'Higher plans include more monthly credits and additional features. You can upgrade or downgrade anytime.',
    articleId: 'billing-credits',
  },
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  featureId,
  text,
  position = 'top',
  size = 'md',
  articleLink,
  onLearnMore,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  // Get tooltip content from lookup or use custom text
  const content = tooltipContent[featureId];
  const displayText = text || content?.text || 'Help information not available.';
  const displayTitle = content?.title;

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  // Position classes for tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent',
  };

  // Adjust position if tooltip would go off-screen
  useEffect(() => {
    if (isVisible && tooltipRef.current && iconRef.current) {
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = position;

      if (position === 'top' && tooltip.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltip.bottom > viewport.height) {
        newPosition = 'top';
      } else if (position === 'left' && tooltip.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltip.right > viewport.width) {
        newPosition = 'left';
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore();
    } else if (articleLink) {
      // Navigate to article
      window.location.href = articleLink;
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={iconRef}
        type="button"
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white flex items-center justify-center hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Help"
        aria-describedby={isVisible ? `tooltip-${featureId}` : undefined}
      >
        <span className="font-bold leading-none">?</span>
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={`tooltip-${featureId}`}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[actualPosition]} w-64 max-w-xs`}
        >
          <div className="bg-gray-800 text-white rounded-xl shadow-lg p-4 text-sm">
            {displayTitle && (
              <h4 className="font-bold text-[#D4AF37] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                {displayTitle}
              </h4>
            )}
            <p className="text-gray-200 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {displayText}
            </p>
            {(content?.articleId || articleLink || onLearnMore) && (
              <button
                onClick={handleLearnMore}
                className="mt-2 text-[#D4AF37] hover:text-[#E5C048] text-xs font-semibold flex items-center gap-1"
              >
                Learn more
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`} />
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
