import { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Privacy Policy | GreenLine365 - Data Protection & SMS Privacy',
  description: 'GreenLine365 Privacy Policy. Learn how we collect, use, protect, and manage your personal data including SMS verification, in compliance with privacy regulations.',
  keywords: 'GreenLine365 privacy, data protection, SMS privacy, OTP verification, personal data, user privacy, TCPA compliance',
  openGraph: {
    title: 'Privacy Policy | GreenLine365',
    description: 'How GreenLine365 protects your personal data and respects your privacy rights.',
    type: 'website',
    url: 'https://greenline365.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'data-collection', title: '2. Data We Collect' },
  { id: 'data-usage', title: '3. How We Use Your Data' },
  { id: 'sharing-storage', title: '4. Sharing, Storage & Retention' },
  { id: 'your-choices', title: '5. Your Choices & Contact' },
];

async function getPrivacyContent() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'privacy_policy')
    .single();
  
  return data?.value || null;
}

export default async function PrivacyPage() {
  const customContent = await getPrivacyContent();

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <Link href="/" className="hover:text-emerald-300 transition">Home</Link>
            <span className="text-white/30">/</span>
            <span>Legal</span>
            <span className="text-white/30">/</span>
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Last Updated: January 10, 2026
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~5 min read
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="lg:sticky lg:top-24 bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Table of Contents
              </h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a 
                      href={`#${section.id}`}
                      className="text-sm text-white/60 hover:text-emerald-400 transition block py-1"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-10">
            {customContent ? (
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: customContent }}
              />
            ) : (
              <>
                {/* Section 1 - Overview */}
                <section id="overview" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">1</span>
                    Overview
                  </h2>
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                    <p className="text-white/80 leading-relaxed">
                      This Privacy Policy explains how GreenLine365 (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and 
                      protects personal information when you visit our website or use our services, including SMS‑based verification.
                    </p>
                  </div>
                  <p className="text-white/70 leading-relaxed mt-4">
                    By providing your information (including your mobile phone number) and using our services, you agree 
                    to the practices described here, subject to any additional consent screens shown in the product.
                  </p>
                </section>

                {/* Section 2 - Data We Collect */}
                <section id="data-collection" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">2</span>
                    Data We Collect
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-5">
                    We collect the following types of information to provide and improve our services:
                  </p>
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-white">Contact Details</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Such as name, email address, and mobile phone number when you join the waitlist, 
                        sign up for the newsletter, or create an account.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-white">Technical Data</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Such as IP address, device/browser information, and basic usage logs generated 
                        automatically by our hosting and analytics providers.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-white">Verification & Journaling Data</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Including one‑time passcodes (OTPs), verification status, and audit logs of when codes 
                        were generated, sent, verified, or expired. <strong className="text-white">Codes are stored only in hashed 
                        or tokenized form.</strong>
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3 - How We Use Your Data */}
                <section id="data-usage" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">3</span>
                    How We Use Your Data
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    We use the information we collect for the following purposes:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4 text-white/70 bg-white/5 border border-white/10 rounded-lg p-4">
                      <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        <strong className="text-white">Account Management:</strong> To create and manage your GreenLine365 account, 
                        place you on our waitlist or newsletter, and communicate important updates about the service.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 text-white/70 bg-white/5 border border-white/10 rounded-lg p-4">
                      <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        <strong className="text-white">SMS Verification:</strong> To send transactional SMS messages, such as 
                        one‑time verification codes, using your phone number <strong className="text-amber-400">only for security and 
                        account‑related purposes</strong> unless you separately opt into marketing messages.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 text-white/70 bg-white/5 border border-white/10 rounded-lg p-4">
                      <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        <strong className="text-white">Security & Compliance:</strong> To maintain security and reliability of the service, 
                        including fraud prevention, journaling of verification events, debugging, and compliance with 
                        applicable laws and carrier rules for SMS programs.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Section 4 - Sharing, Storage & Retention */}
                <section id="sharing-storage" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">4</span>
                    Sharing, Storage & Retention
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Trusted Third-Party Providers
                      </h3>
                      <p className="text-white/60 text-sm">
                        We use trusted third‑party service providers to host and process data, such as 
                        <strong className="text-white"> Supabase</strong> for database and backend hosting, 
                        <strong className="text-white"> Twilio</strong> (or similar) for SMS delivery, and workflow tools 
                        (e.g., <strong className="text-white">n8n</strong>) to orchestrate message sending. These providers 
                        process data only on our behalf and under contract.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg p-5">
                      <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        We Do Not Sell Your Data
                      </h3>
                      <p className="text-white/70 text-sm">
                        We do not sell your personal information and do not share your phone number or email 
                        with unrelated third parties for their own marketing without your separate consent.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Data Retention
                      </h3>
                      <p className="text-white/60 text-sm">
                        We retain personal data for as long as needed to provide the service and meet legal or 
                        accounting obligations. OTP codes and related logs are kept only as long as reasonably 
                        necessary for security and audit purposes, after which they are deleted or anonymized.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5 - Your Choices & Contact */}
                <section id="your-choices" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">5</span>
                    Your Choices & Contact
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        SMS Opt-Out
                      </h3>
                      <p className="text-white/60 text-sm">
                        You may opt out of SMS messages at any time by following the opt‑out instructions in 
                        the message (for example, replying <strong className="text-white">STOP</strong>) or by contacting us. 
                        <span className="text-amber-400"> Note: Opting out of verification messages may limit your ability 
                        to use features that require a verified phone number.</span>
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Access, Correction & Deletion
                      </h3>
                      <p className="text-white/60 text-sm">
                        You may request access to, correction of, or deletion of your personal information, 
                        subject to legal and operational limits, by emailing our support team using the 
                        contact details provided on the GreenLine365 website.
                      </p>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                      <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Policy Updates
                      </h3>
                      <p className="text-white/60 text-sm">
                        We may update this Privacy Policy from time to time. When we do, we will change 
                        the &quot;Last updated&quot; date and, where required, provide additional notice or obtain your consent.
                      </p>
                    </div>
                  </div>

                  {/* Contact Card */}
                  <div className="mt-8 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4">Contact Us About Privacy</h3>
                    <p className="text-white/70 leading-relaxed mb-4">
                      If you have questions or concerns about this Privacy Policy, please contact us:
                    </p>
                    <div className="space-y-2">
                      <a 
                        href="mailto:greenline365help@gmail.com" 
                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        greenline365help@gmail.com
                      </a>
                      <p className="text-white/60 text-sm">
                        GreenLine365<br />
                        Data Protection Officer<br />
                        Florida, United States
                      </p>
                    </div>
                  </div>
                </section>

                {/* Footer Links */}
                <div className="pt-8 border-t border-white/10">
                  <p className="text-white/40 text-sm mb-4">Related Documents:</p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition text-sm">
                      Terms of Service →
                    </Link>
                    <Link href="/trust" className="text-emerald-400 hover:text-emerald-300 transition text-sm">
                      Trust & Security →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
