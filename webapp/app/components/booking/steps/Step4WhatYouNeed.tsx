'use client';

type Step4WhatYouNeedProps = {
  onBack: () => void;
  onNext: () => void;
  data: { needs?: string[]; notes?: string };
  onUpdate: (data: { needs?: string[]; notes?: string }) => void;
};

const needsOptions = [
  { value: 'new-site', label: 'New website' },
  { value: 'redesign', label: 'Redesign / refresh' },
  { value: 'seo', label: 'SEO help' },
  { value: 'ads', label: 'Google/Facebook ads' },
  { value: 'automation', label: 'Automation / AI' },
  { value: 'booking-system', label: 'Booking system' },
  { value: 'consulting', label: 'Consulting' },
];

export default function Step4WhatYouNeed({ onBack, onNext, data, onUpdate }: Step4WhatYouNeedProps) {
  const toggleNeed = (value: string) => {
    const currentNeeds = data.needs || [];
    const newNeeds = currentNeeds.includes(value)
      ? currentNeeds.filter((n) => n !== value)
      : [...currentNeeds, value];
    onUpdate({ ...data, needs: newNeeds });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What Do You Need?</h2>
        <p className="text-white/60">Select all that apply.</p>
      </div>

      <div className="grid gap-3">
        {needsOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleNeed(option.value)}
            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
              data.needs?.includes(option.value)
                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'
            }`}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
              data.needs?.includes(option.value)
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-white/30'
            }`}>
              {data.needs?.includes(option.value) && (
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={data.notes || ''}
          onChange={(e) => onUpdate({ ...data, notes: e.target.value })}
          rows={3}
          placeholder="Tell us what you're trying to accomplish..."
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!data.needs || data.needs.length === 0}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
