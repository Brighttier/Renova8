/**
 * Help Articles Data
 *
 * Static content for the Knowledge Base. Each article contains
 * markdown-formatted content covering platform features.
 */

export type HelpCategory =
  | 'getting-started'
  | 'lead-finder'
  | 'website-builder'
  | 'marketing'
  | 'billing'
  | 'account';

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  tags: string[];
  updatedAt: string;
}

export const categoryInfo: Record<HelpCategory, { label: string; icon: string; description: string }> = {
  'getting-started': {
    label: 'Getting Started',
    icon: '🚀',
    description: 'New to RenovateMySite? Start here.',
  },
  'lead-finder': {
    label: 'Lead Finder',
    icon: '🔍',
    description: 'Find and manage business leads.',
  },
  'website-builder': {
    label: 'Website Builder',
    icon: '🌐',
    description: 'Create and publish AI-powered websites.',
  },
  'marketing': {
    label: 'Marketing',
    icon: '📣',
    description: 'Generate marketing content and campaigns.',
  },
  'billing': {
    label: 'Billing & Credits',
    icon: '💳',
    description: 'Manage your subscription and credits.',
  },
  'account': {
    label: 'Account',
    icon: '👤',
    description: 'Profile settings and preferences.',
  },
};

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'welcome',
    title: 'Welcome to RenovateMySite',
    category: 'getting-started',
    content: `
# Welcome to RenovateMySite

RenovateMySite is an AI-powered business concierge platform designed for entrepreneurs. We help you:

- **Find local leads** using Google Maps data
- **Generate marketing content** powered by Gemini AI
- **Build professional websites** in minutes
- **Manage client relationships** all in one place

## Getting Started in 5 Minutes

1. **Scout Customers** - Use the Lead Finder to search for businesses in your target area
2. **Analyze Leads** - AI analyzes each business and suggests branding
3. **Generate Content** - Create websites, emails, and marketing materials
4. **Manage Clients** - Track your leads through the sales pipeline

## Your First Search

Click "Scout Customers" in the sidebar to start finding leads. Enter a business type (like "dentist" or "restaurant") and a location to begin.
    `,
    tags: ['start', 'introduction', 'overview', 'basics'],
    updatedAt: '2024-12-22',
  },
  {
    id: 'dashboard-overview',
    title: 'Understanding Your Dashboard',
    category: 'getting-started',
    content: `
# Dashboard Overview

Your RenovateMySite dashboard is your command center for managing leads, content, and websites.

## Sidebar Navigation

- **Scout Customers** - Search for new business leads
- **Client List** - View and manage your saved leads
- **Inbox** - Communications with leads
- **Marketing** - Generate marketing content
- **Archives** - Past campaigns and generated assets
- **Websites** - Manage published websites

## Credit Balance

Your credit balance appears in the sidebar. Credits are used for AI operations:
- Finding leads: 5 credits
- Generating websites: 10 credits
- Creating marketing content: 2-5 credits

## Quick Actions

Use the search bar at the top to quickly find leads, or click the "+" button to start a new project.
    `,
    tags: ['dashboard', 'navigation', 'sidebar', 'interface'],
    updatedAt: '2024-12-22',
  },

  // Lead Finder
  {
    id: 'lead-finder-basics',
    title: 'How to Find Business Leads',
    category: 'lead-finder',
    content: `
# Finding Business Leads

The Lead Finder uses Google Maps data to discover businesses that might need your services.

## Search Parameters

### Business Type
Enter specific business types like:
- "dentist"
- "restaurant"
- "auto repair shop"
- "real estate agent"

### Location
Enter a city, zip code, or full address. Examples:
- "Austin, TX"
- "90210"
- "123 Main St, Chicago, IL"

### Search Radius
Choose how far from your location to search:
- Small (5 miles) - Very targeted
- Medium (15 miles) - Balanced
- Large (25+ miles) - Maximum results

## Understanding Results

Each result includes:
- **Business name** and address
- **Contact info** (when publicly available)
- **Website** (or lack thereof - great opportunity!)
- **Rating** from Google reviews

## Saving Leads

Click "Add to Clients" to save a lead to your Client List for follow-up.
    `,
    tags: ['leads', 'search', 'scout', 'find', 'google maps'],
    updatedAt: '2024-12-22',
  },
  {
    id: 'analyzing-leads',
    title: 'AI Lead Analysis',
    category: 'lead-finder',
    content: `
# AI-Powered Lead Analysis

When you select a lead, our AI analyzes the business to help you create targeted outreach.

## What AI Analyzes

- **Industry** - Business type and market segment
- **Online Presence** - Website quality, social media activity
- **Brand Colors** - Suggested color palette based on industry
- **Pain Points** - Common challenges for this business type

## Brand Analysis

Click "Analyze Brand" on any lead to get:
- Recommended color schemes
- Typography suggestions
- Logo concepts
- Marketing tone recommendations

## Using Analysis Results

The analysis helps you:
1. Create customized pitch emails
2. Generate relevant website designs
3. Craft targeted marketing messages
4. Understand the client's needs
    `,
    tags: ['analysis', 'AI', 'brand', 'colors', 'insights'],
    updatedAt: '2024-12-22',
  },

  // Website Builder
  {
    id: 'website-builder-guide',
    title: 'Creating Websites with AI',
    category: 'website-builder',
    content: `
# AI Website Builder

Create professional, mobile-responsive websites in minutes using AI.

## Starting a New Website

1. Select a lead from your Client List
2. Click "Generate Website"
3. AI analyzes the business and creates a custom design
4. Review and edit the generated site
5. Publish when ready

## Customization Options

### AI Regeneration
Don't like something? Click "Regenerate" to get a new version with different:
- Color schemes
- Layouts
- Content suggestions

### Manual Editing
Use the visual editor to:
- Change text and images
- Rearrange sections
- Add/remove components
- Adjust styling

## Website Components

Generated websites include:
- Hero section with CTA
- Services/features section
- About section
- Contact form
- Footer with links
    `,
    tags: ['website', 'builder', 'create', 'design', 'AI'],
    updatedAt: '2024-12-22',
  },
  {
    id: 'publishing-websites',
    title: 'Publishing Your Website',
    category: 'website-builder',
    content: `
# Publishing Websites

Once your website is ready, publish it to make it live on the internet.

## Free Hosting

Every website gets a free URL on our platform:
\`https://your-site-name.web.app\`

This URL is:
- Free forever
- SSL secured (https)
- Fast loading via CDN

## Publishing Steps

1. Click "Publish" in the website builder
2. Choose a subdomain name
3. Confirm publication
4. Share the live URL!

## After Publishing

- **Update anytime** - Changes republish instantly
- **View analytics** - Track visitors and engagement
- **Add custom domain** - Connect your own domain name

## Custom Domains

Want to use your own domain? See our Custom Domain Setup guide for step-by-step instructions.
    `,
    tags: ['publish', 'hosting', 'live', 'URL', 'deploy'],
    updatedAt: '2024-12-22',
  },
  {
    id: 'custom-domain-setup',
    title: 'Connecting a Custom Domain',
    category: 'website-builder',
    content: `
# Custom Domain Setup

Connect your own domain (like www.yourbusiness.com) to your published website.

## Prerequisites

- A published website on our platform
- A domain name you own
- Access to your domain's DNS settings

## Step-by-Step Setup

### 1. Start Domain Setup
In your website settings, click "Add Custom Domain" and enter your domain name.

### 2. Get DNS Records
We'll provide you with DNS records to add:

**For apex domains (example.com):**
- A record pointing to our IP address

**For subdomains (www.example.com):**
- CNAME record pointing to our servers

### 3. Add Records to Your Registrar
Log into your domain registrar (GoDaddy, Namecheap, etc.) and add the DNS records.

### 4. Verify and Wait
- Click "Verify" to check your DNS configuration
- SSL certificate is automatically provisioned
- Full activation takes 15 minutes to 24 hours

## Troubleshooting

**DNS not propagating?**
- Wait 30 minutes and try again
- Use dnschecker.org to verify records
- Contact your registrar if issues persist
    `,
    tags: ['domain', 'DNS', 'custom', 'CNAME', 'SSL'],
    updatedAt: '2024-12-22',
  },

  // Marketing
  {
    id: 'marketing-studio',
    title: 'Marketing Studio Overview',
    category: 'marketing',
    content: `
# Marketing Studio

Generate professional marketing content for any business using AI.

## Available Content Types

### Email Campaigns
- Cold outreach emails
- Follow-up sequences
- Newsletter templates

### Social Media
- Posts for Facebook, Instagram, LinkedIn
- Platform-optimized formatting
- Hashtag suggestions

### Long-form Content
- Blog posts
- Case studies
- Service descriptions

## Creating Content

1. Select a lead or enter business details
2. Choose content type
3. AI generates tailored content
4. Edit and customize as needed
5. Copy, download, or send directly

## Campaign Strategies

AI can suggest full campaign strategies including:
- Content calendar
- Platform recommendations
- Messaging angles
- Call-to-action suggestions
    `,
    tags: ['marketing', 'content', 'email', 'social media', 'campaigns'],
    updatedAt: '2024-12-22',
  },

  // Billing
  {
    id: 'billing-credits',
    title: 'Understanding Credits',
    category: 'billing',
    content: `
# Credit System

RenovateMySite uses a credit system for AI-powered features.

## How Credits Work

Credits are consumed when you use AI features:

| Action | Credits |
|--------|---------|
| Lead search | 5 |
| Brand analysis | 3 |
| Website generation | 10 |
| Website regeneration | 5 |
| Email generation | 2 |
| Marketing content | 3-5 |

## Getting More Credits

### Monthly Allocation
Your subscription includes monthly credits that refresh on your billing date.

### Credit Packs
Purchase additional credits anytime:
- 50 credits - $9
- 150 credits - $19
- 500 credits - $49

### Referral Bonus
Earn 25 free credits for each friend who signs up!

## Checking Your Balance

Your credit balance is displayed in the sidebar. Click it to see usage history.
    `,
    tags: ['credits', 'billing', 'pricing', 'cost', 'subscription'],
    updatedAt: '2024-12-22',
  },
  {
    id: 'subscription-plans',
    title: 'Subscription Plans',
    category: 'billing',
    content: `
# Subscription Plans

Choose the plan that fits your needs. Upgrade or downgrade anytime.

## Plan Comparison

### Free Plan
- 50 credits/month
- Basic lead finder
- Standard website templates
- Email support

### Pro Plan - $29/month
- 300 credits/month
- Unlimited lead searches
- Premium templates
- Custom domains
- Priority support

### Agency Plan - $99/month
- 1000 credits/month
- White-label options
- Team collaboration
- API access
- Dedicated support

## Changing Plans

1. Go to Settings > Billing
2. Click "Change Plan"
3. Select your new plan
4. Confirm the change

Upgrades take effect immediately. Downgrades take effect at your next billing date.

## Cancellation

You can cancel anytime from the Billing page. You'll keep access until the end of your billing period.
    `,
    tags: ['plans', 'subscription', 'pricing', 'upgrade', 'cancel'],
    updatedAt: '2024-12-22',
  },

  // Account
  {
    id: 'profile-settings',
    title: 'Managing Your Profile',
    category: 'account',
    content: `
# Profile Settings

Customize your account and preferences.

## Personal Information

Update your profile in Settings > Profile:
- Name and photo
- Email address
- Business name
- Contact information

## Notification Preferences

Control how we communicate with you:
- **Email notifications** - Weekly summaries, lead alerts
- **Desktop notifications** - Task completion alerts
- **Marketing emails** - Tips and product updates

## Email Configuration

Set up how emails are sent on your behalf:
- Sender name (appears in "From" field)
- Reply-to address
- Email signature template

## Security

Keep your account secure:
- Change password regularly
- Enable two-factor authentication (coming soon)
- Review login history
    `,
    tags: ['profile', 'settings', 'account', 'preferences', 'security'],
    updatedAt: '2024-12-22',
  },
];

/**
 * Search articles by query
 */
export function searchArticles(query: string): HelpArticle[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return helpArticles;

  return helpArticles.filter(article => {
    const searchableText = [
      article.title,
      article.content,
      ...article.tags,
    ].join(' ').toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return helpArticles.filter(article => article.category === category);
}

/**
 * Get article by ID
 */
export function getArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find(article => article.id === id);
}
