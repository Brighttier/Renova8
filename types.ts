
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
    websiteId?: string; // For website deployments
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
  websiteCode?: string; // The actual HTML code for the website
  websiteConceptImage?: string; // The initial AI concept image

  // AI Generated Data
  analysis?: string;
  brandGuidelines?: {
    colors: string[];
    tone: string;
    suggestions: string;
    designSpec?: DesignSpecification;  // Extended design specifications for strict consistency
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
  LANDING = 'LANDING', // Landing Page
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
  AI_WEBSITE_EDITOR = 'AI_WEBSITE_EDITOR', // AI-powered website editor (Lovable/Bolt style)
  SITES_MANAGER = 'SITES_MANAGER', // Sites Manager Dashboard
  SERVICE_CATALOG = 'SERVICE_CATALOG', // Service & Feature Catalog
  SETTINGS = 'SETTINGS',

  // User Pages
  PROFILE = 'PROFILE',
  GENERAL_SETTINGS = 'GENERAL_SETTINGS',
  PASSWORD = 'PASSWORD',
  PAYMENT_SETUP = 'PAYMENT_SETUP',
  EMAIL_CONFIG = 'EMAIL_CONFIG',
  HELP_SUPPORT = 'HELP_SUPPORT',

  // Help & Support Pages
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  SUPPORT_TICKETS = 'SUPPORT_TICKETS',
  STATUS_PAGE = 'STATUS_PAGE'
}

// AI Website Editor Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  codeChanges?: string; // HTML code changes made
  versionId?: string; // Associated version snapshot
}

export interface WebsiteVersion {
  id: string;
  name: string;
  htmlCode: string;
  timestamp: number;
  messageId?: string; // Associated chat message
  thumbnail?: string; // Base64 preview image
}

export interface SelectedElement {
  selector: string;
  tagName: string;
  className: string;
  textContent?: string;
  outerHTML: string;
  rect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
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

// Design Specification for strict concept-to-website consistency
export interface DesignSpecification {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headerBg?: string;
    footerBg?: string;
    heroBg?: string;
    cardBg?: string;
    exactHexCodes: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
    headingSizes: {
      h1: string;
      h2: string;
      h3: string;
    };
    fontWeight?: {
      heading?: string;
      body?: string;
    };
  };
  layout: {
    maxWidth: string;
    sectionPadding: string;
    gridColumns: number;
    gutterWidth: string;
  };
  components: {
    header: {
      style: 'fixed' | 'sticky' | 'static';
      logoPlacement: 'left' | 'center';
      backgroundColor?: string;
      textColor?: string;
      logoText?: string;
      navItems?: string[];
    };
    hero: {
      height: string;
      alignment: 'left' | 'center' | 'right';
      headline?: string;
      subheadline?: string;
      ctaButtons?: string[];
      backgroundType?: string;
      backgroundValue?: string;
      imagePosition?: string;
      hasOverlay?: boolean;
    };
    buttons: {
      borderRadius: string;
      style: 'solid' | 'outline' | 'ghost';
      primaryColor?: string;
      primaryTextColor?: string;
      secondaryColor?: string;
      padding?: string;
    };
    cards: {
      borderRadius: string;
      shadow: string;
      backgroundColor?: string;
      border?: string;
    };
  };
  content: {
    sections: SectionSpec[];
    exactText: {
      logoText?: string;
      heroHeadline?: string;
      heroSubheadline?: string;
      ctaButtonTexts?: string[];
      navMenuItems?: string[];
      sectionTitles?: string[];
      footerText?: string;
      [key: string]: string | string[] | undefined;
    };
  };
  assets: {
    logo?: AssetSpec;
    heroImage?: AssetSpec;
    images: AssetSpec[];
  };
  verification: {
    missingAssets: string[];
    discrepancies: DiscrepancyReport[];
  };
  pixelPerfectMode?: boolean;  // Enforce strict matching with auto-retry
  pageStructure?: 'single-page' | 'multi-page';  // Detected from concept mockup
}

export interface SectionSpec {
  type: string;
  order: number;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  itemCount?: number;
  layout?: string;
  items?: string[];
  requiredContent: string[];
}

export interface AssetSpec {
  id: string;
  type: 'logo' | 'image' | 'icon';
  source: 'user' | 'placeholder' | 'ai-generated';
  url?: string;
  placement: string;
  required: boolean;
}

export interface DiscrepancyReport {
  element: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface VerificationResult {
  overallMatchScore: number;
  colorMatchScore: number;
  layoutMatchScore: number;
  typographyMatchScore: number;
  discrepancies: DiscrepancyReport[];
  recommendations: string[];
  missingAssets: { type: string; description: string; placement: string; required: boolean; }[];
  approved: boolean;
}

// ============================================
// Platform Admin Types
// ============================================

export type AdminRole = 'super_admin' | 'finance_admin' | 'support_admin' | 'technical_admin' | 'analytics_admin';

export interface PlatformAdmin {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: number;
  lastLoginAt?: number;
  createdBy?: string; // ID of admin who created this admin
}

export type AdminPermission =
  | 'users.view' | 'users.edit' | 'users.delete' | 'users.suspend'
  | 'revenue.view' | 'revenue.refund' | 'revenue.export'
  | 'hosting.view' | 'hosting.suspend' | 'hosting.delete'
  | 'support.view' | 'support.respond' | 'support.escalate'
  | 'analytics.view' | 'analytics.export'
  | 'settings.view' | 'settings.edit'
  | 'admins.view' | 'admins.create' | 'admins.edit' | 'admins.delete';

export interface AdminSession {
  adminId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  expiresAt: number;
  createdAt: number;
}

// Admin Dashboard View Types
export enum AdminView {
  OVERVIEW = 'OVERVIEW',
  USERS = 'USERS',
  USER_DETAIL = 'USER_DETAIL',
  REVENUE = 'REVENUE',
  HOSTING = 'HOSTING',
  SITE_DETAIL = 'SITE_DETAIL',
  ANALYTICS = 'ANALYTICS',
  SUPPORT = 'SUPPORT',
  TICKET_DETAIL = 'TICKET_DETAIL',
  PERFORMANCE = 'PERFORMANCE',
  SETTINGS = 'SETTINGS',
  ADMIN_MANAGEMENT = 'ADMIN_MANAGEMENT'
}

// Platform User (as seen by admin)
export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  company?: string;
  location?: string;
  photoURL?: string;

  // Account Status
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;

  // Subscription Info
  subscriptionId?: string;
  planId: 'free' | 'starter' | 'pro' | 'enterprise';
  planStatus: 'active' | 'cancelled' | 'past_due' | 'trialing';
  trialEndsAt?: number;

  // Usage Tracking
  credits: number;
  websitesCreated: number;
  websitesLimit: number;

  // Billing
  lifetimeValue: number;
  lastPaymentAt?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;

  // Admin Notes
  adminNotes?: string;
  tags?: string[];
}

// Revenue Types
export interface RevenueMetrics {
  totalRevenue: number;
  subscriptionRevenue: number;
  creditRevenue: number;
  hostingRevenue: number;
  refunds: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  arpu: number; // Average Revenue Per User
  churnRate: number;

  // Comparisons
  revenueChange: number;
  mrrChange: number;
  churnChange: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'subscription' | 'credit_pack' | 'hosting' | 'refund';
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  metadata?: {
    planId?: string;
    creditAmount?: number;
    siteId?: string;
    refundReason?: string;
  };
  createdAt: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  credits: number;
  websitesLimit: number;
  features: string[];
  activeSubscriptions: number;
}

// Hosted Website Types (Admin View)
export interface HostedWebsite {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;

  // Site Info
  name: string;
  description?: string;

  // Hosting
  subdomain: string;
  customDomain?: string;
  sslStatus: 'pending' | 'active' | 'failed';

  // Status
  status: 'active' | 'suspended' | 'deleted';

  // Metrics
  bandwidth: number;
  storage: number;
  pageViews: number;
  uptime: number;
  avgResponseTime: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastDeployedAt?: number;
}

// Support Ticket Types
export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'awaiting_reply' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'technical' | 'account' | 'feature_request' | 'general';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: string;

  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  messages: TicketMessage[];

  assignedTo?: string;
  assignedToName?: string;

  tags?: string[];

  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  firstResponseAt?: number;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  content: string;
  isInternal: boolean; // Internal admin note
  attachments?: { name: string; url: string; size: number }[];
  createdAt: number;
}

// Analytics Types
export interface PlatformAnalytics {
  // User Metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  userGrowthRate: number;

  // Engagement
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  avgSessionDuration: number;
  actionsPerSession: number;

  // Feature Usage
  featureUsage: { feature: string; count: number; change: number }[];

  // Conversion Funnel
  visitors: number;
  signups: number;
  trials: number;
  paidUsers: number;

  // AI Usage
  aiGenerations: { type: string; count: number; cost: number }[];
  totalApiCost: number;
}

// Performance Monitoring Types
export interface SystemHealth {
  services: ServiceStatus[];
  webVitals: WebVitals;
  errors: ErrorSummary;
  resourceUsage: ResourceUsage;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  uptime: number;
  requests: number;
}

export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface ErrorSummary {
  total: number;
  critical: number;
  warnings: number;
  info: number;
  recentErrors: ErrorLog[];
}

export interface ErrorLog {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  service: string;
  count: number;
  lastSeen: number;
  status: 'active' | 'resolved';
}

export interface ResourceUsage {
  firebase: { service: string; usage: number; limit: number; cost: number }[];
  externalApis: { api: string; requests: number; quota: number; cost: number }[];
  projectedCost: number;
  budget: number;
}

// ============================================
// Website Publishing Types
// ============================================

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  purpose?: string;
}

export interface PublishedWebsite {
  id: string;
  userId: string;
  leadId?: string;
  name: string;
  subdomain: string;
  firebaseUrl: string;
  customDomain?: string;
  customDomainStatus?: 'pending' | 'verified' | 'active';
  dnsRecords?: DnsRecord[];
  publishedAt: number;
  updatedAt: number;
  sslStatus: 'provisioning' | 'active';
  expireTime?: string;
}

export interface PublishWebsiteResult {
  success: boolean;
  websiteId: string;
  firebaseUrl: string;
  subdomain: string;
  expireTime?: string;
}

export interface SetupDomainResult {
  success: boolean;
  dnsRecords: DnsRecord[];
  instructions: string[];
}

export interface DomainStatusResult {
  status: 'pending' | 'verified' | 'active' | 'error';
  domain?: string;
  sslStatus?: 'provisioning' | 'active';
  message: string;
}

// ============================================
// Platform API Settings Types
// ============================================

export type ApiKeyRotationStrategy = 'round-robin' | 'failover' | 'usage-based';

export interface ApiKeyConfig {
  id: string;
  key: string;           // Full key (stored encrypted server-side, masked in UI)
  name: string;          // "Primary", "Backup 1", etc.
  isActive: boolean;
  usageCount: number;    // Requests today
  totalUsage: number;    // Lifetime requests
  lastUsed: number;      // Timestamp
  dailyLimit?: number;   // Optional per-key daily limit
  addedAt: number;
  addedBy: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  globalRequestsPerMinute: number;    // Platform-wide limit
  perUserRequestsPerMinute: number;   // Per user per minute
  perUserRequestsPerDay: number;      // Per user per day
}

export interface TokenLimitConfig {
  initialSignupTokens: number;        // Tokens given to new users
  maxTokensPerUser: number;           // Max tokens a user can hold (0 = unlimited)
  minBalanceForCall: number;          // Minimum balance required for API call
  profitMargin: number;               // 0-1 (e.g., 0.45 = 45%)
}

export interface PlatformAPISettings {
  // API Keys
  geminiApiKeys: ApiKeyConfig[];
  currentKeyIndex: number;
  rotationStrategy: ApiKeyRotationStrategy;

  // Rate Limiting
  rateLimits: RateLimitConfig;

  // Token Limitations
  tokenLimits: TokenLimitConfig;

  // Metadata
  updatedAt: number;
  updatedBy: string;
}

// Default settings for new installations
export const DEFAULT_PLATFORM_API_SETTINGS: Omit<PlatformAPISettings, 'updatedAt' | 'updatedBy'> = {
  geminiApiKeys: [],
  currentKeyIndex: 0,
  rotationStrategy: 'round-robin',
  rateLimits: {
    enabled: false,
    globalRequestsPerMinute: 60,
    perUserRequestsPerMinute: 10,
    perUserRequestsPerDay: 1000,
  },
  tokenLimits: {
    initialSignupTokens: 2000,
    maxTokensPerUser: 0, // 0 = unlimited
    minBalanceForCall: 10,
    profitMargin: 0.45,
  },
};

// ============================================
// Service Catalog Types
// ============================================

export type ServiceCategory =
  // DIY Categories
  | 'pages-structure'
  | 'design-branding'
  | 'content-copy'
  | 'lead-capture'
  | 'embeds'
  | 'seo-trust'
  // Get Assistance Categories
  | 'payments-monetization'
  | 'memberships-accounts'
  | 'scheduling-booking'
  | 'ai-automation'
  | 'integrations-apis'
  | 'data-backend'
  | 'security-reliability'
  | 'advanced-features';
export type ServiceType = 'diy' | 'backend' | 'hybrid';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  icon: string;
  iconBg: string;
  lastUpdate: string;
  source?: string;
  features: string[];
  serviceType: ServiceType;  // Classification: diy, backend, or hybrid
  diyPrompt?: string;        // Generic prompt template (optional for backend-only)
  hybridNote?: string;       // Explanation for hybrid services
  price?: string;            // Price placeholder for backend/assistance services (e.g., "$XX")
}
