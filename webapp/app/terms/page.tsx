import { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Terms of Service | GreenLine365 - AI Business Automation Platform',
  description: 'Read the GreenLine365 Terms of Service. Learn about our AI-powered business automation platform, data ownership, billing, acceptable use policies, and your rights as a user.',
  keywords: 'GreenLine365 terms, terms of service, AI automation terms, business automation legal, SaaS terms, Florida business software',
  openGraph: {
    title: 'Terms of Service | GreenLine365',
    description: 'Legal agreement governing your use of the GreenLine365 AI-powered business automation platform.',
    type: 'website',
    url: 'https://greenline365.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'directory-terms', title: '3. Directory Listing Terms' },
  { id: 'reviews-policy', title: '4. Reviews Policy' },
  { id: 'transaction-fees', title: '5. Transaction & Interaction Fees' },
  { id: 'ai-disclaimer', title: '6. AI & Automation Disclaimer' },
  { id: 'accounts', title: '7. User Accounts & Security' },
  { id: 'data-ownership', title: '8. Data Ownership & IP' },
  { id: 'billing', title: '9. Subscription & Billing' },
  { id: 'acceptable-use', title: '10. Acceptable Use Policy' },
  { id: 'third-party', title: '11. Third-Party Services' },
  { id: 'liability', title: '12. Limitation of Liability' },
  { id: 'indemnification', title: '13. Indemnification' },
  { id: 'governing-law', title: '14. Governing Law' },
  { id: 'changes', title: '15. Changes to Terms' },
  { id: 'contact', title: '16. Contact Information' },
];

async function getTermsContent() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'terms_of_service')
    .single();
  
  return data?.value || null;
}

export default async function TermsPage() {
  const customContent = await getTermsContent();
  const useCustomContent = customContent && customContent.length > 200; // Only use if admin has added substantial content

  return (
    <div className="pt-24 py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <Link href="/" className="hover:text-emerald-300 transition">Home</Link>
            <span className="text-white/30">/</span>
            <span>Legal</span>
            <span className="text-white/30">/</span>
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Terms of Service
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
              ~8 min read
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
            {useCustomContent ? (
              <div 
                className="prose prose-invert max-w-none text-white/70"
                dangerouslySetInnerHTML={{ __html: customContent }}
              />
            ) : (
              <>
            {/* Introduction Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
              <p className="text-white/80 leading-relaxed">
                Welcome to GreenLine365. These Terms of Service govern your use of our AI-powered 
                business automation platform. Please read them carefully before using our services.
              </p>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">1</span>
                Acceptance of Terms
              </h2>
              <p className="text-white/70 leading-relaxed">
                By creating an account, accessing, or using the GreenLine365 platform (the "Service"), 
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these 
                Terms, you may not use the Service. These Terms constitute a legally binding agreement 
                between you ("User," "Client," or "Tenant") and GreenLine365 ("we," "us," or "our").
              </p>
            </section>

            {/* Section 2 */}
            <section id="description" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">2</span>
                Description of Service
              </h2>
              <p className="text-white/70 leading-relaxed mb-5">
                GreenLine365 is a <strong className="text-white">"Living Economic Operating System"</strong> designed 
                to automate local business operations. The Service includes, but is not limited to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Automated Booking</h3>
                  </div>
                  <p className="text-white/60 text-sm">Calendar management and intelligent appointment scheduling.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">AI Customer Support</h3>
                  </div>
                  <p className="text-white/60 text-sm">Automated agent ("Aiden") for text, web chat, and voice.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Business Automation</h3>
                  </div>
                  <p className="text-white/60 text-sm">Workflows for lead qualification and marketing operations.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Asset Manifestation</h3>
                  </div>
                  <p className="text-white/60 text-sm">AI-driven creation of images, text, and marketing materials.</p>
                </div>
              </div>
            </section>

            {/* Section 3 - Directory Listing Terms */}
            <section id="directory-terms" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">3</span>
                Directory Listing Terms
              </h2>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Business Listing Creation</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    GreenLine365 creates business listings using publicly available information from Google Places API and other public data sources. Business listings are created to provide consumers with a comprehensive local business directory. If you are a business owner and wish to have your listing removed, please contact us at greenline365help@gmail.com.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Claiming a Listing</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Business owners may claim their listing by contacting our team and completing a verification process. Claiming a listing grants the ability to edit business information, upload photos, and access the business dashboard. GreenLine365 reserves the right to verify ownership before granting claim access. Fraudulent claims may result in account termination.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Directory Tiers</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Directory listings are available in three tiers: Free, Pro ($39/month), and Premium ($59/month). Each tier provides different features as detailed on our Pricing page. Tier subscriptions are billed monthly via Stripe and may be cancelled at any time. Downgrading or cancelling will take effect at the end of the current billing period.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Marketplace Add-Ons</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Additional features (such as Coupon Engine, Featured Boost, Analytics Pro, Custom Poll Templates, and Review Response AI) are available as paid add-ons. Add-on availability may require an active Pro or Premium subscription. Pricing and features for add-ons are detailed on our Pricing page and may be updated from time to time.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 - Reviews Policy */}
            <section id="reviews-policy" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">4</span>
                Reviews Policy
              </h2>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Submitting Reviews</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    GL365 Reviews are user-generated content. By submitting a review, you represent that your review is based on a genuine experience, is truthful to the best of your knowledge, and does not contain defamatory, abusive, or fraudulent content. Reviews must include at least 10 characters of descriptive text explaining the rating.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Review Moderation</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    GreenLine365 reserves the right to remove reviews that violate these terms, contain hate speech, spam, or personally identifiable information of third parties, or that we reasonably believe to be fraudulent. We do not verify the accuracy of reviews and they represent the opinions of individual reviewers.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Business Responses</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Business owners may respond to reviews manually or with AI-assisted drafting. AI-generated responses are always subject to business owner review and approval, unless the owner explicitly enables automatic response mode. Business owners are responsible for the content of their responses, whether manually written or AI-assisted.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 - Transaction & Interaction Fees */}
            <section id="transaction-fees" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">5</span>
                Transaction & Interaction Fees
              </h2>
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                  <h3 className="font-semibold text-amber-400 mb-2">Per-Interaction Fees</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Directory-only business listings (Free, Pro, and Premium tiers) are subject to a $0.60 per-interaction fee for certain high-value customer interactions that occur through the directory. Currently, this applies to phone calls initiated via the &ldquo;Call Now&rdquo; button and coupon redemptions. Page views, map clicks, website visits, and directions requests are tracked for analytics but do not incur fees.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Fee Transparency</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    All interaction fees are visible to business owners in their dashboard analytics. Consumers are never charged for interacting with listings. Transaction fee rates may be updated with 30 days notice to affected business owners.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-2">Backend Service Subscribers</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Businesses subscribed to GreenLine365 backend service bundles (Booking Foundation, Marketing Engine, or Intelligence Command) have all directory transaction fees waived as part of their subscription.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 - AI Disclaimer */}
            <section id="ai-disclaimer" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">6</span>
                Artificial Intelligence & Automation Disclaimer
              </h2>
              <p className="text-white/70 leading-relaxed mb-5">
                You acknowledge that the Service utilizes advanced Artificial Intelligence (AI) and 
                Large Language Models (LLMs) provided by third parties (e.g., OpenRouter, OpenAI) to 
                perform tasks. By using the Service, you accept the following inherent risks:
              </p>
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Accuracy & Hallucinations
                  </h3>
                  <p className="text-white/60 text-sm">
                    AI models may occasionally produce incorrect, misleading, or offensive information 
                    ("hallucinations"). You are solely responsible for reviewing all AI-generated content 
                    (including marketing copy, client responses, and images) before it is published or 
                    sent to your customers.
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Booking & Revenue Liability
                  </h3>
                  <p className="text-white/60 text-sm">
                    While our system automates scheduling, GreenLine365 is not liable for missed appointments, 
                    double-bookings caused by third-party calendar sync errors, lost revenue, or damage to 
                    your business reputation resulting from automated interactions.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">No Professional Advice</h3>
                  <p className="text-white/60 text-sm">
                    The Service provides operational automation. It does not provide legal, financial, or medical advice.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="accounts" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">4</span>
                User Accounts & Security
              </h2>
              <p className="text-white/70 leading-relaxed mb-4">
                To use the Service, you must register for an account. You agree to:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Provide accurate, current, and complete information during registration.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Maintain the security of your password and API keys.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Notify us immediately of any unauthorized use of your account.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Accept responsibility for all activities that occur under your account, including actions taken by the AI agent as configured by you.</span>
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="data-ownership" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">5</span>
                Data Ownership & Intellectual Property
              </h2>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Your Data</h3>
                  <p className="text-white/60 text-sm">
                    You retain full ownership of all data, customer lists, and content you upload to the Service ("User Content").
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">AI Training Rights</h3>
                  <p className="text-white/60 text-sm">
                    As outlined in our <Link href="/trust" className="text-emerald-400 hover:text-emerald-300">Trust & Security Whitepaper</Link>, 
                    we may use pseudonymized (anonymized) usage patterns to improve our AI models. We do not use your proprietary 
                    trade secrets, raw client lists, or Personally Identifiable Information (PII) to train models for other tenants.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Generated Assets</h3>
                  <p className="text-white/60 text-sm">
                    You own the rights to the specific marketing assets (images, text) generated by the Service for your business, 
                    subject to the terms of the underlying AI providers (e.g., OpenAI, Black Forest Labs).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="billing" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">6</span>
                Subscription, Billing, and Cancellation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Fees</h3>
                  <p className="text-white/60 text-sm">
                    The Service is billed on a subscription basis (monthly or annually). You agree to pay all fees per your selected plan.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Payment Processing</h3>
                  <p className="text-white/60 text-sm">
                    Payments are processed via secure third-party processors (e.g., Stripe). We do not store your full credit card information.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Cancellation</h3>
                  <p className="text-white/60 text-sm">
                    Cancel anytime via your dashboard. Access continues until the end of your current billing cycle.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Refund Policy</h3>
                  <p className="text-white/60 text-sm">
                    All fees are non-refundable unless otherwise required by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="acceptable-use" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">7</span>
                Acceptable Use Policy
              </h2>
              <p className="text-white/70 leading-relaxed mb-4">
                You agree <strong className="text-red-400">not</strong> to use the Service to:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Send unsolicited bulk messages (spam) in violation of CAN-SPAM, TCPA, or other local regulations.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Generate content that is illegal, harmful, threatening, sexually explicit, or discriminatory.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Reverse engineer, decompile, or attempt to extract the underlying code, weights, or logic of the AI models.</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Interfere with or disrupt the integrity or performance of the Service (e.g., DDoS attacks).</span>
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">8</span>
                Third-Party Services
              </h2>
              <p className="text-white/70 leading-relaxed">
                The Service integrates with third-party providers (including but not limited to Supabase, n8n, 
                OpenRouter, and Vercel) to deliver functionality. We are not responsible for the availability, 
                performance, or security of these third-party services. If a third-party provider experiences 
                an outage, the Service may be temporarily unavailable.
              </p>
            </section>

            {/* Section 9 - Liability */}
            <section id="liability" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">9</span>
                Limitation of Liability
              </h2>
              <div className="bg-gray-800/50 border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm leading-relaxed uppercase font-medium">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW: GREENLINE365 SHALL NOT BE LIABLE FOR ANY 
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF 
                  PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, 
                  USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                </p>
                <ul className="mt-4 space-y-2 text-white/60 text-sm uppercase">
                  <li>(A) YOUR USE OR INABILITY TO USE THE SERVICE;</li>
                  <li>(B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE;</li>
                  <li>(C) ERRORS, INACCURACIES, OR "HALLUCINATIONS" IN AI-GENERATED CONTENT OR BOOKINGS;</li>
                  <li>(D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
                </ul>
                <p className="mt-4 text-white/60 text-sm uppercase font-medium">
                  IN NO EVENT SHALL GREENLINE365'S AGGREGATE LIABILITY EXCEED THE AMOUNT YOU PAID US 
                  IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">10</span>
                Indemnification
              </h2>
              <p className="text-white/70 leading-relaxed">
                You agree to defend, indemnify, and hold harmless GreenLine365 and its officers, directors, 
                employees, and agents from and against any claims, liabilities, damages, losses, and expenses 
                (including legal fees) arising out of or in any way connected with your access to or use of 
                the Service, your violation of these Terms, or your generation of illegal or infringing AI content.
              </p>
            </section>

            {/* Section 11 */}
            <section id="governing-law" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">11</span>
                Governing Law
              </h2>
              <p className="text-white/70 leading-relaxed">
                These Terms shall be governed and construed in accordance with the laws of the 
                <strong className="text-white"> State of Florida, United States</strong>, without regard to its 
                conflict of law provisions. Any legal action or proceeding arising under these Terms shall be 
                brought exclusively in the federal or state courts located in Florida.
              </p>
            </section>

            {/* Section 12 */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">12</span>
                Changes to Terms
              </h2>
              <p className="text-white/70 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of significant 
                changes via email or a prominent notice on the Service. Your continued use of the Service after 
                such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            {/* Section 13 - Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">13</span>
                Contact Information
              </h2>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                <p className="text-white/70 leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <a 
                  href="mailto:greenline365help@gmail.com" 
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  greenline365help@gmail.com
                </a>
              </div>
            </section>

            {/* Footer Links */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm mb-4">Related Documents:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition text-sm">
                  Privacy Policy →
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
