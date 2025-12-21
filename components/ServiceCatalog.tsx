import React, { useState, useMemo } from 'react';
import type { ServiceItem, ServiceCategory, ServiceType } from '../types';
import type { SupportContext } from '../services/supportChatService';

interface ServiceCatalogProps {
  onOpenSupportChat?: (context: SupportContext, initialMessage?: string) => void;
}

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onOpenSupportChat }) => {
  const [catalogView, setCatalogView] = useState<'diy' | 'assistance'>('diy');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiyModal, setShowDiyModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Service catalog data - DIY Website Builder Features
  const services: ServiceItem[] = [

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 1: PAGES & STRUCTURE (8 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'add-new-page',
      name: 'Add a New Page',
      description: 'Create a new page with custom name, URL slug, and navigation placement',
      category: 'pages-structure',
      icon: '📄',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Custom page creation', 'URL slug configuration', 'Navigation menu integration', 'Template selection', 'SEO-ready structure'],
      serviceType: 'diy',
      diyPrompt: `Add a new page to my website with the following details:
- Page name: [PAGE NAME: About, Services, Contact, etc.]
- URL slug: [URL SLUG: /about, /services, /contact]
- Add to navigation menu in position: [POSITION: First, Last, After "Home"]
- Use template style: [TEMPLATE: Blank, Hero + Content, Two Column, Full Width]
- Include default sections: [SECTIONS: Header, Content Area, Footer]

The page should match the existing design system and be mobile-responsive.`
    },

    {
      id: 'remove-page',
      name: 'Remove a Page',
      description: 'Delete an existing page and remove it from navigation',
      category: 'pages-structure',
      icon: '🗑️',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Safe page deletion', 'Navigation cleanup', 'Link removal', 'Preserve data backups', 'Redirect handling'],
      serviceType: 'diy',
      diyPrompt: `Remove the following page from my website:
- Page to delete: [PAGE NAME: Blog, Old Services, Contact-v1]
- Remove from navigation menu: [YES/NO]
- Redirect visitors to: [REDIRECT URL: /home, /services, 404 page]
- Clean up all internal links pointing to this page
- Preserve page content in backup/archive: [YES/NO]

Ensure no broken links remain after deletion.`
    },

    {
      id: 'rename-page',
      name: 'Rename a Page',
      description: 'Change page title, URL slug, and navigation label',
      category: 'pages-structure',
      icon: '✏️',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Title updates', 'URL slug changes', 'Navigation label editing', 'Meta title updates', 'Breadcrumb updates'],
      serviceType: 'diy',
      diyPrompt: `Rename an existing page on my website:
- Current page name: [CURRENT NAME: About Us, Our Services]
- New page name: [NEW NAME: Our Story, What We Do]
- Update URL slug to: [NEW SLUG: /our-story, /what-we-do]
- Update navigation menu label to: [NAV LABEL: Story, Services]
- Update page meta title and descriptions accordingly

Maintain all page content and design while updating names.`
    },

    {
      id: 'reorder-navigation',
      name: 'Reorder Navigation Menu',
      description: 'Change the order of pages in your main navigation menu',
      category: 'pages-structure',
      icon: '↕️',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Drag-and-drop ordering', 'Menu position control', 'Mobile menu ordering', 'Dropdown organization', 'Visual hierarchy'],
      serviceType: 'diy',
      diyPrompt: `Reorder the navigation menu on my website:
- Current order: [CURRENT ORDER: Home, About, Services, Contact]
- New desired order: [NEW ORDER: Home, Services, About, Portfolio, Contact]
- Apply to: [LOCATIONS: Desktop Nav, Mobile Menu, Footer Links]
- Group related items: [GROUPING: Services submenu, About submenu]

Ensure navigation remains intuitive and matches user expectations.`
    },

    {
      id: 'add-section-to-page',
      name: 'Add a New Section to a Page',
      description: 'Insert a new content section with customizable layout and styling',
      category: 'pages-structure',
      icon: '➕',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Section templates', 'Layout options', 'Content blocks', 'Background styles', 'Responsive design'],
      serviceType: 'diy',
      diyPrompt: `Add a new section to the following page:
- Page: [PAGE NAME: Home, About, Services]
- Section position: [POSITION: After Hero, Before Footer, Between sections 2 and 3]
- Section type: [TYPE: Text Block, Image + Text, CTA Banner, Feature Grid, Testimonials]
- Layout: [LAYOUT: Full Width, Contained, Two Column, Three Column]
- Background: [BACKGROUND: White, Light Gray, Gradient, Image]

Include placeholder content that I can customize later.`
    },

    {
      id: 'reorder-sections',
      name: 'Reorder Sections on a Page',
      description: 'Change the vertical order of content sections within a page',
      category: 'pages-structure',
      icon: '🔀',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Visual section moving', 'Smooth transitions', 'Maintain content', 'Preview changes', 'Responsive handling'],
      serviceType: 'diy',
      diyPrompt: `Reorder sections on the following page:
- Page: [PAGE NAME: Home, Services, About]
- Current section order: [CURRENT: Hero, Features, Testimonials, CTA, Footer]
- New desired order: [NEW ORDER: Hero, Testimonials, Features, CTA, Footer]
- Maintain: [MAINTAIN: All content, styling, animations, spacing]

Ensure visual flow and user experience remain optimal after reordering.`
    },

    {
      id: 'anchor-links',
      name: 'Add Anchor Links / Jump-to-Section Buttons',
      description: 'Create clickable links that scroll to specific sections within a page',
      category: 'pages-structure',
      icon: '⚓',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Smooth scrolling', 'Section anchors', 'Jump buttons', 'Navigation links', 'Mobile-friendly'],
      serviceType: 'diy',
      diyPrompt: `Add anchor links / jump-to-section functionality:
- Page: [PAGE NAME: Long Services page, About page]
- Sections to link to: [SECTIONS: Services, Pricing, FAQ, Contact Form, Team]
- Anchor link placement: [PLACEMENT: Top of page, Sticky sidebar, Hero section buttons]
- Button/link style: [STYLE: Outline buttons, Text links, Icon buttons]
- Scroll behavior: [BEHAVIOR: Smooth scroll with offset for fixed header]

(UI only, no backend integration required)`
    },

    {
      id: 'footer-content',
      name: 'Add or Update Footer Content',
      description: 'Customize footer with contact info, links, social media, and legal pages',
      category: 'pages-structure',
      icon: '👣',
      iconBg: '#3B82F6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Multi-column layout', 'Social icons', 'Contact info', 'Quick links', 'Copyright text'],
      serviceType: 'diy',
      diyPrompt: `Update the footer section with the following:
- Footer columns: [COLUMNS: Company Info, Quick Links, Contact, Social Media]
- Contact details: [CONTACT: Phone, Email, Address, Business Hours]
- Quick links: [LINKS: About, Services, Privacy Policy, Terms of Service]
- Social media icons: [PLATFORMS: Facebook, Instagram, LinkedIn, Twitter]
- Copyright text: [TEXT: © 2025 [BUSINESS NAME]. All rights reserved.]
- Footer style: [STYLE: Dark background, Light background, Gradient]

Ensure footer is mobile-responsive and matches brand design.`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 2: DESIGN & BRANDING (6 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'update-colors',
      name: 'Update Primary and Secondary Colors',
      description: 'Change brand colors across the entire website for consistent theming',
      category: 'design-branding',
      icon: '🎨',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Global color system', 'Primary/secondary colors', 'Accent colors', 'Text contrast', 'Color accessibility'],
      serviceType: 'diy',
      diyPrompt: `Update the website color scheme:
- Primary color: [PRIMARY: #3B82F6, Navy Blue, Brand Teal]
- Secondary color: [SECONDARY: #EC4899, Gold, Orange]
- Accent color: [ACCENT: #10B981, Light Blue, Yellow]
- Apply to: [ELEMENTS: Buttons, links, headers, backgrounds, borders]
- Ensure text contrast meets accessibility standards (WCAG AA)

Update all pages consistently with the new color palette.`
    },

    {
      id: 'update-fonts',
      name: 'Update Font Style and Typography',
      description: 'Change fonts for headings and body text across the website',
      category: 'design-branding',
      icon: '🔤',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Heading fonts', 'Body fonts', 'Font pairings', 'Size scaling', 'Weight variations'],
      serviceType: 'diy',
      diyPrompt: `Update website typography:
- Heading font: [HEADING FONT: Playfair Display, Montserrat, Roboto, Lora]
- Body font: [BODY FONT: Open Sans, Lato, Inter, Poppins]
- Font sizes: [SIZES: H1: 3rem, H2: 2rem, Body: 1rem, etc.]
- Font weights: [WEIGHTS: Headings bold (700), Body regular (400)]
- Line height: [LINE HEIGHT: 1.5 for body, 1.2 for headings]

Apply consistently across all pages and ensure readability on mobile.`
    },

    {
      id: 'update-button-styles',
      name: 'Update Button Styles',
      description: 'Customize button design including colors, shapes, and hover effects',
      category: 'design-branding',
      icon: '🔘',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Button variants', 'Hover effects', 'Border radius', 'Shadows', 'Icon buttons'],
      serviceType: 'diy',
      diyPrompt: `Update button styles throughout the website:
- Primary button: [PRIMARY: Background color, text color, border, padding]
- Secondary button: [SECONDARY: Outline style, ghost style, text-only]
- Button shape: [SHAPE: Rounded corners (8px), Pill shape, Sharp corners]
- Hover effects: [HOVER: Color change, shadow lift, scale transform]
- Button sizes: [SIZES: Small, Medium, Large, Full Width]

Apply to all call-to-action buttons, form submissions, and navigation.`
    },

    {
      id: 'improve-spacing',
      name: 'Improve Spacing and Visual Hierarchy',
      description: 'Adjust margins, padding, and whitespace for better visual flow',
      category: 'design-branding',
      icon: '📐',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Margin adjustments', 'Padding optimization', 'Section spacing', 'Content breathing room', 'Visual balance'],
      serviceType: 'diy',
      diyPrompt: `Improve spacing and visual hierarchy:
- Section spacing: [SPACING: Increase gap between sections to 80px]
- Content padding: [PADDING: Add 40px padding to content containers]
- Heading margins: [MARGINS: Add 24px margin-bottom to all headings]
- Element spacing: [ELEMENTS: Buttons, cards, forms, lists]
- Mobile adjustments: [MOBILE: Reduce spacing by 50% on small screens]

Create a more balanced, professional layout with improved readability.`
    },

    {
      id: 'mobile-optimization',
      name: 'Optimize Layout for Mobile Devices',
      description: 'Improve mobile responsiveness including navigation, images, and content stacking',
      category: 'design-branding',
      icon: '📱',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Responsive breakpoints', 'Mobile navigation', 'Touch targets', 'Image scaling', 'Content stacking'],
      serviceType: 'diy',
      diyPrompt: `Optimize the website for mobile devices:
- Responsive breakpoints: [BREAKPOINTS: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)]
- Mobile navigation: [NAV: Hamburger menu, collapsible sections]
- Content layout: [LAYOUT: Stack columns vertically, full-width images]
- Touch targets: [SIZE: Minimum 44x44px for buttons and links]
- Font sizes: [FONTS: Increase base font size to 16px on mobile]

Test on common mobile screen sizes (iPhone, Android) and ensure usability.`
    },

    {
      id: 'add-animations',
      name: 'Add Simple Hover or Scroll Animations',
      description: 'Enhance user experience with subtle animations and transitions',
      category: 'design-branding',
      icon: '✨',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Hover effects', 'Scroll animations', 'Fade-ins', 'Slide-ups', 'Smooth transitions'],
      serviceType: 'diy',
      diyPrompt: `Add simple animations to enhance user experience:
- Hover effects: [ELEMENTS: Buttons scale on hover, cards lift with shadow, links underline]
- Scroll animations: [ANIMATIONS: Fade in on scroll, slide up on scroll, stagger items]
- Elements to animate: [TARGETS: Feature cards, testimonials, images, CTAs]
- Animation speed: [SPEED: 300ms transitions, 0.5s fade-ins]
- Accessibility: [A11Y: Respect prefers-reduced-motion settings]

Keep animations subtle and professional, avoiding distractions.`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 3: CONTENT & COPY (8 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'rewrite-page-copy',
      name: 'Rewrite Page Copy with a New Tone',
      description: 'Transform existing content with a different writing style and tone',
      category: 'content-copy',
      icon: '✍️',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Tone transformation', 'Voice consistency', 'Length adjustment', 'Keyword integration', 'Readability optimization'],
      serviceType: 'diy',
      diyPrompt: `Rewrite the copy on the following page:
- Page: [PAGE NAME: Home, About, Services]
- Current tone: [CURRENT: Professional, Formal, Technical]
- Desired new tone: [NEW TONE: Friendly, Conversational, Authoritative, Playful, Empathetic]
- Target audience: [AUDIENCE: Small business owners, Homeowners, Tech professionals]
- Key points to maintain: [MAINTAIN: Company values, service offerings, contact info]
- Preferred length: [LENGTH: Concise, Detailed, Same as current]

Preserve all factual information while adapting the writing style.`
    },

    {
      id: 'generate-service-descriptions',
      name: 'Generate Service Descriptions',
      description: 'Create compelling descriptions for services with benefits and features',
      category: 'content-copy',
      icon: '📋',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Service overviews', 'Benefit highlighting', 'Feature lists', 'Pricing context', 'Call-to-action'],
      serviceType: 'diy',
      diyPrompt: `Generate service descriptions for:
- Service name: [SERVICE: Plumbing Repair, Web Design, Home Cleaning, etc.]
- What it includes: [INCLUDES: Features, deliverables, process steps]
- Key benefits: [BENEFITS: Time savings, cost effectiveness, quality guarantee]
- Target customer: [CUSTOMER: Homeowners, Small businesses, Families]
- Tone: [TONE: Professional, Friendly, Technical]
- Length: [LENGTH: 2-3 paragraphs, bullet points, short summary]

Include a clear call-to-action at the end.`
    },

    {
      id: 'improve-headlines-ctas',
      name: 'Improve Headlines and Calls-to-Action',
      description: 'Strengthen headlines and CTAs to drive engagement and conversions',
      category: 'content-copy',
      icon: '🎯',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Compelling headlines', 'Action-oriented CTAs', 'Value propositions', 'Urgency creation', 'Benefit focus'],
      serviceType: 'diy',
      diyPrompt: `Improve headlines and calls-to-action:
- Current headlines: [CURRENT: "Our Services", "About Us", "Contact"]
- Current CTAs: [CURRENT: "Click Here", "Submit", "Learn More"]
- Desired focus: [FOCUS: Benefits, Outcomes, Problem-solving, Urgency]
- Industry: [INDUSTRY: Home services, B2B, E-commerce, Professional services]
- Action goals: [GOALS: Get quote, Book appointment, Sign up, Download, Purchase]

Make headlines attention-grabbing and CTAs clear and actionable.`
    },

    {
      id: 'add-update-testimonials',
      name: 'Add or Update Testimonials',
      description: 'Add customer testimonials with quotes, names, and optional photos',
      category: 'content-copy',
      icon: '💬',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Customer quotes', 'Reviewer details', 'Star ratings', 'Photo placeholders', 'Carousel layout'],
      serviceType: 'diy',
      diyPrompt: `Add testimonials section to my website:
- Number of testimonials: [COUNT: 3, 6, 9 testimonials]
- Customer details: [DETAILS: Name, Title/Location, Company (if B2B), Photo]
- Testimonial content: [CONTENT: Short quote highlighting specific benefit]
- Display style: [STYLE: Carousel, Grid, List, Featured single testimonial]
- Include ratings: [RATINGS: 5-star display, YES/NO]

(UI only - use placeholder content that I can replace with real testimonials)`
    },

    {
      id: 'add-update-faq',
      name: 'Add or Update an FAQ Section',
      description: 'Create comprehensive FAQ with collapsible questions and answers',
      category: 'content-copy',
      icon: '❓',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Expandable questions', 'Organized categories', 'Search functionality', 'Jump links', 'Schema markup'],
      serviceType: 'diy',
      diyPrompt: `Add or update FAQ section:
- Page location: [LOCATION: Dedicated FAQ page, Bottom of homepage, Services page]
- FAQ topics: [TOPICS: Pricing, Process, Guarantees, Scheduling, Service area]
- Number of questions: [COUNT: 5, 10, 15+ questions]
- Display style: [STYLE: Accordion (collapsible), All expanded, Two-column grid]
- Categories: [CATEGORIES: General, Billing, Services, Technical]

Generate placeholder questions relevant to [INDUSTRY: plumbing, web design, etc.].`
    },

    {
      id: 'add-team-section',
      name: 'Add a "Meet the Team" Section',
      description: 'Showcase team members with photos, roles, and brief bios',
      category: 'content-copy',
      icon: '👥',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Team member cards', 'Photo placeholders', 'Role titles', 'Bio descriptions', 'Social links'],
      serviceType: 'diy',
      diyPrompt: `Add a "Meet the Team" section:
- Number of team members: [COUNT: 2, 4, 6, 8+ members]
- Information to display: [INFO: Name, Job Title, Bio (2-3 sentences), Photo, Social links]
- Layout style: [LAYOUT: Grid, List, Carousel, Featured leader + team grid]
- Bio tone: [TONE: Professional, Friendly, Personal]
- Include social links: [SOCIAL: LinkedIn, Email, YES/NO]

(UI only - use placeholder photos and sample bios that I can customize)`
    },

    {
      id: 'update-business-info',
      name: 'Update Business Information',
      description: 'Update company details like name, address, hours, contact across the site',
      category: 'content-copy',
      icon: 'ℹ️',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Company name', 'Address updates', 'Contact info', 'Business hours', 'Service area'],
      serviceType: 'diy',
      diyPrompt: `Update business information throughout the website:
- Business name: [NAME: ABC Plumbing, XYZ Web Design]
- Address: [ADDRESS: 123 Main St, City, State, ZIP]
- Phone number: [PHONE: (555) 123-4567]
- Email: [EMAIL: info@business.com]
- Business hours: [HOURS: Mon-Fri 9am-5pm, 24/7 Emergency]
- Service area: [AREA: City name, County, Radius]
- Update locations: [LOCATIONS: Header, Footer, Contact page, About page, Schema markup]

Ensure consistency across all pages and sections.`
    },

    {
      id: 'improve-about-story',
      name: 'Write or Improve "About Us" Story',
      description: 'Craft compelling company origin story and mission statement',
      category: 'content-copy',
      icon: '📖',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Origin story', 'Mission statement', 'Core values', 'Company timeline', 'Founder story'],
      serviceType: 'diy',
      diyPrompt: `Write or improve the "About Us" content:
- Company background: [BACKGROUND: Founded in [YEAR], [FOUNDER] started the business to [PURPOSE]]
- Mission statement: [MISSION: What you do, who you serve, how you're different]
- Core values: [VALUES: Quality, Integrity, Customer service, Innovation]
- Story elements: [STORY: Challenges overcome, growth milestones, community impact]
- Tone: [TONE: Inspirational, Down-to-earth, Professional]
- Length: [LENGTH: 300-500 words, 3-4 paragraphs]

Create an authentic, engaging story that builds trust with customers.`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 4: LEAD CAPTURE & CONTACT (4 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'add-contact-form',
      name: 'Add a Contact Form',
      description: 'Create a contact form with name, email, message, and optional fields',
      category: 'lead-capture',
      icon: '📨',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Form fields', 'Validation', 'Spam protection', 'Success message', 'Mobile-friendly'],
      serviceType: 'diy',
      diyPrompt: `Add a contact form to my website:
- Form location: [LOCATION: Contact page, Homepage footer, Sidebar]
- Form fields: [FIELDS: Name, Email, Phone, Subject, Message, Service Interest]
- Required fields: [REQUIRED: Name, Email, Message]
- Form styling: [STYLE: Inline, Two-column, Single column, Modal popup]
- Success message: [MESSAGE: "Thanks! We'll respond within 24 hours."]
- Button text: [BUTTON: "Send Message", "Get in Touch", "Submit"]

(UI only, no backend integration - form submission will need to be connected later)`
    },

    {
      id: 'update-contact-form',
      name: 'Update Contact Form Fields or Text',
      description: 'Modify existing form fields, labels, placeholders, and messaging',
      category: 'lead-capture',
      icon: '✏️',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Field customization', 'Label editing', 'Placeholder text', 'Help text', 'Error messages'],
      serviceType: 'diy',
      diyPrompt: `Update the existing contact form:
- Add/remove fields: [CHANGES: Add phone field, Remove company field, Make message longer]
- Update field labels: [LABELS: "Your Name" → "Full Name", "Email" → "Best Email"]
- Update placeholders: [PLACEHOLDERS: "Enter your message" → "Tell us about your project"]
- Update button text: [BUTTON: Current → New text]
- Update success/error messages: [MESSAGES: Custom confirmation text]
- Validation rules: [VALIDATION: Email format, phone format, minimum message length]

(UI only, no backend changes)`
    },

    {
      id: 'add-quote-form',
      name: 'Add a "Request a Quote" Form',
      description: 'Create detailed quote request form with project-specific fields',
      category: 'lead-capture',
      icon: '💰',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Multi-step form', 'Service selection', 'Budget range', 'Timeline', 'File uploads'],
      serviceType: 'diy',
      diyPrompt: `Add a "Request a Quote" form:
- Form location: [LOCATION: Dedicated page, Modal popup, Services page]
- Form fields: [FIELDS: Name, Email, Phone, Service Type, Project Description, Budget Range, Timeline]
- Service options: [SERVICES: Dropdown or checkboxes for service categories]
- Budget field: [BUDGET: Range slider, Dropdown ranges, Text input]
- Additional fields: [OPTIONAL: Company, Project size, Preferred contact method, File upload]
- Form style: [STYLE: Single page, Multi-step wizard, Side-by-side layout]

(UI only, no backend integration - submissions need to be wired up later)`
    },

    {
      id: 'add-newsletter-signup',
      name: 'Add a Newsletter Signup Form',
      description: 'Create email capture form for newsletter subscriptions and updates',
      category: 'lead-capture',
      icon: '📬',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Email capture', 'Minimal design', 'Inline/popup options', 'Privacy notice', 'Success state'],
      serviceType: 'diy',
      diyPrompt: `Add a newsletter signup form:
- Form location: [LOCATION: Footer, Homepage section, Popup modal, Sidebar]
- Form style: [STYLE: Inline (email + button), Popup after 30s, Exit-intent popup]
- Fields: [FIELDS: Email only, Email + Name, Email + Preferences]
- Headline: [HEADLINE: "Stay Updated", "Join Our Newsletter", "Get Tips & Updates"]
- Button text: [BUTTON: "Subscribe", "Sign Up", "Get Updates"]
- Privacy note: [PRIVACY: "We respect your privacy. Unsubscribe anytime."]

(UI only, no backend integration - email collection needs to be connected later)`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 5: SIMPLE EMBEDS (5 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'embed-google-maps',
      name: 'Embed Google Maps',
      description: 'Add interactive Google Maps showing your business location',
      category: 'embeds',
      icon: '🗺️',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Interactive map', 'Location pin', 'Directions link', 'Responsive sizing', 'Custom styling'],
      serviceType: 'diy',
      diyPrompt: `Embed Google Maps on my website:
- Business address: [ADDRESS: 123 Main Street, City, State, ZIP]
- Map placement: [LOCATION: Contact page, Footer, About page]
- Map size: [SIZE: Full width, Half width, Square embed]
- Map style: [STYLE: Default, Grayscale, Satellite view, Terrain]
- Additional features: [FEATURES: Show directions link, Zoom level, Custom marker]

Generate the Google Maps embed code for the specified address.
(UI only - uses Google Maps embed iframe, no backend required)`
    },

    {
      id: 'embed-calendly',
      name: 'Embed Calendly',
      description: 'Add Calendly scheduling widget for booking appointments',
      category: 'embeds',
      icon: '📅',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Inline calendar', 'Popup widget', 'Custom colors', 'Timezone handling', 'Confirmation flow'],
      serviceType: 'diy',
      diyPrompt: `Embed Calendly scheduling on my website:
- Calendly URL: [URL: https://calendly.com/your-username/event-type]
- Embed style: [STYLE: Inline embed, Popup widget, Text link trigger]
- Page placement: [LOCATION: Book Appointment page, Contact section, Services page]
- Widget height: [HEIGHT: 600px, 800px, Full height]
- Button text (if popup): [BUTTON: "Schedule a Call", "Book Appointment", "Choose a Time"]
- Custom colors: [COLORS: Match website primary color]

(UI only - uses Calendly embed code, no backend required)`
    },

    {
      id: 'embed-typeform',
      name: 'Embed Typeform / Google Form',
      description: 'Add embedded Typeform or Google Form for surveys and lead capture',
      category: 'embeds',
      icon: '📝',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Form embed', 'Full width option', 'Popup mode', 'Custom height', 'Responsive design'],
      serviceType: 'diy',
      diyPrompt: `Embed a Typeform or Google Form:
- Form type: [TYPE: Typeform, Google Form]
- Form URL: [URL: Your form's share/embed URL]
- Embed style: [STYLE: Inline embed, Popup modal, Sidebar widget, Full-page]
- Page placement: [LOCATION: Contact page, Quote request page, Survey page]
- Form height: [HEIGHT: 500px, 700px, Full viewport height]
- Loading message: [MESSAGE: "Loading form..."]

(UI only - uses third-party embed code, no backend required)`
    },

    {
      id: 'embed-video',
      name: 'Embed YouTube or Vimeo Video',
      description: 'Add embedded video player for promotional or educational content',
      category: 'embeds',
      icon: '🎥',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Responsive player', 'Auto-play option', 'Custom thumbnail', 'Playlist support', 'Privacy mode'],
      serviceType: 'diy',
      diyPrompt: `Embed a YouTube or Vimeo video:
- Video platform: [PLATFORM: YouTube, Vimeo]
- Video URL: [URL: Full YouTube/Vimeo video URL]
- Page placement: [LOCATION: Homepage hero, About page, Services page, Dedicated video page]
- Player size: [SIZE: Full width, 16:9 aspect ratio, Square, Custom dimensions]
- Player settings: [SETTINGS: Auto-play, Show controls, Loop video, Start at timestamp]
- Caption/description: [CAPTION: Optional text below video]

(UI only - uses platform embed code, no backend required)`
    },

    {
      id: 'embed-instagram',
      name: 'Embed Instagram Feed Widget',
      description: 'Display live Instagram posts feed with photos from your account',
      category: 'embeds',
      icon: '📸',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Photo grid', 'Live updates', 'Clickable posts', 'Customizable layout', 'Mobile responsive'],
      serviceType: 'diy',
      diyPrompt: `Embed an Instagram feed widget:
- Instagram username: [USERNAME: @yourbusiness]
- Widget placement: [LOCATION: Homepage section, Footer, Gallery page, Sidebar]
- Display style: [STYLE: Grid (3x3), Carousel, Single column, Masonry]
- Number of posts: [COUNT: 6, 9, 12 recent posts]
- Widget service: [SERVICE: EmbedSocial, Snapwidget, Juicer.io, or custom solution]
- Show captions: [CAPTIONS: YES/NO]

(UI only - uses third-party widget embed code, no backend required)`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY 6: SEO & TRUST (4 features)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: 'update-meta-tags',
      name: 'Update Page Titles and Meta Descriptions',
      description: 'Optimize page meta tags for search engines and social sharing',
      category: 'seo-trust',
      icon: '🔍',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Title tags', 'Meta descriptions', 'Character limits', 'Keyword optimization', 'Social preview'],
      serviceType: 'diy',
      diyPrompt: `Update SEO meta tags for the following pages:
- Pages to update: [PAGES: Home, About, Services, Contact]
- Business name: [BUSINESS: ABC Plumbing, XYZ Web Design]
- Location: [LOCATION: City, State for local SEO]
- Target keywords: [KEYWORDS: Main service keywords, location keywords]
- Title format: [FORMAT: "Page Name | Business Name | Location" (55-60 characters)]
- Description format: [FORMAT: Compelling 150-160 character summary with call-to-action]

Generate optimized titles and descriptions for each page.`
    },

    {
      id: 'improve-heading-structure',
      name: 'Improve Heading Structure (H1/H2)',
      description: 'Organize content with proper heading hierarchy for SEO and accessibility',
      category: 'seo-trust',
      icon: '📑',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['H1 optimization', 'H2-H6 hierarchy', 'Keyword placement', 'Semantic structure', 'Accessibility'],
      serviceType: 'diy',
      diyPrompt: `Improve heading structure across the website:
- Pages to optimize: [PAGES: Home, Services, About, Blog posts]
- H1 requirements: [H1: One per page, include main keyword, clear page topic]
- H2 sections: [H2: Section headings describing main content blocks]
- H3-H6 usage: [SUBHEADINGS: Logical nested structure]
- Target keywords: [KEYWORDS: Service keywords, location keywords]
- Current issues: [ISSUES: Multiple H1s, Skipped levels, Generic headings like "Welcome"]

Restructure headings for better SEO and screen reader accessibility.`
    },

    {
      id: 'add-schema-markup',
      name: 'Add Basic Local Business Schema Markup',
      description: 'Add structured data for local business visibility in search results',
      category: 'seo-trust',
      icon: '🏷️',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['LocalBusiness schema', 'Organization markup', 'Contact info', 'Service area', 'Opening hours'],
      serviceType: 'diy',
      diyPrompt: `Add local business schema markup (JSON-LD):
- Business type: [TYPE: LocalBusiness, HomeAndConstructionBusiness, ProfessionalService]
- Business name: [NAME: Full legal business name]
- Address: [ADDRESS: Street, City, State, ZIP]
- Phone: [PHONE: (555) 123-4567]
- Business hours: [HOURS: Mon-Fri 9am-5pm]
- Service area: [AREA: Cities/regions served]
- Additional info: [INFO: Website URL, Logo URL, Price range, Payment methods]

Generate valid JSON-LD schema markup to paste in the website <head> section.`
    },

    {
      id: 'add-trust-badges',
      name: 'Add Trust Badges, Guarantees, or Certifications',
      description: 'Display trust symbols including certifications, awards, and guarantees',
      category: 'seo-trust',
      icon: '🛡️',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'AI Engine',
      features: ['Badge display', 'Certification logos', 'Guarantee seals', 'Award icons', 'Security badges'],
      serviceType: 'diy',
      diyPrompt: `Add trust badges and guarantees to my website:
- Trust elements: [ELEMENTS: BBB Accredited, Licensed & Insured, Money-Back Guarantee, Industry Certifications]
- Placement: [LOCATION: Homepage hero, Footer, About page, Checkout/quote pages]
- Badge types: [TYPES: Certification logos, Award badges, Guarantee seals, Payment security icons]
- Display style: [STYLE: Row of icons, Grid, Carousel, With descriptions]
- Guarantees text: [GUARANTEES: "100% Satisfaction Guaranteed", "Insured & Licensed", "20 Years Experience"]

(UI only - use placeholder images for badges that can be replaced with real logos)`
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GET ASSISTANCE CATALOG - BACKEND/COMPLEX FEATURES
    // ═══════════════════════════════════════════════════════════════════════

    // CATEGORY 1: PAYMENTS & MONETIZATION (5 features)
    {
      id: 'stripe-one-time-payments',
      name: 'Stripe One-Time Payments',
      description: 'Accept one-time payments for products or services using Stripe',
      category: 'payments-monetization',
      icon: '💳',
      iconBg: '#6366F1',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Stripe integration', 'Payment processing', 'Receipt generation', 'Refund handling', 'Transaction logging'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'subscription-billing',
      name: 'Subscription Billing / Recurring Payments',
      description: 'Set up recurring subscription payments with automated billing cycles',
      category: 'payments-monetization',
      icon: '🔄',
      iconBg: '#6366F1',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Recurring billing', 'Multiple plan tiers', 'Trial periods', 'Cancellation management', 'Payment reminders'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'ecommerce-setup',
      name: 'Ecommerce Setup (Products/Cart/Checkout)',
      description: 'Full ecommerce solution with product catalog, shopping cart, and checkout',
      category: 'payments-monetization',
      icon: '🛒',
      iconBg: '#6366F1',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Product management', 'Shopping cart', 'Checkout flow', 'Inventory tracking', 'Order management'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'invoicing-billing-systems',
      name: 'Invoicing / Billing Systems',
      description: 'Automated invoice generation and billing management system',
      category: 'payments-monetization',
      icon: '📄',
      iconBg: '#6366F1',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Invoice creation', 'Payment tracking', 'Automatic reminders', 'PDF generation', 'Client portal'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'paid-content-gated-downloads',
      name: 'Paid Content / Gated Downloads',
      description: 'Sell digital products with secure download delivery after payment',
      category: 'payments-monetization',
      icon: '🔒',
      iconBg: '#6366F1',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Digital product sales', 'Secure file delivery', 'Access control', 'Download tracking', 'License management'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 2: MEMBERSHIPS & USER ACCOUNTS (5 features)
    {
      id: 'authentication-login-system',
      name: 'Authentication/Login System',
      description: 'Secure user authentication with email/password and social login options',
      category: 'memberships-accounts',
      icon: '🔐',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['User registration', 'Secure login', 'Password reset', 'Social auth', 'Session management'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'member-portal-gated-content',
      name: 'Member Portal / Gated Content',
      description: 'Create members-only area with restricted content access',
      category: 'memberships-accounts',
      icon: '👥',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Member dashboard', 'Content access control', 'User profiles', 'Activity tracking', 'Member directory'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'roles-permissions',
      name: 'Roles & Permissions (Admin vs Member)',
      description: 'Role-based access control system with customizable permission levels',
      category: 'memberships-accounts',
      icon: '⚙️',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Role management', 'Permission levels', 'Access restrictions', 'User groups', 'Admin controls'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard for Managing Members/Content',
      description: 'Comprehensive admin panel for user and content management',
      category: 'memberships-accounts',
      icon: '📊',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['User management', 'Content moderation', 'Analytics', 'Bulk operations', 'Export data'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'multi-tenant-setup',
      name: 'Multi-Tenant Setup',
      description: 'Create separate workspaces or accounts for different organizations',
      category: 'memberships-accounts',
      icon: '🏢',
      iconBg: '#8B5CF6',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Tenant isolation', 'Subdomain routing', 'Separate databases', 'Custom branding', 'Tenant admin'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 3: SCHEDULING & BOOKING (4 features)
    {
      id: 'custom-booking-reservations',
      name: 'Custom Booking/Reservations',
      description: 'Build custom appointment or reservation booking system',
      category: 'scheduling-booking',
      icon: '📅',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Availability calendar', 'Booking forms', 'Time slot management', 'Resource allocation', 'Booking confirmation'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'calendar-sync',
      name: 'Calendar Sync',
      description: 'Two-way sync with Google Calendar, Outlook, or other calendar services',
      category: 'scheduling-booking',
      icon: '🔄',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Google Calendar sync', 'Outlook integration', 'iCal support', 'Conflict prevention', 'Real-time updates'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'automated-reminders',
      name: 'Automated Reminders (Email/SMS)',
      description: 'Send automatic appointment reminders via email and SMS',
      category: 'scheduling-booking',
      icon: '⏰',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Email reminders', 'SMS notifications', 'Custom timing', 'Template customization', 'Confirmation tracking'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'reschedule-cancel-workflows',
      name: 'Reschedule/Cancel Workflows',
      description: 'Allow clients to reschedule or cancel appointments with automated workflows',
      category: 'scheduling-booking',
      icon: '♻️',
      iconBg: '#10B981',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Self-service rescheduling', 'Cancellation policies', 'Refund automation', 'Waitlist management', 'Notification updates'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 4: AI & AUTOMATION (5 features)
    {
      id: 'ai-lead-qualification',
      name: 'AI Lead Qualification Flows',
      description: 'Automated lead qualification using AI-powered conversation flows',
      category: 'ai-automation',
      icon: '🤖',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['AI chat qualification', 'Lead scoring', 'Smart routing', 'Qualification forms', 'CRM integration'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'automated-email-sms-followups',
      name: 'Automated Email/SMS Follow-ups',
      description: 'Set up automated drip campaigns and follow-up sequences',
      category: 'ai-automation',
      icon: '✉️',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Email sequences', 'SMS campaigns', 'Trigger-based sends', 'A/B testing', 'Analytics tracking'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'ai-chat-crm-integration',
      name: 'AI Chat with CRM Integration',
      description: 'AI-powered chatbot integrated with your CRM system',
      category: 'ai-automation',
      icon: '💬',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['AI chatbot', 'CRM sync', 'Lead capture', 'Natural language', 'Chat history'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'multi-step-automations',
      name: 'Multi-Step Automations/Agents',
      description: 'Complex workflow automation with conditional logic and multi-step processes',
      category: 'ai-automation',
      icon: '⚡',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Workflow builder', 'Conditional logic', 'Multi-step flows', 'API integration', 'Error handling'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'document-generation',
      name: 'Document Generation (Quotes/Contracts)',
      description: 'Automated generation of quotes, contracts, and custom documents',
      category: 'ai-automation',
      icon: '📝',
      iconBg: '#F59E0B',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Template system', 'PDF generation', 'E-signature integration', 'Variable substitution', 'Version control'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 5: INTEGRATIONS & APIS (6 features)
    {
      id: 'crm-integration',
      name: 'CRM Integration (HubSpot/Salesforce)',
      description: 'Connect your website with HubSpot, Salesforce, or other CRM platforms',
      category: 'integrations-apis',
      icon: '🔗',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Bi-directional sync', 'Lead capture', 'Contact management', 'Activity tracking', 'Custom fields'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'email-marketing-integration',
      name: 'Email Marketing Integration (Mailchimp/Klaviyo)',
      description: 'Integrate with email marketing platforms for list building and campaigns',
      category: 'integrations-apis',
      icon: '📧',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['List synchronization', 'Signup forms', 'Segmentation', 'Campaign triggers', 'Analytics sync'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'sms-integration',
      name: 'SMS Integration (Twilio)',
      description: 'Send and receive SMS messages using Twilio integration',
      category: 'integrations-apis',
      icon: '📱',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['SMS sending', 'Two-way messaging', 'Bulk SMS', 'Message templates', 'Delivery tracking'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'google-business-profile-integration',
      name: 'Google Business Profile Integration',
      description: 'Sync reviews, posts, and business information with Google Business Profile',
      category: 'integrations-apis',
      icon: '🏪',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Review sync', 'Post management', 'Q&A integration', 'Analytics', 'Multi-location support'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'review-ingestion-management',
      name: 'Review Ingestion/Management',
      description: 'Aggregate and display reviews from multiple platforms',
      category: 'integrations-apis',
      icon: '⭐',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Multi-platform sync', 'Review widgets', 'Response management', 'Sentiment analysis', 'Review requests'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'oauth-api-integrations',
      name: 'OAuth/API-Key Based Integrations',
      description: 'Custom API integrations with OAuth authentication',
      category: 'integrations-apis',
      icon: '🔑',
      iconBg: '#EC4899',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['OAuth setup', 'API key management', 'Token refresh', 'Webhook handling', 'Rate limiting'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 6: DATA & BACKEND SYSTEMS (6 features)
    {
      id: 'database-backed-features',
      name: 'Database-Backed Features',
      description: 'Build custom features with database persistence and CRUD operations',
      category: 'data-backend',
      icon: '🗄️',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Database design', 'CRUD operations', 'Data relationships', 'Query optimization', 'Data migration'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'cms-functionality',
      name: 'CMS Functionality',
      description: 'Content management system for easy content updates and publishing',
      category: 'data-backend',
      icon: '📰',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Content editor', 'Media library', 'Version control', 'Publishing workflow', 'SEO tools'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'analytics-dashboards-reporting',
      name: 'Analytics Dashboards/Reporting',
      description: 'Custom analytics dashboards with real-time reporting and insights',
      category: 'data-backend',
      icon: '📈',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Custom dashboards', 'Real-time metrics', 'Report generation', 'Data visualization', 'Export capabilities'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'user-data-storage-reporting',
      name: 'User Data Storage + Reporting',
      description: 'Secure user data storage with comprehensive reporting tools',
      category: 'data-backend',
      icon: '💾',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Secure storage', 'Data encryption', 'User reports', 'Data export', 'GDPR compliance'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'custom-admin-panels',
      name: 'Custom Admin Panels',
      description: 'Build tailored admin interfaces for managing your platform',
      category: 'data-backend',
      icon: '🎛️',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Custom UI', 'Data management', 'User controls', 'Settings panel', 'Activity logs'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'user-activity-tracking',
      name: 'User Activity Tracking/Logs',
      description: 'Track and log user activities for analytics and compliance',
      category: 'data-backend',
      icon: '📋',
      iconBg: '#06B6D4',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Activity logging', 'Audit trails', 'Event tracking', 'User sessions', 'Compliance reports'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 7: SECURITY & RELIABILITY (5 features)
    {
      id: 'security-hardening-rate-limiting',
      name: 'Security Hardening + Rate Limiting',
      description: 'Implement security best practices and API rate limiting',
      category: 'security-reliability',
      icon: '🛡️',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Security audit', 'Rate limiting', 'DDoS protection', 'Input validation', 'Security headers'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'spam-prevention-captcha',
      name: 'Spam Prevention/CAPTCHA',
      description: 'Implement spam prevention and CAPTCHA solutions',
      category: 'security-reliability',
      icon: '🚫',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['reCAPTCHA', 'Honeypot fields', 'Email verification', 'IP blocking', 'Bot detection'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'gdpr-cookie-consent',
      name: 'GDPR/Cookie Consent Tooling',
      description: 'GDPR-compliant cookie consent and privacy management',
      category: 'security-reliability',
      icon: '🍪',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Cookie banner', 'Consent management', 'Privacy policy', 'Data requests', 'Compliance tracking'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'backup-recovery',
      name: 'Backup/Recovery',
      description: 'Automated backup system with point-in-time recovery',
      category: 'security-reliability',
      icon: '💿',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Automated backups', 'Point-in-time recovery', 'Offsite storage', 'Backup testing', 'Disaster recovery'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'performance-optimization-monitoring',
      name: 'Performance Optimization/Monitoring',
      description: 'Optimize site performance and implement monitoring tools',
      category: 'security-reliability',
      icon: '⚡',
      iconBg: '#EF4444',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Performance audit', 'Caching setup', 'CDN integration', 'Real-time monitoring', 'Alert system'],
      serviceType: 'backend',
      price: '$XX'
    },

    // CATEGORY 8: ADVANCED FEATURES (4 features)
    {
      id: 'multi-language-support-cms',
      name: 'Multi-Language Support with CMS',
      description: 'Implement internationalization with content management for multiple languages',
      category: 'advanced-features',
      icon: '🌍',
      iconBg: '#A855F7',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Language switching', 'Translation management', 'RTL support', 'Locale detection', 'SEO per language'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'custom-domain-mapping-ssl',
      name: 'Custom Domain Mapping + SSL',
      description: 'Set up custom domain routing and SSL certificate management',
      category: 'advanced-features',
      icon: '🔐',
      iconBg: '#A855F7',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Domain configuration', 'SSL certificates', 'DNS management', 'Subdomain routing', 'Auto-renewal'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'white-label-rebrand',
      name: 'White-Label/Rebrand Options',
      description: 'Enable white-label capabilities with custom branding for resellers',
      category: 'advanced-features',
      icon: '🎨',
      iconBg: '#A855F7',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['Custom branding', 'Logo replacement', 'Color schemes', 'Email templates', 'Domain isolation'],
      serviceType: 'backend',
      price: '$XX'
    },
    {
      id: 'api-development-third-party',
      name: 'API Development for Third-Party Integrations',
      description: 'Build custom APIs for third-party integrations and external services',
      category: 'advanced-features',
      icon: '🔌',
      iconBg: '#A855F7',
      lastUpdate: 'December 2025',
      source: 'Professional Setup',
      features: ['RESTful API', 'API documentation', 'Authentication', 'Webhooks', 'Rate limiting'],
      serviceType: 'backend',
      price: '$XX'
    }
  ];

  // Helper function to get card styling based on service type
  const getCardStyling = (serviceType: ServiceType) => {
    switch (serviceType) {
      case 'diy':
        return {
          border: 'border-l-4 border-l-green-500',
          badge: { bg: 'bg-green-50', text: 'text-green-700', label: '✓ DIY Ready' }
        };
      case 'backend':
        return {
          border: 'border-l-4 border-l-blue-500',
          badge: { bg: 'bg-blue-50', text: 'text-blue-700', label: '🔧 Setup Required' }
        };
      case 'hybrid':
        return {
          border: 'border-l-4 border-l-purple-500',
          badge: { bg: 'bg-purple-50', text: 'text-purple-700', label: '🔀 DIY + Pro' }
        };
      default:
        return { border: '', badge: null };
    }
  };

  // Filter services based on catalog view, category, and search
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by catalog view (DIY vs Get Assistance)
    if (catalogView === 'diy') {
      filtered = filtered.filter(service => service.serviceType === 'diy');
    } else {
      filtered = filtered.filter(service => service.serviceType === 'backend');
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.features.some(f => f.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [catalogView, selectedCategory, searchQuery, services]);

  // Category counts (filtered by current catalog view)
  const categoryCounts = useMemo(() => {
    // Filter services by current catalog view
    const viewServices = catalogView === 'diy'
      ? services.filter(s => s.serviceType === 'diy')
      : services.filter(s => s.serviceType === 'backend');

    const counts: Record<string, number> = {
      all: viewServices.length,
      // DIY categories
      'pages-structure': 0,
      'design-branding': 0,
      'content-copy': 0,
      'lead-capture': 0,
      'embeds': 0,
      'seo-trust': 0,
      // Get Assistance categories
      'payments-monetization': 0,
      'memberships-accounts': 0,
      'scheduling-booking': 0,
      'ai-automation': 0,
      'integrations-apis': 0,
      'data-backend': 0,
      'security-reliability': 0,
      'advanced-features': 0
    };

    viewServices.forEach(service => {
      counts[service.category]++;
    });

    return counts;
  }, [services, catalogView]);

  const handleDiyClick = (service: ServiceItem) => {
    setSelectedService(service);
    setShowDiyModal(true);
  };

  const handleGetAssistanceClick = (service: ServiceItem) => {
    // Build service context
    const context: SupportContext = {
      currentPage: 'Service Catalog',
      currentWebsiteName: service.name,
      recentActions: [{
        type: 'requested_assistance',
        timestamp: Date.now(),
        success: true,
        details: `User requested assistance for: ${service.name}`
      }]
    };

    // Pre-populated message
    const initialMessage = `Hi! I need help implementing ${service.name} for my client's website. Could you assist me with the setup and requirements?`;

    // Call support chat callback
    if (onOpenSupportChat) {
      onOpenSupportChat(context, initialMessage);
    } else {
      // Fallback if not wired up yet
      alert(`Support integration coming soon!\n\nService: ${service.name}\n\nOur team will help you implement this feature.`);
    }
  };

  const handleCopyPrompt = () => {
    if (selectedService) {
      navigator.clipboard.writeText(selectedService.diyPrompt);
      alert('Prompt copied to clipboard! Paste it into the Website Studio to add this feature.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-white">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                Service & Feature Catalog
              </h1>
              <p className="text-gray-600">
                Browse our complete collection of AI-powered services and features
              </p>
            </div>
          </div>

          {/* Catalog View Toggle */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => {
                  setCatalogView('diy');
                  setSelectedCategory('all'); // Reset category filter when switching views
                }}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  catalogView === 'diy'
                    ? 'bg-[#D4AF37] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✓ DIY Features
              </button>
              <button
                onClick={() => {
                  setCatalogView('assistance');
                  setSelectedCategory('all'); // Reset category filter when switching views
                }}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  catalogView === 'assistance'
                    ? 'bg-[#D4AF37] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔧 Get Assistance
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search services and features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {catalogView === 'diy' ? (
              // DIY Category Filters
              [
                { id: 'all', label: 'All Features', icon: '🔍' },
                { id: 'pages-structure', label: 'Pages & Structure', icon: '📄' },
                { id: 'design-branding', label: 'Design & Branding', icon: '🎨' },
                { id: 'content-copy', label: 'Content & Copy', icon: '✍️' },
                { id: 'lead-capture', label: 'Lead Capture & Contact', icon: '📨' },
                { id: 'embeds', label: 'Simple Embeds', icon: '🔗' },
                { id: 'seo-trust', label: 'SEO & Trust', icon: '🔍' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ServiceCategory | 'all')}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                  <span className="ml-2 text-xs opacity-75">
                    ({categoryCounts[cat.id]})
                  </span>
                </button>
              ))
            ) : (
              // Get Assistance Category Filters
              [
                { id: 'all', label: 'All Services', icon: '🔍' },
                { id: 'payments-monetization', label: 'Payments & Monetization', icon: '💳' },
                { id: 'memberships-accounts', label: 'Memberships & Accounts', icon: '👥' },
                { id: 'scheduling-booking', label: 'Scheduling & Booking', icon: '📅' },
                { id: 'ai-automation', label: 'AI & Automation', icon: '🤖' },
                { id: 'integrations-apis', label: 'Integrations & APIs', icon: '🔗' },
                { id: 'data-backend', label: 'Data & Backend', icon: '🗄️' },
                { id: 'security-reliability', label: 'Security & Reliability', icon: '🛡️' },
                { id: 'advanced-features', label: 'Advanced Features', icon: '⚡' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ServiceCategory | 'all')}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                  <span className="ml-2 text-xs opacity-75">
                    ({categoryCounts[cat.id]})
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const cardStyle = getCardStyling(service.serviceType);

              return (
              <div
                key={service.id}
                className={`bg-white rounded-2xl border border-[#EFEBE4] ${cardStyle.border} p-6 hover:shadow-lg transition-all duration-300`}
              >
                {/* Service Type Badge */}
                {cardStyle.badge && (
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-3 ${cardStyle.badge.bg} ${cardStyle.badge.text}`}>
                    {cardStyle.badge.label}
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: service.iconBg + '15' }}
                >
                  {service.icon}
                </div>

                {/* Service Info */}
                <h3 className="text-xl font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Price Display for Backend Services */}
                {service.price && service.serviceType === 'backend' && (
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-[#D4AF37]">{service.price}</span>
                    <span className="text-sm text-gray-500 ml-2">starting from</span>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  {service.source && (
                    <div className="bg-gray-100 px-2 py-1 rounded">
                      Source: {service.source}
                    </div>
                  )}
                  <div className="bg-gray-100 px-2 py-1 rounded">
                    {service.lastUpdate}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {service.features.length > 3 && (
                      <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">
                        +{service.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {/* DIY Button - Show for 'diy' and 'hybrid' */}
                  {(service.serviceType === 'diy' || service.serviceType === 'hybrid') && service.diyPrompt && (
                    <button
                      onClick={() => handleDiyClick(service)}
                      className={`${service.serviceType === 'hybrid' ? 'flex-1' : 'w-full'} bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-semibold py-2 px-4 rounded-lg hover:shadow-md transition-all`}
                    >
                      {service.serviceType === 'hybrid' ? 'DIY (Basic)' : 'DIY'}
                    </button>
                  )}

                  {/* Get Assistance Button - Show for 'backend' and 'hybrid' */}
                  {(service.serviceType === 'backend' || service.serviceType === 'hybrid') && (
                    <button
                      onClick={() => {
                        // For backend services, open modal first to show details and pricing
                        setSelectedService(service);
                        setShowDiyModal(true);
                      }}
                      className={`${service.serviceType === 'hybrid' ? 'flex-1' : 'w-full'} bg-white text-[#D4AF37] border-2 border-[#D4AF37] font-semibold py-2 px-4 rounded-lg hover:bg-[#D4AF37] hover:text-white transition-all`}
                    >
                      {service.serviceType === 'hybrid' ? 'Pro Setup' : 'Get Assistance'}
                    </button>
                  )}
                </div>

                {/* Hybrid explanation note - Show only for hybrid services */}
                {service.serviceType === 'hybrid' && service.hybridNote && (
                  <div className="mt-3 text-xs text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <span className="font-semibold text-purple-700">💡 Note:</span> {service.hybridNote}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Modal (DIY and Get Assistance) */}
      {showDiyModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedService.iconBg + '15' }}
                >
                  {selectedService.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display' }}>
                    {selectedService.name}
                    {selectedService.serviceType === 'diy' && ' - DIY Prompt'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedService.serviceType === 'backend'
                      ? 'Professional setup service - Get expert assistance'
                      : 'Copy this prompt and paste it into the Website Studio'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiyModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">{selectedService.serviceType === 'backend' ? (
                // Backend Service Modal Content
                <>
                  {/* Price Display */}
                  {selectedService.price && (
                    <div className="mb-6 text-center bg-gradient-to-r from-[#D4AF37]/10 to-[#F4D03F]/10 rounded-xl p-6 border-2 border-[#D4AF37]/30">
                      <div className="text-sm text-gray-600 mb-2">Starting from</div>
                      <div className="text-5xl font-bold text-[#D4AF37] mb-2">{selectedService.price}</div>
                      <div className="text-sm text-gray-600">Professional implementation service</div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Service</h3>
                    <p className="text-gray-600">{selectedService.description}</p>
                  </div>

                  {/* Features Included */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">What's Included:</h3>
                    <div className="space-y-2">
                      {selectedService.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-gray-700">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why Get Assistance */}
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <span>💡</span>
                      Why Choose Professional Setup?
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2 ml-6 list-disc">
                      <li>Complex backend development requiring technical expertise</li>
                      <li>Secure integration with third-party services and APIs</li>
                      <li>Custom configuration tailored to your business needs</li>
                      <li>Ongoing support and maintenance included</li>
                      <li>Testing and quality assurance before launch</li>
                    </ul>
                  </div>

                  {/* Get Support CTA */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleGetAssistanceClick(selectedService);
                        setShowDiyModal(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Get Support
                    </button>
                    <button
                      onClick={() => setShowDiyModal(false)}
                      className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                // DIY Service Modal Content (existing)
                <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  {selectedService.serviceType === 'hybrid'
                    ? 'How to use this DIY prompt (Basic Version):'
                    : 'How to use this prompt:'}
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 ml-6 list-decimal">
                  <li>Click "Copy Prompt" button below</li>
                  <li>Open the Website Studio in RenovateMySite</li>
                  <li>Paste the prompt into the editor's chat input</li>
                  <li>Fill in the [BRACKETED] sections with your specific details</li>
                  <li>Let AI generate the feature for your website!</li>
                </ol>

                {/* Hybrid note */}
                {selectedService.serviceType === 'hybrid' && selectedService.hybridNote && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm text-blue-900">
                      <strong>⚠️ Note:</strong> {selectedService.hybridNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Generic DIY Prompt:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {selectedService.diyPrompt}
                  </pre>
                </div>
              </div>

              {/* Features Included */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Features Included:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyPrompt}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt
                </button>
                <button
                  onClick={() => setShowDiyModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
              </>
              )}
            </div> {/* Closes <div className="p-6"> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalog;
