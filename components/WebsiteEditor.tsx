import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Lead } from '../types';

interface WebsiteEditorProps {
  customers: Lead[];
  selectedCustomer?: Lead | null;
  onUpdateCustomer: (customer: Lead) => void;
  onBack: () => void;
}

interface EditorComponent {
  id: string;
  type: 'header' | 'hero' | 'features' | 'about' | 'services' | 'testimonials' | 'gallery' | 'contact' | 'footer' | 'cta' | 'pricing' | 'team' | 'faq' | 'stats' | 'text' | 'image' | 'video' | 'divider' | 'spacer';
  content: any;
  styles: {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    margin?: string;
    fontFamily?: string;
    fontSize?: string;
  };
  order: number;
}

interface WebsiteData {
  id: string;
  name: string;
  components: EditorComponent[];
  globalStyles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    backgroundColor: string;
  };
  publishedAt?: number;
  lastSavedAt?: number;
  isDraft: boolean;
}

interface HistoryState {
  past: WebsiteData[];
  present: WebsiteData;
  future: WebsiteData[];
}

interface AIChange {
  id: string;
  description: string;
  type: 'style' | 'content' | 'structure' | 'global';
  targetComponent?: string;
  changes: any;
  applied: boolean;
}

interface PromptSuggestion {
  text: string;
  category: 'color' | 'content' | 'layout' | 'add' | 'remove' | 'style';
  icon: string;
}

// AI Prompt suggestions for non-technical users
const promptSuggestions: PromptSuggestion[] = [
  { text: 'Change the primary color to blue', category: 'color', icon: '🎨' },
  { text: 'Make the hero section background darker', category: 'style', icon: '🌙' },
  { text: 'Add a testimonials section', category: 'add', icon: '➕' },
  { text: 'Change the headline text', category: 'content', icon: '✏️' },
  { text: 'Increase the font size', category: 'style', icon: '🔤' },
  { text: 'Add more padding to sections', category: 'style', icon: '📐' },
  { text: 'Change the button color to green', category: 'color', icon: '🟢' },
  { text: 'Update the contact email', category: 'content', icon: '📧' },
  { text: 'Add a pricing section', category: 'add', icon: '💰' },
  { text: 'Remove the features section', category: 'remove', icon: '🗑️' },
  { text: 'Make the website more modern', category: 'style', icon: '✨' },
  { text: 'Change the font to something elegant', category: 'style', icon: '🖋️' },
  { text: 'Add a team section', category: 'add', icon: '👥' },
  { text: 'Update the company description', category: 'content', icon: '📝' },
  { text: 'Make the CTA button stand out more', category: 'style', icon: '🔘' },
];

// Color name to hex mapping
const colorNameToHex: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B',
  purple: '#8B5CF6', pink: '#EC4899', orange: '#F97316', teal: '#14B8A6',
  indigo: '#6366F1', cyan: '#06B6D4', lime: '#84CC16', amber: '#F59E0B',
  emerald: '#10B981', sky: '#0EA5E9', violet: '#8B5CF6', rose: '#F43F5E',
  slate: '#64748B', gray: '#6B7280', zinc: '#71717A', neutral: '#737373',
  stone: '#78716C', black: '#000000', white: '#FFFFFF', gold: '#D4AF37',
  navy: '#1E3A5F', maroon: '#800000', olive: '#808000', coral: '#FF7F50',
  salmon: '#FA8072', turquoise: '#40E0D0', lavender: '#E6E6FA', beige: '#F5F5DC',
  dark: '#1a1a1a', light: '#f5f5f5', darker: '#0a0a0a', lighter: '#fafafa'
};

// Font family mapping
const fontFamilyMap: Record<string, string> = {
  modern: 'Inter, sans-serif',
  elegant: "'Playfair Display', serif",
  clean: "'Roboto', sans-serif",
  friendly: "'Open Sans', sans-serif",
  professional: "'Lato', sans-serif",
  bold: "'Montserrat', sans-serif",
  playful: "'Poppins', sans-serif",
  classic: "'Times New Roman', serif",
  minimal: "'Helvetica Neue', sans-serif"
};

// Professional Color Palettes
interface ColorPalette {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'corporate' | 'bold' | 'pastel' | 'gradient' | 'elegant';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  preview: string[]; // Array of 4-5 colors for preview swatches
}

const professionalPalettes: ColorPalette[] = [
  // Modern Minimal
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean and contemporary with subtle contrasts',
    category: 'modern',
    colors: { primary: '#0F172A', secondary: '#334155', accent: '#3B82F6', background: '#FFFFFF', text: '#1E293B' },
    preview: ['#0F172A', '#3B82F6', '#F1F5F9', '#FFFFFF']
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Cool, crisp Scandinavian-inspired tones',
    category: 'modern',
    colors: { primary: '#1E3A5F', secondary: '#64748B', accent: '#38BDF8', background: '#F8FAFC', text: '#0F172A' },
    preview: ['#1E3A5F', '#38BDF8', '#E2E8F0', '#F8FAFC']
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    description: 'Peaceful and organic natural greens',
    category: 'modern',
    colors: { primary: '#14532D', secondary: '#166534', accent: '#22C55E', background: '#F0FDF4', text: '#15803D' },
    preview: ['#14532D', '#22C55E', '#DCFCE7', '#F0FDF4']
  },

  // Corporate Professional
  {
    id: 'executive-blue',
    name: 'Executive Blue',
    description: 'Trustworthy and professional corporate blue',
    category: 'corporate',
    colors: { primary: '#1E40AF', secondary: '#1E3A8A', accent: '#3B82F6', background: '#FFFFFF', text: '#1F2937' },
    preview: ['#1E40AF', '#3B82F6', '#DBEAFE', '#FFFFFF']
  },
  {
    id: 'charcoal-gold',
    name: 'Charcoal Gold',
    description: 'Sophisticated luxury with gold accents',
    category: 'corporate',
    colors: { primary: '#1F2937', secondary: '#374151', accent: '#D4AF37', background: '#FAFAFA', text: '#111827' },
    preview: ['#1F2937', '#D4AF37', '#F3F4F6', '#FAFAFA']
  },
  {
    id: 'slate-teal',
    name: 'Slate Teal',
    description: 'Modern tech-inspired professional palette',
    category: 'corporate',
    colors: { primary: '#0F766E', secondary: '#115E59', accent: '#14B8A6', background: '#FFFFFF', text: '#134E4A' },
    preview: ['#0F766E', '#14B8A6', '#CCFBF1', '#FFFFFF']
  },

  // Bold & Vibrant
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    description: 'Bold and energetic purple-based scheme',
    category: 'bold',
    colors: { primary: '#7C3AED', secondary: '#6D28D9', accent: '#A78BFA', background: '#FAFAFA', text: '#1F2937' },
    preview: ['#7C3AED', '#A78BFA', '#EDE9FE', '#FAFAFA']
  },
  {
    id: 'sunset-fire',
    name: 'Sunset Fire',
    description: 'Warm and energetic orange-red gradient feel',
    category: 'bold',
    colors: { primary: '#DC2626', secondary: '#EA580C', accent: '#F97316', background: '#FFFBEB', text: '#1F2937' },
    preview: ['#DC2626', '#F97316', '#FED7AA', '#FFFBEB']
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Deep blues with vibrant cyan accents',
    category: 'bold',
    colors: { primary: '#0369A1', secondary: '#075985', accent: '#06B6D4', background: '#F0F9FF', text: '#0C4A6E' },
    preview: ['#0369A1', '#06B6D4', '#BAE6FD', '#F0F9FF']
  },

  // Soft Pastels
  {
    id: 'blush-rose',
    name: 'Blush Rose',
    description: 'Soft and feminine rose-pink tones',
    category: 'pastel',
    colors: { primary: '#BE185D', secondary: '#DB2777', accent: '#F472B6', background: '#FDF2F8', text: '#831843' },
    preview: ['#BE185D', '#F472B6', '#FBCFE8', '#FDF2F8']
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    description: 'Gentle purple with calming undertones',
    category: 'pastel',
    colors: { primary: '#7C3AED', secondary: '#8B5CF6', accent: '#C4B5FD', background: '#FAF5FF', text: '#5B21B6' },
    preview: ['#7C3AED', '#C4B5FD', '#EDE9FE', '#FAF5FF']
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    description: 'Cool minty greens with clean whites',
    category: 'pastel',
    colors: { primary: '#059669', secondary: '#10B981', accent: '#6EE7B7', background: '#ECFDF5', text: '#065F46' },
    preview: ['#059669', '#6EE7B7', '#D1FAE5', '#ECFDF5']
  },

  // Gradient-Inspired
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Magical gradient-inspired purple to teal',
    category: 'gradient',
    colors: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#14B8A6', background: '#FAFAFA', text: '#1E1B4B' },
    preview: ['#6366F1', '#8B5CF6', '#14B8A6', '#FAFAFA']
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm sunset gradient from gold to rose',
    category: 'gradient',
    colors: { primary: '#F59E0B', secondary: '#D97706', accent: '#F43F5E', background: '#FFFBEB', text: '#78350F' },
    preview: ['#F59E0B', '#F43F5E', '#FBBF24', '#FFFBEB']
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Futuristic dark theme with neon accents',
    category: 'gradient',
    colors: { primary: '#EC4899', secondary: '#8B5CF6', accent: '#06B6D4', background: '#0F172A', text: '#F1F5F9' },
    preview: ['#EC4899', '#8B5CF6', '#06B6D4', '#0F172A']
  },

  // Elegant & Sophisticated
  {
    id: 'champagne-noir',
    name: 'Champagne Noir',
    description: 'Luxurious dark theme with champagne gold',
    category: 'elegant',
    colors: { primary: '#18181B', secondary: '#27272A', accent: '#C9A962', background: '#FAFAF9', text: '#18181B' },
    preview: ['#18181B', '#C9A962', '#E7E5E4', '#FAFAF9']
  },
  {
    id: 'vintage-burgundy',
    name: 'Vintage Burgundy',
    description: 'Rich wine tones with cream accents',
    category: 'elegant',
    colors: { primary: '#7F1D1D', secondary: '#991B1B', accent: '#B91C1C', background: '#FEF2F2', text: '#450A0A' },
    preview: ['#7F1D1D', '#B91C1C', '#FECACA', '#FEF2F2']
  },
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    description: 'Deep emerald with luxurious dark tones',
    category: 'elegant',
    colors: { primary: '#064E3B', secondary: '#065F46', accent: '#10B981', background: '#F0FDF4', text: '#022C22' },
    preview: ['#064E3B', '#10B981', '#A7F3D0', '#F0FDF4']
  }
];

// Component Templates
const componentTemplates: Record<string, Partial<EditorComponent>> = {
  header: {
    type: 'header',
    content: {
      logo: 'Company Logo',
      menuItems: ['Home', 'About', 'Services', 'Contact'],
      showCta: true,
      ctaText: 'Get Started'
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '16px' }
  },
  hero: {
    type: 'hero',
    content: {
      headline: 'Welcome to Our Business',
      subheadline: 'We provide exceptional services to help your business grow',
      ctaText: 'Learn More',
      ctaLink: '#',
      backgroundImage: '',
      alignment: 'center'
    },
    styles: { backgroundColor: '#F9F6F0', textColor: '#4A4A4A', padding: '80px 20px' }
  },
  features: {
    type: 'features',
    content: {
      title: 'Our Features',
      subtitle: 'What makes us different',
      items: [
        { icon: 'star', title: 'Quality', description: 'We deliver excellence in everything we do' },
        { icon: 'clock', title: 'Fast', description: 'Quick turnaround times on all projects' },
        { icon: 'shield', title: 'Reliable', description: 'You can count on us every time' }
      ]
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  about: {
    type: 'about',
    content: {
      title: 'About Us',
      description: 'We are a passionate team dedicated to delivering exceptional results for our clients.',
      image: '',
      stats: [
        { value: '10+', label: 'Years Experience' },
        { value: '500+', label: 'Happy Clients' },
        { value: '1000+', label: 'Projects Done' }
      ]
    },
    styles: { backgroundColor: '#F9F6F0', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  services: {
    type: 'services',
    content: {
      title: 'Our Services',
      subtitle: 'What we offer',
      items: [
        { title: 'Consulting', description: 'Expert advice for your business', price: '$99/hr' },
        { title: 'Development', description: 'Custom solutions built for you', price: '$149/hr' },
        { title: 'Support', description: '24/7 assistance when you need it', price: '$49/mo' }
      ]
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  testimonials: {
    type: 'testimonials',
    content: {
      title: 'What Our Clients Say',
      items: [
        { name: 'John Doe', role: 'CEO, TechCorp', text: 'Absolutely fantastic service! Highly recommend.', avatar: '' },
        { name: 'Jane Smith', role: 'Founder, StartupXYZ', text: 'They exceeded all our expectations.', avatar: '' }
      ]
    },
    styles: { backgroundColor: '#F9F6F0', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  gallery: {
    type: 'gallery',
    content: {
      title: 'Our Work',
      images: [],
      layout: 'grid'
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  contact: {
    type: 'contact',
    content: {
      title: 'Get In Touch',
      subtitle: 'We\'d love to hear from you',
      email: 'hello@company.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      showForm: true
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  footer: {
    type: 'footer',
    content: {
      logo: 'Company Logo',
      description: 'Your trusted partner in success.',
      links: [
        { title: 'Company', items: ['About', 'Careers', 'Press'] },
        { title: 'Support', items: ['Help Center', 'Contact', 'FAQ'] }
      ],
      social: ['facebook', 'twitter', 'instagram', 'linkedin'],
      copyright: '2024 Company Name. All rights reserved.'
    },
    styles: { backgroundColor: '#4A4A4A', textColor: '#ffffff', padding: '40px 20px' }
  },
  cta: {
    type: 'cta',
    content: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers today',
      buttonText: 'Start Now',
      buttonLink: '#'
    },
    styles: { backgroundColor: '#D4AF37', textColor: '#ffffff', padding: '60px 20px' }
  },
  pricing: {
    type: 'pricing',
    content: {
      title: 'Pricing Plans',
      subtitle: 'Choose the perfect plan for you',
      plans: [
        { name: 'Basic', price: '$29', period: '/mo', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: false },
        { name: 'Pro', price: '$79', period: '/mo', features: ['All Basic features', 'Feature 4', 'Feature 5', 'Feature 6'], highlighted: true },
        { name: 'Enterprise', price: '$199', period: '/mo', features: ['All Pro features', 'Feature 7', 'Feature 8', 'Feature 9'], highlighted: false }
      ]
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  team: {
    type: 'team',
    content: {
      title: 'Meet Our Team',
      members: [
        { name: 'Alex Johnson', role: 'CEO', image: '', bio: 'Leading with vision' },
        { name: 'Sarah Williams', role: 'CTO', image: '', bio: 'Tech innovator' },
        { name: 'Mike Chen', role: 'Designer', image: '', bio: 'Creative genius' }
      ]
    },
    styles: { backgroundColor: '#F9F6F0', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  faq: {
    type: 'faq',
    content: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'How do I get started?', answer: 'Simply contact us and we\'ll guide you through the process.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and bank transfers.' },
        { question: 'Do you offer refunds?', answer: 'Yes, we offer a 30-day money-back guarantee.' }
      ]
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '60px 20px' }
  },
  stats: {
    type: 'stats',
    content: {
      items: [
        { value: '99%', label: 'Customer Satisfaction' },
        { value: '24/7', label: 'Support Available' },
        { value: '50+', label: 'Countries Served' },
        { value: '10M+', label: 'Users Worldwide' }
      ]
    },
    styles: { backgroundColor: '#4A4A4A', textColor: '#ffffff', padding: '40px 20px' }
  },
  text: {
    type: 'text',
    content: {
      text: 'Add your text content here. You can write paragraphs, add headings, and format your text as needed.',
      alignment: 'left'
    },
    styles: { backgroundColor: '#ffffff', textColor: '#4A4A4A', padding: '40px 20px' }
  },
  image: {
    type: 'image',
    content: {
      src: '',
      alt: 'Image description',
      caption: '',
      alignment: 'center',
      width: '100%'
    },
    styles: { backgroundColor: '#ffffff', padding: '20px' }
  },
  divider: {
    type: 'divider',
    content: {
      style: 'solid',
      width: '80%',
      color: '#EFEBE4'
    },
    styles: { backgroundColor: 'transparent', padding: '20px 0' }
  },
  spacer: {
    type: 'spacer',
    content: {
      height: '60px'
    },
    styles: { backgroundColor: 'transparent' }
  }
};

// Default website template
const createDefaultWebsite = (customer: Lead): WebsiteData => ({
  id: `website-${customer.id}`,
  name: `${customer.businessName} Website`,
  components: [
    { ...componentTemplates.header, id: 'header-1', order: 0, content: { ...componentTemplates.header!.content, logo: customer.businessName } } as EditorComponent,
    { ...componentTemplates.hero, id: 'hero-1', order: 1, content: { ...componentTemplates.hero!.content, headline: `Welcome to ${customer.businessName}`, subheadline: customer.details || 'We provide exceptional services' } } as EditorComponent,
    { ...componentTemplates.features, id: 'features-1', order: 2 } as EditorComponent,
    { ...componentTemplates.about, id: 'about-1', order: 3 } as EditorComponent,
    { ...componentTemplates.services, id: 'services-1', order: 4 } as EditorComponent,
    { ...componentTemplates.testimonials, id: 'testimonials-1', order: 5 } as EditorComponent,
    { ...componentTemplates.cta, id: 'cta-1', order: 6 } as EditorComponent,
    { ...componentTemplates.contact, id: 'contact-1', order: 7, content: { ...componentTemplates.contact!.content, email: customer.email || 'hello@company.com', phone: customer.phone || '' } } as EditorComponent,
    { ...componentTemplates.footer, id: 'footer-1', order: 8, content: { ...componentTemplates.footer!.content, logo: customer.businessName } } as EditorComponent
  ],
  globalStyles: {
    primaryColor: customer.brandGuidelines?.colors?.[0] || '#D4AF37',
    secondaryColor: customer.brandGuidelines?.colors?.[1] || '#4A4A4A',
    accentColor: customer.brandGuidelines?.colors?.[2] || '#F9F6F0',
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#ffffff'
  },
  isDraft: true
});

export const WebsiteEditor: React.FC<WebsiteEditorProps> = ({
  customers,
  selectedCustomer,
  onUpdateCustomer,
  onBack
}) => {
  const [activeCustomer, setActiveCustomer] = useState<Lead | null>(selectedCustomer || null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'layers' | 'pages'>('components');
  const [rightPanelTab, setRightPanelTab] = useState<'style' | 'settings'>('style');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(!selectedCustomer);

  // AI Prompt states
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<AIChange[]>([]);
  const [showChangePreview, setShowChangePreview] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Color Palette states
  const [showPaletteSelector, setShowPaletteSelector] = useState(false);
  const [paletteCategory, setPaletteCategory] = useState<'all' | 'modern' | 'corporate' | 'bold' | 'pastel' | 'gradient' | 'elegant'>('all');

  // Enhanced Drag & Drop states
  const [dragOverComponentId, setDragOverComponentId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [draggedExistingId, setDraggedExistingId] = useState<string | null>(null);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!aiPrompt.trim()) return promptSuggestions.slice(0, 6);
    const lower = aiPrompt.toLowerCase();
    return promptSuggestions.filter(s =>
      s.text.toLowerCase().includes(lower) ||
      s.category.includes(lower)
    ).slice(0, 6);
  }, [aiPrompt]);

  // Initialize website data with history
  const [history, setHistory] = useState<HistoryState>(() => {
    const initial = activeCustomer ? createDefaultWebsite(activeCustomer) : createDefaultWebsite({ id: 'temp', businessName: 'New Website', location: '', details: '', status: 'new' } as Lead);
    return { past: [], present: initial, future: [] };
  });

  const websiteData = history.present;

  // History management
  const pushToHistory = useCallback((newData: WebsiteData) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-49), prev.present], // Keep last 50 states
      present: newData,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const previous = newPast.pop()!;
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Update component
  const updateComponent = useCallback((componentId: string, updates: Partial<EditorComponent>) => {
    const newData = {
      ...websiteData,
      components: websiteData.components.map(comp =>
        comp.id === componentId ? { ...comp, ...updates } : comp
      ),
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
  }, [websiteData, pushToHistory]);

  // Update global styles
  const updateGlobalStyles = useCallback((updates: Partial<WebsiteData['globalStyles']>) => {
    const newData = {
      ...websiteData,
      globalStyles: { ...websiteData.globalStyles, ...updates },
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
  }, [websiteData, pushToHistory]);

  // Add component
  const addComponent = useCallback((type: string, afterId?: string) => {
    const template = componentTemplates[type];
    if (!template) return;

    const newComponent: EditorComponent = {
      ...template,
      id: `${type}-${Date.now()}`,
      order: afterId
        ? websiteData.components.find(c => c.id === afterId)!.order + 0.5
        : websiteData.components.length
    } as EditorComponent;

    const newComponents = [...websiteData.components, newComponent]
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i }));

    const newData = {
      ...websiteData,
      components: newComponents,
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
    setSelectedComponent(newComponent.id);
  }, [websiteData, pushToHistory]);

  // Delete component
  const deleteComponent = useCallback((componentId: string) => {
    const newData = {
      ...websiteData,
      components: websiteData.components
        .filter(c => c.id !== componentId)
        .map((c, i) => ({ ...c, order: i })),
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
  }, [websiteData, pushToHistory, selectedComponent]);

  // Move component
  const moveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    const index = websiteData.components.findIndex(c => c.id === componentId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === websiteData.components.length - 1) return;

    const newComponents = [...websiteData.components];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newComponents[index], newComponents[swapIndex]] = [newComponents[swapIndex], newComponents[index]];

    const newData = {
      ...websiteData,
      components: newComponents.map((c, i) => ({ ...c, order: i })),
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
  }, [websiteData, pushToHistory]);

  // Duplicate component
  const duplicateComponent = useCallback((componentId: string) => {
    const component = websiteData.components.find(c => c.id === componentId);
    if (!component) return;

    const newComponent: EditorComponent = {
      ...component,
      id: `${component.type}-${Date.now()}`,
      content: JSON.parse(JSON.stringify(component.content)),
      styles: { ...component.styles },
      order: component.order + 0.5
    };

    const newComponents = [...websiteData.components, newComponent]
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i }));

    const newData = {
      ...websiteData,
      components: newComponents,
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
    setSelectedComponent(newComponent.id);
  }, [websiteData, pushToHistory]);

  // Save draft
  const saveDraft = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newData = {
      ...websiteData,
      lastSavedAt: Date.now(),
      isDraft: true
    };

    setHistory(prev => ({ ...prev, present: newData }));
    setIsSaving(false);
  }, [websiteData]);

  // Publish website
  const publishWebsite = useCallback(async () => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newData = {
      ...websiteData,
      publishedAt: Date.now(),
      lastSavedAt: Date.now(),
      isDraft: false
    };

    setHistory(prev => ({ ...prev, present: newData }));
    setIsPublishing(false);
    setShowPublishModal(false);
  }, [websiteData]);

  // Load customer website
  const loadCustomerWebsite = useCallback((customer: Lead) => {
    setActiveCustomer(customer);
    const newWebsite = createDefaultWebsite(customer);
    setHistory({ past: [], present: newWebsite, future: [] });
    setSelectedComponent(null);
    setShowCustomerSelector(false);
  }, []);

  const selectedComponentData = useMemo(() =>
    websiteData.components.find(c => c.id === selectedComponent),
    [websiteData.components, selectedComponent]
  );

  // AI Prompt Processing
  const processAIPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsProcessingPrompt(true);
    const lowerPrompt = prompt.toLowerCase();
    const changes: AIChange[] = [];

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Parse prompt and generate changes
    // Color changes
    const colorMatch = lowerPrompt.match(/(?:change|set|make)\s+(?:the\s+)?(?:primary|main|button|accent|secondary|background)\s*(?:color)?\s*(?:to\s+)?(\w+)/i);
    if (colorMatch) {
      const colorName = colorMatch[1].toLowerCase();
      const hexColor = colorNameToHex[colorName] || colorMatch[1];

      if (lowerPrompt.includes('primary') || lowerPrompt.includes('main') || lowerPrompt.includes('button')) {
        changes.push({
          id: `change-${Date.now()}-1`,
          description: `Change primary color to ${colorName}`,
          type: 'global',
          changes: { globalStyles: { primaryColor: hexColor } },
          applied: false
        });
      }
      if (lowerPrompt.includes('secondary')) {
        changes.push({
          id: `change-${Date.now()}-2`,
          description: `Change secondary color to ${colorName}`,
          type: 'global',
          changes: { globalStyles: { secondaryColor: hexColor } },
          applied: false
        });
      }
      if (lowerPrompt.includes('accent')) {
        changes.push({
          id: `change-${Date.now()}-3`,
          description: `Change accent color to ${colorName}`,
          type: 'global',
          changes: { globalStyles: { accentColor: hexColor } },
          applied: false
        });
      }
      if (lowerPrompt.includes('background')) {
        changes.push({
          id: `change-${Date.now()}-4`,
          description: `Change background color to ${colorName}`,
          type: 'global',
          changes: { globalStyles: { backgroundColor: hexColor } },
          applied: false
        });
      }
    }

    // Section-specific color changes
    const sectionColorMatch = lowerPrompt.match(/(?:change|set|make)\s+(?:the\s+)?(\w+)\s+(?:section\s+)?(?:background|color)\s*(?:to\s+)?(\w+)/i);
    if (sectionColorMatch) {
      const sectionType = sectionColorMatch[1].toLowerCase();
      const colorName = sectionColorMatch[2].toLowerCase();
      const hexColor = colorNameToHex[colorName] || sectionColorMatch[2];
      const targetComponent = websiteData.components.find(c => c.type === sectionType);

      if (targetComponent) {
        const isBackground = lowerPrompt.includes('background');
        changes.push({
          id: `change-${Date.now()}-5`,
          description: `Change ${sectionType} section ${isBackground ? 'background' : 'text'} color to ${colorName}`,
          type: 'style',
          targetComponent: targetComponent.id,
          changes: { styles: isBackground ? { backgroundColor: hexColor } : { textColor: hexColor } },
          applied: false
        });
      }
    }

    // Add section
    const addMatch = lowerPrompt.match(/add\s+(?:a\s+)?(\w+)\s+(?:section|block|component)?/i);
    if (addMatch) {
      const sectionType = addMatch[1].toLowerCase();
      const validTypes = ['header', 'hero', 'features', 'about', 'services', 'testimonials', 'gallery', 'contact', 'footer', 'cta', 'pricing', 'team', 'faq', 'stats', 'text', 'divider', 'spacer'];

      if (validTypes.includes(sectionType)) {
        changes.push({
          id: `change-${Date.now()}-6`,
          description: `Add a ${sectionType} section`,
          type: 'structure',
          changes: { addComponent: sectionType },
          applied: false
        });
      }
    }

    // Remove section
    const removeMatch = lowerPrompt.match(/(?:remove|delete)\s+(?:the\s+)?(\w+)\s+(?:section|block|component)?/i);
    if (removeMatch) {
      const sectionType = removeMatch[1].toLowerCase();
      const targetComponent = websiteData.components.find(c => c.type === sectionType);

      if (targetComponent) {
        changes.push({
          id: `change-${Date.now()}-7`,
          description: `Remove the ${sectionType} section`,
          type: 'structure',
          targetComponent: targetComponent.id,
          changes: { removeComponent: true },
          applied: false
        });
      }
    }

    // Font changes
    const fontMatch = lowerPrompt.match(/(?:change|set|make)\s+(?:the\s+)?(?:font|typography)\s*(?:to\s+)?(?:something\s+)?(\w+)/i);
    if (fontMatch) {
      const fontStyle = fontMatch[1].toLowerCase();
      const fontFamily = fontFamilyMap[fontStyle] || `'${fontMatch[1]}', sans-serif`;

      changes.push({
        id: `change-${Date.now()}-8`,
        description: `Change font to ${fontStyle}`,
        type: 'global',
        changes: { globalStyles: { fontFamily } },
        applied: false
      });
    }

    // Headline/text content changes
    const headlineMatch = lowerPrompt.match(/(?:change|update|set)\s+(?:the\s+)?(?:headline|heading|title)\s*(?:to\s+)?["']?([^"']+)["']?/i);
    if (headlineMatch && headlineMatch[1]) {
      const heroComponent = websiteData.components.find(c => c.type === 'hero');
      if (heroComponent) {
        changes.push({
          id: `change-${Date.now()}-9`,
          description: `Update headline text`,
          type: 'content',
          targetComponent: heroComponent.id,
          changes: { content: { headline: headlineMatch[1].trim() } },
          applied: false
        });
      }
    }

    // Padding changes
    if (lowerPrompt.includes('padding') || lowerPrompt.includes('spacing')) {
      const increase = lowerPrompt.includes('more') || lowerPrompt.includes('increase') || lowerPrompt.includes('add');
      const decrease = lowerPrompt.includes('less') || lowerPrompt.includes('reduce') || lowerPrompt.includes('decrease');

      if (increase || decrease) {
        changes.push({
          id: `change-${Date.now()}-10`,
          description: `${increase ? 'Increase' : 'Decrease'} section padding`,
          type: 'style',
          changes: { adjustPadding: increase ? 'increase' : 'decrease' },
          applied: false
        });
      }
    }

    // Make CTA stand out
    if (lowerPrompt.includes('cta') && (lowerPrompt.includes('stand out') || lowerPrompt.includes('prominent') || lowerPrompt.includes('bigger'))) {
      const ctaComponent = websiteData.components.find(c => c.type === 'cta');
      if (ctaComponent) {
        changes.push({
          id: `change-${Date.now()}-11`,
          description: `Make CTA section more prominent`,
          type: 'style',
          targetComponent: ctaComponent.id,
          changes: { styles: { backgroundColor: '#D4AF37', padding: '80px 20px' } },
          applied: false
        });
      }
    }

    // Modern style
    if (lowerPrompt.includes('modern') || lowerPrompt.includes('contemporary')) {
      changes.push({
        id: `change-${Date.now()}-12`,
        description: `Apply modern styling`,
        type: 'global',
        changes: {
          globalStyles: {
            fontFamily: 'Inter, sans-serif',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E293B'
          }
        },
        applied: false
      });
    }

    // Dark mode / darker
    if (lowerPrompt.includes('dark') || lowerPrompt.includes('darker')) {
      if (lowerPrompt.includes('hero')) {
        const heroComponent = websiteData.components.find(c => c.type === 'hero');
        if (heroComponent) {
          changes.push({
            id: `change-${Date.now()}-13`,
            description: `Make hero section darker`,
            type: 'style',
            targetComponent: heroComponent.id,
            changes: { styles: { backgroundColor: '#1a1a1a', textColor: '#ffffff' } },
            applied: false
          });
        }
      } else {
        changes.push({
          id: `change-${Date.now()}-14`,
          description: `Apply dark theme`,
          type: 'global',
          changes: {
            globalStyles: {
              backgroundColor: '#1a1a1a',
              secondaryColor: '#ffffff'
            }
          },
          applied: false
        });
      }
    }

    // Contact email update
    const emailMatch = lowerPrompt.match(/(?:change|update|set)\s+(?:the\s+)?(?:contact\s+)?email\s*(?:to\s+)?([^\s]+@[^\s]+)/i);
    if (emailMatch) {
      const contactComponent = websiteData.components.find(c => c.type === 'contact');
      if (contactComponent) {
        changes.push({
          id: `change-${Date.now()}-15`,
          description: `Update contact email to ${emailMatch[1]}`,
          type: 'content',
          targetComponent: contactComponent.id,
          changes: { content: { email: emailMatch[1] } },
          applied: false
        });
      }
    }

    // If no specific changes detected, add a generic suggestion
    if (changes.length === 0) {
      changes.push({
        id: `change-${Date.now()}-0`,
        description: `Could not understand the request. Try being more specific, like "Change the primary color to blue" or "Add a testimonials section"`,
        type: 'content',
        changes: {},
        applied: false
      });
    }

    setPendingChanges(changes);
    setShowChangePreview(true);
    setIsProcessingPrompt(false);
    setPromptHistory(prev => [...prev, prompt]);
  }, [websiteData.components]);

  // Apply pending changes
  const applyChanges = useCallback((changeIds?: string[]) => {
    const changesToApply = changeIds
      ? pendingChanges.filter(c => changeIds.includes(c.id))
      : pendingChanges;

    let newData = { ...websiteData };

    changesToApply.forEach(change => {
      if (change.changes.globalStyles) {
        newData = {
          ...newData,
          globalStyles: { ...newData.globalStyles, ...change.changes.globalStyles }
        };
      }

      if (change.changes.addComponent) {
        const template = componentTemplates[change.changes.addComponent];
        if (template) {
          const newComponent: EditorComponent = {
            ...template,
            id: `${change.changes.addComponent}-${Date.now()}`,
            order: newData.components.length
          } as EditorComponent;
          newData = {
            ...newData,
            components: [...newData.components, newComponent]
          };
        }
      }

      if (change.changes.removeComponent && change.targetComponent) {
        newData = {
          ...newData,
          components: newData.components.filter(c => c.id !== change.targetComponent)
        };
      }

      if (change.targetComponent && change.changes.styles) {
        newData = {
          ...newData,
          components: newData.components.map(c =>
            c.id === change.targetComponent
              ? { ...c, styles: { ...c.styles, ...change.changes.styles } }
              : c
          )
        };
      }

      if (change.targetComponent && change.changes.content) {
        newData = {
          ...newData,
          components: newData.components.map(c =>
            c.id === change.targetComponent
              ? { ...c, content: { ...c.content, ...change.changes.content } }
              : c
          )
        };
      }

      if (change.changes.adjustPadding) {
        const multiplier = change.changes.adjustPadding === 'increase' ? 1.25 : 0.8;
        newData = {
          ...newData,
          components: newData.components.map(c => {
            const currentPadding = c.styles.padding || '40px 20px';
            const paddingValues = currentPadding.match(/\d+/g);
            if (paddingValues) {
              const newPadding = paddingValues.map(v => Math.round(parseInt(v) * multiplier) + 'px').join(' ');
              return { ...c, styles: { ...c.styles, padding: newPadding } };
            }
            return c;
          })
        };
      }
    });

    newData.lastSavedAt = undefined;
    newData.isDraft = true;
    pushToHistory(newData);
    setPendingChanges([]);
    setShowChangePreview(false);
    setAiPrompt('');
  }, [pendingChanges, websiteData, pushToHistory]);

  // Discard changes
  const discardChanges = useCallback(() => {
    setPendingChanges([]);
    setShowChangePreview(false);
  }, []);

  // Apply color palette
  const applyColorPalette = useCallback((palette: ColorPalette) => {
    const newData = {
      ...websiteData,
      globalStyles: {
        ...websiteData.globalStyles,
        primaryColor: palette.colors.primary,
        secondaryColor: palette.colors.secondary,
        accentColor: palette.colors.accent,
        backgroundColor: palette.colors.background
      },
      lastSavedAt: undefined,
      isDraft: true
    };
    pushToHistory(newData);
    setShowPaletteSelector(false);
  }, [websiteData, pushToHistory]);

  // Filter palettes by category
  const filteredPalettes = useMemo(() => {
    if (paletteCategory === 'all') return professionalPalettes;
    return professionalPalettes.filter(p => p.category === paletteCategory);
  }, [paletteCategory]);

  // Drag and drop handlers with visual indicators
  const handleDragStart = (componentType: string, isExisting: boolean = false, existingId?: string) => {
    setDraggedComponent(componentType);
    setIsDraggingFromPalette(!isExisting);
    setIsDraggingExisting(isExisting);
    if (existingId) setDraggedExistingId(existingId);
  };

  const handleDragEnd = () => {
    setDraggedComponent(null);
    setDragOverComponentId(null);
    setDragOverPosition(null);
    setIsDraggingFromPalette(false);
    setIsDraggingExisting(false);
    setDraggedExistingId(null);
  };

  const handleDragOver = (e: React.DragEvent, componentId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (componentId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'before' : 'after';

      setDragOverComponentId(componentId);
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the component entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverComponentId(null);
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDraggingExisting && draggedExistingId && targetId) {
      // Reorder existing components
      const fromIndex = websiteData.components.findIndex(c => c.id === draggedExistingId);
      let toIndex = websiteData.components.findIndex(c => c.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        if (dragOverPosition === 'after') toIndex++;
        if (fromIndex < toIndex) toIndex--;

        const newComponents = [...websiteData.components];
        const [removed] = newComponents.splice(fromIndex, 1);
        newComponents.splice(toIndex, 0, removed);

        const reorderedComponents = newComponents.map((c, i) => ({ ...c, order: i }));

        const newData = {
          ...websiteData,
          components: reorderedComponents,
          lastSavedAt: undefined,
          isDraft: true
        };
        pushToHistory(newData);
      }
    } else if (draggedComponent && !isDraggingExisting) {
      // Add new component from palette
      addComponent(draggedComponent, targetId);
    }

    handleDragEnd();
  };

  // Component preview renderer
  const renderComponentPreview = (component: EditorComponent) => {
    const isSelected = selectedComponent === component.id;
    const isDragTarget = dragOverComponentId === component.id;
    const showDropBefore = isDragTarget && dragOverPosition === 'before';
    const showDropAfter = isDragTarget && dragOverPosition === 'after';
    const isBeingDragged = draggedExistingId === component.id;

    const baseStyle = {
      backgroundColor: component.styles.backgroundColor,
      color: component.styles.textColor,
      padding: component.styles.padding,
      fontFamily: component.styles.fontFamily || websiteData.globalStyles.fontFamily
    };

    return (
      <div
        key={component.id}
        className={`relative group cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-[#D4AF37] ring-offset-2' : 'hover:ring-2 hover:ring-[#D4AF37]/30'
        } ${isBeingDragged ? 'opacity-40 scale-[0.98] ring-2 ring-dashed ring-[#D4AF37]' : ''}`}
        style={baseStyle}
        onClick={() => setSelectedComponent(component.id)}
        onDragOver={(e) => handleDragOver(e, component.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, component.id)}
      >
        {/* Drop Zone Indicator - Before */}
        <div className={`absolute -top-2 left-0 right-0 h-4 z-20 transition-all duration-200 pointer-events-none ${
          showDropBefore ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className={`h-1 bg-[#D4AF37] rounded-full mx-4 shadow-lg shadow-[#D4AF37]/50 ${
            showDropBefore ? 'animate-pulse' : ''
          }`} />
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-white shadow-md ${
            showDropBefore ? '' : 'hidden'
          }`} />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-white shadow-md ${
            showDropBefore ? '' : 'hidden'
          }`} />
        </div>

        {/* Drop Zone Indicator - After */}
        <div className={`absolute -bottom-2 left-0 right-0 h-4 z-20 transition-all duration-200 pointer-events-none ${
          showDropAfter ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className={`h-1 bg-[#D4AF37] rounded-full mx-4 shadow-lg shadow-[#D4AF37]/50 ${
            showDropAfter ? 'animate-pulse' : ''
          }`} />
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-white shadow-md ${
            showDropAfter ? '' : 'hidden'
          }`} />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-white shadow-md ${
            showDropAfter ? '' : 'hidden'
          }`} />
        </div>

        {/* Drag Handle - visible on hover */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', component.id);
            // Create a custom drag image
            const dragImage = document.createElement('div');
            dragImage.className = 'bg-[#D4AF37] text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium capitalize';
            dragImage.textContent = component.type;
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
            handleDragStart(component.type, true, component.id);
          }}
          onDragEnd={handleDragEnd}
          className={`absolute left-1/2 -translate-x-1/2 top-1 z-30 px-4 py-1.5 bg-[#D4AF37] text-white rounded-b-lg cursor-grab active:cursor-grabbing shadow-lg transition-all duration-200 flex items-center gap-2 ${
            isSelected || isBeingDragged ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs font-medium capitalize">{component.type}</span>
        </div>

        {/* Component overlay controls */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10`}>
          <button onClick={(e) => { e.stopPropagation(); moveComponent(component.id, 'up'); }} className="p-1.5 bg-white rounded shadow-md hover:bg-gray-50" title="Move Up">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); moveComponent(component.id, 'down'); }} className="p-1.5 bg-white rounded shadow-md hover:bg-gray-50" title="Move Down">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); duplicateComponent(component.id); }} className="p-1.5 bg-white rounded shadow-md hover:bg-gray-50" title="Duplicate">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteComponent(component.id); }} className="p-1.5 bg-red-500 text-white rounded shadow-md hover:bg-red-600" title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        {/* Component type label - moved to bottom left */}
        <div className={`absolute bottom-2 left-2 px-2 py-1 bg-[#4A4A4A]/80 text-white text-xs rounded capitalize ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          {component.type}
        </div>

        {/* Component content preview */}
        {renderComponentContent(component)}
      </div>
    );
  };

  // Render component content based on type
  const renderComponentContent = (component: EditorComponent) => {
    switch (component.type) {
      case 'header':
        return (
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="font-bold text-xl">{component.content.logo}</div>
            <div className="hidden md:flex items-center gap-6">
              {component.content.menuItems?.map((item: string, i: number) => (
                <span key={i} className="text-sm hover:opacity-70 cursor-pointer">{item}</span>
              ))}
              {component.content.showCta && (
                <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: websiteData.globalStyles.primaryColor, color: '#fff' }}>
                  {component.content.ctaText}
                </button>
              )}
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className={`text-${component.content.alignment} max-w-4xl mx-auto`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{component.content.headline}</h1>
            <p className="text-lg md:text-xl opacity-80 mb-8">{component.content.subheadline}</p>
            <button className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: websiteData.globalStyles.primaryColor }}>
              {component.content.ctaText}
            </button>
          </div>
        );

      case 'features':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{component.content.title}</h2>
              <p className="text-lg opacity-70">{component.content.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {component.content.items?.map((item: any, i: number) => (
                <div key={i} className="text-center p-6 rounded-xl bg-white/50">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: websiteData.globalStyles.primaryColor + '20' }}>
                    <svg className="w-6 h-6" style={{ color: websiteData.globalStyles.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm opacity-70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">{component.content.title}</h2>
                <p className="text-lg opacity-80 leading-relaxed">{component.content.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {component.content.stats?.map((stat: any, i: number) => (
                  <div key={i} className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold" style={{ color: websiteData.globalStyles.primaryColor }}>{stat.value}</div>
                    <div className="text-xs opacity-70 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{component.content.title}</h2>
              <p className="text-lg opacity-70">{component.content.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {component.content.items?.map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm opacity-70 mb-4">{item.description}</p>
                  <div className="font-bold" style={{ color: websiteData.globalStyles.primaryColor }}>{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{component.content.title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {component.content.items?.map((item: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-xl shadow-sm">
                  <p className="text-lg italic mb-4">"{item.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm opacity-70">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{component.content.headline}</h2>
            <p className="text-lg opacity-90 mb-8">{component.content.subheadline}</p>
            <button className="px-8 py-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              {component.content.buttonText}
            </button>
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{component.content.title}</h2>
              <p className="text-lg opacity-70">{component.content.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>{component.content.email}</span>
                </div>
                {component.content.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span>{component.content.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 opacity-60 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{component.content.address}</span>
                </div>
              </div>
              {component.content.showForm && (
                <div className="space-y-4">
                  <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': websiteData.globalStyles.primaryColor } as any} />
                  <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2" />
                  <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 resize-none" />
                  <button className="w-full py-3 rounded-lg font-medium text-white" style={{ backgroundColor: websiteData.globalStyles.primaryColor }}>Send Message</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="font-bold text-xl mb-4">{component.content.logo}</div>
                <p className="text-sm opacity-70">{component.content.description}</p>
              </div>
              {component.content.links?.map((section: any, i: number) => (
                <div key={i}>
                  <h4 className="font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.items?.map((item: string, j: number) => (
                      <li key={j} className="text-sm opacity-70 hover:opacity-100 cursor-pointer">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex gap-3">
                  {component.content.social?.map((platform: string, i: number) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30">
                      <span className="text-xs capitalize">{platform.charAt(0).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/20 text-center text-sm opacity-60">
              {component.content.copyright}
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{component.content.title}</h2>
              <p className="text-lg opacity-70">{component.content.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {component.content.plans?.map((plan: any, i: number) => (
                <div key={i} className={`p-6 rounded-xl ${plan.highlighted ? 'ring-2 shadow-xl scale-105' : 'border border-gray-200'}`} style={plan.highlighted ? { '--tw-ring-color': websiteData.globalStyles.primaryColor } as any : {}}>
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="opacity-60">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features?.map((feature: string, j: number) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4" style={{ color: websiteData.globalStyles.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-lg font-medium ${plan.highlighted ? 'text-white' : 'text-gray-700 border border-gray-200'}`} style={plan.highlighted ? { backgroundColor: websiteData.globalStyles.primaryColor } : {}}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {component.content.items?.map((stat: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        );

      case 'team':
        return (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{component.content.title}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {component.content.members?.map((member: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold" style={{ color: websiteData.globalStyles.primaryColor }}>
                    {member.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <div className="text-sm opacity-70 mb-2">{member.role}</div>
                  <p className="text-sm opacity-60">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{component.content.title}</h2>
            <div className="space-y-4">
              {component.content.items?.map((item: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-sm opacity-70">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`max-w-4xl mx-auto text-${component.content.alignment}`}>
            <p className="whitespace-pre-wrap">{component.content.text}</p>
          </div>
        );

      case 'divider':
        return (
          <div className="flex justify-center">
            <div style={{ width: component.content.width, borderTop: `1px ${component.content.style} ${component.content.color}` }} />
          </div>
        );

      case 'spacer':
        return <div style={{ height: component.content.height }} />;

      default:
        return <div className="p-8 text-center opacity-50">Component: {component.type}</div>;
    }
  };

  // Customer selector modal
  if (showCustomerSelector) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-[#4A4A4A]/60 hover:text-[#4A4A4A] mb-8 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#EFEBE4]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#4A4A4A] mb-2">Website Editor</h1>
              <p className="text-[#4A4A4A]/60">Select a customer to edit their website</p>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#F9F6F0] rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#4A4A4A]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[#4A4A4A]/60 mb-4">No customers found</p>
                <p className="text-sm text-[#4A4A4A]/40">Add customers from the Client List to start editing their websites</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => loadCustomerWebsite(customer)}
                    className="w-full p-4 bg-[#F9F6F0] hover:bg-[#D4AF37]/10 rounded-xl transition-all flex items-center gap-4 text-left group border border-transparent hover:border-[#D4AF37]/30"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-bold text-[#D4AF37] shadow-sm">
                      {customer.businessName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#4A4A4A] group-hover:text-[#D4AF37] transition-colors">{customer.businessName}</div>
                      <div className="text-sm text-[#4A4A4A]/60">{customer.location}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {customer.websiteUrl && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Published</span>
                      )}
                      <svg className="w-5 h-5 text-[#4A4A4A]/30 group-hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] text-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-[#252525] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#333] rounded-lg transition-colors" title="Back">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="h-6 w-px bg-[#444]" />
          <button onClick={() => setShowCustomerSelector(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#404040] rounded-lg transition-colors">
            <span className="font-medium">{activeCustomer?.businessName || 'Select Customer'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="h-6 w-px bg-[#444]" />
          {/* Undo/Redo */}
          <button onClick={undo} disabled={!canUndo} className={`p-2 rounded-lg transition-colors ${canUndo ? 'hover:bg-[#333]' : 'opacity-30 cursor-not-allowed'}`} title="Undo (Ctrl+Z)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          <button onClick={redo} disabled={!canRedo} className={`p-2 rounded-lg transition-colors ${canRedo ? 'hover:bg-[#333]' : 'opacity-30 cursor-not-allowed'}`} title="Redo (Ctrl+Y)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
          </button>
        </div>

        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#333] rounded-lg p-1">
          <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-[#D4AF37] text-black' : 'hover:bg-[#404040]'}`} title="Desktop">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
          <button onClick={() => setPreviewMode('tablet')} className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-[#D4AF37] text-black' : 'hover:bg-[#404040]'}`} title="Tablet">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </button>
          <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-[#D4AF37] text-black' : 'hover:bg-[#404040]'}`} title="Mobile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {websiteData.isDraft && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">Draft</span>
          )}
          {websiteData.lastSavedAt && (
            <span className="text-xs text-gray-500">Saved {new Date(websiteData.lastSavedAt).toLocaleTimeString()}</span>
          )}
          <button onClick={saveDraft} disabled={isSaving} className="px-4 py-2 bg-[#333] hover:bg-[#404040] rounded-lg transition-colors flex items-center gap-2">
            {isSaving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            )}
            <span>Save Draft</span>
          </button>
          <button onClick={() => setShowPublishModal(true)} className="px-4 py-2 bg-[#D4AF37] text-black hover:bg-[#C4A030] rounded-lg transition-colors flex items-center gap-2 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* AI Prompt Bar */}
      <div className="bg-[#1f1f1f] border-b border-[#333] px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 relative">
                <input
                  ref={promptInputRef}
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && aiPrompt.trim()) {
                      processAIPrompt(aiPrompt);
                    }
                  }}
                  placeholder="Describe what you want to change... (e.g., 'Change the primary color to blue')"
                  className="w-full bg-[#333] border border-[#444] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                />
                {isProcessingPrompt && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 animate-spin text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => aiPrompt.trim() && processAIPrompt(aiPrompt)}
                disabled={!aiPrompt.trim() || isProcessingPrompt}
                className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#C4A030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Apply
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-[#444]">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Suggestions</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setAiPrompt(suggestion.text);
                        setShowSuggestions(false);
                        promptInputRef.current?.focus();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#333] transition-colors flex items-center gap-3 group"
                    >
                      <span className="text-lg">{suggestion.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm text-white group-hover:text-[#D4AF37]">{suggestion.text}</div>
                        <div className="text-xs text-gray-500 capitalize">{suggestion.category}</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-[#444] bg-[#252525]">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-[#333] rounded">Enter</span>
                    <span>to apply</span>
                    <span className="px-1.5 py-0.5 bg-[#333] rounded ml-2">Tab</span>
                    <span>to use suggestion</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick action chips */}
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
            <span className="text-xs text-gray-500 flex-shrink-0">Quick:</span>
            {['Add testimonials', 'Change color to blue', 'Make it modern', 'Add pricing'].map((quick, i) => (
              <button
                key={i}
                onClick={() => {
                  setAiPrompt(quick);
                  processAIPrompt(quick);
                }}
                className="px-3 py-1 bg-[#333] hover:bg-[#404040] rounded-full text-xs text-gray-300 hover:text-white transition-colors flex-shrink-0"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Change Preview Modal */}
      {showChangePreview && pendingChanges.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] rounded-2xl max-w-lg w-full shadow-2xl border border-[#333]">
            <div className="p-6 border-b border-[#333]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Review Changes</h3>
                  <p className="text-sm text-gray-400">The following changes will be applied to your website</p>
                </div>
              </div>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto">
              {pendingChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#333] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    change.type === 'global' ? 'bg-purple-500/20 text-purple-400' :
                    change.type === 'style' ? 'bg-blue-500/20 text-blue-400' :
                    change.type === 'structure' ? 'bg-green-500/20 text-green-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {change.type === 'global' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                    {change.type === 'style' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
                    {change.type === 'structure' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
                    {change.type === 'content' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{change.description}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{change.type} change</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#333] flex gap-3">
              <button
                onClick={discardChanges}
                className="flex-1 py-2.5 bg-[#333] hover:bg-[#404040] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => applyChanges()}
                className="flex-1 py-2.5 bg-[#D4AF37] text-black hover:bg-[#C4A030] rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Components & Layers */}
        <div className="w-72 bg-[#252525] border-r border-[#333] flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[#333]">
            <button onClick={() => setLeftPanelTab('components')} className={`flex-1 py-3 text-sm font-medium transition-colors ${leftPanelTab === 'components' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
              Components
            </button>
            <button onClick={() => setLeftPanelTab('layers')} className={`flex-1 py-3 text-sm font-medium transition-colors ${leftPanelTab === 'layers' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
              Layers
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {leftPanelTab === 'components' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Layout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['header', 'hero', 'footer', 'spacer', 'divider'].map(type => (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'copy';
                          handleDragStart(type, false);
                        }}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-[#333] hover:bg-[#404040] rounded-lg cursor-grab active:cursor-grabbing transition-all text-center border border-transparent hover:border-[#D4AF37]/30 ${
                          draggedComponent === type && isDraggingFromPalette ? 'ring-2 ring-[#D4AF37] scale-95 opacity-70' : ''
                        }`}
                      >
                        <div className="text-xs capitalize">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sections</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['features', 'about', 'services', 'testimonials', 'pricing', 'team', 'gallery', 'faq', 'stats', 'cta', 'contact'].map(type => (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'copy';
                          handleDragStart(type, false);
                        }}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-[#333] hover:bg-[#404040] rounded-lg cursor-grab active:cursor-grabbing transition-all text-center border border-transparent hover:border-[#D4AF37]/30 ${
                          draggedComponent === type && isDraggingFromPalette ? 'ring-2 ring-[#D4AF37] scale-95 opacity-70' : ''
                        }`}
                      >
                        <div className="text-xs capitalize">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['text', 'image'].map(type => (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'copy';
                          handleDragStart(type, false);
                        }}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-[#333] hover:bg-[#404040] rounded-lg cursor-grab active:cursor-grabbing transition-all text-center border border-transparent hover:border-[#D4AF37]/30 ${
                          draggedComponent === type && isDraggingFromPalette ? 'ring-2 ring-[#D4AF37] scale-95 opacity-70' : ''
                        }`}
                      >
                        <div className="text-xs capitalize">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {websiteData.components.map((component, index) => (
                  <div
                    key={component.id}
                    draggable
                    onClick={() => setSelectedComponent(component.id)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      handleDragStart(component.type, true, component.id);
                    }}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 group ${
                      selectedComponent === component.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-[#333]'
                    } ${draggedExistingId === component.id ? 'opacity-50 scale-95' : ''}`}
                  >
                    <svg className="w-4 h-4 text-gray-600 cursor-grab" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-xs text-gray-500">{index + 1}</span>
                    <span className="text-sm capitalize flex-1">{component.type}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); moveComponent(component.id, 'up'); }} className="p-1 hover:bg-[#404040] rounded" disabled={index === 0}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveComponent(component.id, 'down'); }} className="p-1 hover:bg-[#404040] rounded" disabled={index === websiteData.components.length - 1}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 bg-[#1a1a1a] p-8 overflow-hidden flex items-start justify-center">
          <div
            className={`bg-white overflow-y-auto shadow-2xl transition-all duration-300 ${
              previewMode === 'desktop' ? 'w-full max-w-6xl h-full' :
              previewMode === 'tablet' ? 'w-[768px] h-full' :
              'w-[375px] h-full'
            } ${(isDraggingFromPalette || isDraggingExisting) ? 'ring-2 ring-[#D4AF37]/50 ring-dashed' : ''}`}
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
          >
            {websiteData.components.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-gray-400 transition-all ${
                (isDraggingFromPalette || isDraggingExisting) ? 'bg-[#D4AF37]/5 border-2 border-dashed border-[#D4AF37]/30' : ''
              }`}>
                <div className="text-center">
                  <svg className={`w-16 h-16 mx-auto mb-4 transition-all ${
                    (isDraggingFromPalette || isDraggingExisting) ? 'opacity-100 text-[#D4AF37]' : 'opacity-50'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <p className={`mb-2 transition-all ${(isDraggingFromPalette || isDraggingExisting) ? 'text-[#D4AF37] font-medium' : ''}`}>
                    {(isDraggingFromPalette || isDraggingExisting) ? 'Drop component here' : 'Drag components here'}
                  </p>
                  <p className="text-sm opacity-60">Start building your website</p>
                </div>
              </div>
            ) : (
              websiteData.components.map(renderComponentPreview)
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 bg-[#252525] border-l border-[#333] flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[#333]">
            <button onClick={() => setRightPanelTab('style')} className={`flex-1 py-3 text-sm font-medium transition-colors ${rightPanelTab === 'style' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
              Style
            </button>
            <button onClick={() => setRightPanelTab('settings')} className={`flex-1 py-3 text-sm font-medium transition-colors ${rightPanelTab === 'settings' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
              Settings
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'style' ? (
              selectedComponentData ? (
                <div className="space-y-6">
                  {/* Component Info */}
                  <div className="pb-4 border-b border-[#333]">
                    <h3 className="text-lg font-semibold capitalize">{selectedComponentData.type}</h3>
                    <p className="text-xs text-gray-500">{selectedComponentData.id}</p>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedComponentData.styles.backgroundColor || '#ffffff'}
                        onChange={(e) => updateComponent(selectedComponentData.id, { styles: { ...selectedComponentData.styles, backgroundColor: e.target.value } })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComponentData.styles.backgroundColor || '#ffffff'}
                        onChange={(e) => updateComponent(selectedComponentData.id, { styles: { ...selectedComponentData.styles, backgroundColor: e.target.value } })}
                        className="flex-1 px-3 py-2 bg-[#333] rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedComponentData.styles.textColor || '#4A4A4A'}
                        onChange={(e) => updateComponent(selectedComponentData.id, { styles: { ...selectedComponentData.styles, textColor: e.target.value } })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComponentData.styles.textColor || '#4A4A4A'}
                        onChange={(e) => updateComponent(selectedComponentData.id, { styles: { ...selectedComponentData.styles, textColor: e.target.value } })}
                        className="flex-1 px-3 py-2 bg-[#333] rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Padding</label>
                    <input
                      type="text"
                      value={selectedComponentData.styles.padding || ''}
                      onChange={(e) => updateComponent(selectedComponentData.id, { styles: { ...selectedComponentData.styles, padding: e.target.value } })}
                      placeholder="e.g., 40px 20px"
                      className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
                    />
                  </div>

                  {/* Content Editor - Dynamic based on component type */}
                  <div className="pt-4 border-t border-[#333]">
                    <h4 className="text-sm font-medium mb-4">Content</h4>
                    {renderContentEditor(selectedComponentData, updateComponent)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="text-sm">Select a component to edit</p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {/* Global Styles */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Global Styles</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={websiteData.globalStyles.primaryColor}
                          onChange={(e) => updateGlobalStyles({ primaryColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={websiteData.globalStyles.primaryColor}
                          onChange={(e) => updateGlobalStyles({ primaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#333] rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={websiteData.globalStyles.secondaryColor}
                          onChange={(e) => updateGlobalStyles({ secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={websiteData.globalStyles.secondaryColor}
                          onChange={(e) => updateGlobalStyles({ secondaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#333] rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={websiteData.globalStyles.accentColor}
                          onChange={(e) => updateGlobalStyles({ accentColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={websiteData.globalStyles.accentColor}
                          onChange={(e) => updateGlobalStyles({ accentColor: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#333] rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Font Family</label>
                      <select
                        value={websiteData.globalStyles.fontFamily}
                        onChange={(e) => updateGlobalStyles({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
                      >
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="'Lato', sans-serif">Lato</option>
                        <option value="'Montserrat', sans-serif">Montserrat</option>
                        <option value="'Poppins', sans-serif">Poppins</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Professional Color Palettes */}
                <div className="pt-4 border-t border-[#333]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Color Palettes</h3>
                    <button
                      onClick={() => setShowPaletteSelector(!showPaletteSelector)}
                      className="text-xs text-[#D4AF37] hover:text-[#C4A030] transition-colors"
                    >
                      {showPaletteSelector ? 'Hide' : 'Browse All'}
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(['all', 'modern', 'corporate', 'bold', 'pastel', 'gradient', 'elegant'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPaletteCategory(cat)}
                        className={`px-2 py-1 text-xs rounded-md transition-all capitalize ${
                          paletteCategory === cat
                            ? 'bg-[#D4AF37] text-black font-medium'
                            : 'bg-[#333] text-gray-400 hover:bg-[#404040] hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Palette Grid */}
                  <div className={`space-y-2 transition-all ${showPaletteSelector ? 'max-h-[400px]' : 'max-h-[200px]'} overflow-y-auto`}>
                    {filteredPalettes.map((palette) => (
                      <button
                        key={palette.id}
                        onClick={() => applyColorPalette(palette)}
                        className="w-full p-3 bg-[#333] hover:bg-[#404040] rounded-lg transition-all text-left group border border-transparent hover:border-[#D4AF37]/30"
                      >
                        <div className="flex items-center gap-3">
                          {/* Color Preview Swatches */}
                          <div className="flex -space-x-1">
                            {palette.preview.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full border-2 border-[#252525] shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white group-hover:text-[#D4AF37] truncate">
                              {palette.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {palette.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Current Palette Preview */}
                  <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="text-xs text-gray-500 mb-2">Current Colors</div>
                    <div className="flex gap-2">
                      <div className="flex-1 text-center">
                        <div
                          className="w-full h-8 rounded-md mb-1 border border-[#444]"
                          style={{ backgroundColor: websiteData.globalStyles.primaryColor }}
                        />
                        <span className="text-[10px] text-gray-500">Primary</span>
                      </div>
                      <div className="flex-1 text-center">
                        <div
                          className="w-full h-8 rounded-md mb-1 border border-[#444]"
                          style={{ backgroundColor: websiteData.globalStyles.secondaryColor }}
                        />
                        <span className="text-[10px] text-gray-500">Secondary</span>
                      </div>
                      <div className="flex-1 text-center">
                        <div
                          className="w-full h-8 rounded-md mb-1 border border-[#444]"
                          style={{ backgroundColor: websiteData.globalStyles.accentColor }}
                        />
                        <span className="text-[10px] text-gray-500">Accent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page Settings */}
                <div className="pt-4 border-t border-[#333]">
                  <h3 className="text-sm font-semibold mb-4">Page Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Website Name</label>
                      <input
                        type="text"
                        value={websiteData.name}
                        onChange={(e) => pushToHistory({ ...websiteData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Publish Website</h2>
            <p className="text-gray-400 mb-6">
              Are you ready to publish {activeCustomer?.businessName}'s website? This will make the changes live.
            </p>
            <div className="bg-[#333] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div>
                  <div className="font-medium">{activeCustomer?.businessName?.toLowerCase().replace(/\s+/g, '-')}.lovable.app</div>
                  <div className="text-xs text-gray-500">Your website URL</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPublishModal(false)} className="flex-1 py-3 bg-[#333] hover:bg-[#404040] rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={publishWebsite} disabled={isPublishing} className="flex-1 py-3 bg-[#D4AF37] text-black hover:bg-[#C4A030] rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                {isPublishing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Publishing...
                  </>
                ) : (
                  <>Publish Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Content editor renderer based on component type
function renderContentEditor(
  component: EditorComponent,
  updateComponent: (id: string, updates: Partial<EditorComponent>) => void
) {
  const updateContent = (updates: any) => {
    updateComponent(component.id, { content: { ...component.content, ...updates } });
  };

  switch (component.type) {
    case 'header':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Text</label>
            <input
              type="text"
              value={component.content.logo}
              onChange={(e) => updateContent({ logo: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CTA Button Text</label>
            <input
              type="text"
              value={component.content.ctaText}
              onChange={(e) => updateContent({ ctaText: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.content.showCta}
              onChange={(e) => updateContent({ showCta: e.target.checked })}
              className="rounded"
            />
            <label className="text-xs text-gray-400">Show CTA Button</label>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Headline</label>
            <input
              type="text"
              value={component.content.headline}
              onChange={(e) => updateContent({ headline: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subheadline</label>
            <textarea
              value={component.content.subheadline}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={component.content.ctaText}
              onChange={(e) => updateContent({ ctaText: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Alignment</label>
            <select
              value={component.content.alignment}
              onChange={(e) => updateContent({ alignment: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case 'features':
    case 'services':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={component.content.title}
              onChange={(e) => updateContent({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
            <input
              type="text"
              value={component.content.subtitle}
              onChange={(e) => updateContent({ subtitle: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div className="text-xs text-gray-500 italic">Edit individual items coming soon...</div>
        </div>
      );

    case 'about':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={component.content.title}
              onChange={(e) => updateContent({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={component.content.description}
              onChange={(e) => updateContent({ description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm resize-none"
            />
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Headline</label>
            <input
              type="text"
              value={component.content.headline}
              onChange={(e) => updateContent({ headline: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subheadline</label>
            <input
              type="text"
              value={component.content.subheadline}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={component.content.buttonText}
              onChange={(e) => updateContent({ buttonText: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={component.content.title}
              onChange={(e) => updateContent({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={component.content.email}
              onChange={(e) => updateContent({ email: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input
              type="tel"
              value={component.content.phone}
              onChange={(e) => updateContent({ phone: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Address</label>
            <textarea
              value={component.content.address}
              onChange={(e) => updateContent({ address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.content.showForm}
              onChange={(e) => updateContent({ showForm: e.target.checked })}
              className="rounded"
            />
            <label className="text-xs text-gray-400">Show Contact Form</label>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Text</label>
            <input
              type="text"
              value={component.content.logo}
              onChange={(e) => updateContent({ logo: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={component.content.description}
              onChange={(e) => updateContent({ description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Copyright</label>
            <input
              type="text"
              value={component.content.copyright}
              onChange={(e) => updateContent({ copyright: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Text Content</label>
            <textarea
              value={component.content.text}
              onChange={(e) => updateContent({ text: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Alignment</label>
            <select
              value={component.content.alignment}
              onChange={(e) => updateContent({ alignment: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Height</label>
          <input
            type="text"
            value={component.content.height}
            onChange={(e) => updateContent({ height: e.target.value })}
            placeholder="e.g., 60px"
            className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
          />
        </div>
      );

    case 'divider':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={component.content.width}
              onChange={(e) => updateContent({ width: e.target.value })}
              placeholder="e.g., 80%"
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Style</label>
            <select
              value={component.content.style}
              onChange={(e) => updateContent({ style: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] rounded-lg text-sm"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-gray-500 italic">
          Content editor for {component.type} coming soon...
        </div>
      );
  }
}

export default WebsiteEditor;
