import React, { useState } from 'react';
import { AppView } from '../types';

interface Props {
  onNavigate: (view: AppView) => void;
}

export const LandingPage: React.FC<Props> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Scout Customers',
      description: 'Find local businesses using AI-powered Google Maps discovery. Target by industry and location.',
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: 'Analyze Brands',
      description: 'Extract color palettes, typography, and brand tone. Upload logos for instant brand guidelines.',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: 'Build Websites',
      description: 'Generate complete, responsive HTML websites in seconds. Edit with our drag-and-drop editor.',
      image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Pitch Perfectly',
      description: 'AI-crafted personalized cold emails that convert. Each one tailored to the prospect.',
      image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&h=400&fit=crop'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Manage Clients',
      description: 'Full CRM with invoicing, payment tracking, and communication history in one place.',
      image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=600&h=400&fit=crop'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: 'Publish & Host',
      description: 'One-click publishing to your custom domain with SSL. Professional hosting included.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop'
    }
  ];

  const steps = [
    { number: '01', title: 'Find', description: 'Search for local businesses using AI-powered Google Maps discovery', icon: '🔍' },
    { number: '02', title: 'Analyze', description: 'Extract brand colors, typography, and upload their logo', icon: '🎨' },
    { number: '03', title: 'Build', description: 'Generate a complete, responsive website in seconds', icon: '💻' },
    { number: '04', title: 'Pitch', description: 'Send personalized cold emails that convert', icon: '✉️' }
  ];

  const pricingPlans = [
    {
      name: 'Free Trial',
      price: 'Free',
      period: '14 days',
      description: 'Try before you buy',
      features: ['100 credits to start', 'Lead discovery', 'Brand analysis', 'Website concept preview', 'Email support'],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Beginner',
      price: '$20',
      period: 'one-time',
      description: 'Perfect for getting started',
      features: ['1,000 credits', '3 website hosting slots', 'Full website generation', 'CRM features', 'Priority support'],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Agency 50',
      price: '$199',
      period: '/month',
      description: 'For teams and agencies',
      features: ['5,000 credits/month', '50 website hosting slots', 'Dynamic hosting support', 'Everything in Beginner', 'Dedicated support'],
      cta: 'Go Agency',
      popular: false
    }
  ];

  const testimonials = [
    {
      quote: "RenovateMySite transformed how I find and pitch clients. What used to take days now takes minutes. The AI-generated websites are incredibly professional.",
      author: 'Sarah Mitchell',
      title: 'Freelance Marketing Consultant',
      rating: 5
    },
    {
      quote: "As a small agency owner, this tool has been a game-changer. We've doubled our client acquisition rate since using RenovateMySite's concierge wizard.",
      author: 'Marcus Chen',
      title: 'Founder, Digital Edge Agency',
      rating: 5
    },
    {
      quote: "The brand analysis feature alone is worth the subscription. It gives me insights that would normally require hours of research.",
      author: 'Emily Rodriguez',
      title: 'Business Development Manager',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'What is RenovateMySite?',
      answer: 'RenovateMySite is an AI-powered business concierge platform that helps entrepreneurs and agencies find customers, analyze brands, build websites, and pitch services - all from one intuitive dashboard.'
    },
    {
      question: 'How does the credit system work?',
      answer: 'Credits are used for AI-powered features. Each credit equals $0.02. Lead discovery costs 5 credits ($0.10), brand analysis costs 2 credits ($0.04), website builds cost 10 credits ($0.20), and pitch emails cost 2 credits ($0.04). New users get 100 free credits to try the platform.'
    },
    {
      question: 'Do I need technical skills to use RenovateMySite?',
      answer: 'Not at all! RenovateMySite is designed for non-technical entrepreneurs. Our AI handles all the complex work - you just provide the business details and let our concierge wizard guide you through each step.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. The Beginner pack is a one-time purchase that never expires. Agency subscriptions can be cancelled before the next billing cycle.'
    },
    {
      question: 'What AI powers RenovateMySite?',
      answer: 'RenovateMySite is powered by Google\'s Gemini AI, including Gemini 2.5 Flash for fast operations like lead discovery and brand analysis, and Gemini 3 Pro for complex tasks like full website generation.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@renovatemysite.com. Beginner and Agency users get priority support with faster response times.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/Logo.png"
                alt="RenovateMySite"
                className="w-10 h-10 rounded-xl shadow-md"
              />
              <span className="font-serif font-bold text-2xl text-[#4A4A4A] tracking-tight">RenovateMySite.</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium">Testimonials</button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => onNavigate(AppView.WIZARD)}
                className="px-4 py-2 text-[#4A4A4A] font-medium hover:text-[#D4AF37] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate(AppView.WIZARD)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4A4A4A]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#EFEBE4]">
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection('features')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium text-left">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium text-left">How It Works</button>
                <button onClick={() => scrollToSection('pricing')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium text-left">Pricing</button>
                <button onClick={() => scrollToSection('testimonials')} className="text-[#4A4A4A]/70 hover:text-[#D4AF37] transition-colors font-medium text-left">Testimonials</button>
                <div className="pt-4 border-t border-[#EFEBE4] flex flex-col gap-3">
                  <button
                    onClick={() => onNavigate(AppView.WIZARD)}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold rounded-xl text-center"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full mb-6 border border-[#D4AF37]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
              </span>
              <span className="text-sm font-medium text-[#D4AF37]">AI-Powered Business Growth</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#4A4A4A] mb-6 leading-tight">
              Your AI-Powered<br />
              <span className="text-[#D4AF37]">Business Concierge</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#4A4A4A]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Find customers, analyze brands, build websites, and close deals - all in one platform designed for non-tech entrepreneurs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => onNavigate(AppView.WIZARD)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all text-lg"
              >
                Get Started Free
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#4A4A4A]/60">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                5-minute setup
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI-powered
              </div>
            </div>
          </div>

          {/* Hero Visual - Browser Mockup with Dashboard Image */}
          <div className="mt-16 relative">
            {/* Browser Frame */}
            <div className="bg-[#4A4A4A] rounded-2xl shadow-2xl p-1 max-w-5xl mx-auto">
              {/* Browser Top Bar */}
              <div className="bg-[#3A3A3A] rounded-t-xl px-4 py-3 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27CA40]"></div>
                </div>
                <div className="flex-1 bg-[#2A2A2A] rounded-lg px-4 py-1.5 text-white/40 text-sm font-mono">
                  renovatemysite.com/dashboard
                </div>
              </div>
              {/* Browser Content */}
              <div className="bg-white rounded-b-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop"
                  alt="RenovateMySite Dashboard"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>

            {/* Floating Feature Cards */}
            <div className="hidden lg:block absolute -left-8 top-1/4 bg-white rounded-xl shadow-xl border border-[#EFEBE4] p-4 max-w-[200px] animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-lg flex items-center justify-center text-white text-lg">🔍</div>
                <span className="font-semibold text-[#4A4A4A]">Lead Found</span>
              </div>
              <p className="text-xs text-[#4A4A4A]/60">AI discovered 15 new prospects in your area</p>
            </div>

            <div className="hidden lg:block absolute -right-8 top-1/3 bg-white rounded-xl shadow-xl border border-[#EFEBE4] p-4 max-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-lg flex items-center justify-center text-white text-lg">✨</div>
                <span className="font-semibold text-[#4A4A4A]">Website Ready</span>
              </div>
              <p className="text-xs text-[#4A4A4A]/60">Your client's site is live!</p>
            </div>

            {/* 4-Step Wizard Flow */}
            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
              {['🔍 Find', '🎨 Analyze', '💻 Build', '✉️ Pitch'].map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${i === 0 ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white shadow-lg' : 'bg-white border border-[#EFEBE4] text-[#4A4A4A]/70'}`}>
                    {step}
                  </div>
                  {i < 3 && <div className="w-4 sm:w-8 h-0.5 bg-[#EFEBE4]"></div>}
                </div>
              ))}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform">100</div>
              <div className="text-sm text-[#4A4A4A]/60">Free Credits to Start</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform">5 min</div>
              <div className="text-sm text-[#4A4A4A]/60">Setup Time</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform flex items-center justify-center gap-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-sm text-[#4A4A4A]/60">Powered by Gemini AI</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-sm text-[#4A4A4A]/60">Always Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mb-4">
              Growing a Business Shouldn't Be This Hard
            </h2>
            <p className="text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Traditional methods of finding clients and creating assets are time-consuming, expensive, and frustrating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: '⏰', title: 'Hours of Research', desc: 'Finding quality leads manually takes forever' },
              { icon: '💰', title: 'Expensive Developers', desc: 'Professional websites cost thousands' },
              { icon: '✍️', title: 'Writer\'s Block', desc: 'Crafting converting pitch emails is hard' },
              { icon: '🔀', title: 'Tool Overload', desc: 'Managing clients across apps is chaotic' }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#EFEBE4] text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-[#4A4A4A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#4A4A4A]/60">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xl text-[#D4AF37] font-semibold">
              RenovateMySite solves all of this in one intelligent platform
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mt-2 mb-4">
              Everything You Need to Win More Clients
            </h2>
            <p className="text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Powerful AI tools designed to streamline your entire client acquisition process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group bg-[#F9F6F0] rounded-2xl overflow-hidden border border-[#EFEBE4] hover:border-[#D4AF37]/30 hover:shadow-xl transition-all duration-300">
                {/* Feature Image */}
                <div className="h-40 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-xl flex items-center justify-center text-white mb-4 -mt-10 relative z-10 shadow-lg group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">{feature.title}</h3>
                  <p className="text-[#4A4A4A]/70 leading-relaxed text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mt-2 mb-4">
              From Lead to Closed Deal in 4 Simple Steps
            </h2>
            <p className="text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Our concierge wizard guides you through the entire process, making client acquisition effortless.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#EFEBE4] via-[#D4AF37] to-[#EFEBE4] -translate-y-1/2"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative text-center group">
                  <div className="bg-white rounded-2xl p-6 border border-[#EFEBE4] hover:border-[#D4AF37]/30 hover:shadow-lg transition-all relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      {step.icon}
                    </div>
                    <div className="text-xs text-[#D4AF37] font-semibold mb-1">Step {step.number}</div>
                    <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">{step.title}</h3>
                    <p className="text-sm text-[#4A4A4A]/60">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate(AppView.WIZARD)}
              className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all"
            >
              Try the Wizard Now
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mt-2 mb-4">
              Simple, Credit-Based Pricing
            </h2>
            <p className="text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Pay only for what you use. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`relative bg-[#F9F6F0] rounded-2xl p-8 border-2 ${plan.popular ? 'border-[#D4AF37] shadow-xl' : 'border-[#EFEBE4]'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-serif font-bold text-[#4A4A4A]">{plan.price}</span>
                    <span className="text-[#4A4A4A]/60">{plan.period}</span>
                  </div>
                  <p className="text-sm text-[#4A4A4A]/60 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-[#4A4A4A]/80">
                      <svg className="w-5 h-5 text-[#D4AF37] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onNavigate(AppView.WIZARD)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white hover:shadow-lg hover:shadow-[#D4AF37]/25'
                      : 'bg-white border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Credit Usage Table */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-[#4A4A4A] text-center mb-2">Credit Usage</h3>
            <p className="text-sm text-[#4A4A4A]/60 text-center mb-6">1 credit = $0.02 • Only pay for what you use</p>
            <div className="bg-[#F9F6F0] rounded-2xl border border-[#EFEBE4] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EFEBE4]">
                    <th className="text-left px-6 py-4 text-[#4A4A4A] font-semibold">Feature</th>
                    <th className="text-center px-6 py-4 text-[#4A4A4A] font-semibold">Credits</th>
                    <th className="text-right px-6 py-4 text-[#4A4A4A] font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Lead Discovery', '5', '$0.10'],
                    ['Brand Analysis', '2', '$0.04'],
                    ['Website Build', '10', '$0.20'],
                    ['Pitch Email', '2', '$0.04']
                  ].map(([feature, credits, price], i) => (
                    <tr key={i} className="border-b border-[#EFEBE4] last:border-0">
                      <td className="px-6 py-4 text-[#4A4A4A]/80">{feature}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[#D4AF37] font-semibold">
                          {credits}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#4A4A4A]/60">{price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mt-2 mb-4">
              Loved by Entrepreneurs Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-[#EFEBE4] shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#4A4A4A]/80 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#4A4A4A]">{testimonial.author}</p>
                    <p className="text-sm text-[#4A4A4A]/60">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A4A4A] mt-2 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#F9F6F0] rounded-2xl border border-[#EFEBE4] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-[#4A4A4A]">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-[#D4AF37] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-[#4A4A4A]/70 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#4A4A4A] to-[#2A2A2A] rounded-3xl p-12 sm:p-16 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
                Join entrepreneurs already winning more clients with RenovateMySite's AI-powered concierge platform.
              </p>
              <button
                onClick={() => onNavigate(AppView.WIZARD)}
                className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all text-lg"
              >
                Get Started Free
              </button>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/60">
                <span>No credit card required</span>
                <span>•</span>
                <span>Start in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4A4A4A] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/Logo.png"
                  alt="RenovateMySite"
                  className="w-10 h-10 rounded-xl shadow-md"
                />
                <span className="font-serif font-bold text-2xl">RenovateMySite.</span>
              </div>
              <p className="text-white/60 mb-6 max-w-sm">
                Your AI-powered business concierge. Find customers, build websites, and close deals faster than ever.
              </p>
            </div>

            {/* Quick Links - Only functional scroll links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-white/60">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#D4AF37] transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#D4AF37] transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-[#D4AF37] transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#D4AF37] transition-colors">FAQ</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a href="mailto:support@renovatemysite.com" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    support@renovatemysite.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-white/60">
                <li>
                  <button
                    onClick={() => onNavigate(AppView.PRIVACY_POLICY)}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate(AppView.TERMS_OF_SERVICE)}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} RenovateMySite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
