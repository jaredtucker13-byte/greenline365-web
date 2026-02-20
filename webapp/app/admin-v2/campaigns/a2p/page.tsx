'use client';

/**
 * A2P 10DLC Compliance Portal
 *
 * Displays all AI-generated A2P campaign fields for copy-paste into Twilio Console.
 * Per-tenant view: select a client, see all fields pre-filled, copy them.
 * Vault-protected fields (EIN, contact info) require explicit reveal action.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface A2PRegistration {
  id: string;
  tenant_id: string;
  legal_business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  business_website: string;
  industry_vertical: string;
  contact_name: string;
  campaign_description: string;
  message_samples: string[];
  opt_in_method: string;
  opt_in_message: string;
  opt_out_keywords: string;
  help_keywords: string;
  privacy_policy_url: string;
  twilio_brand_sid: string;
  twilio_campaign_sid: string;
  brand_status: string;
  campaign_status: string;
  brand_registration_fee: number;
  campaign_monthly_fee: number;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  approved_at: string;
}

interface Tenant {
  id: string;
  business_name: string;
  industry: string;
  onboarding_status: string;
  config_type: string;
}

export default function A2PCompliancePortal() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [registration, setRegistration] = useState<A2PRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchA2P = useCallback(async (tenantId: string) => {
    try {
      const res = await fetch(`/api/admin/a2p?tenant_id=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setRegistration(data.registration || null);
      } else {
        setRegistration(null);
      }
    } catch (err) {
      console.error('Failed to fetch A2P:', err);
      setRegistration(null);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  useEffect(() => {
    if (selectedTenant) fetchA2P(selectedTenant);
  }, [selectedTenant, fetchA2P]);

  const generatePackage = async () => {
    if (!selectedTenant) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-a2p-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenant }),
      });
      if (res.ok) {
        await fetchA2P(selectedTenant);
      }
    } catch (err) {
      console.error('Failed to generate:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopied(fieldName);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (!registration) return;
    const allText = `
A2P 10DLC REGISTRATION — ${registration.legal_business_name}
============================================================

BRAND REGISTRATION
Legal Business Name: ${registration.legal_business_name}
Business Type: ${registration.business_type || 'LLC'}
Industry: ${registration.industry_vertical}
Website: ${registration.business_website}
Address: ${registration.business_address || ''}
Contact: ${registration.contact_name}

CAMPAIGN REGISTRATION
Use Case: Appointment Reminder / Service Notification

Campaign Description:
${registration.campaign_description}

Message Samples:
${(registration.message_samples || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

Opt-in Method: ${registration.opt_in_method}
Opt-in Message: ${registration.opt_in_message}
Opt-out Keywords: ${registration.opt_out_keywords}
Help Keywords: ${registration.help_keywords}
Privacy Policy: ${registration.privacy_policy_url}
    `.trim();

    navigator.clipboard.writeText(allText);
    setCopied('all');
    setTimeout(() => setCopied(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2/campaigns" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  A2P Compliance Portal
                </h1>
                <p className="text-sm text-white/40">10DLC registration data for Twilio Console</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Tenant Selector */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none min-w-[300px]"
          >
            <option value="">Select a client...</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                {t.business_name} ({t.config_type || 'N/A'}) — {t.onboarding_status || 'pending'}
              </option>
            ))}
          </select>

          {selectedTenant && (
            <button
              onClick={generatePackage}
              disabled={generating}
              className="px-4 py-2.5 rounded-lg bg-[#39FF14] text-black font-semibold hover:bg-[#32E012] disabled:opacity-50 transition flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {registration ? 'Regenerate A2P Package' : 'Generate A2P Package'}
                </>
              )}
            </button>
          )}
        </div>

        {/* A2P Content */}
        {!selectedTenant ? (
          <div className="text-center py-20 text-white/30">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            <p className="text-lg mb-2">Select a client to view their A2P registration</p>
            <p className="text-sm text-white/20">Choose from the dropdown above or generate a new package</p>
          </div>
        ) : !registration ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg mb-4">No A2P package generated yet for this client</p>
            <button onClick={generatePackage} disabled={generating} className="px-6 py-3 rounded-lg bg-[#39FF14] text-black font-semibold hover:bg-[#32E012] transition">
              {generating ? 'Generating...' : 'Generate A2P Package Now'}
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">{registration.legal_business_name}</h2>
                <StatusBadge label="Brand" status={registration.brand_status} />
                <StatusBadge label="Campaign" status={registration.campaign_status} />
              </div>
              <div className="flex gap-2">
                <button onClick={copyAll} className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition">
                  {copied === 'all' ? 'Copied!' : 'Copy ALL for Twilio'}
                </button>
              </div>
            </div>

            {/* Section 1: Brand Registration */}
            <Section title="Brand Registration">
              <CopyField label="Legal Business Name" value={registration.legal_business_name} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Business Type" value={registration.business_type || 'LLC'} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Industry Vertical" value={registration.industry_vertical} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Business Website" value={registration.business_website} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Business Address" value={registration.business_address || 'Not set — update in settings'} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Contact Name" value={registration.contact_name} onCopy={copyToClipboard} copied={copied} />
              <div className="col-span-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400">EIN / Tax ID and contact email/phone are stored in Supabase Vault. Use the Reveal button below to access them during registration.</p>
                <button className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition">
                  Reveal Vault Fields (30s)
                </button>
              </div>
            </Section>

            {/* Section 2: Campaign Registration */}
            <Section title="Campaign Registration">
              <div className="col-span-2">
                <label className="block text-xs text-white/40 mb-1">Campaign Description</label>
                <div className="relative">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 whitespace-pre-wrap">
                    {registration.campaign_description}
                  </div>
                  <CopyButton onClick={() => copyToClipboard(registration.campaign_description, 'campaign_description')} copied={copied === 'campaign_description'} />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-xs text-white/40">Message Samples</label>
                {(registration.message_samples || []).map((sample, i) => (
                  <div key={i} className="relative">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 flex items-start gap-2">
                      <span className="text-[#39FF14] font-bold shrink-0">{i + 1}.</span>
                      <span>{sample}</span>
                    </div>
                    <CopyButton onClick={() => copyToClipboard(sample, `sample_${i}`)} copied={copied === `sample_${i}`} />
                  </div>
                ))}
              </div>

              <CopyField label="Opt-in Method" value={registration.opt_in_method} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Opt-in Message" value={registration.opt_in_message} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Opt-out Keywords" value={registration.opt_out_keywords} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Help Keywords" value={registration.help_keywords} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Privacy Policy URL" value={registration.privacy_policy_url} onCopy={copyToClipboard} copied={copied} />
            </Section>

            {/* Section 3: Registration Status */}
            <Section title="Registration Status">
              <CopyField label="Twilio Brand SID" value={registration.twilio_brand_sid || 'Not submitted yet'} onCopy={copyToClipboard} copied={copied} />
              <CopyField label="Twilio Campaign SID" value={registration.twilio_campaign_sid || 'Not submitted yet'} onCopy={copyToClipboard} copied={copied} />
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1">Brand Registration Fee</p>
                <p className="text-white font-bold">${registration.brand_registration_fee || '4.50'} one-time</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1">Campaign Monthly Fee</p>
                <p className="text-white font-bold">${registration.campaign_monthly_fee || '10.00'}/month</p>
              </div>
            </Section>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ============ Components ============

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function CopyField({ label, value, onCopy, copied }: {
  label: string;
  value: string;
  onCopy: (text: string, field: string) => void;
  copied: string | null;
}) {
  const fieldId = label.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="relative">
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 truncate">
          {value || '—'}
        </div>
        <button
          onClick={() => value && onCopy(value, fieldId)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
            copied === fieldId
              ? 'bg-[#39FF14]/20 text-[#39FF14]'
              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          {copied === fieldId ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-medium transition ${
        copied
          ? 'bg-[#39FF14]/20 text-[#39FF14]'
          : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
      }`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    pending: 'bg-amber-500/20 text-amber-400',
    verified: 'bg-[#39FF14]/15 text-[#39FF14]',
    active: 'bg-[#39FF14]/15 text-[#39FF14]',
    failed: 'bg-red-500/20 text-red-400',
    suspended: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || colors.draft}`}>
      {label}: {status || 'draft'}
    </span>
  );
}
