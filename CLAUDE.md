# Renova8 - Development Documentation

## Project Overview

**Renova8** is an AI-powered business concierge platform designed for non-tech entrepreneurs. It provides an integrated suite of tools for finding local leads, generating marketing content, building websites, and managing client relationships—all powered by Google's Gemini AI.

**Tagline**: "An easy-to-use platform for non-tech entrepreneurs to find local leads, generate marketing content, and build website concepts using Gemini AI."

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.2.0 |
| **Language** | TypeScript 5.8.2 |
| **Build Tool** | Vite 6.2.0 |
| **Styling** | Tailwind CSS (via CDN) |
| **AI Integration** | Google Gemini AI (`@google/genai` 1.30.0) |
| **State Management** | React useState/useRef (in-memory) |
| **Persistence** | localStorage (UI preferences only) |

---

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Google Gemini API key

### Installation & Running

```bash
# Install dependencies
npm install

# Create environment file with your Gemini API key
echo 'GEMINI_API_KEY=your_api_key_here' > .env

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Development URLs**:
- Local: http://localhost:3000
- Network: http://0.0.0.0:3000

---

## Project Structure

```
Renova8/Untitled/
├── index.html              # HTML entry point (Tailwind CDN, Google Fonts)
├── index.tsx               # React mount point
├── App.tsx                 # Main app component (state, routing, layout)
├── types.ts                # TypeScript interfaces and enums
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── metadata.json           # Project metadata
│
├── components/             # React components
│   ├── Header.tsx          # Top navigation bar
│   ├── LandingPage.tsx     # Marketing landing page
│   ├── Wizard.tsx          # 5-step concierge wizard
│   ├── LeadFinder.tsx      # Scout/search for business leads
│   ├── MyCustomers.tsx     # CRM: Client list management
│   ├── Inbox.tsx           # Email/communication hub
│   ├── WebsiteBuilder.tsx  # AI website generation
│   ├── WebsiteEditor.tsx   # Drag-and-drop website editor
│   ├── MarketingStudio.tsx # Marketing content generation
│   ├── ImageStudio.tsx     # Social media image generation
│   ├── VideoStudio.tsx     # Video content generation
│   ├── CampaignHistory.tsx # Asset archive/timeline
│   ├── Invoicing.tsx       # Invoice management
│   ├── Settings.tsx        # User preferences
│   ├── UserPages.tsx       # Account, password, billing pages
│   ├── GuidedWalkthrough.tsx   # Onboarding tour system
│   ├── PageTour.tsx        # Feature-specific guided tours
│   ├── WalkthroughGraphics.tsx # Tour visual assets
│   ├── WalkthroughStep.tsx # Tour step component
│   └── ApiKeyModal.tsx     # API key configuration modal
│
└── services/
    └── geminiService.ts    # Google Gemini AI integration
```

---

## Key Features

### Core Functionality
| Feature | Description |
|---------|-------------|
| **Scout Customers** | AI-powered lead discovery using Google Maps + Gemini |
| **Client List (CRM)** | Manage leads with status tracking, communications, invoices |
| **Concierge Wizard** | 5-step guided workflow for customer acquisition |
| **Website Builder** | AI-generated HTML websites with Tailwind CSS |
| **Website Editor** | Drag-and-drop editor with 20+ component types |
| **Marketing Studio** | Campaign strategy and content generation |
| **Image Studio** | Social media graphics for 8+ platforms |
| **Video Studio** | AI video content creation |
| **Inbox** | Unified email/communication management |
| **Invoicing** | Invoice creation and payment tracking |
| **Campaign History** | Archive of all generated assets |

### User Experience
- **Guided Walkthrough**: 10-step onboarding for first-time users
- **Page Tours**: Feature-specific tours (Scout, Editor, Archives)
- **Credit System**: Freemium model with credit-based AI operations
- **Responsive Design**: Mobile-first with collapsible sidebar

---

## Application Views (Routes)

The app uses a single-page architecture with view switching via `AppView` enum:

| View | Enum Value | Description |
|------|------------|-------------|
| Landing | `LANDING` | Marketing page with feature showcase |
| Wizard | `WIZARD` | 5-step concierge workflow |
| Scout | `LEAD_FINDER` | Search for business leads |
| Clients | `MY_CUSTOMERS` | CRM customer management |
| Inbox | `INBOX` | Email communications |
| Marketing | `MARKETING` | Marketing studio |
| Archives | `CAMPAIGN_HISTORY` | Generated asset history |
| Website Builder | `WEBSITE_BUILDER` | AI website generation |
| Website Editor | `WEBSITE_EDITOR` | Visual website editor |
| Image Studio | `IMAGE_STUDIO` | Social media images |
| Video Studio | `VIDEO_STUDIO` | Video content |
| Invoicing | `INVOICING` | Invoice management |
| Settings | `SETTINGS` | User preferences |
| User Profile | `USER_PROFILE` | Account settings |
| Help | `HELP_SUPPORT` | Help and support |

---

## AI Integration (Gemini Service)

All AI functionality is centralized in `services/geminiService.ts`:

### Available Functions

| Function | Model | Purpose |
|----------|-------|---------|
| `findLeadsWithMaps()` | gemini-2.5-flash | Find local businesses via Google Maps grounding |
| `generateBrandAnalysis()` | gemini-2.5-flash | Create color palettes and brand guidelines |
| `generatePitchEmail()` | gemini-2.5-flash | Generate personalized cold emails |
| `generateCampaignStrategy()` | gemini-2.5-flash | Create marketing strategies with content ideas |
| `generateWebsiteConceptImage()` | gemini-3-pro-image | AI-generated website mockups |
| `generateSocialMediaImage()` | gemini-3-pro-image | Platform-specific social graphics |
| `generateWebsiteStructure()` | gemini-3-pro-preview | Full HTML website code generation |
| `refineWebsiteCode()` | gemini-3-pro-preview | Iterative website code editing |
| `generateMarketingVideo()` | veo-3.1-fast | AI video generation |

### API Key Configuration

```typescript
// Environment variable required
GEMINI_API_KEY=your_api_key_here

// For paid features (Pro Image), uses AI Studio key selection
window.aistudio.openSelectKey()
```

---

## Data Models (types.ts)

### Lead (Core Customer Object)
```typescript
interface Lead {
  id: string;
  businessName: string;
  location: string;
  details: string;
  phone?: string;
  email?: string;
  status: 'new' | 'analyzing' | 'contacted' | 'negotiating' | 'converted';
  websiteUrl?: string;
  websiteConceptImage?: string;
  analysis?: BrandAnalysis;
  brandGuidelines?: BrandGuidelines;
  emailDraft?: string;
  history: HistoryItem[];
  invoices: Invoice[];
  communications: Communication[];
  addedAt?: string;
}
```

### Key Interfaces
- **BrandAnalysis**: Colors, tone, suggestions for branding
- **BrandGuidelines**: Comprehensive brand style guide
- **Invoice**: Items, tax, discounts, payment tracking
- **Communication**: Email threads with categories and attachments
- **HistoryItem**: Audit trail for all generated content

---

## State Management

All state is managed in `App.tsx` using React hooks:

```typescript
// Core state
const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
const [leads, setLeads] = useState<Lead[]>([]);           // Search results
const [myCustomers, setMyCustomers] = useState<Lead[]>([]); // Saved customers
const [credits, setCredits] = useState(50);               // User credits
const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

// UI state
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const [showWalkthrough, setShowWalkthrough] = useState(false);
```

**Important**: All data is in-memory only. Data is lost on page refresh (no backend persistence).

---

## Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Gold | `#D4AF37` | Primary accent, buttons, highlights |
| Charcoal | `#4A4A4A` | Primary text |
| Cream | `#F9F6F0` | Backgrounds |
| Light Border | `#EFEBE4` | Dividers, subtle borders |

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Montserrat (sans-serif)
- **Alternative**: Quicksand

### UI Patterns
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Subtle shadows and borders
- Gradient buttons and accents
- Mobile-first responsive design
- Collapsible sidebar navigation

---

## Credit System

Users start with **50 credits**. Operations cost:

| Operation | Credits |
|-----------|---------|
| Lead search | 5 |
| Website generation | 10 |
| Image generation | 5-20 |
| Video generation | 10-20 |
| Marketing operations | 2 |

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `renova8_walkthrough_complete` | Onboarding tour completion |
| `renova8_tour_scout` | Scout page tour completion |
| `renova8_tour_editor` | Editor page tour completion |
| `renova8_tour_archives` | Archives page tour completion |

---

## Development Notes

### Architecture
- **Frontend-only**: No backend server or database
- **AI-first**: Every major feature leverages Gemini AI
- **Single-session**: Data exists only in browser memory
- **Component-driven**: Modular components with clear separation

### Key Files to Understand
1. `App.tsx` - Central state and routing
2. `types.ts` - All TypeScript interfaces
3. `services/geminiService.ts` - AI integration layer
4. `components/Wizard.tsx` - Core 5-step workflow
5. `components/MyCustomers.tsx` - CRM functionality

### Adding New Features
1. Define types in `types.ts`
2. Add view to `AppView` enum if needed
3. Create component in `components/`
4. Add state management in `App.tsx`
5. Wire up navigation in sidebar

### Styling Guidelines
- Use Tailwind utility classes
- Follow existing color palette
- Maintain gold accent for interactive elements
- Keep mobile-first approach

---

## Known Limitations

1. **No data persistence**: All customer data lost on refresh
2. **No authentication**: Single-user, no accounts
3. **No real-time sync**: Client-side only
4. **API key required**: Gemini API key needed for all AI features
5. **Pro features**: Some image generation requires paid API key

---

## Future Considerations

To add backend persistence, consider:
- Supabase for database and auth
- PostgreSQL for data storage
- Real-time subscriptions for live updates
- User authentication and accounts
- Cloud storage for generated assets

---

## Scripts Reference

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Gemini AI](https://ai.google.dev/docs)

---

**Last Updated**: December 2025
