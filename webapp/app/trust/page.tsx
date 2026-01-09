import { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Trust & Security Whitepaper | GreenLine365 - Enterprise Security',
  description: 'GreenLine365 Trust & Security Whitepaper. Learn about our Zero-Trust architecture, AI privacy protocols, data encryption, GDPR compliance, and enterprise-grade infrastructure.',
  keywords: 'GreenLine365 security, zero trust architecture, data privacy, GDPR compliance, SOC2, AI privacy, multi-tenant security, encryption',
  openGraph: {
    title: 'Trust & Security Whitepaper | GreenLine365',
    description: 'Enterprise-grade security protecting your business data 24/7 with Zero-Trust architecture and AI privacy protocols.',
    type: 'website',
    url: 'https://greenline365.com/trust',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: 'executive-summary', title: '1. Executive Summary' },
  { id: 'architecture', title: '2. Technical Architecture' },
  { id: 'ai-privacy', title: '3. AI Data Usage & Privacy' },
  { id: 'data-retention', title: '4. Data Retention' },
  { id: 'infrastructure', title: '5. Infrastructure & Sub-processors' },
  { id: 'disaster-recovery', title: '6. Disaster Recovery' },
  { id: 'contact', title: '7. Contact & Reporting' },
];

const subprocessors = [
  { 
    provider: 'Vercel', 
    role: 'Frontend Hosting & Global Edge Network', 
    standard: 'SOC2 Type II, ISO 27001',
    icon: '🌐'
  },
  { 
    provider: 'Supabase (AWS)', 
    role: 'Database & Auth Hosting (Primary Storage)', 
    standard: 'SOC2 Type II, HIPAA Compliant',
    icon: '🗄️'
  },
  { 
    provider: 'n8n', 
    role: 'Workflow Automation & Logic Routing', 
    standard: 'SOC2 Type II, GDPR Compliant',
    icon: '⚡'
  },
  { 
    provider: 'OpenRouter', 
    role: 'AI Gateway (GPT-4o, Claude 3, etc.)', 
    standard: 'GDPR Compliant, No-Log Policy',
    icon: '🤖'
  },
  { 
    provider: 'GitHub', 
    role: 'Code Infrastructure & Deployment', 
    standard: 'ISO 27001',
    icon: '📦'
  },
];

export default function TrustPage() {
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
            <span>Trust & Security</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Trust & Security Whitepaper
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Status: Effective
            </span>
            <span className="text-white/60 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              January 6, 2026
            </span>
            <span className="text-white/60 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              US / Global Compliance
            </span>
          </div>
          <p className="text-white/60 max-w-3xl">
            A comprehensive overview of our security architecture, data protection measures, 
            and compliance standards that keep your business data sovereign, private, and secure.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="lg:sticky lg:top-24 bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contents
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
              
              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Compliance</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">SOC2</span>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">GDPR</span>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">HIPAA</span>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">ISO 27001</span>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Zero-Trust Architecture</h2>
                  <p className="text-white/70">
                    We don't rely on standard permissions alone. We use cryptographic and database-level 
                    isolation to ensure your business data remains sovereign, private, and secure.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 - Executive Summary */}
            <section id="executive-summary" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">1</span>
                Executive Summary
              </h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  GreenLine365 treats data security as the <strong className="text-white">foundational layer</strong> of 
                  our Living Economic Operating System. We utilize a <strong className="text-emerald-400">"Zero-Trust" Architecture</strong>, 
                  meaning we do not rely on standard permissions alone; we rely on cryptographic and database-level 
                  isolation to ensure your business data remains sovereign, private, and secure.
                </p>
                <p>
                  This document outlines the technical measures, AI protocols, and data governance policies 
                  that protect your business <strong className="text-white">24/7</strong>.
                </p>
              </div>
            </section>

            {/* Section 2 - Technical Architecture */}
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">2</span>
                Technical Architecture & Logical Isolation
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                Unlike traditional platforms that mix customer data in a shared environment, GreenLine365 
                utilizes strict <strong className="text-white">Multi-Tenant Logical Isolation</strong> at the kernel level.
              </p>
              
              <div className="space-y-4">
                {/* RLS Card */}
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-400 mb-2">Row-Level Security (RLS)</h3>
                      <p className="text-white/60 text-sm">
                        We enforce isolation at the database level. Every single row of data—from a lead's email 
                        to a financial metric—is stamped with a unique <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">tenant_id</code>. 
                        Our database acts as a <strong className="text-white">"Digital Bouncer,"</strong> automatically rejecting 
                        any query that attempts to cross tenant lines. It is <em>mathematically impossible</em> for 
                        one tenant to query another tenant's data.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Authentication Card */}
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-400 mb-2">Authentication</h3>
                      <p className="text-white/60 text-sm">
                        All system access is governed by <strong className="text-white">JWT (JSON Web Token)</strong> standards. 
                        API requests are verified for signature integrity before they reach our database.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Encryption Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-400 mb-2">Encryption</h3>
                      <p className="text-white/60 text-sm">
                        Data is encrypted <strong className="text-white">in transit</strong> (via TLS 1.3) and 
                        <strong className="text-white"> at rest</strong> (via AES-256), ensuring that data remains 
                        unreadable even in the event of physical infrastructure compromise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 - AI Privacy */}
            <section id="ai-privacy" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">3</span>
                AI Data Usage & Privacy Protocol
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                GreenLine365 uses advanced Artificial Intelligence to provide predictive analytics. 
                We adhere to a strict <strong className="text-emerald-400">"Privacy Glass"</strong> policy to ensure 
                AI utility does not compromise data confidentiality.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Pseudonymization</h3>
                  <p className="text-white/60 text-sm">
                    PII (names, emails, IPs) is <strong className="text-white">hashed (SHA-256)</strong> or redacted 
                    before the AI can access it.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Vector Isolation</h3>
                  <p className="text-white/60 text-sm">
                    Your Knowledge Base is stored in a <strong className="text-white">dedicated Vector Index</strong>. 
                    AI cannot use one client's data to answer another's questions.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Federated Patterns</h3>
                  <p className="text-white/60 text-sm">
                    AI learns from <strong className="text-white">aggregated, anonymized</strong> behavioral patterns 
                    without retaining individual user data.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 - Data Retention */}
            <section id="data-retention" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">4</span>
                Data Retention & Minimization
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                We adhere to strict <strong className="text-white">Data Minimization</strong> principles to reduce liability and risk.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🗑️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Automated Purging</h3>
                    <p className="text-white/60 text-sm">
                      We implement an automated <strong className="text-white">Time-To-Live (TTL)</strong> policy. 
                      Raw web-scraping data and temporary system logs are cryptographically erased after 
                      <span className="text-emerald-400 font-semibold"> 90 days</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Audit Trails</h3>
                    <p className="text-white/60 text-sm">
                      We maintain a secure, <strong className="text-white">immutable log</strong> of all critical system 
                      actions (logins, deletions, exports) for <span className="text-emerald-400 font-semibold">365 days</span> to 
                      assist with internal compliance and security auditing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚪</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Right to be Forgotten</h3>
                    <p className="text-white/60 text-sm">
                      Upon termination of service, all data associated with your <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">tenant_id</code> is 
                      scheduled for <strong className="text-white">permanent deletion</strong> within 
                      <span className="text-emerald-400 font-semibold"> 30 days</span>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 - Infrastructure */}
            <section id="infrastructure" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">5</span>
                Infrastructure & Sub-processors
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                GreenLine365 infrastructure is built on <strong className="text-white">industry-leading providers</strong> to 
                ensure maximum reliability, speed, and security.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="text-left py-4 px-5 text-white font-semibold">Provider</th>
                        <th className="text-left py-4 px-5 text-white font-semibold">Role</th>
                        <th className="text-left py-4 px-5 text-white font-semibold">Security Standard</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/70">
                      {subprocessors.map((item, index) => (
                        <tr key={item.provider} className={index !== subprocessors.length - 1 ? 'border-b border-white/5' : ''}>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.icon}</span>
                              <span className="font-medium text-white">{item.provider}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">{item.role}</td>
                          <td className="py-4 px-5">
                            <div className="flex flex-wrap gap-1">
                              {item.standard.split(', ').map((badge) => (
                                <span key={badge} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 6 - Disaster Recovery */}
            <section id="disaster-recovery" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">6</span>
                Disaster Recovery & Availability
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Daily Encrypted Backups</h3>
                  <p className="text-white/60 text-sm">
                    Automated daily backups of the entire system structure to prevent data loss.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">DDoS Protection</h3>
                  <p className="text-white/60 text-sm">
                    Enterprise-grade Edge networks (Vercel) provide mitigation against attacks.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Cloud Redundancy</h3>
                  <p className="text-white/60 text-sm">
                    Cloud-native and distributed infrastructure ensures high availability.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 - Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">7</span>
                Contact & Reporting
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                For specific security inquiries, compliance reports, or to report a vulnerability, 
                please contact our security team.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="mailto:security@greenline365.com"
                  className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-500/40 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm">Security Contact</p>
                      <p className="text-emerald-400 font-medium">security@greenline365.com</p>
                    </div>
                  </div>
                </a>

                <a 
                  href="https://help.greenline365.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm">Support Portal</p>
                      <p className="text-blue-400 font-medium">help.greenline365.com</p>
                    </div>
                  </div>
                </a>
              </div>
            </section>

            {/* Footer Links */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm mb-4">Related Documents:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition text-sm">
                  Terms of Service →
                </Link>
                <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition text-sm">
                  Privacy Policy →
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
