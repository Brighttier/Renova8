import React from 'react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const lastUpdated = "December 22, 2024";
  const companyName = "RenovateMySite";
  const companyEmail = "privacy@renovatemysite.com";
  const companyAddress = "United States";

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
            <h1 className="text-2xl font-serif font-bold text-[#4A4A4A]">Privacy Policy</h1>
          </div>
          <span className="text-sm text-[#4A4A4A]/60">Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-[#EFEBE4] p-8 sm:p-12 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">1. Introduction</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Welcome to {companyName} ("we," "our," or "us"). We are committed to protecting your personal information
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our website and services.
            </p>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              By using {companyName}, you agree to the collection and use of information in accordance with this policy.
              If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">2.1 Personal Information</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed mb-4">
              We collect personal information that you voluntarily provide when you:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4">
              <li>Create an account (email address, display name)</li>
              <li>Make a purchase (billing information processed by Stripe)</li>
              <li>Use our AI features (prompts and generated content)</li>
              <li>Contact our support team</li>
              <li>Subscribe to our newsletter</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">2.2 Business Information</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              When using our lead generation and CRM features, you may input business information including:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-2">
              <li>Business names and addresses</li>
              <li>Contact information (phone, email)</li>
              <li>Website URLs</li>
              <li>Brand analysis data</li>
              <li>Communication history</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2 mt-6">2.3 Automatically Collected Information</h3>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              We automatically collect certain information when you visit our platform:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-2">
              <li>Device and browser information</li>
              <li>IP address (for security and fraud prevention)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs (for debugging and improvement)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">3. How We Use Your Information</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4">
              <li>Provide and maintain our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative information (updates, security alerts)</li>
              <li>Respond to inquiries and offer support</li>
              <li>Improve our platform and develop new features</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">4. How We Share Your Information</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed mb-4">
              We may share your information with the following third parties:
            </p>

            <div className="space-y-4">
              <div className="bg-[#F9F6F0] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A]">Firebase/Google Cloud</h4>
                <p className="text-sm text-[#4A4A4A]/70">Authentication, database storage, and hosting infrastructure</p>
              </div>
              <div className="bg-[#F9F6F0] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A]">Stripe</h4>
                <p className="text-sm text-[#4A4A4A]/70">Payment processing (we never store your credit card information)</p>
              </div>
              <div className="bg-[#F9F6F0] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A]">Google Generative AI (Gemini)</h4>
                <p className="text-sm text-[#4A4A4A]/70">AI-powered content generation features</p>
              </div>
              <div className="bg-[#F9F6F0] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A]">Sentry</h4>
                <p className="text-sm text-[#4A4A4A]/70">Error monitoring and performance tracking</p>
              </div>
            </div>

            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              We do not sell your personal information to third parties. We may also share information when required
              by law or to protect our rights and safety.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">5. Data Security</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>All data is encrypted in transit using HTTPS/TLS</li>
              <li>Data is encrypted at rest in our databases</li>
              <li>Payment information is processed by PCI-compliant Stripe</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security assessments and updates</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">6. Your Privacy Rights</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-[#EFEBE4] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Right to Access
                </h4>
                <p className="text-sm text-[#4A4A4A]/70 mt-1">Request a copy of your personal data</p>
              </div>
              <div className="border border-[#EFEBE4] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Right to Rectification
                </h4>
                <p className="text-sm text-[#4A4A4A]/70 mt-1">Correct inaccurate personal data</p>
              </div>
              <div className="border border-[#EFEBE4] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Right to Erasure
                </h4>
                <p className="text-sm text-[#4A4A4A]/70 mt-1">Delete your account and data</p>
              </div>
              <div className="border border-[#EFEBE4] rounded-xl p-4">
                <h4 className="font-semibold text-[#4A4A4A] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Right to Portability
                </h4>
                <p className="text-sm text-[#4A4A4A]/70 mt-1">Export your data in a portable format</p>
              </div>
            </div>

            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              To exercise these rights, visit your Account Settings or contact us at{' '}
              <a href={`mailto:${companyEmail}`} className="text-[#D4AF37] hover:underline">{companyEmail}</a>.
            </p>
          </section>

          {/* GDPR */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">7. GDPR Compliance (EU Users)</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              If you are located in the European Economic Area (EEA), you have additional rights under the
              General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li><strong>Legal Basis:</strong> We process your data based on your consent, contract performance,
                  legitimate interests, or legal obligations</li>
              <li><strong>Data Transfers:</strong> Your data may be transferred to servers in the United States.
                  We ensure appropriate safeguards are in place</li>
              <li><strong>Right to Object:</strong> You can object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time</li>
              <li><strong>Right to Lodge a Complaint:</strong> You can file a complaint with your local data
                  protection authority</li>
            </ul>
          </section>

          {/* CCPA */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">8. CCPA Rights (California Users)</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              If you are a California resident, you have the right to:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Know what personal information we collect about you</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of the sale of your personal information (we do not sell your data)</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">9. Cookies and Tracking</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              We use essential cookies and local storage to:
            </p>
            <ul className="list-disc list-inside text-[#4A4A4A]/80 space-y-2 ml-4 mt-4">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences (e.g., onboarding completion)</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              We do not use advertising or tracking cookies. Third-party services may use their own cookies
              as described in their respective privacy policies.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">10. Data Retention</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide
              you services. We may retain certain information as required by law or for legitimate business purposes.
            </p>
            <p className="text-[#4A4A4A]/80 leading-relaxed mt-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days,
              except where we are required to retain it for legal, accounting, or reporting purposes.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">11. Children's Privacy</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. If we learn we have collected personal information from a
              child under 18, we will delete that information promptly.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">12. Changes to This Policy</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">13. Contact Us</h2>
            <p className="text-[#4A4A4A]/80 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-[#F9F6F0] rounded-xl p-6 mt-4">
              <p className="text-[#4A4A4A] font-semibold">{companyName}</p>
              <p className="text-[#4A4A4A]/70 mt-1">Email: <a href={`mailto:${companyEmail}`} className="text-[#D4AF37] hover:underline">{companyEmail}</a></p>
              <p className="text-[#4A4A4A]/70">Location: {companyAddress}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
