import React, { useState, useEffect, useCallback } from 'react';

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface PageTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete: () => void;
}

interface SpotlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PageTour: React.FC<PageTourProps> = ({ tourId, steps, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(true);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!currentStep) return;

    const updatePosition = () => {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setSpotlightPos({
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 300;
        const tooltipHeight = 140;
        let top = 0;
        let left = 0;

        switch (currentStep.position) {
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + 16;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - 16;
            break;
          case 'bottom':
            top = rect.bottom + 16;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'top':
            top = rect.top - tooltipHeight - 16;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
        }

        // Keep tooltip within viewport
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

        setTooltipStyle({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, steps.length]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(`renova8_tour_${tourId}`, 'true');
    setIsVisible(false);
    onComplete();
  }, [tourId, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isVisible || !currentStep) return null;

  return (
    <>
      <style>{`
        @keyframes pageTourFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pageTourSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-tour-fadeIn {
          animation: pageTourFadeIn 0.3s ease-out forwards;
        }
        .page-tour-slideIn {
          animation: pageTourSlideIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-[150] pointer-events-none page-tour-fadeIn">
        {/* Dark overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id={`page-spotlight-mask-${tourId}`}>
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightPos && (
                <rect
                  x={spotlightPos.x}
                  y={spotlightPos.y}
                  width={spotlightPos.width}
                  height={spotlightPos.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask={`url(#page-spotlight-mask-${tourId})`}
          />
        </svg>

        {/* Spotlight border */}
        {spotlightPos && (
          <div
            className="absolute pointer-events-none rounded-lg border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            style={{
              left: spotlightPos.x,
              top: spotlightPos.y,
              width: spotlightPos.width,
              height: spotlightPos.height,
            }}
          />
        )}

        {/* Tooltip card */}
        <div
          className="absolute bg-white rounded-xl shadow-xl w-[300px] overflow-hidden page-tour-slideIn pointer-events-auto"
          style={tooltipStyle}
        >
          <div className="p-4">
            <h3 className="text-base font-bold font-serif text-[#4A4A4A] mb-1">
              {currentStep.title}
            </h3>
            <p className="text-[#4A4A4A]/70 text-sm leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Progress and actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-3 bg-[#D4AF37]'
                        : idx < currentStepIndex
                        ? 'bg-[#2E7D32]'
                        : 'bg-[#EFEBE4]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-xs text-[#4A4A4A]/50 font-medium hover:text-[#4A4A4A] transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  {currentStepIndex === steps.length - 1 ? 'Got it!' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Tour configurations for each page
export const SCOUT_TOUR_STEPS: TourStep[] = [
  {
    id: 'search-form',
    targetSelector: '[data-tour="scout-search"]',
    title: 'Search for Businesses',
    description: 'Enter a business type (like "Bakeries" or "Yoga Studios") and a location to find potential customers.',
    position: 'bottom',
  },
  {
    id: 'results',
    targetSelector: '[data-tour="scout-results"]',
    title: 'Browse Results',
    description: 'View matching businesses with their details. Click "Save List" to add them to your clients or "Start Work" to begin immediately.',
    position: 'top',
  },
];

export const EDITOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'customer-select',
    targetSelector: '[data-tour="editor-customers"]',
    title: 'Select a Customer',
    description: 'Choose a customer to edit their website. Only customers with generated websites will appear here.',
    position: 'right',
  },
  {
    id: 'ai-prompt',
    targetSelector: '[data-tour="editor-prompt"]',
    title: 'AI-Powered Editing',
    description: 'Type what you want to change in plain English. Try "Change the primary color to blue" or "Add a testimonials section".',
    position: 'bottom',
  },
  {
    id: 'preview',
    targetSelector: '[data-tour="editor-preview"]',
    title: 'Live Preview',
    description: 'See your changes in real-time. The preview updates automatically as you make edits.',
    position: 'left',
  },
  {
    id: 'actions',
    targetSelector: '[data-tour="editor-actions"]',
    title: 'Save & Publish',
    description: 'Save your changes as a draft or publish the website when ready. You can also undo/redo changes.',
    position: 'bottom',
  },
];

export const ARCHIVES_TOUR_STEPS: TourStep[] = [
  {
    id: 'customer-list',
    targetSelector: '[data-tour="archives-customers"]',
    title: 'Select a Customer',
    description: 'Choose a customer from the list to view all their generated content and campaign history.',
    position: 'right',
  },
  {
    id: 'timeline',
    targetSelector: '[data-tour="archives-timeline"]',
    title: 'Content Timeline',
    description: 'View all generated assets in chronological order - strategies, images, emails, and websites.',
    position: 'left',
  },
];

// Helper hook to check and show page tours
export const usePageTour = (tourId: string) => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`renova8_tour_${tourId}`) === 'true';
    const hasSeenMainWalkthrough = localStorage.getItem('renova8_walkthrough_complete') === 'true';

    // Only show page tour if main walkthrough is complete and this page tour hasn't been seen
    if (hasSeenMainWalkthrough && !hasSeenTour) {
      // Small delay to let the page render
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [tourId]);

  const completeTour = useCallback(() => {
    setShowTour(false);
  }, []);

  return { showTour, completeTour };
};
