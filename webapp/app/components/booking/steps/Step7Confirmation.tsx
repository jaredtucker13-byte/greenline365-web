'use client';

import { useState } from 'react';

type Step7ConfirmationProps = {
  onBack: () => void;
  onSubmit: () => Promise<void>;
  data: {
    fullName?: string;
    company?: string;
    role?: string;
    businessName?: string;
    website?: string;
    industry?: string;
    needs?: string[];
    notes?: string;
    preferredDateTime?: string;
    alternateDateTime?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
};

export default function Step7Confirmation({ onBack, onSubmit, data }: Step7ConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-white/60">We&apos;ll send a confirmation email to {data.email}</p>
        </div>
        <p className="text-white/40 text-sm">
          You&apos;ll receive calendar invite details shortly.
        </p>
      </div>
    );
  }

  const formatDateTime = (dt?: string) => {
    if (!dt) return 'Not specified';
    return new Date(dt).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Confirm Your Booking</h2>
        <p className="text-white/60">Please review your details before submitting.</p>
      </div>

      <div className="space-y-4 bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Name</span>
            <span className="text-white">{data.fullName || data.contactName}</span>
          </div>
          {data.company && (
            <div className="flex justify-between">
              <span className="text-white/50">Company</span>
              <span className="text-white">{data.company}</span>
            </div>
          )}
          {data.businessName && (
            <div className="flex justify-between">
              <span className="text-white/50">Business</span>
              <span className="text-white">{data.businessName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-white/50">Email</span>
            <span className="text-white">{data.email}</span>
          </div>
          {data.phone && (
            <div className="flex justify-between">
              <span className="text-white/50">Phone</span>
              <span className="text-white">{data.phone}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="text-white/50">Preferred Time</span>
              <span className="text-white">{formatDateTime(data.preferredDateTime)}</span>
            </div>
          </div>
          {data.alternateDateTime && (
            <div className="flex justify-between">
              <span className="text-white/50">Alternate Time</span>
              <span className="text-white">{formatDateTime(data.alternateDateTime)}</span>
            </div>
          )}
          {data.needs && data.needs.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <span className="text-white/50 block mb-2">Services Needed</span>
              <div className="flex flex-wrap gap-2">
                {data.needs.map((need) => (
                  <span key={need} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                    {need.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
}
