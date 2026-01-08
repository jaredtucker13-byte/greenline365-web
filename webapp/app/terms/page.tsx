import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | GreenLine365',
  description: 'GreenLine365 Terms of Service - Legal agreement governing your use of our AI scheduling and customer messaging platform.',
};

export default function TermsPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">GreenLine365 Terms of Service</h1>
          <p className="text-white/60">Last Updated: January 6, 2026</p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/70 leading-relaxed">
              By creating an account, accessing, or using the GreenLine365 platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms constitute a legally binding agreement between you ("User," "Client," or "Tenant") and GreenLine365 ("we," "us," or "our").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              GreenLine365 is a "Living Economic Operating System" designed to automate local business operations. The Service includes, but is not limited to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Automated Booking System:</strong> Tools for calendar management and appointment scheduling.</li>
              <li><strong className="text-white">AI Customer Support:</strong> An automated agent ("Aiden") capable of interacting with your clients via text, web chat, or voice.</li>
              <li><strong className="text-white">Business Automation:</strong> Workflows for lead qualification, marketing asset generation, and operational tasks.</li>
              <li><strong className="text-white">Asset Manifestation:</strong> AI-driven creation of images, text, and marketing materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Artificial Intelligence & Automation Disclaimer</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You acknowledge that the Service utilizes advanced Artificial Intelligence (AI) and Large Language Models (LLMs) provided by third parties (e.g., OpenRouter, OpenAI) to perform tasks. By using the Service, you accept the following inherent risks:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Accuracy & Hallucinations:</strong> AI models may occasionally produce incorrect, misleading, or offensive information ("hallucinations"). You are solely responsible for reviewing all AI-generated content before it is published or sent to your customers.</li>
              <li><strong className="text-white">Booking & Revenue Liability:</strong> While our system automates scheduling, GreenLine365 is not liable for missed appointments, double-bookings caused by third-party calendar sync errors, lost revenue, or damage to your business reputation resulting from automated interactions.</li>
              <li><strong className="text-white">No Professional Advice:</strong> The Service provides operational automation. It does not provide legal, financial, or medical advice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. User Accounts & Security</h2>
            <p className="text-white/70 leading-relaxed mb-4">To use the Service, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your password and API keys.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Accept responsibility for all activities that occur under your account, including actions taken by the AI agent as configured by you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Ownership & Intellectual Property</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Your Data:</strong> You retain full ownership of all data, customer lists, and content you upload to the Service ("User Content").</li>
              <li><strong className="text-white">AI Training Rights:</strong> As outlined in our Trust & Security Whitepaper, we may use pseudonymized (anonymized) usage patterns to improve our AI models. We do not use your proprietary trade secrets, raw client lists, or Personally Identifiable Information (PII) to train models for other tenants.</li>
              <li><strong className="text-white">Generated Assets:</strong> You own the rights to the specific marketing assets (images, text) generated by the Service for your business, subject to the terms of the underlying AI providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Subscription, Billing, and Cancellation</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Fees:</strong> The Service is billed on a subscription basis (e.g., monthly or annually). You agree to pay all fees in accordance with the pricing plan selected.</li>
              <li><strong className="text-white">Payment Processing:</strong> Payments are processed via third-party secure processors (e.g., Stripe). We do not store your full credit card information.</li>
              <li><strong className="text-white">Cancellation:</strong> You may cancel your subscription at any time via your account dashboard. Access to the Service will continue until the end of the current billing cycle.</li>
              <li><strong className="text-white">Refund Policy:</strong> All fees are non-refundable unless otherwise required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Acceptable Use Policy</h2>
            <p className="text-white/70 leading-relaxed mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Send unsolicited bulk messages (spam) in violation of CAN-SPAM, TCPA, or other local regulations.</li>
              <li>Generate content that is illegal, harmful, threatening, sexually explicit, or discriminatory.</li>
              <li>Reverse engineer, decompile, or attempt to extract the underlying code, weights, or logic of the AI models.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service (e.g., DDoS attacks).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Services</h2>
            <p className="text-white/70 leading-relaxed">
              The Service integrates with third-party providers (including but not limited to Supabase, n8n, OpenRouter, and Vercel) to deliver functionality. We are not responsible for the availability, performance, or security of these third-party services. If a third-party provider experiences an outage, the Service may be temporarily unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm leading-relaxed uppercase">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW: GREENLINE365 SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ERRORS, INACCURACIES, OR "HALLUCINATIONS" IN AI-GENERATED CONTENT OR BOOKINGS; (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT. IN NO EVENT SHALL GREENLINE365'S AGGREGATE LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Indemnification</h2>
            <p className="text-white/70 leading-relaxed">
              You agree to defend, indemnify, and hold harmless GreenLine365 and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your generation of illegal or infringing AI content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
            <p className="text-white/70 leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms shall be brought exclusively in the federal or state courts located in Florida.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or a prominent notice on the Service. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
            <p className="text-white/70 leading-relaxed">
              If you have any questions about these Terms, please contact us at:<br />
              <strong className="text-white">Email:</strong> legal@greenline365.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
