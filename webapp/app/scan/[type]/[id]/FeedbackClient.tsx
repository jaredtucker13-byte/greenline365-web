'use client';

import { useState, useEffect } from 'react';
import type { PollTemplate, PollQuestion } from '@/lib/poll-templates';

interface ListingInfo {
  id: string;
  business_name: string;
  industry: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          <svg
            width={28}
            height={28}
            fill={s <= (hover || value) ? '#C9A84C' : 'none'}
            stroke={s <= (hover || value) ? '#C9A84C' : '#555'}
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: PollQuestion;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  if (question.type === 'rating') {
    return (
      <div className="space-y-2">
        <label className="text-sm text-white/80 font-medium">
          {question.text}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <StarInput value={typeof value === 'number' ? value : 0} onChange={onChange} />
      </div>
    );
  }

  if (question.type === 'choice' && question.options) {
    return (
      <div className="space-y-2">
        <label className="text-sm text-white/80 font-medium">
          {question.text}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                value === opt
                  ? 'bg-[#C9A84C]/20 border-[#C9A84C]/60 text-[#C9A84C]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // text
  return (
    <div className="space-y-2">
      <label className="text-sm text-white/80 font-medium">
        {question.text}
        {question.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-none"
        placeholder="Your thoughts..."
      />
    </div>
  );
}

export default function FeedbackClient({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<ListingInfo | null>(null);
  const [template, setTemplate] = useState<PollTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch listing info to determine industry
        const listingRes = await fetch(`/api/directory/${listingId}`);
        if (!listingRes.ok) {
          setError('Business not found');
          setLoading(false);
          return;
        }
        const listingData = await listingRes.json();
        setListing({
          id: listingData.id,
          business_name: listingData.business_name,
          industry: listingData.industry,
        });

        // Fetch matching template
        const templateRes = await fetch(`/api/directory/feedback/template?industry=${listingData.industry}`);
        if (templateRes.ok) {
          const tpl = await templateRes.json();
          setTemplate(tpl);
        }
      } catch {
        setError('Failed to load feedback form');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  const handleSubmit = async () => {
    if (!listing || !template) return;

    // Validate required fields
    const missing = template.questions.filter(
      (q) => q.required && !answers[q.id] && answers[q.id] !== 0
    );
    if (missing.length > 0) {
      setError(`Please answer: ${missing.map((q) => q.text).join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    // Compute overall rating from any rating-type questions
    const ratingQuestions = template.questions.filter((q) => q.type === 'rating');
    const ratingValues = ratingQuestions.map((q) => (typeof answers[q.id] === 'number' ? (answers[q.id] as number) : 0)).filter((v) => v > 0);
    const avgRating = ratingValues.length > 0 ? Math.round(ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) : 5;

    // Build comment from text answers
    const commentQuestion = template.questions.find((q) => q.id === 'comment');
    const feedbackText = commentQuestion ? (answers['comment'] as string) || '' : '';

    try {
      const res = await fetch('/api/directory/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          rating: avgRating,
          feedback_text: feedbackText || null,
          feedback_type: template.id,
          categories: answers,
          submitter_name: name || null,
          submitter_email: email || null,
          source: 'qr',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Thank You!</h1>
          <p className="text-white/60 text-sm">
            Your feedback for <span className="text-[#C9A84C]">{listing?.business_name}</span> has been submitted.
          </p>
          <a
            href={`/listing/${listingId}`}
            className="inline-block px-6 py-2 rounded-lg bg-[#C9A96E] text-[#0A0A0A] font-medium text-sm hover:bg-[#E8D5A3] transition-colors"
          >
            View Business
          </a>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Business Not Found</h1>
          <p className="text-white/60 text-sm">{error}</p>
          <a
            href="/directory"
            className="inline-block px-6 py-2 rounded-lg bg-[#C9A96E] text-[#0A0A0A] font-medium text-sm hover:bg-[#E8D5A3] transition-colors"
          >
            Browse Directory
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Share Your Experience</h1>
          {listing && (
            <p className="text-white/50 text-sm">
              How was your visit to <span className="text-[#C9A84C]">{listing.business_name}</span>?
            </p>
          )}
        </div>

        {/* Feedback Form */}
        <div className="rounded-xl border border-[#C9A84C]/20 bg-white/[0.03] p-5 space-y-5">
          {template ? (
            <>
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                {template.name}
              </p>
              {template.questions.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={answers[q.id] ?? ''}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              ))}
            </>
          ) : (
            /* Fallback: simple rating + comment if no template matched */
            <>
              <div className="space-y-2">
                <label className="text-sm text-white/80 font-medium">
                  Overall experience <span className="text-red-400">*</span>
                </label>
                <StarInput
                  value={typeof answers['overall'] === 'number' ? answers['overall'] : 0}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, overall: v }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80 font-medium">Comments</label>
                <textarea
                  value={(answers['comment'] as string) || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, comment: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about your experience..."
                />
              </div>
            </>
          )}

          {/* Name & email */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <p className="text-xs text-white/40">Optional — helps us verify your feedback</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm hover:bg-[#E8D5A3] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>

        <p className="text-center text-[10px] text-white/30">
          Powered by GreenLine365
        </p>
      </div>
    </div>
  );
}
