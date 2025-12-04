
export interface HistoryItem {
  id: string;
  type: 'STRATEGY' | 'IMAGE' | 'VIDEO' | 'EMAIL' | 'WEBSITE_CONCEPT' | 'WEBSITE_DEPLOY' | 'INVOICE' | 'PAYMENT' | 'COMMUNICATION';
  timestamp: number;
  content: any; // URL for media, JSON for strategy, text for email
  metadata?: {
    prompt?: string;
    platform?: string; // e.g., Instagram, Facebook
    description?: string;
    format?: string;
    amount?: number;
    status?: string;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceSender {
  name?: string;
  company?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: number;
  method?: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';
  createdAt: number;
  dueDate?: number;
  paidAt?: number;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  notes?: string;
  terms?: string;
  billingPeriod?: {
    start: number;
    end: number;
  };
  sender?: InvoiceSender;
  // Payment tracking
  paidAmount: number;
  payments?: PaymentRecord[];
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Communication {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject: string;
  content: string;
  timestamp: number;
  direction?: 'inbound' | 'outbound';
  read?: boolean;
  starred?: boolean;
  attachments?: EmailAttachment[];
  category?: 'pitch' | 'followup' | 'response' | 'invoice' | 'general';
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

  // Invoices & Payments
  invoices?: Invoice[];

  // Communications
  communications?: Communication[];
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
  INBOX = 'INBOX', // Email Inbox
  MARKETING = 'MARKETING',
  CAMPAIGN_HISTORY = 'CAMPAIGN_HISTORY',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  WEBSITE_BUILDER = 'WEBSITE_BUILDER',
  INVOICING = 'INVOICING',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  WEBSITE_EDITOR = 'WEBSITE_EDITOR',
  SETTINGS = 'SETTINGS',

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
