'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  created_at: string;
  response: { text: string; responded_at: string; method: string } | null;
  ai_draft: { text: string; generated_at: string; status: string } | null;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  pending_drafts: number;
  responded: number;
  response_rate: number;
  auto_responded: number;
}

interface ReviewSettings {
  auto_respond: boolean;
  auto_enabled_at?: string;
  auto_disabled_at?: string;
  tone_preferences?: string;
}

export default function ReviewsPanel({ listingId }: { listingId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [settings, setSettings] = useState<ReviewSettings>({ auto_respond: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [toneInput, setToneInput] = useState('');
  const [showToneEditor, setShowToneEditor] = useState(false);
  const [message, setMessage] = useState('');

  const loadReviews = useCallback(async () => {
    const res = await fetch(`/api/directory/reviews/manage?listing_id=${listingId}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      setSettings(data.settings || { auto_respond: false });
      setToneInput(data.settings?.tone_preferences || '');
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const reviewAction = async (action: string, reviewId?: string, extra?: Record<string, string>) => {
    setActionLoading(reviewId || action);
    setMessage('');
    const res = await fetch('/api/directory/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, action, review_id: reviewId, ...extra }),
    });
    if (res.ok) {
      await loadReviews();
      setEditingResponse(null);
      setRegeneratingId(null);
      setMessage(action === 'toggle_auto' ? (settings.auto_respond ? 'Autopilot disabled' : 'Autopilot enabled') : 'Action completed');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Action failed');
    }
    setActionLoading(null);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reviews-panel">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Reviews', value: stats.total_reviews, color: 'text-white' },
            { label: 'Avg Rating', value: stats.average_rating > 0 ? `${stats.average_rating}/5` : '--', color: 'text-gold' },
            { label: 'Response Rate', value: `${stats.response_rate}%`, color: 'text-greenline' },
            { label: 'Pending Drafts', value: stats.pending_drafts, color: stats.pending_drafts > 0 ? 'text-orange-400' : 'text-white/30' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className={`block text-xl font-heading font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-heading">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Autopilot Toggle */}
        <button
          onClick={() => reviewAction('toggle_auto')}
          disabled={actionLoading === 'toggle_auto'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-heading transition-all ${
            settings.auto_respond
              ? 'bg-greenline/15 text-greenline border border-greenline/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:border-gold/30'
          }`}
          data-testid="autopilot-toggle"
        >
          <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.auto_respond ? 'bg-greenline' : 'bg-white/20'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.auto_respond ? 'left-4.5 left-[18px]' : 'left-0.5'}`} />
          </div>
          {settings.auto_respond ? 'Autopilot ON' : 'Autopilot OFF'}
        </button>

        {settings.auto_respond && settings.auto_enabled_at && (
          <span className="text-[10px] text-greenline/60 font-body">
            Enabled {new Date(settings.auto_enabled_at).toLocaleDateString()}
          </span>
        )}

        {/* Tone Settings */}
        <button
          onClick={() => setShowToneEditor(!showToneEditor)}
          className="px-3 py-2 rounded-xl text-xs text-white/40 border border-white/10 hover:border-gold/20 transition-all font-body"
        >
          Tone Settings
        </button>
      </div>

      {/* Tone Editor */}
      <AnimatePresence>
        {showToneEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-gold/10 p-4 overflow-hidden"
            style={{ background: 'rgba(201,169,110,0.03)' }}
          >
            <label className="text-xs text-white/40 font-heading uppercase tracking-wider mb-2 block">Response Tone Preferences</label>
            <textarea
              value={toneInput}
              onChange={e => setToneInput(e.target.value)}
              placeholder="e.g., Warm and professional. Use first name. Mention we're a family-owned business since 1985. Always invite them back."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none placeholder-white/25"
            />
            <button
              onClick={() => { reviewAction('update_tone', undefined, { tone_preferences: toneInput }); setShowToneEditor(false); }}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading"
            >
              Save Tone
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message */}
      {message && (
        <div className={`px-3 py-2 rounded-lg text-xs font-body ${message.includes('fail') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-greenline/10 text-greenline border border-greenline/20'}`}>
          {message}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm font-body">No reviews yet. Reviews will appear here when customers leave feedback on your listing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className={`rounded-xl border p-5 transition-all ${
                !review.response && review.ai_draft?.status === 'pending'
                  ? 'border-orange-500/20 bg-orange-500/[0.02]'
                  : 'border-white/10'
              }`}
              style={{ background: review.response ? 'rgba(255,255,255,0.02)' : undefined }}
              data-testid={`review-item-${review.id}`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm font-heading font-bold text-gold">
                    {review.reviewer_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-heading font-semibold text-white block">{review.reviewer_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-3 h-3" fill={s <= review.rating ? '#C9A96E' : 'none'} stroke={s <= review.rating ? '#C9A96E' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-white/20 font-body">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {/* Status indicator */}
                {review.response ? (
                  <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-greenline/10 text-greenline border border-greenline/20">
                    {review.response.method === 'ai_auto' ? 'Auto-responded' : review.response.method === 'ai_approved' ? 'AI Approved' : 'Responded'}
                  </span>
                ) : review.ai_draft?.status === 'pending' ? (
                  <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Draft Ready
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/30">
                    No Response
                  </span>
                )}
              </div>

              {/* Review Text */}
              <p className="text-sm text-white/60 font-body leading-relaxed mb-4">{review.text}</p>

              {/* Published Response */}
              {review.response && (
                <div className="pl-4 border-l-2 border-gold/20 mb-3">
                  <p className="text-[10px] text-gold/50 font-heading uppercase tracking-wider mb-1">Your Response</p>
                  <p className="text-xs text-white/50 font-body leading-relaxed">{review.response.text}</p>
                  <span className="text-[9px] text-white/20 font-body mt-1 block">
                    {new Date(review.response.responded_at).toLocaleDateString()} via {review.response.method === 'ai_auto' ? 'Autopilot' : review.response.method === 'ai_approved' ? 'AI (approved)' : 'Manual'}
                  </span>
                </div>
              )}

              {/* AI Draft (if pending and no response yet) */}
              {!review.response && review.ai_draft?.status === 'pending' && (
                <div className="rounded-lg border border-gold/15 p-4 mb-3" style={{ background: 'rgba(201,169,110,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <span className="text-[10px] text-gold/60 font-heading uppercase tracking-wider">AI Draft Response</span>
                  </div>
                  <p className="text-xs text-white/60 font-body leading-relaxed mb-3">{review.ai_draft.text}</p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => reviewAction('approve_draft', review.id)}
                      disabled={actionLoading === review.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                      data-testid={`approve-draft-${review.id}`}
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      onClick={() => { setEditingResponse(review.id); setEditText(review.ai_draft?.text || ''); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gold border border-gold/30 hover:bg-gold/5 transition-all font-body"
                      data-testid={`edit-draft-${review.id}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setRegeneratingId(review.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 border border-white/10 hover:border-white/20 transition-all font-body"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => reviewAction('reject_draft', review.id)}
                      disabled={actionLoading === review.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/60 border border-red-500/10 hover:border-red-500/20 transition-all font-body"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Response Form */}
              {editingResponse === review.id && (
                <div className="rounded-lg border border-gold/15 p-4 mb-3 space-y-3" style={{ background: 'rgba(201,169,110,0.03)' }}>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none"
                    data-testid={`edit-response-text-${review.id}`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewAction('respond', review.id, { response_text: editText })}
                      disabled={!editText.trim() || actionLoading === review.id}
                      className="px-4 py-2 rounded-lg text-xs font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02] disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                      data-testid={`publish-response-${review.id}`}
                    >
                      Publish Response
                    </button>
                    <button onClick={() => setEditingResponse(null)} className="px-3 py-2 text-xs text-white/40 hover:text-white/60 font-body">Cancel</button>
                  </div>
                </div>
              )}

              {/* Regenerate with Feedback */}
              {regeneratingId === review.id && (
                <div className="rounded-lg border border-white/10 p-4 mb-3 space-y-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <label className="text-xs text-white/40 font-heading uppercase tracking-wider block">Feedback for AI (optional)</label>
                  <input
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="e.g., Make it warmer, mention our new menu, be more apologetic..."
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/25"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { reviewAction('regenerate', review.id, { feedback: feedbackText }); setFeedbackText(''); }}
                      disabled={actionLoading === review.id}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading"
                    >
                      Regenerate Draft
                    </button>
                    <button onClick={() => setRegeneratingId(null)} className="px-3 py-2 text-xs text-white/40 font-body">Cancel</button>
                  </div>
                </div>
              )}

              {/* Write manual response (if no draft and no response) */}
              {!review.response && !review.ai_draft && editingResponse !== review.id && (
                <button
                  onClick={() => { setEditingResponse(review.id); setEditText(''); }}
                  className="text-xs text-gold/50 hover:text-gold transition-colors font-body"
                >
                  Write a response
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
