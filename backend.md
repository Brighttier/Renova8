# Renova8 Backend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Firebase App Hosting](#firebase-app-hosting)
4. [Directory Structure](#directory-structure)
5. [Services & APIs](#services--apis)
6. [Environment Variables](#environment-variables)
7. [Local Development](#local-development)
8. [Firebase Setup & Configuration](#firebase-setup--configuration)
9. [Deployment](#deployment)
10. [Security Considerations](#security-considerations)
11. [Best Practices & Recommendations](#best-practices--recommendations)

---

## Overview

**Renova8** is an AI-powered CRM and marketing platform designed to help businesses find leads, generate marketing content, build websites, and manage customer relationships. The application is built as a modern React single-page application (SPA) that leverages:

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (via CDN)
- **AI Services**: Google Gemini API (@google/genai)
- **Backend Hosting**: Firebase App Hosting

### Key Features
- Lead discovery with Google Maps integration
- AI-powered brand analysis and marketing content generation
- Website concept image generation (Gemini 3 Pro Image)
- Live website builder with code generation
- Marketing video generation (Veo)
- Email and communication management
- Invoice and payment tracking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (Vite)                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │  Components │  │   Services  │  │      Types          │  │    │
│  │  │  (UI Layer) │  │ (API Layer) │  │  (Data Models)      │  │    │
│  │  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │    │
│  └──────────────────────────┼──────────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE APP HOSTING                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Static File Serving (HTML, JS, CSS, Assets)                  │   │
│  │  CDN Distribution                                              │   │
│  │  SSL/TLS Termination                                           │   │
│  │  Custom Domain Support                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │  Google Gemini  │  │  Google Maps    │  │  Google Veo        │   │
│  │  API            │  │  (Grounding)    │  │  (Video Gen)       │   │
│  └─────────────────┘  └─────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React components
2. Components call service functions (geminiService.ts)
3. Services make API calls to Google Gemini
4. Responses are processed and state is updated
5. Firebase App Hosting serves the static build

---

## Firebase App Hosting

Firebase App Hosting is a serverless hosting solution that provides:

- **Global CDN**: Fast content delivery worldwide
- **Automatic SSL**: Secure HTTPS connections
- **Git Integration**: Deploy directly from GitHub
- **Preview Channels**: Test changes before production
- **Rollback Support**: Easy version management

### How Firebase App Hosting Serves Renova8

```
GitHub Repository
       │
       ▼ (Push to main)
┌──────────────────┐
│  Firebase Build  │ ──► npm run build (Vite)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   dist/ folder   │ ──► Static HTML, JS, CSS bundles
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Firebase CDN    │ ──► Global edge distribution
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   End Users      │ ──► https://your-app.web.app
└──────────────────┘
```

---

## Directory Structure

```
Renova8/
├── .env                    # Environment variables (GITIGNORED)
├── .gitignore              # Git ignore rules
├── index.html              # HTML entry point
├── index.tsx               # React app bootstrap
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── backend.md              # This documentation file
│
├── components/             # React UI components
│   ├── ApiKeyModal.tsx     # API key input modal
│   ├── CampaignHistory.tsx # Marketing campaign archive
│   ├── Header.tsx          # App header with navigation
│   ├── ImageStudio.tsx     # AI image generation studio
│   ├── Inbox.tsx           # Email management interface
│   ├── Invoicing.tsx       # Invoice management
│   ├── LeadFinder.tsx      # Lead discovery with Maps
│   ├── MarketingStudio.tsx # Marketing content generator
│   ├── MyCustomers.tsx     # CRM customer management
│   ├── Settings.tsx        # App settings
│   ├── UserPages.tsx       # User account pages
│   ├── VideoStudio.tsx     # AI video generation
│   ├── WebsiteBuilder.tsx  # Website generation wizard
│   ├── WebsiteEditor.tsx   # Advanced website editor
│   └── Wizard.tsx          # Concierge wizard flow
│
├── services/               # Backend service integrations
│   └── geminiService.ts    # Google Gemini API wrapper
│
└── node_modules/           # NPM packages (GITIGNORED)
```

---

## Services & APIs

### geminiService.ts

The primary backend service layer that interfaces with Google's Generative AI APIs.

#### Available Functions

| Function | Description | Model Used |
|----------|-------------|------------|
| `findLeadsWithMaps()` | Discover local business leads using Google Maps grounding | gemini-2.5-flash |
| `generateBrandAnalysis()` | Analyze business and generate branding guidelines | gemini-2.5-flash |
| `generatePitchEmail()` | Generate cold outreach emails | gemini-2.5-flash |
| `generateCampaignStrategy()` | Create marketing campaign strategies | gemini-2.5-flash |
| `analyzeAndGenerateMarketing()` | Full marketing analysis with email and social | gemini-2.5-flash |
| `generateWebsiteConceptImage()` | Generate website mockup images | gemini-3-pro-image-preview |
| `generateSocialMediaImage()` | Generate social media images | gemini-3-pro-image-preview |
| `generateWebsiteStructure()` | Generate complete HTML website code | gemini-3-pro-preview |
| `refineWebsiteCode()` | Refine existing website code based on instructions | gemini-3-pro-preview |
| `generateMarketingVideo()` | Generate marketing videos | veo-3.1-fast-generate-preview |

#### Client Initialization

```typescript
const getClient = async (requiresPaidKey: boolean = false, skipKeyCheck: boolean = false) => {
  if (requiresPaidKey && !skipKeyCheck && window.aistudio) {
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (!hasKey) {
        throw new Error("API_KEY_REQUIRED");
     }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};
```

#### JSON Response Parsing

The service includes a robust `safeParseJSON()` function that handles:
- Markdown code block removal
- Extraction of JSON from mixed content
- Control character sanitization
- Graceful fallback to empty objects

---

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# Google Gemini API Key
VITE_API_KEY=your_gemini_api_key_here

# Alternative naming (both are supported via vite.config.ts)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Vite Environment Variable Handling

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
    };
});
```

### Firebase App Hosting Environment Variables

For production deployment, set environment variables in Firebase:

```bash
# Using Firebase CLI
firebase apphosting:secrets:set VITE_API_KEY
```

Or configure in `apphosting.yaml`:

```yaml
env:
  - variable: VITE_API_KEY
    secret: gemini-api-key
```

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Brighttier/Renova8.git
cd Renova8

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your VITE_API_KEY
```

### Running the Development Server

```bash
# Start Vite dev server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

---

## Firebase Setup & Configuration

### Initial Setup

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase in Project**
```bash
firebase init hosting
```

4. **Configure firebase.json**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

5. **Create .firebaserc**
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### Firebase App Hosting Configuration

Create `apphosting.yaml` in the project root:

```yaml
# Firebase App Hosting configuration
runConfig:
  minInstances: 0
  maxInstances: 100
  concurrency: 80
  cpu: 1
  memoryMiB: 512

env:
  - variable: VITE_API_KEY
    secret: gemini-api-key
  - variable: NODE_ENV
    value: production

# Build settings
buildCommand: npm run build
outputDirectory: dist
```

### Firebase Emulator (Local Testing)

```bash
# Start Firebase emulators
firebase emulators:start --only hosting

# Emulator will serve at http://localhost:5000
```

---

## Deployment

### Deploy to Firebase App Hosting

#### Option 1: Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

#### Option 2: Git-Based Deployment (Recommended)

1. **Connect GitHub Repository**
```bash
firebase init hosting:github
```

2. **Configure Automatic Deployments**
   - Production deploys on push to `main`
   - Preview channels on pull requests

3. **GitHub Actions Workflow** (auto-generated)
```yaml
# .github/workflows/firebase-hosting-merge.yml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### Deploy Commands Reference

```bash
# Deploy to production
firebase deploy --only hosting

# Deploy to preview channel
firebase hosting:channel:deploy preview-name

# List deployment history
firebase hosting:sites:list

# Rollback to previous version
firebase hosting:rollback
```

---

## Security Considerations

### API Key Security

1. **Never commit API keys to Git**
   - Ensure `.env` is in `.gitignore`
   - Use Firebase secrets for production

2. **Client-Side API Key Exposure**
   - Gemini API keys are exposed in client bundle
   - Implement API key restrictions in Google Cloud Console:
     - HTTP referrer restrictions
     - API restrictions (only Gemini API)

3. **Recommended: Server-Side Proxy**
   For production, consider implementing Firebase Cloud Functions as a proxy:

   ```typescript
   // functions/src/index.ts
   import * as functions from 'firebase-functions';
   import { GoogleGenAI } from '@google/genai';

   export const geminiProxy = functions.https.onCall(async (data, context) => {
     // Validate authentication
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
     }

     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
     // Process request...
   });
   ```

### Content Security Policy

Add to `firebase.json` headers:

```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com"
        }
      ]
    }
  ]
}
```

---

## Best Practices & Recommendations

### Performance Optimization

1. **Code Splitting**
   ```typescript
   // Lazy load heavy components
   const WebsiteEditor = React.lazy(() => import('./components/WebsiteEditor'));
   ```

2. **Image Optimization**
   - Use WebP format for generated images
   - Implement lazy loading for image galleries

3. **Caching Strategy**
   - Static assets: Long cache (1 year)
   - HTML: No cache (always fresh)
   - API responses: Cache where appropriate

### Error Handling

1. **Implement Global Error Boundary**
   ```typescript
   class ErrorBoundary extends React.Component {
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }

     componentDidCatch(error, errorInfo) {
       // Log to monitoring service
     }
   }
   ```

2. **API Error Handling**
   ```typescript
   try {
     const result = await generateContent();
   } catch (error) {
     if (error.message === 'API_KEY_REQUIRED') {
       // Prompt for API key
     } else {
       // Show user-friendly error
     }
   }
   ```

### Future Enhancements

1. **Firebase Authentication**
   - Add user authentication
   - Implement role-based access control

2. **Firestore Database**
   - Persist leads and customer data
   - Real-time synchronization across devices

3. **Firebase Storage**
   - Store generated images and videos
   - Reduce API calls with caching

4. **Firebase Cloud Functions**
   - Server-side API key management
   - Scheduled tasks (follow-up reminders)
   - Email sending via Firebase Extensions

5. **Firebase Analytics**
   - Track user engagement
   - Monitor feature usage

### Monitoring & Logging

1. **Enable Firebase Performance Monitoring**
   ```javascript
   import { getPerformance } from 'firebase/performance';
   const perf = getPerformance(app);
   ```

2. **Implement Error Logging**
   ```javascript
   import { getAnalytics, logEvent } from 'firebase/analytics';
   logEvent(analytics, 'error', { error_message: error.message });
   ```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview build

# Firebase
firebase login           # Authenticate
firebase init            # Initialize project
firebase deploy          # Deploy to production
firebase emulators:start # Local emulation
firebase hosting:channel:deploy [name] # Preview channel
```

### Useful Links

- [Firebase App Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vite Configuration](https://vitejs.dev/config/)
- [Google Gemini API](https://ai.google.dev/docs)
- [React Documentation](https://react.dev/)

---

## Support

For issues or questions:
- Create an issue on [GitHub](https://github.com/Brighttier/Renova8/issues)
- Email: support@renova8.com

---

*Last Updated: December 2024*
