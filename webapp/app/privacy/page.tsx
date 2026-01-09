import { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Privacy Policy | GreenLine365 - Data Protection & Privacy',
  description: 'GreenLine365 Privacy Policy. Learn how we collect, use, protect, and manage your personal data in compliance with GDPR, CCPA, and privacy regulations.',
  keywords: 'GreenLine365 privacy, data protection, GDPR, CCPA, privacy policy, personal data, user privacy',
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
  { id: 'introduction', title: '1. Introduction' },
  { id: 'data-collection', title: '2. Information We Collect' },
  { id: 'data-usage', title: '3. How We Use Your Data' },
  { id: 'data-sharing', title: '4. Data Sharing & Third Parties' },
  { id: 'data-security', title: '5. Data Security' },
  { id: 'your-rights', title: '6. Your Rights' },
  { id: 'cookies', title: '7. Cookies & Tracking' },
  { id: 'children', title: '8. Children\'s Privacy' },
  { id: 'changes', title: '9. Changes to This Policy' },
  { id: 'contact', title: '10. Contact Us' },
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
              Last Updated: January 6, 2026
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~7 min read
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
                {/* Introduction Card */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                  <p className="text-white/80 leading-relaxed">
                    GreenLine365 (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                    when you use our AI-powered business automation platform.
                  </p>
                </div>

                {/* Section 1 */}
                <section id="introduction" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">1</span>
                    Introduction
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    By accessing or using GreenLine365, you agree to the collection and use of information 
                    in accordance with this Privacy Policy. If you do not agree with our policies and practices, 
                    please do not use our Service.
                  </p>
                  <p className="text-white/70 leading-relaxed">
                    This policy applies to information we collect through the Service, via email, text, and 
                    other electronic communications, and through mobile applications.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="data-collection" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">2</span>
                    Information We Collect
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-5">
                    We collect several types of information from and about users of our Service:
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Personal Information</h3>
                      <p className="text-white/60 text-sm">
                        Name, email address, phone number, business name, billing information, and other identifiers.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Usage Data</h3>
                      <p className="text-white/60 text-sm">
                        Information about your interactions with the Service, including features used, pages visited, and time spent.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Technical Data</h3>
                      <p className="text-white/60 text-sm">
                        IP address, browser type, device information, operating system, and unique device identifiers.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Business Content</h3>
                      <p className="text-white/60 text-sm">
                        Customer data, marketing materials, calendars, and other content you upload or create through the Service.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="data-usage" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">3</span>
                    How We Use Your Data
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Provide, operate, and maintain the Service</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Process transactions and send related information</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Improve, personalize, and expand our Service</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Communicate with you about updates, security alerts, and support</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Develop new products, services, and features</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/70">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Prevent fraud, enforce terms, and comply with legal obligations</span>
                    </li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section id="data-sharing" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">4</span>
                    Data Sharing & Third Parties
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information with:
                  </p>
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Service Providers</h3>
                      <p className="text-white/60 text-sm">
                        Third-party vendors who perform services on our behalf (hosting, analytics, payment processing). 
                        See our <Link href="/trust" className="text-emerald-400 hover:text-emerald-300">Trust & Security Whitepaper</Link> for details.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Legal Compliance</h3>
                      <p className="text-white/60 text-sm">
                        When required by law, to respond to legal processes, or to protect rights and safety.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Business Transfers</h3>
                      <p className="text-white/60 text-sm">
                        In connection with a merger, acquisition, or sale of assets (users will be notified).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="data-security" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">5</span>
                    Data Security
                  </h2>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                    <p className="text-white/70 leading-relaxed mb-4">
                      We implement industry-standard security measures including:
                    </p>
                    <ul className="space-y-2 text-white/70">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>TLS 1.3 encryption for data in transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>AES-256 encryption for data at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Multi-tenant logical isolation with Row-Level Security</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Regular security audits and penetration testing</span>
                      </li>
                    </ul>
                    <p className="text-white/60 text-sm mt-4">
                      For detailed security information, review our <Link href="/trust" className="text-blue-400 hover:text-blue-300">Trust & Security Whitepaper</Link>.
                    </p>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="your-rights" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">6</span>
                    Your Privacy Rights
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    Depending on your location, you may have the following rights:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Access</h3>
                      <p className="text-white/60 text-sm">Request a copy of your personal data</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Correction</h3>
                      <p className="text-white/60 text-sm">Update inaccurate or incomplete data</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Deletion</h3>
                      <p className="text-white/60 text-sm">Request deletion of your personal data</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Portability</h3>
                      <p className="text-white/60 text-sm">Export your data in a machine-readable format</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Objection</h3>
                      <p className="text-white/60 text-sm">Object to processing of your data</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">Opt-Out</h3>
                      <p className="text-white/60 text-sm">Unsubscribe from marketing communications</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mt-4">
                    To exercise these rights, contact us at <a href="mailto:privacy@greenline365.com" className="text-emerald-400 hover:text-emerald-300">privacy@greenline365.com</a>.
                  </p>
                </section>

                {/* Section 7 */}
                <section id="cookies" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">7</span>
                    Cookies & Tracking Technologies
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    We use cookies and similar tracking technologies to improve user experience, analyze usage, 
                    and deliver personalized content. You can control cookies through your browser settings.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-400 mb-2">Cookie Types</h3>
                    <p className="text-white/60 text-sm">
                      Essential cookies (required for functionality), performance cookies (analytics), 
                      and functional cookies (preferences). We do not use advertising cookies.
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="children" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">8</span>
                    Children's Privacy
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    Our Service is not intended for individuals under the age of 18. We do not knowingly 
                    collect personal information from children. If you believe we have collected information 
                    from a child, please contact us immediately.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="changes" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">9</span>
                    Changes to This Policy
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of significant 
                    changes via email or a prominent notice on our Service. Your continued use after such 
                    changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                {/* Section 10 - Contact */}
                <section id="contact" className="scroll-mt-24">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">10</span>
                    Contact Us
                  </h2>
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                    <p className="text-white/70 leading-relaxed mb-4">
                      If you have questions or concerns about this Privacy Policy, please contact us:
                    </p>
                    <div className="space-y-2">
                      <a 
                        href="mailto:privacy@greenline365.com" 
                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        privacy@greenline365.com
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
