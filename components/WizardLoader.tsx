import React from 'react';

/**
 * WizardLoader - A tech-wizard loading animation for the AI website builder
 *
 * Features:
 * - Minimalist geometric wizard SVG
 * - Floating code blocks and wireframe elements
 * - Magic sparkles and glowing orb
 * - Smooth CSS animations
 * - Configurable size (small, medium, large)
 */

interface WizardLoaderProps {
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: {
    container: 'w-40 h-40',
    minHeight: 'min-h-[240px]',
    text: 'text-base',
    subtext: 'text-xs'
  },
  medium: {
    container: 'w-56 h-56',
    minHeight: 'min-h-[320px]',
    text: 'text-lg',
    subtext: 'text-sm'
  },
  large: {
    container: 'w-72 h-72',
    minHeight: 'min-h-[400px]',
    text: 'text-xl',
    subtext: 'text-sm'
  }
};

const WizardLoader: React.FC<WizardLoaderProps> = ({
  title = "Constructing your vision...",
  subtitle = "AI is assembling the layout",
  size = 'medium'
}) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${config.minHeight} bg-white w-full`}>
      {/* CSS Keyframes - injected via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) translateY(0); }
          50% { opacity: 1; transform: scale(1) translateY(-10px); }
        }

        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.9));
          }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes codeFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.7; }
          25% { transform: translateY(-5px) translateX(2px); opacity: 1; }
          50% { transform: translateY(-10px) translateX(0); opacity: 0.8; }
          75% { transform: translateY(-5px) translateX(-2px); opacity: 1; }
        }

        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse 2s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .animate-code-float { animation: codeFloat 3.5s ease-in-out infinite; }
      `}</style>

      {/* ANIMATION CONTAINER */}
      <div className={`relative ${config.container}`}>

        {/* Floating Code Block - Top Right */}
        <div
          className="absolute -top-2 right-4 animate-code-float"
          style={{ animationDelay: '0s' }}
        >
          <div className="w-12 h-8 border-2 border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
            <div className="h-1.5 w-6 bg-slate-200 rounded m-1"></div>
            <div className="h-1 w-8 bg-slate-100 rounded mx-1"></div>
            <div className="h-1 w-4 bg-slate-100 rounded mx-1 mt-0.5"></div>
          </div>
        </div>

        {/* Floating Wireframe - Top Left */}
        <div
          className="absolute top-4 -left-2 animate-code-float"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="w-10 h-12 border-2 border-slate-200 rounded-md bg-white shadow-sm p-1">
            <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
            <div className="flex gap-0.5">
              <div className="h-4 w-3 bg-slate-100 rounded"></div>
              <div className="h-4 flex-1 bg-slate-50 rounded"></div>
            </div>
          </div>
        </div>

        {/* Floating Browser Window - Bottom Right */}
        <div
          className="absolute bottom-8 -right-4 animate-code-float"
          style={{ animationDelay: '1s' }}
        >
          <div className="w-14 h-10 border-2 border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
            <div className="h-2 bg-slate-100 flex items-center px-1 gap-0.5">
              <div className="w-1 h-1 rounded-full bg-red-300"></div>
              <div className="w-1 h-1 rounded-full bg-yellow-300"></div>
              <div className="w-1 h-1 rounded-full bg-green-300"></div>
            </div>
            <div className="p-1">
              <div className="h-1 w-8 bg-slate-100 rounded"></div>
              <div className="h-1 w-6 bg-slate-50 rounded mt-0.5"></div>
            </div>
          </div>
        </div>

        {/* Floating Tag Element - Left Side */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 animate-float-slow"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="text-slate-300 text-xs font-mono">&lt;/&gt;</div>
        </div>

        {/* THE WIZARD SVG */}
        <svg viewBox="0 0 200 220" className="w-full h-full animate-breathe">
          <defs>
            {/* Gradient for robes */}
            <linearGradient id="robeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E1AD01" />
              <stop offset="100%" stopColor="#C99700" />
            </linearGradient>

            {/* Gradient for hat */}
            <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E1AD01" />
              <stop offset="100%" stopColor="#D4A000" />
            </linearGradient>

            {/* Glow filter for orb */}
            <filter id="orbGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Shadow filter */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>

          {/* === WIZARD BODY === */}
          <g filter="url(#shadow)">
            {/* Robes - Main body */}
            <path
              d="M100 85 L70 190 Q100 200 130 190 L100 85 Z"
              fill="url(#robeGradient)"
              stroke="#B8960A"
              strokeWidth="1"
            />

            {/* Robes - Left fold */}
            <path
              d="M85 100 L65 185 Q75 188 85 185 L95 110 Z"
              fill="#D4A000"
              opacity="0.7"
            />

            {/* Robes - Right fold */}
            <path
              d="M115 100 L135 185 Q125 188 115 185 L105 110 Z"
              fill="#EDBE00"
              opacity="0.5"
            />

            {/* Belt/Sash */}
            <ellipse cx="100" cy="120" rx="18" ry="5" fill="#3D3D3D" />

            {/* Head/Face (simplified geometric) */}
            <circle cx="100" cy="70" r="18" fill="#FBE8D3" stroke="#E8D4BC" strokeWidth="1" />

            {/* Beard (geometric) */}
            <path
              d="M88 78 Q100 105 112 78 Q100 90 88 78 Z"
              fill="#E0E0E0"
            />

            {/* === WIZARD HAT === */}
            <path
              d="M100 15 L75 60 Q100 65 125 60 L100 15 Z"
              fill="url(#hatGradient)"
              stroke="#B8960A"
              strokeWidth="1"
            />

            {/* Hat band */}
            <path
              d="M75 58 Q100 68 125 58 Q100 62 75 58"
              fill="#3D3D3D"
              stroke="#3D3D3D"
              strokeWidth="3"
            />

            {/* Hat brim */}
            <ellipse cx="100" cy="60" rx="30" ry="8" fill="#D4A000" />

            {/* Star on hat */}
            <polygon
              points="100,25 102,32 109,32 103,36 106,43 100,39 94,43 97,36 91,32 98,32"
              fill="#8B5CF6"
              className="animate-pulse-glow"
            />
          </g>

          {/* === STAFF === */}
          <g>
            {/* Staff pole */}
            <rect
              x="138"
              y="50"
              width="5"
              height="140"
              rx="2"
              fill="#3D3D3D"
              transform="rotate(10, 140, 120)"
            />

            {/* Staff ornament rings */}
            <ellipse cx="152" cy="65" rx="4" ry="2" fill="#5D5D5D" transform="rotate(10, 152, 65)" />
            <ellipse cx="150" cy="75" rx="3" ry="1.5" fill="#5D5D5D" transform="rotate(10, 150, 75)" />

            {/* Magic Orb */}
            <g className="animate-glow">
              <circle
                cx="155"
                cy="45"
                r="14"
                fill="#8B5CF6"
                filter="url(#orbGlow)"
                opacity="0.9"
              />
              <circle cx="155" cy="45" r="10" fill="#A78BFA" />
              <circle cx="151" cy="41" r="3" fill="#C4B5FD" opacity="0.8" />
            </g>
          </g>

          {/* === ARM holding staff === */}
          <path
            d="M115 95 Q135 90 145 100 Q140 110 120 105 Z"
            fill="#E1AD01"
            stroke="#B8960A"
            strokeWidth="0.5"
          />

          {/* Hand */}
          <circle cx="143" cy="98" r="6" fill="#FBE8D3" />

          {/* === MAGIC SPARKLES === */}
          <g className="animate-sparkle" style={{ animationDelay: '0s' }}>
            <circle cx="165" cy="30" r="2" fill="#8B5CF6" />
          </g>
          <g className="animate-sparkle" style={{ animationDelay: '0.3s' }}>
            <circle cx="175" cy="45" r="1.5" fill="#A78BFA" />
          </g>
          <g className="animate-sparkle" style={{ animationDelay: '0.6s' }}>
            <circle cx="160" cy="25" r="1" fill="#C4B5FD" />
          </g>
          <g className="animate-sparkle" style={{ animationDelay: '0.9s' }}>
            <polygon
              points="170,35 171,38 174,38 172,40 173,43 170,41 167,43 168,40 166,38 169,38"
              fill="#8B5CF6"
            />
          </g>
          <g className="animate-sparkle" style={{ animationDelay: '1.2s' }}>
            <circle cx="180" cy="55" r="1.5" fill="#8B5CF6" />
          </g>

          {/* Magic trail from orb */}
          <path
            d="M155 55 Q160 70 150 85 Q145 95 155 105"
            stroke="#8B5CF6"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            strokeDasharray="4 4"
            className="animate-pulse-glow"
          />
        </svg>

        {/* Additional floating sparkles around the wizard */}
        <div
          className="absolute top-1/4 right-8 w-2 h-2 bg-purple-400 rounded-full animate-sparkle"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="absolute top-1/3 right-4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-sparkle"
          style={{ animationDelay: '0.7s' }}
        />
        <div
          className="absolute top-1/4 right-12 w-1 h-1 bg-purple-500 rounded-full animate-sparkle"
          style={{ animationDelay: '1.1s' }}
        />
      </div>

      {/* LOADING TEXT */}
      <div className="mt-4 text-center">
        <h3 className={`${config.text} font-bold text-slate-800`}>{title}</h3>
        <p className={`text-slate-500 ${config.subtext} mt-1`}>{subtitle}</p>

        {/* Animated dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div
            className="w-2 h-2 bg-[#E1AD01] rounded-full animate-pulse-glow"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="w-2 h-2 bg-[#E1AD01] rounded-full animate-pulse-glow"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 bg-[#E1AD01] rounded-full animate-pulse-glow"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardLoader;
