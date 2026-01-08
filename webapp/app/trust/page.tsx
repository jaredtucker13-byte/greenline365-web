import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Security | GreenLine365',
  description: 'Learn about GreenLine365 security measures, data protection, and compliance standards that keep your business data safe.',
};

export default function TrustPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Trust & Security</h1>
          <p className="text-white/60">GreenLine365 Trust & Security Whitepaper</p>
          <p className="text-white/40 text-sm mt-2">Status: Effective | Date: January 6, 2026 | Jurisdiction: United States / Global Compliance Ready</p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Executive Summary</h2>
            <p className="text-white/70 leading-relaxed">
              GreenLine365 treats data security as the foundational layer of our Living Economic Operating System. We utilize a "Zero-Trust" Architecture, meaning we do not rely on standard permissions alone; we rely on cryptographic and database-level isolation to ensure your business data remains sovereign, private, and secure.
            </p>
            <p className="text-white/70 leading-relaxed mt-4">
              This document outlines the technical measures, AI protocols, and data governance policies that protect your business 24/7.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Technical Architecture & Logical Isolation</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Unlike traditional platforms that mix customer data in a shared environment, GreenLine365 utilizes strict Multi-Tenant Logical Isolation at the kernel level.
            </p>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-bold text-emerald-400 mb-2">Row-Level Security (RLS)</h4>
                <p className="text-white/70 text-sm">
                  We enforce isolation at the database level. Every single row of data—from a lead's email to a financial metric—is stamped with a unique tenant_id. Our database acts as a "Digital Bouncer," automatically rejecting any query that attempts to cross tenant lines. It is mathematically impossible for one tenant to query another tenant's data.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-bold text-emerald-400 mb-2">Authentication</h4>
                <p className="text-white/70 text-sm">
                  All system access is governed by JWT (JSON Web Token) standards. API requests are verified for signature integrity before they reach our database.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-bold text-emerald-400 mb-2">Encryption</h4>
                <p className="text-white/70 text-sm">
                  Data is encrypted in transit (via TLS 1.3) and at rest (via AES-256), ensuring that data remains unreadable even in the event of physical infrastructure compromise.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. AI Data Usage & Privacy Protocol</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              GreenLine365 uses advanced Artificial Intelligence to provide predictive analytics. We adhere to a strict "Privacy Glass" policy to ensure AI utility does not compromise data confidentiality.
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Pseudonymization:</strong> Our AI training agents operate on a strictly sanitized view of system data. Personal Identifiable Information (PII)—such as names, emails, and IP addresses—is hashed (SHA-256) or redacted before the data is accessible to the AI.</li>
              <li><strong className="text-white">Vector Isolation:</strong> Your business's specific "Knowledge Base" (documents, pricing, history) is stored in a dedicated Vector Index. We strictly prohibit the AI from using one client's proprietary facts to answer questions for another client.</li>
              <li><strong className="text-white">Federated Patterns:</strong> The AI learns from aggregated, anonymized behavioral patterns to improve system intelligence without retaining individual user data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Retention & Minimization</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We adhere to strict Data Minimization principles to reduce liability and risk.
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Automated Purging:</strong> We implement an automated Time-To-Live (TTL) policy. Raw web-scraping data and temporary system logs are cryptographically erased after 90 days.</li>
              <li><strong className="text-white">Audit Trails:</strong> We maintain a secure, immutable log of all critical system actions (logins, deletions, exports) for 365 days to assist with internal compliance and security auditing.</li>
              <li><strong className="text-white">Right to be Forgotten:</strong> Upon the termination of service, all data associated with a client's tenant_id is scheduled for permanent deletion within 30 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Infrastructure & Sub-processors</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              GreenLine365 infrastructure is built on industry-leading providers to ensure maximum reliability, speed, and security.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white font-semibold">Provider</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Role</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Security Standard</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Vercel</td>
                    <td className="py-3 px-4">Frontend Hosting & Global Edge Network</td>
                    <td className="py-3 px-4">SOC2 Type II, ISO 27001</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Supabase (AWS)</td>
                    <td className="py-3 px-4">Database & Auth Hosting (Primary Storage)</td>
                    <td className="py-3 px-4">SOC2 Type II, HIPAA Compliant</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">n8n</td>
                    <td className="py-3 px-4">Workflow Automation & Logic Routing</td>
                    <td className="py-3 px-4">SOC2 Type II, GDPR Compliant</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">OpenRouter</td>
                    <td className="py-3 px-4">AI Gateway (Aggregated Access to GPT-4o, Claude 3, etc.)</td>
                    <td className="py-3 px-4">GDPR Compliant, No-Log Policy</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">GitHub</td>
                    <td className="py-3 px-4">Code Infrastructure & Deployment</td>
                    <td className="py-3 px-4">ISO 27001</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Disaster Recovery & Availability</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong className="text-white">Daily Encrypted Backups:</strong> We perform automated daily backups of the entire system structure to prevent data loss.</li>
              <li><strong className="text-white">DDoS Protection:</strong> Our frontend interface is protected by enterprise-grade Edge networks (Vercel), providing mitigation against Distributed Denial of Service attacks.</li>
              <li><strong className="text-white">Redundancy:</strong> Our infrastructure is cloud-native and distributed, ensuring high availability and fault tolerance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact & Reporting</h2>
            <p className="text-white/70 leading-relaxed">
              For specific security inquiries, compliance reports, or to report a vulnerability, please contact our security team.
            </p>
            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-emerald-400"><strong>Security Contact:</strong> security@greenline365.com</p>
              <p className="text-emerald-400"><strong>Support Portal:</strong> help.greenline365.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
