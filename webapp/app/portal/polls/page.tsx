'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import UpgradeCTA from '@/components/portal/UpgradeCTA';
import { POLL_TEMPLATES, getTemplatesForIndustry, type PollTemplate } from '@/lib/poll-templates';

interface Poll {
  id: string;
  title: string;
  questions: { id: string; text: string; type: string; options?: string[] }[];
  responses: any[];
  response_count: number;
  is_active: boolean;
  created_at: string;
}

export default function PollsPage() {
  const { activeListing } = usePortalContext();
  const marketplaceGate = useFeatureGate('marketplace_access');

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!activeListing) return;
    loadPolls();
  }, [activeListing]);

  const loadPolls = async () => {
    if (!activeListing) return;
    setLoading(true);
    const res = await fetch(`/api/directory/addons/polls?listing_id=${activeListing.id}`);
    if (res.ok) {
      const data = await res.json();
      setPolls(data.polls || []);
    }
    setLoading(false);
  };

  const createPollFromTemplate = async (template: PollTemplate) => {
    if (!activeListing) return;
    setCreating(true);
    setMessage(null);

    const res = await fetch('/api/directory/addons/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: activeListing.id,
        title: template.name,
        questions: template.questions,
      }),
    });

    if (res.ok) {
      setMessage({ type: 'success', text: `"${template.name}" poll created and is now live on your listing!` });
      setShowTemplates(false);
      await loadPolls();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to create poll.' });
    }
    setCreating(false);
    setTimeout(() => setMessage(null), 5000);
  };

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  if (!marketplaceGate.isAvailable && !marketplaceGate.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Community Polls</h1>
        <div className="rounded-xl border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <svg className="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">Unlock Community Polls</h2>
          <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
            Create industry-specific feedback polls for your customers. Collect valuable insights and earn trust badges based on poll results.
          </p>
          <UpgradeCTA feature="Community Polls" variant="card" />
        </div>
      </div>
    );
  }

  const recommendedTemplates = activeListing.industry
    ? getTemplatesForIndustry(activeListing.industry)
    : POLL_TEMPLATES;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Polls</h1>
          <p className="mt-1 text-sm text-white/50">
            Create feedback polls that appear on your listing page. Customers can respond directly.
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="rounded-lg bg-neon-green-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-neon-green-400"
        >
          {showTemplates ? 'Cancel' : '+ New Poll'}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Template Picker */}
      {showTemplates && (
        <div className="rounded-xl border border-neon-green-500/20 p-6" style={{ background: 'rgba(0,255,100,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-1">Choose a Poll Template</h2>
          <p className="text-xs text-white/40 mb-4">
            Select a pre-built template for your industry. It will go live on your listing immediately.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => createPollFromTemplate(template)}
                disabled={creating}
                className="text-left rounded-xl border border-white/10 p-4 hover:border-neon-green-500/30 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-xs text-white/40 mb-3">{template.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 bg-white/5 rounded-full px-2 py-0.5">
                    {template.questions.length} questions
                  </span>
                  <span className="text-[10px] text-neon-green-500/60 bg-neon-green-500/10 rounded-full px-2 py-0.5">
                    {template.questions.filter(q => q.type === 'rating').length > 0 ? 'Star ratings' : 'Choice-based'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Polls */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-neon-green-500/30 border-t-neon-green-500 rounded-full animate-spin" />
        </div>
      ) : polls.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <svg className="w-10 h-10 mx-auto mb-3 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p className="text-sm text-white/40 mb-4">No polls yet. Create your first one to start collecting feedback.</p>
          <button
            onClick={() => setShowTemplates(true)}
            className="rounded-lg border border-neon-green-500/30 px-4 py-2 text-sm font-medium text-neon-green-500 transition-colors hover:bg-neon-green-500/10"
          >
            Create Your First Poll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="rounded-xl border border-white/10 p-5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">{poll.title}</h3>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 ${poll.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30'}`}>
                    {poll.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {poll.response_count || 0}
                  <span className="text-xs text-white/30 font-normal ml-1">responses</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {poll.questions?.map((q: any) => (
                  <span
                    key={q.id}
                    className="text-[10px] text-white/40 bg-white/5 rounded-full px-2.5 py-1"
                  >
                    {q.text}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/20">
                  Created {new Date(poll.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-white/20">
                  Visible on your listing page
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
