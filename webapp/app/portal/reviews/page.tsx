'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';

interface ReviewResponse {
  text: string;
  responded_at: string;
  method: 'manual' | 'ai_approved' | 'ai_auto';
}

interface AiDraft {
  text: string;
  generated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  created_at: string;
  response: ReviewResponse | null;
  ai_draft: AiDraft | null;
}

interface ReviewSettings {
  auto_respond?: boolean;
  tone_preferences?: string;
}

export default function PortalReviewsPage() {
  const { activeListing } = usePortalContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<ReviewSettings>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [editingTone, setEditingTone] = useState(false);
  const [toneText, setToneText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = async () => {
    if (!activeListing) return;

    setLoading(true);
    try {
      // Fetch reviews with AI drafts (owner endpoint)
      const res = await fetch(`/api/portal/reviews?listing_id=${activeListing.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setSettings(data.settings || {});
        setToneText(data.settings?.tone_preferences || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListing]);

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  const handleAction = async (action: string, reviewId?: string, extra?: Record<string, string>) => {
    setActionLoading(reviewId || action);
    setMessage(null);

    const res = await fetch('/api/directory/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: activeListing.id,
        action,
        review_id: reviewId,
        ...extra,
      }),
    });

    const data = await res.json();
    setActionLoading(null);

    if (res.ok) {
      setMessage({ type: 'success', text: action === 'toggle_auto' ? `Autopilot ${data.settings?.auto_respond ? 'enabled' : 'disabled'}` : 'Response posted.' });
      fetchReviews();
    } else {
      setMessage({ type: 'error', text: data.error || 'Action failed.' });
    }
  };

  const handleManualResponse = (reviewId: string) => {
    const text = responseText[reviewId]?.trim();
    if (!text) return;
    handleAction('respond', reviewId, { response_text: text });
    setResponseText((prev) => ({ ...prev, [reviewId]: '' }));
  };

  const handleToneSave = () => {
    handleAction('update_tone', undefined, { tone_preferences: toneText });
    setEditingTone(false);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-gold-500' : 'text-white/20'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const pendingCount = reviews.filter((r) => !r.response && r.ai_draft?.status === 'pending').length;
  const unansweredCount = reviews.filter((r) => !r.response).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage customer reviews and respond to feedback.
        </p>
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

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-white">{reviews.length}</p>
          <p className="text-xs text-white/50">Total Reviews</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-gold-500">{pendingCount}</p>
          <p className="text-xs text-white/50">AI Drafts Ready</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-white">{unansweredCount}</p>
          <p className="text-xs text-white/50">Need Response</p>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Autopilot</h3>
            <p className="text-xs text-white/50">
              When enabled, AI will auto-post responses to new reviews.
            </p>
          </div>
          <button
            onClick={() => handleAction('toggle_auto')}
            disabled={actionLoading === 'toggle_auto'}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              settings.auto_respond ? 'bg-gold-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.auto_respond ? 'translate-x-[22px]' : 'translate-x-0.5'
              } mt-0.5`}
            />
          </button>
        </div>

        {/* Tone preferences */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-white/70">Response Tone</h4>
            {!editingTone && (
              <button
                onClick={() => setEditingTone(true)}
                className="text-xs text-gold-500 hover:text-gold-400"
              >
                Edit
              </button>
            )}
          </div>
          {editingTone ? (
            <div className="mt-2">
              <textarea
                value={toneText}
                onChange={(e) => setToneText(e.target.value)}
                rows={2}
                placeholder="e.g. Warm and professional, mention our family values, keep it brief"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleToneSave}
                  className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-400"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingTone(false); setToneText(settings.tone_preferences || ''); }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-white/40">
              {settings.tone_preferences || 'No tone preferences set — AI will use a professional default.'}
            </p>
          )}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">No reviews yet</h3>
          <p className="mt-1 text-xs text-white/40">
            Reviews from customers will appear here once they start coming in.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-xl border p-5 ${
                !review.response
                  ? 'border-gold-500/20 bg-gold-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {/* Review header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{review.reviewer_name}</p>
                      <p className="text-xs text-white/40">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">{renderStars(review.rating)}</div>
                </div>
                {!review.response && (
                  <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-medium text-gold-500">
                    Needs response
                  </span>
                )}
              </div>

              {/* Review text */}
              <p className="mt-3 text-sm text-white/80">{review.text}</p>

              {/* Existing response */}
              {review.response && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-xs font-medium text-gold-500">
                      Your response
                      {review.response.method === 'ai_auto' && ' (AI Auto)'}
                      {review.response.method === 'ai_approved' && ' (AI Approved)'}
                    </span>
                    <span className="text-xs text-white/30">
                      {new Date(review.response.responded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{review.response.text}</p>
                </div>
              )}

              {/* AI Draft (pending, not yet responded) */}
              {!review.response && review.ai_draft && review.ai_draft.status === 'pending' && (
                <div className="mt-4 rounded-lg border border-gold-500/20 bg-gold-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs font-medium text-gold-500">AI-generated draft</span>
                  </div>
                  <p className="text-sm text-white/70 mb-3">{review.ai_draft.text}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction('approve_draft', review.id)}
                      disabled={actionLoading === review.id}
                      className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-400 disabled:opacity-50"
                    >
                      Approve & Post
                    </button>
                    <button
                      onClick={() => {
                        setResponseText((prev) => ({ ...prev, [review.id]: review.ai_draft!.text }));
                        handleAction('reject_draft', review.id);
                      }}
                      disabled={actionLoading === review.id}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-50"
                    >
                      Edit & Customize
                    </button>
                    <button
                      onClick={() => handleAction('regenerate', review.id)}
                      disabled={actionLoading === review.id}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}

              {/* Manual response input (when no response exists and no pending draft) */}
              {!review.response && (!review.ai_draft || review.ai_draft.status !== 'pending') && (
                <div className="mt-4">
                  <textarea
                    value={responseText[review.id] || ''}
                    onChange={(e) =>
                      setResponseText((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                    rows={3}
                    placeholder="Write your response..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleManualResponse(review.id)}
                      disabled={!responseText[review.id]?.trim() || actionLoading === review.id}
                      className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-400 disabled:opacity-50"
                    >
                      Post Response
                    </button>
                    <button
                      onClick={() => handleAction('regenerate', review.id)}
                      disabled={actionLoading === review.id}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 disabled:opacity-50"
                    >
                      Generate AI Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
