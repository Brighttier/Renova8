/**
 * AI Support Chat Service
 *
 * Provides intelligent support chatbot functionality using Gemini AI.
 * Handles intent classification, context-aware responses, and escalation.
 */

import { GoogleGenAI } from '@google/genai';

// ============================================
// Types
// ============================================

export interface SupportContext {
  userId?: string;
  userEmail?: string;
  userPlan?: 'free' | 'starter' | 'pro' | 'enterprise';
  currentPage?: string;
  currentWebsiteId?: string;
  currentWebsiteName?: string;
  recentActions?: RecentAction[];
  systemStatus?: SystemStatus;
}

export interface RecentAction {
  type: 'publish' | 'domain_setup' | 'dns_verify' | 'website_edit' | 'payment' | 'login';
  timestamp: number;
  success: boolean;
  details?: string;
}

export interface SystemStatus {
  publishingAvailable: boolean;
  lastPublishError?: string;
  domainStatus?: 'pending' | 'verified' | 'active' | 'error';
  sslStatus?: 'provisioning' | 'active';
  dnsRecords?: Array<{ type: string; name: string; value: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: SupportIntent;
  actions?: SuggestedAction[];
}

export interface SuggestedAction {
  label: string;
  type: 'link' | 'action' | 'escalate';
  target?: string;
  onClick?: () => void;
}

export type SupportIntent =
  | 'publishing_issue'
  | 'dns_domain_issue'
  | 'ssl_issue'
  | 'preview_issue'
  | 'billing_question'
  | 'how_to'
  | 'account_issue'
  | 'bug_report'
  | 'feature_request'
  | 'general_question'
  | 'escalation_request'
  | 'greeting';

// ============================================
// Knowledge Base
// ============================================

const KNOWLEDGE_BASE = {
  publishing: {
    common_issues: [
      {
        problem: 'Publishing failed with authentication error',
        solution: 'Please ensure you are logged in. Try logging out and logging back in. If the issue persists, your session may have expired.',
        steps: ['Log out of the platform', 'Clear browser cache', 'Log back in', 'Try publishing again']
      },
      {
        problem: 'Website not updating after publish',
        solution: 'Firebase Hosting may take 1-2 minutes to propagate changes globally. Try clearing your browser cache or opening in incognito mode.',
        steps: ['Wait 2-3 minutes', 'Clear browser cache', 'Try hard refresh (Ctrl+Shift+R)', 'Check in incognito window']
      },
      {
        problem: 'Publish button not working',
        solution: 'Ensure you have generated website code first. The publish button is only active when there is content to publish.',
        steps: ['Generate or edit your website first', 'Ensure code is visible in the builder', 'Click Publish again']
      }
    ],
    faq: [
      { q: 'How long does publishing take?', a: 'Publishing typically takes 10-30 seconds. Your site will be live immediately after.' },
      { q: 'Can I update my published website?', a: 'Yes! Simply make changes in the editor and click Publish again. Updates deploy instantly.' },
      { q: 'What URL will my website have?', a: 'Your website gets a unique Firebase Hosting URL like your-site-name.web.app. You can also connect a custom domain.' }
    ]
  },
  domains: {
    common_issues: [
      {
        problem: 'DNS records not verifying',
        solution: 'DNS propagation can take up to 48 hours, though usually completes within 30 minutes. Ensure records are entered exactly as shown.',
        steps: ['Double-check DNS records match exactly', 'Wait at least 30 minutes', 'Use a DNS checker tool', 'Contact your domain registrar if needed']
      },
      {
        problem: 'SSL certificate not provisioning',
        solution: 'SSL certificates are automatically provisioned after domain verification. This can take 1-24 hours.',
        steps: ['Ensure domain is verified first', 'Wait up to 24 hours', 'Check domain status in settings']
      },
      {
        problem: 'Custom domain not loading',
        solution: 'Ensure DNS records are correctly configured and domain status shows "Active".',
        steps: ['Verify domain status is "Active"', 'Check DNS A/CNAME records', 'Clear DNS cache', 'Wait for propagation']
      }
    ],
    faq: [
      { q: 'How do I connect a custom domain?', a: 'After publishing, click "Add Custom Domain" in the deploy section. Enter your domain and configure the DNS records at your registrar.' },
      { q: 'What DNS records do I need?', a: 'You\'ll need to add A records (for apex domain) or CNAME records (for subdomains) plus a TXT record for verification.' },
      { q: 'Do I get free SSL?', a: 'Yes! SSL certificates are automatically provisioned for all domains, including custom domains.' }
    ]
  },
  billing: {
    faq: [
      { q: 'How does the credit system work?', a: 'Credits are used for AI operations. You start with 50 free credits. Website generation uses 10 credits, images use 5-20 credits.' },
      { q: 'How do I buy more credits?', a: 'Go to Settings > Billing and select a credit pack. Payments are processed securely through Stripe.' },
      { q: 'Do credits expire?', a: 'No, credits do not expire. Use them whenever you need.' },
      { q: 'Can I get a refund?', a: 'Please contact support for refund requests. We handle these on a case-by-case basis.' }
    ]
  },
  howTo: {
    guides: [
      { topic: 'create_website', steps: ['Go to Website Builder', 'Describe your business', 'Generate concept image (optional)', 'Click "Build Website"', 'Refine with AI chat', 'Publish when ready'] },
      { topic: 'edit_website', steps: ['Open your website in the Editor', 'Click on elements to select them', 'Use the AI chat to describe changes', 'Or manually edit in code view', 'Save and publish changes'] },
      { topic: 'find_leads', steps: ['Go to Scout Customers', 'Enter business type and location', 'Click Search', 'Review results', 'Add promising leads to your Client List'] },
      { topic: 'send_proposal', steps: ['Select a customer', 'Build their website', 'Publish the website', 'Use "Send Proposal" to email them the link'] }
    ]
  }
};

// ============================================
// Intent Classification
// ============================================

function classifyIntent(message: string, context: SupportContext): SupportIntent {
  const lowerMessage = message.toLowerCase();

  // Greeting detection
  if (/^(hi|hello|hey|help|support|good\s*(morning|afternoon|evening))/.test(lowerMessage)) {
    return 'greeting';
  }

  // Publishing issues
  if (/(publish|deploy|live|hosting|upload|launch)/i.test(lowerMessage)) {
    if (/(fail|error|not working|issue|problem|stuck|can't|cannot)/i.test(lowerMessage)) {
      return 'publishing_issue';
    }
    return 'how_to';
  }

  // DNS/Domain issues
  if (/(dns|domain|cname|a record|txt record|nameserver|registrar)/i.test(lowerMessage)) {
    return 'dns_domain_issue';
  }

  // SSL issues
  if (/(ssl|https|certificate|secure|encryption)/i.test(lowerMessage)) {
    return 'ssl_issue';
  }

  // Preview issues
  if (/(preview|view|see|display|show|render|broken|blank)/i.test(lowerMessage) &&
      /(website|site|page)/i.test(lowerMessage)) {
    return 'preview_issue';
  }

  // Billing
  if (/(bill|payment|credit|charge|price|cost|plan|subscription|refund|invoice)/i.test(lowerMessage)) {
    return 'billing_question';
  }

  // Account issues
  if (/(account|login|password|email|profile|settings)/i.test(lowerMessage) &&
      /(change|update|reset|can't|cannot|issue|problem)/i.test(lowerMessage)) {
    return 'account_issue';
  }

  // Bug report
  if (/(bug|broken|crash|freeze|glitch|doesn't work|error)/i.test(lowerMessage)) {
    return 'bug_report';
  }

  // Feature request
  if (/(feature|suggestion|would be nice|wish|could you add|request)/i.test(lowerMessage)) {
    return 'feature_request';
  }

  // Escalation
  if (/(human|agent|person|support team|escalate|ticket|speak to)/i.test(lowerMessage)) {
    return 'escalation_request';
  }

  // How-to questions
  if (/(how|what|where|when|why|can i|do i|should i)/i.test(lowerMessage)) {
    return 'how_to';
  }

  return 'general_question';
}

// ============================================
// Context-Aware Response Generation
// ============================================

function buildContextPrompt(context: SupportContext): string {
  const parts: string[] = [];

  if (context.userPlan) {
    parts.push(`User is on the ${context.userPlan} plan.`);
  }

  if (context.currentPage) {
    parts.push(`User is currently on the ${context.currentPage} page.`);
  }

  if (context.currentWebsiteName) {
    parts.push(`User is working on website: "${context.currentWebsiteName}".`);
  }

  if (context.recentActions && context.recentActions.length > 0) {
    const recent = context.recentActions[0];
    const timeAgo = Math.floor((Date.now() - recent.timestamp) / 60000);
    parts.push(`${timeAgo} minutes ago, user ${recent.success ? 'successfully' : 'attempted to'} ${recent.type.replace('_', ' ')}${recent.details ? `: ${recent.details}` : ''}.`);
  }

  if (context.systemStatus) {
    const status = context.systemStatus;
    if (status.lastPublishError) {
      parts.push(`Last publish error: "${status.lastPublishError}".`);
    }
    if (status.domainStatus) {
      parts.push(`Custom domain status: ${status.domainStatus}.`);
    }
    if (status.sslStatus) {
      parts.push(`SSL status: ${status.sslStatus}.`);
    }
  }

  return parts.length > 0 ? `\n\nContext:\n${parts.join('\n')}` : '';
}

function getRelevantKnowledge(intent: SupportIntent): string {
  let knowledge = '';

  switch (intent) {
    case 'publishing_issue':
      knowledge = `
Publishing Knowledge:
${KNOWLEDGE_BASE.publishing.common_issues.map(i => `- Problem: ${i.problem}\n  Solution: ${i.solution}`).join('\n')}

FAQ:
${KNOWLEDGE_BASE.publishing.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}`;
      break;

    case 'dns_domain_issue':
    case 'ssl_issue':
      knowledge = `
Domain & SSL Knowledge:
${KNOWLEDGE_BASE.domains.common_issues.map(i => `- Problem: ${i.problem}\n  Solution: ${i.solution}`).join('\n')}

FAQ:
${KNOWLEDGE_BASE.domains.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}`;
      break;

    case 'billing_question':
      knowledge = `
Billing FAQ:
${KNOWLEDGE_BASE.billing.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}`;
      break;

    case 'how_to':
      knowledge = `
How-To Guides:
${KNOWLEDGE_BASE.howTo.guides.map(g => `${g.topic}: ${g.steps.join(' → ')}`).join('\n')}`;
      break;
  }

  return knowledge;
}

// ============================================
// Main Chat Function
// ============================================

const SYSTEM_PROMPT = `You are a friendly and helpful AI support assistant for Renova8, an AI-powered platform that helps entrepreneurs build websites, find leads, and create marketing content.

Your role is to:
1. Greet users warmly and ask how you can help
2. Understand their issue or question
3. Provide clear, step-by-step guidance
4. Use non-technical language when possible
5. Be encouraging and supportive
6. Offer to escalate to human support if needed

Important guidelines:
- Keep responses concise (2-4 sentences for simple questions, more for complex issues)
- Use bullet points for steps
- Never make up information - if unsure, say so
- Don't expose sensitive data or internal system details
- If you can't help, offer to create a support ticket

Platform features you can help with:
- Website Builder: AI-generated websites with Tailwind CSS
- Website Editor: Drag-and-drop and AI chat editing
- Publishing: Deploy to Firebase Hosting with custom domains
- Scout Customers: Find local business leads
- Marketing Studio: Campaign and content generation
- Image/Video Studio: AI-generated media
- Invoicing: Create and send invoices
- Credits: Used for AI operations, can be purchased`;

export async function generateSupportResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: SupportContext
): Promise<{ response: string; intent: SupportIntent; actions?: SuggestedAction[] }> {

  // Classify intent
  const intent = classifyIntent(userMessage, context);

  // Handle escalation request
  if (intent === 'escalation_request') {
    return {
      response: "I understand you'd like to speak with our support team. I can help you with that!\n\nWould you like me to:\n• Create a support ticket (we'll respond within 24 hours)\n• Email our support team directly\n\nIn the meantime, is there anything else I can try to help with?",
      intent,
      actions: [
        { label: 'Create Support Ticket', type: 'action', target: 'create_ticket' },
        { label: 'Email Support', type: 'link', target: 'mailto:support@renova8.app' }
      ]
    };
  }

  // Build context-aware prompt
  const contextPrompt = buildContextPrompt(context);
  const knowledgeBase = getRelevantKnowledge(intent);

  // Build conversation history for AI
  const historyText = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${SYSTEM_PROMPT}

${knowledgeBase}
${contextPrompt}

Conversation history:
${historyText}

User's current message: ${userMessage}

Detected intent: ${intent}

Please respond helpfully. If this is a greeting, warmly greet the user and ask how you can help. Keep your response focused and actionable.`;

  try {
    // Use Gemini for response generation
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');

    if (!apiKey) {
      // Fallback to rule-based responses if no API key
      return generateFallbackResponse(userMessage, intent, context);
    }

    const genAI = new GoogleGenAI({ apiKey });

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: fullPrompt,
    });

    const response = result.text || generateFallbackResponse(userMessage, intent, context).response;

    // Generate suggested actions based on intent
    const actions = generateSuggestedActions(intent, context);

    return { response, intent, actions };

  } catch (error) {
    console.error('Error generating support response:', error);
    return generateFallbackResponse(userMessage, intent, context);
  }
}

// ============================================
// Fallback Responses
// ============================================

function generateFallbackResponse(
  userMessage: string,
  intent: SupportIntent,
  context: SupportContext
): { response: string; intent: SupportIntent; actions?: SuggestedAction[] } {

  let response: string;
  let actions: SuggestedAction[] = [];

  switch (intent) {
    case 'greeting':
      response = "👋 Hi there! Welcome to Renova8 support. I'm here to help you with:\n\n• Website building and publishing\n• Custom domain setup\n• Finding leads and customers\n• Billing and account questions\n\nHow can I assist you today?";
      break;

    case 'publishing_issue':
      response = "I see you're having trouble with publishing. Here are some common solutions:\n\n1. **Make sure you're logged in** - Try logging out and back in\n2. **Check your internet connection**\n3. **Ensure you have generated website code** - The publish button needs content\n\nIf you're seeing a specific error message, please share it and I can help further!";
      if (context.systemStatus?.lastPublishError) {
        response += `\n\nI see your last publish attempt had this error: "${context.systemStatus.lastPublishError}"`;
      }
      actions = [{ label: 'Try Publishing Again', type: 'action', target: 'retry_publish' }];
      break;

    case 'dns_domain_issue':
      response = "Setting up a custom domain involves configuring DNS records. Here's what you need to know:\n\n1. **DNS changes take time** - Allow 30 minutes to 48 hours for propagation\n2. **Enter records exactly** - Copy/paste to avoid typos\n3. **Check with your registrar** - GoDaddy, Namecheap, etc. each have different interfaces\n\nWhat specific issue are you experiencing with your domain?";
      actions = [
        { label: 'View DNS Records', type: 'action', target: 'show_dns' },
        { label: 'Check Domain Status', type: 'action', target: 'check_domain' }
      ];
      break;

    case 'ssl_issue':
      response = "SSL certificates are automatically provisioned after your domain is verified. Here's what to know:\n\n• **Provisioning time**: 1-24 hours after domain verification\n• **No action needed**: It's automatic!\n• **Check status**: You can see SSL status in your website settings\n\nIs your domain already verified?";
      break;

    case 'billing_question':
      response = "I can help with billing questions!\n\n**Credits:**\n• You start with 50 free credits\n• Website generation: 10 credits\n• Image generation: 5-20 credits\n• Credits never expire\n\n**Purchasing:**\n• Go to Settings > Billing\n• Choose a credit pack\n• Secure payment via Stripe\n\nWhat specific billing question do you have?";
      actions = [{ label: 'Go to Billing', type: 'link', target: '/settings/billing' }];
      break;

    case 'how_to':
      response = "I'd be happy to help you learn how to use Renova8! Here are our main features:\n\n• **Website Builder** - AI-generated websites\n• **Scout Customers** - Find local business leads\n• **Marketing Studio** - Create campaigns and content\n• **Image Studio** - Generate social media graphics\n\nWhat would you like to learn how to do?";
      break;

    case 'bug_report':
      response = "I'm sorry you're experiencing issues! To help us fix this:\n\n1. **What were you trying to do?**\n2. **What happened instead?**\n3. **Any error messages?**\n\nPlease describe the issue in detail and I'll either help resolve it or create a bug report for our team.";
      actions = [{ label: 'Report Bug', type: 'action', target: 'create_ticket' }];
      break;

    case 'feature_request':
      response = "Thank you for your feedback! We love hearing ideas from our users. 💡\n\nPlease describe the feature you'd like to see, and I'll make sure it gets to our product team.\n\nWhat would this feature help you accomplish?";
      actions = [{ label: 'Submit Feature Request', type: 'action', target: 'feature_request' }];
      break;

    default:
      response = "I'm here to help! Could you tell me more about what you need assistance with?\n\nI can help with:\n• Publishing websites\n• Custom domain setup\n• Finding customers\n• Billing questions\n• How to use features\n\nJust describe your question or issue!";
  }

  return { response, intent, actions };
}

// ============================================
// Suggested Actions Generator
// ============================================

function generateSuggestedActions(intent: SupportIntent, context: SupportContext): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  switch (intent) {
    case 'publishing_issue':
      actions.push({ label: 'Retry Publish', type: 'action', target: 'retry_publish' });
      actions.push({ label: 'View Help Docs', type: 'link', target: '/help/publishing' });
      break;

    case 'dns_domain_issue':
      if (context.currentWebsiteId) {
        actions.push({ label: 'View DNS Records', type: 'action', target: 'show_dns' });
        actions.push({ label: 'Verify Domain', type: 'action', target: 'verify_domain' });
      }
      break;

    case 'billing_question':
      actions.push({ label: 'View Billing', type: 'link', target: '/settings' });
      actions.push({ label: 'Buy Credits', type: 'action', target: 'buy_credits' });
      break;
  }

  // Always offer escalation for issues
  if (['publishing_issue', 'dns_domain_issue', 'ssl_issue', 'bug_report'].includes(intent)) {
    actions.push({ label: 'Contact Support', type: 'escalate', target: 'create_ticket' });
  }

  return actions;
}

// ============================================
// Support Ticket Creation
// ============================================

export interface SupportTicket {
  id: string;
  userId?: string;
  userEmail?: string;
  category: SupportIntent;
  subject: string;
  description: string;
  context: SupportContext;
  conversationHistory: ChatMessage[];
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
}

export function createSupportTicket(
  category: SupportIntent,
  description: string,
  context: SupportContext,
  conversationHistory: ChatMessage[]
): SupportTicket {
  return {
    id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: context.userId,
    userEmail: context.userEmail,
    category,
    subject: `Support Request: ${category.replace('_', ' ')}`,
    description,
    context,
    conversationHistory,
    status: 'open',
    createdAt: Date.now()
  };
}

// ============================================
// Quick Replies
// ============================================

export const QUICK_REPLIES = [
  { label: 'Publishing issues', message: 'I\'m having trouble publishing my website' },
  { label: 'Custom domain help', message: 'How do I connect my custom domain?' },
  { label: 'How to use', message: 'How do I create a website?' },
  { label: 'Billing question', message: 'I have a question about credits and billing' },
  { label: 'Something else', message: 'I need help with something else' }
];
