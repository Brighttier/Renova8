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
      description: 'Find local businesses by type and location with AI-powered lead discovery and Google Maps integration.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: 'Analyze Brand DNA',
      description: 'Generate color palettes, brand tone, and strategic marketing insights in seconds with AI analysis.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Visualize Websites',
      description: 'AI-generated website concept mockups let you see the vision before building anything.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: 'Build Websites',
      description: 'Full HTML websites generated instantly with our no-code editor powered by AI prompts.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Pitch Perfectly',
      description: 'AI-crafted cold emails that convert, personalized to each prospect automatically.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      title: 'Manage Everything',
      description: 'CRM, invoicing, and communications - all your client data organized in one place.'
    }
  ];

  const steps = [
    { number: '01', title: 'Find', description: 'Search for local businesses in your target market' },
    { number: '02', title: 'Analyze', description: 'Get instant brand insights and color palettes' },
    { number: '03', title: 'Visualize', description: 'See AI-generated website concepts' },
    { number: '04', title: 'Build', description: 'Generate complete websites in seconds' },
    { number: '05', title: 'Pitch', description: 'Send personalized emails that convert' }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for getting started',
      features: ['10 credits/month', 'Lead discovery', 'Basic brand analysis', 'Email support'],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For growing businesses',
      features: ['100 credits/month', 'Everything in Starter', 'Website generation', 'Full CRM features', 'Priority support'],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Agency',
      price: '$99',
      period: '/month',
      description: 'For teams and agencies',
      features: ['500 credits/month', 'Everything in Pro', 'Unlimited clients', 'White-label options', 'Dedicated support'],
      cta: 'Contact Sales',
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
      answer: 'Credits are used for AI-powered features. Lead searches cost 5 credits, brand analysis costs 2 credits, website concepts cost 5 credits, website builds cost 10 credits, and pitch emails cost 2 credits. Credits refresh monthly based on your plan.'
    },
    {
      question: 'Do I need technical skills to use RenovateMySite?',
      answer: 'Not at all! RenovateMySite is designed for non-technical entrepreneurs. Our AI handles all the complex work - you just provide the business details and let our concierge wizard guide you through each step.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your access continues until the end of your billing period.'
    },
    {
      question: 'What AI powers RenovateMySite?',
      answer: 'RenovateMySite is powered by RenovateMySite AI, our advanced AI technology. This enables high-quality content generation, accurate brand analysis, and professional website creation.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@renova8.com. Pro and Agency users get priority support with faster response times.'
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
              <div className="w-10 h-10 bg-[#4A4A4A] text-[#F9F6F0] rounded-full flex items-center justify-center font-serif font-bold text-lg shadow-md">
                RMS
              </div>
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

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#EFEBE4] p-4 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-[#F9F6F0] to-white rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#4A4A4A] mb-2">Concierge Wizard</h3>
                  <p className="text-[#4A4A4A]/60">Your 5-step journey from lead to closed deal</p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    {['Find', 'Analyze', 'Visualize', 'Build', 'Pitch'].map((step, i) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-[#D4AF37] text-white' : 'bg-[#EFEBE4] text-[#4A4A4A]/50'}`}>
                          {i + 1}
                        </div>
                        {i < 4 && <div className="w-8 h-0.5 bg-[#EFEBE4]"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-white border-y border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[#4A4A4A]/50 text-sm font-medium mb-8">TRUSTED BY ENTREPRENEURS AND AGENCIES WORLDWIDE</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
            {['TechCrunch', 'Forbes', 'Entrepreneur', 'Inc.', 'Wired'].map((name) => (
              <div key={name} className="text-2xl font-serif font-bold text-[#4A4A4A]">{name}</div>
            ))}
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
              <div key={i} className="group bg-[#F9F6F0] rounded-2xl p-8 border border-[#EFEBE4] hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#4A4A4A] mb-3">{feature.title}</h3>
                <p className="text-[#4A4A4A]/70 leading-relaxed">{feature.description}</p>
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
              From Lead to Closed Deal in 5 Steps
            </h2>
            <p className="text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Our concierge wizard guides you through the entire process, making client acquisition effortless.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#EFEBE4] via-[#D4AF37] to-[#EFEBE4] -translate-y-1/2"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="bg-white rounded-2xl p-6 border border-[#EFEBE4] hover:border-[#D4AF37]/30 hover:shadow-lg transition-all relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-bold text-[#4A4A4A] mb-2">{step.title}</h3>
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
            <h3 className="text-xl font-bold text-[#4A4A4A] text-center mb-6">Credit Usage</h3>
            <div className="bg-[#F9F6F0] rounded-2xl border border-[#EFEBE4] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EFEBE4]">
                    <th className="text-left px-6 py-4 text-[#4A4A4A] font-semibold">Feature</th>
                    <th className="text-right px-6 py-4 text-[#4A4A4A] font-semibold">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Lead Search', '5'],
                    ['Brand Analysis', '2'],
                    ['Website Concept', '5'],
                    ['Website Build', '10'],
                    ['Pitch Email', '2']
                  ].map(([feature, credits], i) => (
                    <tr key={i} className="border-b border-[#EFEBE4] last:border-0">
                      <td className="px-6 py-4 text-[#4A4A4A]/80">{feature}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[#D4AF37] font-semibold">
                          {credits}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </td>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#D4AF37] text-[#4A4A4A] rounded-full flex items-center justify-center font-serif font-bold text-lg">
                  RMS
                </div>
                <span className="font-serif font-bold text-2xl">RenovateMySite.</span>
              </div>
              <p className="text-white/60 mb-6 max-w-sm">
                Your AI-powered business concierge. Find customers, build websites, and close deals faster than ever.
              </p>
              <div className="flex gap-4">
                {['twitter', 'linkedin', 'facebook'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition-colors">
                    <span className="sr-only">{social}</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#features" className="hover:text-[#D4AF37] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#D4AF37] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Community</a></li>
                <li><a href="mailto:support@renova8.com" className="hover:text-[#D4AF37] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} RenovateMySite. All rights reserved.
            </p>
            <div className="flex gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
