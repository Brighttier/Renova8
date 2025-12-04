import React from 'react';

// Welcome Graphic - Logo with sparkles
export const WelcomeGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Background glow */}
    <defs>
      <radialGradient id="welcomeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="80" fill="url(#welcomeGlow)" />

    {/* Main R8 Circle */}
    <circle cx="100" cy="100" r="50" fill="url(#goldGradient)" />
    <text x="100" y="115" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="serif">R8.</text>

    {/* Sparkles */}
    <g className="animate-pulse">
      <polygon points="40,40 42,48 50,50 42,52 40,60 38,52 30,50 38,48" fill="#D4AF37" />
      <polygon points="160,40 162,46 168,48 162,50 160,56 158,50 152,48 158,46" fill="#D4AF37" />
      <polygon points="50,150 52,156 58,158 52,160 50,166 48,160 42,158 48,156" fill="#D4AF37" />
      <polygon points="150,150 152,156 158,158 152,160 150,166 148,160 142,158 148,156" fill="#D4AF37" />
    </g>

    {/* Orbiting dots */}
    <circle cx="100" cy="30" r="4" fill="#D4AF37" opacity="0.8">
      <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
    </circle>
    <circle cx="100" cy="170" r="3" fill="#B8963A" opacity="0.6">
      <animateTransform attributeName="transform" type="rotate" from="180 100 100" to="540 100 100" dur="10s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// Sidebar/Navigation Graphic
export const SidebarGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="sidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A" />
        <stop offset="100%" stopColor="#2A2A2A" />
      </linearGradient>
    </defs>

    {/* Sidebar shape */}
    <rect x="30" y="30" width="60" height="140" rx="12" fill="url(#sidebarGrad)" />

    {/* Menu items */}
    <rect x="40" y="50" width="40" height="8" rx="4" fill="#D4AF37" />
    <rect x="40" y="70" width="35" height="8" rx="4" fill="white" opacity="0.3" />
    <rect x="40" y="90" width="38" height="8" rx="4" fill="white" opacity="0.3" />
    <rect x="40" y="110" width="32" height="8" rx="4" fill="white" opacity="0.3" />
    <rect x="40" y="130" width="36" height="8" rx="4" fill="white" opacity="0.3" />

    {/* Main content area */}
    <rect x="100" y="30" width="70" height="140" rx="12" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="2" />
    <rect x="110" y="50" width="50" height="30" rx="6" fill="#D4AF37" opacity="0.2" />
    <rect x="110" y="90" width="50" height="20" rx="6" fill="#EFEBE4" />
    <rect x="110" y="120" width="50" height="20" rx="6" fill="#EFEBE4" />

    {/* Arrow pointing to sidebar */}
    <path d="M180,100 L195,100 M190,95 L195,100 L190,105" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" fill="none">
      <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

// Wizard/Rocket Graphic
export const WizardGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Rocket body */}
    <path d="M100,30 C120,30 130,60 130,100 L130,130 L100,145 L70,130 L70,100 C70,60 80,30 100,30Z" fill="url(#rocketGrad)" />

    {/* Rocket window */}
    <circle cx="100" cy="80" r="15" fill="white" />
    <circle cx="100" cy="80" r="10" fill="#4A4A4A" />

    {/* Rocket fins */}
    <path d="M70,110 L50,140 L70,130Z" fill="#4A4A4A" />
    <path d="M130,110 L150,140 L130,130Z" fill="#4A4A4A" />

    {/* Flames */}
    <g>
      <ellipse cx="85" cy="160" rx="8" ry="15" fill="#FF6B35" opacity="0.8">
        <animate attributeName="ry" values="15;20;15" dur="0.3s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="100" cy="165" rx="10" ry="20" fill="#FFB347">
        <animate attributeName="ry" values="20;25;20" dur="0.4s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="115" cy="160" rx="8" ry="15" fill="#FF6B35" opacity="0.8">
        <animate attributeName="ry" values="15;18;15" dur="0.35s" repeatCount="indefinite" />
      </ellipse>
    </g>

    {/* Stars */}
    <circle cx="40" cy="50" r="3" fill="#D4AF37" />
    <circle cx="160" cy="70" r="2" fill="#D4AF37" />
    <circle cx="30" cy="120" r="2" fill="#B8963A" />
    <circle cx="170" cy="40" r="3" fill="#B8963A" />
  </svg>
);

// Workflow Steps Graphic
export const WorkflowGraphic: React.FC = () => (
  <svg viewBox="0 0 280 100" className="w-full h-full">
    <defs>
      <linearGradient id="stepGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Step circles with icons */}
    {[
      { x: 30, icon: "🔍", label: "Find" },
      { x: 85, icon: "🧠", label: "Analyze" },
      { x: 140, icon: "🎨", label: "Visualize" },
      { x: 195, icon: "💻", label: "Build" },
      { x: 250, icon: "💌", label: "Pitch" }
    ].map((step, idx) => (
      <g key={idx}>
        {/* Connecting line */}
        {idx < 4 && (
          <line x1={step.x + 15} y1="40" x2={step.x + 40} y2="40" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4,2">
            <animate attributeName="stroke-dashoffset" from="6" to="0" dur="1s" repeatCount="indefinite" />
          </line>
        )}

        {/* Circle */}
        <circle cx={step.x} cy="40" r="20" fill="url(#stepGold)" />
        <text x={step.x} y="46" textAnchor="middle" fontSize="16">{step.icon}</text>

        {/* Label */}
        <text x={step.x} y="75" textAnchor="middle" fontSize="10" fill="#4A4A4A" fontWeight="600">{step.label}</text>
      </g>
    ))}
  </svg>
);

// Clients/CRM Graphic
export const ClientsGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="personGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Central person */}
    <circle cx="100" cy="70" r="25" fill="url(#personGrad)" />
    <circle cx="100" cy="55" r="12" fill="white" />
    <path d="M75,120 Q100,90 125,120" fill="url(#personGrad)" />

    {/* Left person */}
    <circle cx="45" cy="100" r="18" fill="#4A4A4A" opacity="0.7" />
    <circle cx="45" cy="90" r="8" fill="white" opacity="0.5" />
    <path d="M28,135 Q45,115 62,135" fill="#4A4A4A" opacity="0.7" />

    {/* Right person */}
    <circle cx="155" cy="100" r="18" fill="#4A4A4A" opacity="0.7" />
    <circle cx="155" cy="90" r="8" fill="white" opacity="0.5" />
    <path d="M138,135 Q155,115 172,135" fill="#4A4A4A" opacity="0.7" />

    {/* Connection lines */}
    <line x1="75" y1="85" x2="60" y2="95" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4,2" />
    <line x1="125" y1="85" x2="140" y2="95" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4,2" />

    {/* Status badges */}
    <circle cx="65" cy="80" r="8" fill="#2E7D32" />
    <text x="65" y="84" textAnchor="middle" fill="white" fontSize="10">✓</text>

    {/* Cards below */}
    <rect x="40" y="150" width="50" height="35" rx="6" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <rect x="110" y="150" width="50" height="35" rx="6" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <rect x="50" y="160" width="30" height="4" rx="2" fill="#D4AF37" opacity="0.5" />
    <rect x="50" y="170" width="25" height="4" rx="2" fill="#EFEBE4" />
    <rect x="120" y="160" width="30" height="4" rx="2" fill="#D4AF37" opacity="0.5" />
    <rect x="120" y="170" width="25" height="4" rx="2" fill="#EFEBE4" />
  </svg>
);

// Credits/Coins Graphic
export const CreditsGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#F5D76E" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
      <filter id="coinShadow">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* Stacked coins */}
    <g filter="url(#coinShadow)">
      {/* Bottom coin */}
      <ellipse cx="100" cy="140" rx="45" ry="12" fill="#8B7355" />
      <ellipse cx="100" cy="135" rx="45" ry="12" fill="url(#coinGrad)" />

      {/* Middle coin */}
      <ellipse cx="100" cy="115" rx="45" ry="12" fill="#8B7355" />
      <ellipse cx="100" cy="110" rx="45" ry="12" fill="url(#coinGrad)" />

      {/* Top coin */}
      <ellipse cx="100" cy="90" rx="45" ry="12" fill="#8B7355" />
      <ellipse cx="100" cy="85" rx="45" ry="12" fill="url(#coinGrad)" />
    </g>

    {/* Dollar sign on top coin */}
    <text x="100" y="92" textAnchor="middle" fill="#4A4A4A" fontSize="20" fontWeight="bold">$</text>

    {/* Floating coin with animation */}
    <g>
      <ellipse cx="150" cy="55" rx="20" ry="6" fill="url(#coinGrad)">
        <animate attributeName="cy" values="55;45;55" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <text x="150" y="58" textAnchor="middle" fill="#4A4A4A" fontSize="10" fontWeight="bold">
        <animate attributeName="y" values="58;48;58" dur="2s" repeatCount="indefinite" />
        $
      </text>
    </g>

    {/* Plus signs */}
    <text x="45" y="70" fill="#D4AF37" fontSize="24" fontWeight="bold" opacity="0.6">+</text>
    <text x="165" y="100" fill="#D4AF37" fontSize="18" fontWeight="bold" opacity="0.4">+</text>

    {/* Sparkle */}
    <polygon points="60,50 62,56 68,58 62,60 60,66 58,60 52,58 58,56" fill="#D4AF37">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
    </polygon>
  </svg>
);

// Scout Customers Graphic
export const ScoutGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="scoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Magnifying glass */}
    <circle cx="85" cy="85" r="40" fill="none" stroke="url(#scoutGrad)" strokeWidth="8" />
    <line x1="115" y1="115" x2="150" y2="150" stroke="url(#scoutGrad)" strokeWidth="10" strokeLinecap="round" />

    {/* Map pin inside */}
    <path d="M85,60 C75,60 67,68 67,78 C67,93 85,105 85,105 C85,105 103,93 103,78 C103,68 95,60 85,60 Z" fill="#D4AF37" />
    <circle cx="85" cy="78" r="8" fill="white" />

    {/* Location dots */}
    <circle cx="40" cy="140" r="6" fill="#D4AF37" opacity="0.5">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="160" cy="50" r="5" fill="#D4AF37" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="170" cy="130" r="4" fill="#B8963A" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
    </circle>

    {/* Search lines */}
    <rect x="140" y="165" width="40" height="6" rx="3" fill="#EFEBE4" />
    <rect x="140" y="178" width="30" height="6" rx="3" fill="#EFEBE4" />
  </svg>
);

// Website Editor Graphic
export const EditorGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="editorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Browser window */}
    <rect x="25" y="30" width="150" height="120" rx="8" fill="white" stroke="#EFEBE4" strokeWidth="2" />
    <rect x="25" y="30" width="150" height="25" rx="8" fill="#4A4A4A" />
    <circle cx="40" cy="42" r="5" fill="#FF5F57" />
    <circle cx="55" cy="42" r="5" fill="#FEBC2E" />
    <circle cx="70" cy="42" r="5" fill="#28C840" />

    {/* Content blocks */}
    <rect x="35" y="65" width="60" height="8" rx="2" fill="#D4AF37" />
    <rect x="35" y="80" width="130" height="6" rx="2" fill="#EFEBE4" />
    <rect x="35" y="92" width="110" height="6" rx="2" fill="#EFEBE4" />
    <rect x="35" y="108" width="50" height="30" rx="4" fill="#F9F6F0" stroke="#D4AF37" strokeWidth="1" />
    <rect x="95" y="108" width="70" height="30" rx="4" fill="#F9F6F0" />

    {/* Cursor/edit icon */}
    <g transform="translate(145, 95)">
      <path d="M0,30 L8,22 L22,36 L14,44 Z" fill="url(#editorGrad)" />
      <path d="M8,22 L14,16 L28,30 L22,36 Z" fill="#4A4A4A" />
      <path d="M14,16 L20,10 L22,12 L16,18 Z" fill="url(#editorGrad)" />
    </g>

    {/* Color palette dots */}
    <circle cx="50" cy="165" r="10" fill="#D4AF37" />
    <circle cx="75" cy="165" r="10" fill="#4A4A4A" />
    <circle cx="100" cy="165" r="10" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <circle cx="125" cy="165" r="10" fill="#2E7D32" />
    <circle cx="150" cy="165" r="10" fill="#1976D2" />
  </svg>
);

// Archives Graphic
export const ArchivesGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="archiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Archive box */}
    <rect x="40" y="60" width="120" height="100" rx="8" fill="white" stroke="#EFEBE4" strokeWidth="2" />
    <rect x="40" y="60" width="120" height="30" rx="8" fill="url(#archiveGrad)" />
    <rect x="85" y="70" width="30" height="10" rx="3" fill="white" opacity="0.5" />

    {/* Folder tabs */}
    <rect x="50" y="100" width="100" height="15" rx="3" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <rect x="55" y="104" width="40" height="6" rx="2" fill="#D4AF37" opacity="0.5" />

    <rect x="50" y="120" width="100" height="15" rx="3" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <rect x="55" y="124" width="35" height="6" rx="2" fill="#4A4A4A" opacity="0.3" />

    <rect x="50" y="140" width="100" height="15" rx="3" fill="#F9F6F0" stroke="#EFEBE4" strokeWidth="1" />
    <rect x="55" y="144" width="45" height="6" rx="2" fill="#4A4A4A" opacity="0.3" />

    {/* Clock icon */}
    <circle cx="160" cy="45" r="20" fill="white" stroke="#D4AF37" strokeWidth="2" />
    <line x1="160" y1="45" x2="160" y2="35" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" />
    <line x1="160" y1="45" x2="170" y2="50" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <circle cx="160" cy="45" r="2" fill="#D4AF37" />

    {/* Stats */}
    <text x="175" y="110" fontSize="10" fill="#4A4A4A" opacity="0.5">12</text>
    <text x="175" y="130" fontSize="10" fill="#4A4A4A" opacity="0.5">8</text>
    <text x="175" y="150" fontSize="10" fill="#4A4A4A" opacity="0.5">5</text>
  </svg>
);

// Completion/Celebration Graphic
export const CompletionGraphic: React.FC = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#F5D76E" />
        <stop offset="100%" stopColor="#B8963A" />
      </linearGradient>
    </defs>

    {/* Trophy cup */}
    <path d="M70,60 L70,40 L130,40 L130,60 C130,90 115,110 100,115 C85,110 70,90 70,60Z" fill="url(#trophyGrad)" />

    {/* Trophy handles */}
    <path d="M70,50 C50,50 45,70 55,80 L70,75" fill="none" stroke="url(#trophyGrad)" strokeWidth="8" strokeLinecap="round" />
    <path d="M130,50 C150,50 155,70 145,80 L130,75" fill="none" stroke="url(#trophyGrad)" strokeWidth="8" strokeLinecap="round" />

    {/* Trophy base */}
    <rect x="85" y="115" width="30" height="10" fill="#4A4A4A" />
    <rect x="75" y="125" width="50" height="8" rx="2" fill="#4A4A4A" />
    <rect x="70" y="133" width="60" height="10" rx="3" fill="#4A4A4A" />

    {/* Star on trophy */}
    <polygon points="100,55 104,68 118,68 107,77 111,90 100,81 89,90 93,77 82,68 96,68" fill="white" />

    {/* Confetti */}
    <rect x="40" y="30" width="8" height="8" rx="1" fill="#D4AF37" transform="rotate(15 44 34)">
      <animate attributeName="y" values="30;180" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="160" y="25" width="6" height="6" rx="1" fill="#2E7D32" transform="rotate(-20 163 28)">
      <animate attributeName="y" values="25;175" dur="2.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="2.5s" repeatCount="indefinite" />
    </rect>
    <circle cx="30" cy="40" r="4" fill="#D4AF37">
      <animate attributeName="cy" values="40;190" dur="3.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="3.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="175" cy="35" r="3" fill="#B8963A">
      <animate attributeName="cy" values="35;185" dur="2.8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="2.8s" repeatCount="indefinite" />
    </circle>
    <rect x="55" y="20" width="5" height="12" rx="1" fill="#4A4A4A" opacity="0.6" transform="rotate(30 57.5 26)">
      <animate attributeName="y" values="20;170" dur="4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.6;0" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="140" y="15" width="7" height="7" rx="1" fill="#D4AF37" transform="rotate(-15 143.5 18.5)">
      <animate attributeName="y" values="15;165" dur="3.2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="3.2s" repeatCount="indefinite" />
    </rect>

    {/* Burst lines */}
    <line x1="100" y1="5" x2="100" y2="20" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
    </line>
    <line x1="130" y1="15" x2="140" y2="5" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
    </line>
    <line x1="70" y1="15" x2="60" y2="5" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
    </line>
  </svg>
);
