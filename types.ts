
export interface HistoryItem {
  id: string;
  type: 'STRATEGY' | 'IMAGE' | 'VIDEO' | 'EMAIL' | 'WEBSITE_CONCEPT' | 'WEBSITE_DEPLOY';
  timestamp: number;
  content: any; // URL for media, JSON for strategy, text for email
  metadata?: {
    prompt?: string;
    platform?: string; // e.g., Instagram, Facebook
    description?: string;
    format?: string;
  };
}

export interface Lead {
  id: string;
  businessName: string;
  location: string;
  details: string;
  sourceUrl?: string;
  phone?: string;
  email?: string;
  status: 'new' | 'analyzing' | 'contacted' | 'negotiating' | 'converted';
  
  // CRM Data
  addedAt?: number;
  websiteUrl?: string; // The deployed URL
  websiteConceptImage?: string; // The initial AI concept image
  
  // AI Generated Data
  analysis?: string;
  brandGuidelines?: {
    colors: string[];
    tone: string;
    suggestions: string;
  };
  emailDraft?: {
    subject: string;
    body: string;
  };
  
  // Content Archive
  history?: HistoryItem[];
}

export interface GeneratedContent {
  type: 'email' | 'social_post' | 'website_copy';
  content: string;
}

export interface WebsiteConcept {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  codeSnippet?: string;
}

export enum AppView {
  WIZARD = 'WIZARD', // New Wizard View
  DASHBOARD = 'DASHBOARD',
  LEAD_FINDER = 'LEAD_FINDER',
  MY_CUSTOMERS = 'MY_CUSTOMERS',
  MARKETING = 'MARKETING',
  CAMPAIGN_HISTORY = 'CAMPAIGN_HISTORY',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  WEBSITE_BUILDER = 'WEBSITE_BUILDER',
  INVOICING = 'INVOICING',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  SETTINGS = 'SETTINGS',
  BLOOM = 'BLOOM', // New Bloom Status Page
  
  // User Pages
  PROFILE = 'PROFILE',
  GENERAL_SETTINGS = 'GENERAL_SETTINGS',
  PASSWORD = 'PASSWORD',
  PAYMENT_SETUP = 'PAYMENT_SETUP',
  EMAIL_CONFIG = 'EMAIL_CONFIG',
  HELP_SUPPORT = 'HELP_SUPPORT'
}

export enum ImageSize {
  S_1K = '1K',
  S_2K = '2K',
  S_4K = '4K'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  WIDE = '21:9',
  STANDARD = '4:3'
}

export interface SocialPreset {
  id: string;
  name: string;
  icon: string;
  ratio: AspectRatio;
  description: string;
}
