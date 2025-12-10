import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, ChatMessage, WebsiteVersion, SelectedElement } from '../types';
import { editWebsiteWithAI, generateWebsiteFromPrompt, summarizeWebsiteChanges, addPageToWebsite } from '../services/geminiService';

// Page templates for multi-page support
const PAGE_TEMPLATES = [
  { id: 'about', label: 'About Us', desc: 'Company story, team, mission' },
  { id: 'services', label: 'Services', desc: 'Service offerings, pricing' },
  { id: 'gallery', label: 'Gallery', desc: 'Portfolio, image gallery' },
  { id: 'pricing', label: 'Pricing', desc: 'Pricing plans, packages' },
  { id: 'contact', label: 'Contact', desc: 'Contact form, location, info' },
  { id: 'faq', label: 'FAQ', desc: 'Frequently asked questions' },
  { id: 'blog', label: 'Blog', desc: 'Blog posts list' },
  { id: 'testimonials', label: 'Testimonials', desc: 'Customer reviews' },
];

// Detect existing pages from HTML code
const detectPages = (htmlCode: string): string[] => {
  const pageMatches = htmlCode.match(/id="page-([^"]+)"/g) || [];
  const pages = pageMatches.map(m => m.match(/page-([^"]+)/)?.[1] || '').filter(Boolean);
  return pages.length > 0 ? pages : ['home'];
};

interface AIWebsiteEditorProps {
  customers: Lead[];
  selectedCustomer?: Lead | null;
  onUpdateCustomer: (customer: Lead) => void;
  onBack: () => void;
  onUseCredit: (amount: number) => void;
}

// Default starter template
const DEFAULT_WEBSITE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div class="text-2xl font-bold text-gray-900">Brand</div>
            <div class="hidden md:flex gap-8">
                <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
                <a href="#features" class="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#about" class="text-gray-600 hover:text-gray-900">About</a>
                <a href="#contact" class="text-gray-600 hover:text-gray-900">Contact</a>
            </div>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Get Started</button>
        </nav>
    </header>

    <section class="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-5xl font-bold text-gray-900 mb-6">Welcome to Your Website</h1>
            <p class="text-xl text-gray-600 mb-8">Start by describing what you want to build in the chat. I'll help you create it!</p>
            <button class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">Learn More</button>
        </div>
    </section>

    <section id="features" class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Fast</h3>
                    <p class="text-gray-600">Lightning quick performance for all your needs.</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Reliable</h3>
                    <p class="text-gray-600">Dependable service you can count on.</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Secure</h3>
                    <p class="text-gray-600">Your data is safe with us.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="about" class="py-20 px-4 bg-gray-100">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-bold mb-6">About Us</h2>
            <p class="text-lg text-gray-600">We are dedicated to providing the best service possible. Our team works tirelessly to ensure your satisfaction.</p>
        </div>
    </section>

    <section id="contact" class="py-20 px-4">
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-8">Contact Us</h2>
            <form class="space-y-4">
                <input type="text" placeholder="Your Name" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <input type="email" placeholder="Your Email" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <textarea placeholder="Your Message" rows="4" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Send Message</button>
            </form>
        </div>
    </section>

    <footer class="bg-gray-900 text-white py-12 px-4">
        <div class="max-w-6xl mx-auto text-center">
            <div class="text-2xl font-bold mb-4">Brand</div>
            <p class="text-gray-400">&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;

// Icons
const SendIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const DesktopIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const TabletIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const MobileIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const CodeIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const UndoIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const RedoIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CursorIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;
const ChevronLeftIcon = () => <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ExternalLinkIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const PublishIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const AttachmentIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const ImageAttachIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CloseIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const PageIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// Suggestion prompts
const PROMPT_SUGGESTIONS = [
  { text: 'Change the color scheme to dark blue', icon: '🎨' },
  { text: 'Add a testimonials section', icon: '💬' },
  { text: 'Make the hero section larger', icon: '📐' },
  { text: 'Add a pricing table', icon: '💰' },
  { text: 'Change the font to something modern', icon: '✨' },
  { text: 'Add social media icons to footer', icon: '📱' },
  { text: 'Make the buttons more rounded', icon: '⚪' },
  { text: 'Add an image gallery section', icon: '🖼️' },
];

export const AIWebsiteEditor: React.FC<AIWebsiteEditorProps> = ({
  customers,
  selectedCustomer,
  onUpdateCustomer,
  onBack,
  onUseCredit
}) => {
  // State
  const [activeCustomer, setActiveCustomer] = useState<Lead | null>(selectedCustomer || null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(!selectedCustomer);
  const [htmlCode, setHtmlCode] = useState(selectedCustomer?.websiteCode || DEFAULT_WEBSITE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI website builder. Describe what you want to create or modify, and I'll help you build it. You can also click on elements in the preview to select them for editing.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<WebsiteVersion[]>([]);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; type: string; url: string; size: number }>>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Multi-page support state
  const [pages, setPages] = useState<string[]>(['home']);
  const [activePage, setActivePage] = useState('home');
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with customer's existing website if available
  useEffect(() => {
    if (activeCustomer?.websiteCode) {
      // Load the customer's existing website code
      setHtmlCode(activeCustomer.websiteCode);
    } else if (activeCustomer) {
      // Customer exists but no website code - use default
      setHtmlCode(DEFAULT_WEBSITE);
    }
  }, [activeCustomer]);

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const initialHtmlRef = useRef(selectedCustomer?.websiteCode || DEFAULT_WEBSITE);

  // Auto-save website code changes to customer (debounced)
  useEffect(() => {
    // Skip if no customer selected or code hasn't changed from initial
    if (!activeCustomer || htmlCode === initialHtmlRef.current) {
      return;
    }

    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      // Update the customer with new website code
      const updatedCustomer = {
        ...activeCustomer,
        websiteCode: htmlCode,
        // Also update blob URL for preview
        websiteUrl: URL.createObjectURL(new Blob([htmlCode], { type: 'text/html' }))
      };
      onUpdateCustomer(updatedCustomer);
      setActiveCustomer(updatedCustomer);
      initialHtmlRef.current = htmlCode; // Update reference to prevent re-saves
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000); // Debounce: wait 1s before saving

    return () => clearTimeout(timeoutId);
  }, [htmlCode, activeCustomer, onUpdateCustomer]);

  // Detect pages when HTML code changes
  useEffect(() => {
    const detectedPages = detectPages(htmlCode);
    setPages(detectedPages);
    // If active page no longer exists, switch to home
    if (!detectedPages.includes(activePage)) {
      setActivePage('home');
    }
  }, [htmlCode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle iframe click for element selection
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Inject selection styles
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .ai-editor-hover { outline: 2px dashed #3B82F6 !important; outline-offset: 2px; cursor: pointer; }
        .ai-editor-selected { outline: 3px solid #D4AF37 !important; outline-offset: 2px; }
      `;
      iframeDoc.head.appendChild(style);

      // Add event listeners for selection mode
      const handleElementClick = (e: MouseEvent) => {
        if (!selectionMode) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (target.tagName === 'HTML' || target.tagName === 'BODY') return;

        // Remove previous selection
        iframeDoc.querySelectorAll('.ai-editor-selected').forEach(el => {
          el.classList.remove('ai-editor-selected');
        });

        target.classList.add('ai-editor-selected');

        const rect = target.getBoundingClientRect();
        setSelectedElement({
          selector: target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ').join('.')}` : ''),
          tagName: target.tagName,
          className: target.className,
          textContent: target.textContent?.substring(0, 100),
          outerHTML: target.outerHTML,
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        });
      };

      const handleElementHover = (e: MouseEvent) => {
        if (!selectionMode) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'HTML' || target.tagName === 'BODY') return;

        iframeDoc.querySelectorAll('.ai-editor-hover').forEach(el => {
          if (el !== target) el.classList.remove('ai-editor-hover');
        });
        target.classList.add('ai-editor-hover');
      };

      const handleElementLeave = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        target.classList.remove('ai-editor-hover');
      };

      iframeDoc.body.addEventListener('click', handleElementClick);
      iframeDoc.body.addEventListener('mouseover', handleElementHover);
      iframeDoc.body.addEventListener('mouseout', handleElementLeave);

      return () => {
        iframeDoc.body.removeEventListener('click', handleElementClick);
        iframeDoc.body.removeEventListener('mouseover', handleElementHover);
        iframeDoc.body.removeEventListener('mouseout', handleElementLeave);
      };
    };

    iframe.addEventListener('load', handleIframeLoad);
    // Trigger if already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [selectionMode, htmlCode]);

  // Save version snapshot
  const saveVersion = useCallback((name: string, code: string, messageId?: string) => {
    const newVersion: WebsiteVersion = {
      id: `v-${Date.now()}`,
      name,
      htmlCode: code,
      timestamp: Date.now(),
      messageId
    };
    setVersions(prev => [...prev, newVersion]);
  }, []);

  // Restore version
  const restoreVersion = useCallback((version: WebsiteVersion) => {
    setHtmlCode(version.htmlCode);
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Restored to version: "${version.name}"`,
      timestamp: Date.now()
    }]);
    setShowHistory(false);
  }, []);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Save current state before changes
      saveVersion('Before: ' + inputValue.trim().substring(0, 30) + '...', htmlCode);

      // Call AI to edit website
      const newCode = await editWebsiteWithAI(
        htmlCode,
        inputValue.trim(),
        selectedElement || undefined
      );

      // Use credit
      onUseCredit(5);

      // Get summary of changes
      const summary = await summarizeWebsiteChanges(htmlCode, newCode, inputValue.trim());

      setHtmlCode(newCode);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: summary,
        timestamp: Date.now(),
        codeChanges: newCode,
        versionId: `v-${Date.now()}`
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Clear selection after edit
      setSelectedElement(null);
      setSelectionMode(false);

    } catch (error: any) {
      console.error('AI Edit Error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new website
  const handleGenerateNew = async (description: string) => {
    if (isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `Create a new website: ${description}`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const businessName = activeCustomer?.businessName || 'My Business';
      const newCode = await generateWebsiteFromPrompt(description, businessName);

      onUseCredit(10);

      setHtmlCode(newCode);
      saveVersion('Initial generation', newCode);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've created a new website for ${businessName}. You can now describe any changes you'd like to make!`,
        timestamp: Date.now(),
        codeChanges: newCode
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I couldn't generate the website: ${error.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only accept images and common file types
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachments(prev => [...prev, {
          id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: file.name,
          type: file.type,
          url,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachments(prev => [...prev, {
          id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: file.name,
          type: file.type,
          url,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Download HTML
  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCustomer?.businessName || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Publish website
  const handlePublish = async () => {
    if (!activeCustomer) {
      setShowPublishModal(true);
      return;
    }

    setIsPublishing(true);

    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create a blob URL as the "deployed" website
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const deployedUrl = URL.createObjectURL(blob);

    // Update customer with the website URL
    onUpdateCustomer({
      ...activeCustomer,
      websiteUrl: deployedUrl,
      history: [
        ...(activeCustomer.history || []),
        {
          id: `deploy-${Date.now()}`,
          type: 'WEBSITE_DEPLOY',
          timestamp: Date.now(),
          content: deployedUrl,
          metadata: {
            description: 'Website published from AI Editor'
          }
        }
      ]
    });

    // Add system message
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Website published successfully! Your site is now live.`,
      timestamp: Date.now()
    }]);

    setIsPublishing(false);
  };

  // Navigate to a specific page in the preview
  const navigateToPage = useCallback((pageId: string) => {
    setActivePage(pageId);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.location.hash = pageId;
    }
  }, []);

  // Handle adding a new page
  const handleAddPage = async (pageType: string, pageLabel: string) => {
    if (isAddingPage) return;

    setIsAddingPage(true);
    setShowAddPageModal(false);

    // Add system message
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Adding "${pageLabel}" page to your website...`,
      timestamp: Date.now()
    }]);

    try {
      // Save current state before changes
      saveVersion(`Before adding ${pageLabel} page`, htmlCode);

      // Get business context
      const businessContext = activeCustomer
        ? `Business: ${activeCustomer.businessName}. ${activeCustomer.details || ''}`
        : 'Generic business website';

      // Call AI to add the page
      const newCode = await addPageToWebsite(
        htmlCode,
        pageType,
        pageLabel,
        businessContext
      );

      // Use credit
      onUseCredit(8);

      setHtmlCode(newCode);

      // Add success message
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've added the "${pageLabel}" page to your website! You can now click on the page tabs above to navigate between pages, or continue making changes via chat.`,
        timestamp: Date.now()
      }]);

      // Navigate to the new page
      setTimeout(() => navigateToPage(pageType), 500);

    } catch (error: any) {
      console.error('Add Page Error:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I couldn't add the page: ${error.message || 'Please try again.'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsAddingPage(false);
    }
  };

  // Resize panel handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(300, Math.min(600, e.clientX));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Get preview width based on mode
  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  // Customer Selector Modal
  if (showCustomerSelector) {
    return (
      <div className="fixed inset-0 bg-[#F9F6F0] flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-serif font-bold text-[#4A4A4A]">Select a Customer</h2>
            <p className="text-gray-500 mt-1">Choose a customer to build or edit their website</p>
          </div>

          <div className="p-4 max-h-[50vh] overflow-y-auto">
            {customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon />
                </div>
                <p className="text-gray-500">No customers yet. Start fresh with a new website!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setActiveCustomer(customer);
                      setShowCustomerSelector(false);
                      if (customer.websiteUrl) {
                        // Load existing website
                      }
                    }}
                    className="w-full p-4 rounded-xl border border-gray-200 hover:border-[#D4AF37] hover:bg-[#F9F6F0] transition-all text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {customer.businessName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#4A4A4A]">{customer.businessName}</div>
                      <div className="text-sm text-gray-500">{customer.location}</div>
                    </div>
                    {customer.websiteUrl && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Has Website</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setActiveCustomer(null);
                setShowCustomerSelector(false);
              }}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Start Fresh (No Customer)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F9F6F0] flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeftIcon />
            <span className="font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {activeCustomer?.businessName?.charAt(0) || 'W'}
            </div>
            <span className="font-semibold text-[#4A4A4A]">
              {activeCustomer?.businessName || 'New Website'}
            </span>
            {/* Auto-save status indicator */}
            {isSaving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="animate-pulse">●</span> Saving...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                ✓ Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm text-[#D4AF37]' : 'text-gray-500 hover:text-gray-700'}`}
              title="Desktop"
            >
              <DesktopIcon />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'tablet' ? 'bg-white shadow-sm text-[#D4AF37]' : 'text-gray-500 hover:text-gray-700'}`}
              title="Tablet"
            >
              <TabletIcon />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm text-[#D4AF37]' : 'text-gray-500 hover:text-gray-700'}`}
              title="Mobile"
            >
              <MobileIcon />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedElement(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              selectionMode
                ? 'bg-[#D4AF37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Select Element Mode"
          >
            <CursorIcon />
            <span className="text-sm font-medium hidden md:inline">Select</span>
          </button>

          {/* Code Toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showCode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="View Code"
          >
            <CodeIcon />
            <span className="text-sm font-medium hidden md:inline">Code</span>
          </button>

          {/* History */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Version History"
          >
            <HistoryIcon />
            <span className="text-sm font-medium hidden md:inline">History</span>
          </button>

          {/* Publish */}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
              isPublishing
                ? 'bg-green-400 text-white cursor-wait'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
            }`}
            title="Publish Website"
          >
            {isPublishing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm hidden md:inline">Publishing...</span>
              </>
            ) : (
              <>
                <PublishIcon />
                <span className="text-sm hidden md:inline">Publish</span>
              </>
            )}
          </button>

          <div className="h-6 w-px bg-gray-200" />

          {/* Actions */}
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download HTML"
          >
            <DownloadIcon />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open in New Tab"
          >
            <ExternalLinkIcon />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div
          className="bg-white border-r border-gray-200 flex flex-col"
          style={{ width: leftPanelWidth }}
        >
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#D4AF37] text-white rounded-br-md'
                      : message.role === 'system'
                      ? 'bg-gray-100 text-gray-600 text-sm'
                      : 'bg-gray-100 text-[#4A4A4A] rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <SparklesIcon />
                      <span className="font-medium text-sm text-[#D4AF37]">AI Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.versionId && (
                    <button
                      onClick={() => {
                        const version = versions.find(v => v.id === message.versionId);
                        if (version) restoreVersion(version);
                      }}
                      className="mt-2 text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      <HistoryIcon />
                      View this version
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex gap-1">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-gray-500 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Element Indicator */}
          {selectedElement && (
            <div className="px-4 py-2 bg-[#D4AF37]/10 border-t border-[#D4AF37]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CursorIcon />
                  <span className="text-sm font-medium text-[#4A4A4A]">
                    Selected: &lt;{selectedElement.tagName.toLowerCase()}&gt;
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedElement(null);
                    setSelectionMode(false);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              {selectedElement.textContent && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  "{selectedElement.textContent}"
                </p>
              )}
            </div>
          )}

          {/* Suggestions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div
            className={`p-4 border-t border-gray-200 ${isDraggingFile ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                  >
                    {attachment.type.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-50">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <CloseIcon />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                      {attachment.name.length > 10 ? attachment.name.substring(0, 10) + '...' : attachment.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drag overlay */}
            {isDraggingFile && (
              <div className="absolute inset-4 border-2 border-dashed border-[#D4AF37] rounded-xl bg-[#D4AF37]/5 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center">
                  <ImageAttachIcon />
                  <p className="text-sm text-[#D4AF37] font-medium mt-1">Drop images here</p>
                </div>
              </div>
            )}

            <div className="relative">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.svg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attachment button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 bottom-2 p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-gray-100 rounded-lg transition-colors"
                title="Attach image or file"
                disabled={isLoading}
              >
                <AttachmentIcon />
              </button>

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={selectedElement ? `Describe changes for the selected ${selectedElement.tagName.toLowerCase()}...` : "Describe what you want to change..."}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 resize-none transition-all"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8963A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SendIcon />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                {attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached (${formatFileSize(attachments.reduce((sum, a) => sum + a.size, 0))})` : 'Drag & drop images or click 📎'}
              </p>
              <p className="text-xs text-gray-400">
                Enter to send
              </p>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-gray-200 hover:bg-[#D4AF37] cursor-col-resize transition-colors"
        />

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Page Navigation Tabs */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
              <PageIcon />
              Pages:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => navigateToPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    activePage === page
                      ? 'bg-[#D4AF37] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setShowAddPageModal(true)}
                disabled={isAddingPage}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white hover:shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <PlusIcon />
                Add Page
              </button>
            </div>
            {isAddingPage && (
              <span className="text-sm text-gray-500 ml-2 flex items-center gap-1">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding page...
              </span>
            )}
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-4 flex justify-center">
            <div
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
              style={{
                width: getPreviewWidth(),
                maxWidth: '100%',
                height: 'fit-content',
                minHeight: '100%'
              }}
            >
              {showCode ? (
                <div className="h-full">
                  <textarea
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="w-full h-full min-h-[600px] p-4 font-mono text-sm text-gray-800 bg-gray-50 border-0 focus:ring-0 resize-none"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlCode}
                  className="w-full border-0"
                  style={{ height: '800px', minHeight: '100%' }}
                  title="Website Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-[#4A4A4A]">Version History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No versions yet. Changes will be saved automatically.
                </p>
              ) : (
                versions.slice().reverse().map(version => (
                  <button
                    key={version.id}
                    onClick={() => restoreVersion(version)}
                    className="w-full p-3 rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:bg-[#F9F6F0] transition-all text-left"
                  >
                    <div className="text-sm font-medium text-[#4A4A4A] truncate">
                      {version.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(version.timestamp).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold text-[#4A4A4A]">Add New Page</h2>
                <button
                  onClick={() => setShowAddPageModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Select a page type to add to your website
              </p>
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="grid gap-3">
                {PAGE_TEMPLATES
                  .filter(template => !pages.includes(template.id))
                  .map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleAddPage(template.id, template.label)}
                      className="w-full p-4 rounded-xl border border-gray-200 hover:border-[#D4AF37] hover:bg-[#F9F6F0] transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#4A4A4A] group-hover:text-[#D4AF37] transition-colors">
                            {template.label}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {template.desc}
                          </div>
                        </div>
                        <div className="text-gray-300 group-hover:text-[#D4AF37] transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                {PAGE_TEMPLATES.filter(t => !pages.includes(t.id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>All available page types have been added!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowAddPageModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWebsiteEditor;
