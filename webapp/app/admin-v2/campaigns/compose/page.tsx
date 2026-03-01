'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ComposeEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      showToast('error', 'Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/email/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Email sent to ${to}`);
        setTo('');
        setSubject('');
        setBody('');
      } else {
        showToast('error', data.error || 'Failed to send email');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error');
    } finally {
      setSending(false);
    }
  };

  // Build preview paragraphs from body text
  const previewParagraphs = body
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="compose-email-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2/campaigns" className="text-white/50 hover:text-white transition flex items-center gap-2 text-sm" data-testid="back-to-campaigns">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Campaigns
              </Link>
            </div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              Compose Email
            </h1>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right">
          <div className={`px-5 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">To</label>
              <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#333] text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition"
                data-testid="compose-to"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#333] text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition"
                data-testid="compose-subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder="Write your email message here...&#10;&#10;Use double line breaks for new paragraphs."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#333] text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition resize-y min-h-[180px]"
                data-testid="compose-body"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !to || !subject || !body}
              className="w-full px-6 py-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: sending ? '#333' : 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 100%)',
                color: sending ? '#888' : '#fff',
              }}
              data-testid="compose-send-btn"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Send Email
                </>
              )}
            </button>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-3">Live Preview</label>
            <div className="rounded-xl border border-[#333] overflow-hidden" style={{ background: '#0a0a0a' }}>
              <div style={{ padding: '32px 16px', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ color: '#C9A96E', fontSize: 20, fontWeight: 700 }}>GreenLine</span>
                  <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>365</span>
                  <p style={{ color: '#666', fontSize: 10, margin: '3px 0 0' }}>Florida&apos;s Gold Standard Business Directory</p>
                </div>
                {/* Card */}
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.19)', borderRadius: 12, padding: 24 }}>
                  <h2 style={{ color: '#fff', fontSize: 16, margin: '0 0 12px', fontWeight: 600 }}>
                    {subject || 'Your subject line'}
                  </h2>
                  {previewParagraphs.length > 0 ? (
                    previewParagraphs.map((p, i) => (
                      <p key={i} style={{ color: '#a0a0a0', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{p}</p>
                    ))
                  ) : (
                    <p style={{ color: '#555', fontSize: 13, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>Your message will appear here...</p>
                  )}
                </div>
                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <p style={{ color: '#444', fontSize: 9 }}>GreenLine365 &middot; Tampa, FL &middot; Florida Business Directory</p>
                  <p style={{ color: '#333', fontSize: 8, margin: '3px 0 0' }}>
                    &copy; {new Date().getFullYear()} GreenLine365. All rights reserved. &middot;{' '}
                    <span style={{ color: '#555', textDecoration: 'underline' }}>Unsubscribe</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
