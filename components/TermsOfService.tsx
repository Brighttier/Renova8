import React from 'react';

interface TermsOfServiceProps {
  onBack?: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const lastUpdated = "December 22, 2024";
  const companyName = "RenovateMySite";
  const companyEmail = "legal@renovatemysite.com";

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#F9F6F0] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#4A4A4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-serif font-bold text-[#4A4A4A]">Terms of Service</h1>
          </div>
          <span className="text-sm text-[#4A4A4A]/60">Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-[#EFEBE4] p-8 sm:p-12 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">1. Agreement to Terms</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Welcome to {companyName}. These Terms of Service ("Terms") govern your access to and use of our
              website, products, and services ("Services"). By accessing or using our Services, you agree to be
              bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              If you do not agree to these Terms, you may not access or use our Services. We reserve the right
              to modify these Terms at any time, and your continued use of the Services constitutes acceptance
              of any modifications.
            </p>
          </section>

          {/* Description of Services */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">2. Description of Services</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              {companyName} is an AI-powered business concierge platform that provides:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Lead discovery and business search tools</li>
              <li>Brand analysis and guidelines generation</li>
              <li>AI-powered website generation and editing</li>
              <li>Email and pitch content generation</li>
              <li>Client relationship management (CRM)</li>
              <li>Website hosting services</li>
              <li>Image and video generation (where available)</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">3. Account Registration</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              To use our Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              You must be at least 18 years old to create an account and use our Services.
            </p>
          </section>

          {/* Credit System */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">4. Credit System and Payments</h2>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">4.1 Credits</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Our Services operate on a credit-based system. Credits are consumed when you use AI-powered features.
              Each credit equals $0.02 USD. Credit costs for each feature are displayed before use.
            </p>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">4.2 Free Trial</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              New users receive 100 free credits upon registration. Trial credits expire 14 days after account
              creation if unused. Trial credits have no cash value and are non-transferable.
            </p>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">4.3 Purchases</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Credit purchases are processed through Stripe. All purchases are final and non-refundable, except
              as required by applicable law. Purchased credits do not expire. Prices are subject to change with
              reasonable notice.
            </p>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">4.4 Subscriptions</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Some plans include monthly subscriptions. Subscriptions automatically renew unless cancelled before
              the renewal date. You may cancel at any time through your account settings. Cancellation takes effect
              at the end of the current billing period.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">5. Acceptable Use Policy</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed mb-4">
              You agree NOT to use our Services to:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Send spam, unsolicited communications, or harassing messages</li>
              <li>Generate content that is illegal, harmful, threatening, abusive, or defamatory</li>
              <li>Create websites or content promoting illegal activities</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our Services</li>
              <li>Use automated systems to access our Services without permission</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Resell or redistribute our Services without authorization</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              We reserve the right to suspend or terminate accounts that violate these policies.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">6. Intellectual Property</h2>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">6.1 Our Content</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              The {companyName} platform, including its design, features, code, and documentation, is owned by us
              and protected by intellectual property laws. You may not copy, modify, or distribute our platform
              without permission.
            </p>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">6.2 Your Content</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              You retain ownership of content you create or upload. By using our Services, you grant us a limited
              license to process, store, and display your content as necessary to provide the Services.
            </p>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">6.3 AI-Generated Content</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Content generated using our AI tools (websites, emails, images, etc.) is yours to use for your
              business purposes. However, you are responsible for ensuring such content does not infringe on
              third-party rights. AI-generated content is provided "as-is" and should be reviewed before use.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">7. Third-Party Services</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Our Services integrate with third-party providers including:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Google (Firebase, Maps, AI services)</li>
              <li>Stripe (payment processing)</li>
              <li>Sentry (error monitoring)</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              Your use of third-party services is subject to their respective terms and privacy policies.
              We are not responsible for the availability, accuracy, or conduct of third-party services.
            </p>
          </section>

          {/* Website Hosting */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">8. Website Hosting</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              If you publish websites through our hosting services:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>You are responsible for all content published on hosted sites</li>
              <li>Hosting limits are determined by your subscription plan</li>
              <li>We may remove content that violates our acceptable use policy</li>
              <li>Custom domains require proper DNS configuration on your end</li>
              <li>SSL certificates are provided at no additional cost</li>
              <li>Hosted sites may be taken offline if your account is suspended or terminated</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">9. Disclaimers</h2>
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 mb-4">
              <p className="text-[#92400E] text-sm">
                <strong>Important:</strong> Please read this section carefully as it limits our liability.
              </p>
            </div>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties that the Services will be uninterrupted or error-free</li>
              <li>Warranties regarding the accuracy of AI-generated content</li>
              <li>Warranties that the Services will meet your specific requirements</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              You understand that AI-generated content may contain errors or inaccuracies and should be reviewed
              before use. Lead data from our discovery features should be independently verified.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">10. Limitation of Liability</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()} SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages arising from your use of AI-generated content</li>
              <li>Damages resulting from third-party actions or services</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              Our total liability for any claim arising from these Terms or your use of the Services shall not
              exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">11. Indemnification</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              You agree to indemnify, defend, and hold harmless {companyName} and its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses (including reasonable
              attorney fees) arising from:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Your use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Content you create, upload, or publish</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">12. Termination</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              You may terminate your account at any time through your account settings or by contacting us.
              We may suspend or terminate your account if:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>You violate these Terms or our policies</li>
              <li>We are required to do so by law</li>
              <li>Your account has been inactive for an extended period</li>
              <li>We discontinue the Services (with reasonable notice)</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              Upon termination, your right to use the Services ceases immediately. Unused credits are
              non-refundable except as required by law. Hosted websites may be taken offline.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">13. Dispute Resolution</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Any disputes arising from these Terms or your use of the Services shall be resolved as follows:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li><strong>Informal Resolution:</strong> We encourage you to contact us first to resolve any issues</li>
              <li><strong>Governing Law:</strong> These Terms are governed by the laws of the State of Delaware, USA</li>
              <li><strong>Venue:</strong> Any legal proceedings shall be brought in the courts of Delaware</li>
              <li><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive any
                  right to participate in class action lawsuits</li>
            </ul>
          </section>

          {/* General */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">14. General Provisions</h2>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4">
              <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute
                  the entire agreement between you and {companyName}</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions
                  will continue in effect</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right or provision does not constitute a waiver</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent</li>
              <li><strong>Force Majeure:</strong> We are not liable for failures due to circumstances beyond our
                  reasonable control</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">15. Contact Us</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-[#F9F6F0] rounded-xl p-6 mt-4">
              <p className="text-[#4A4A4A] font-semibold">{companyName}</p>
              <p className="text-[#4A4A4A]/70 mt-1">
                Email: <a href={`mailto:${companyEmail}`} className="text-[#D4AF37] hover:underline">{companyEmail}</a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
