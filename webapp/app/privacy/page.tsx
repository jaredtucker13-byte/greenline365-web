import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | GreenLine365',
  description: 'GreenLine365 Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/60">Last Updated: January 6, 2026</p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-white/70 leading-relaxed">
              GreenLine365 ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI scheduling and customer messaging platform (the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <p className="text-white/70 leading-relaxed mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Account Information:</strong> Name, email address, password, company name, and contact details.</li>
              <li><strong className="text-white">Business Data:</strong> Customer lists, appointment schedules, booking information, and service details you input into the Service.</li>
              <li><strong className="text-white">Usage Data:</strong> Information about how you interact with the Service, including features used, pages viewed, and actions taken.</li>
              <li><strong className="text-white">AI Interactions:</strong> Conversations with our AI assistant, content generated, and preferences configured.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>To provide, maintain, and improve the Service</li>
              <li>To process transactions and send related information</li>
              <li>To send technical notices, updates, and support messages</li>
              <li>To respond to your comments, questions, and customer service requests</li>
              <li>To personalize your experience and provide tailored AI responses</li>
              <li>To monitor and analyze trends, usage, and activities</li>
              <li>To detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-white/70 leading-relaxed mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., hosting, analytics, AI processing).</li>
              <li><strong className="text-white">Legal Requirements:</strong> If required by law or in response to valid legal process.</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with any merger, sale, or transfer of company assets.</li>
              <li><strong className="text-white">With Your Consent:</strong> When you have given us explicit permission to share your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-white/70 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (TLS 1.3) and at rest (AES-256), row-level security in our database, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
            <p className="text-white/70 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Upon termination of your account, your data will be scheduled for deletion within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
            <p className="text-white/70 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your personal data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking</h2>
            <p className="text-white/70 leading-relaxed">
              We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, though some features of the Service may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:<br />
              <strong className="text-white">Email:</strong> privacy@greenline365.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
