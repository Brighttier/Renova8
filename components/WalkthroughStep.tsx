import React, { useEffect, useState, useRef } from 'react';

interface WalkthroughStepProps {
  type: 'modal' | 'spotlight';
  title: string;
  description: string;
  graphic: React.ReactNode;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  currentStep: number;
  totalSteps: number;
  primaryCta: {
    text: string;
    onClick: () => void;
  };
  secondaryCta?: {
    text: string;
    onClick: () => void;
  };
  onSkip: () => void;
}

interface SpotlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const WalkthroughStep: React.FC<WalkthroughStepProps> = ({
  type,
  title,
  description,
  graphic,
  targetSelector,
  position = 'right',
  currentStep,
  totalSteps,
  primaryCta,
  secondaryCta,
  onSkip,
}) => {
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === 'spotlight' && targetSelector) {
      const updatePosition = () => {
        const element = document.querySelector(targetSelector);
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
          const tooltipWidth = 340;
          const tooltipHeight = 300;
          let top = 0;
          let left = 0;

          switch (position) {
            case 'right':
              top = rect.top + rect.height / 2 - tooltipHeight / 2;
              left = rect.right + 20;
              break;
            case 'left':
              top = rect.top + rect.height / 2 - tooltipHeight / 2;
              left = rect.left - tooltipWidth - 20;
              break;
            case 'bottom':
              top = rect.bottom + 20;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
              break;
            case 'top':
              top = rect.top - tooltipHeight - 20;
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
    }
  }, [type, targetSelector, position]);

  // Modal style (centered full-screen overlay)
  if (type === 'modal') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
          {/* Graphic area */}
          <div className="bg-gradient-to-br from-[#F9F6F0] to-white p-8 flex items-center justify-center h-48">
            <div className="w-40 h-40">
              {graphic}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold font-serif text-[#4A4A4A] mb-3">{title}</h2>
            <p className="text-[#4A4A4A]/70 mb-8 leading-relaxed">{description}</p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-[#D4AF37]'
                      : idx < currentStep
                      ? 'bg-[#2E7D32]'
                      : 'bg-[#EFEBE4]'
                  }`}
                />
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={primaryCta.onClick}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {primaryCta.text}
              </button>
              {secondaryCta && (
                <button
                  onClick={secondaryCta.onClick}
                  className="w-full text-[#4A4A4A]/50 py-2 font-medium hover:text-[#4A4A4A] transition-colors"
                >
                  {secondaryCta.text}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spotlight style (highlight element with tooltip)
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <rect
                x={spotlightPos.x}
                y={spotlightPos.y}
                width={spotlightPos.width}
                height={spotlightPos.height}
                rx="12"
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
          fill="rgba(0,0,0,0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border/glow effect */}
      {spotlightPos && (
        <div
          className="absolute pointer-events-none rounded-xl border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.5)]"
          style={{
            left: spotlightPos.x,
            top: spotlightPos.y,
            width: spotlightPos.width,
            height: spotlightPos.height,
          }}
        >
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-xl border-2 border-[#D4AF37] animate-ping opacity-50" />
        </div>
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-2xl shadow-2xl w-[340px] overflow-hidden animate-slideIn pointer-events-auto"
        style={tooltipStyle}
      >
        {/* Graphic area */}
        <div className="bg-gradient-to-br from-[#F9F6F0] to-white p-6 flex items-center justify-center h-36">
          <div className="w-28 h-28">
            {graphic}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold font-serif text-[#4A4A4A] mb-2">{title}</h3>
          <p className="text-[#4A4A4A]/70 text-sm mb-6 leading-relaxed">{description}</p>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-4 bg-[#D4AF37]'
                      : idx < currentStep
                      ? 'bg-[#2E7D32]'
                      : 'bg-[#EFEBE4]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#4A4A4A]/40 font-medium">
              {currentStep + 1} of {totalSteps}
            </span>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-2.5 text-[#4A4A4A]/50 font-medium text-sm hover:text-[#4A4A4A] transition-colors border border-[#EFEBE4] rounded-lg hover:bg-[#F9F6F0]"
            >
              Skip Tour
            </button>
            <button
              onClick={primaryCta.onClick}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              {primaryCta.text}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
