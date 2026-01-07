'use client';

type Step5TimeProps = {
  onBack: () => void;
  onNext: () => void;
  data: { preferredDateTime?: string; alternateDateTime?: string };
  onUpdate: (data: { preferredDateTime?: string; alternateDateTime?: string }) => void;
};

export default function Step5Time({ onBack, onNext, data, onUpdate }: Step5TimeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Pick a Date & Time</h2>
        <p className="text-white/60">When would you like to meet?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Preferred Date & Time *
          </label>
          <input
            type="datetime-local"
            value={data.preferredDateTime || ''}
            onChange={(e) => onUpdate({ ...data, preferredDateTime: e.target.value })}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Alternate Date & Time (optional)
          </label>
          <input
            type="datetime-local"
            value={data.alternateDateTime || ''}
            onChange={(e) => onUpdate({ ...data, alternateDateTime: e.target.value })}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>
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
          disabled={!data.preferredDateTime}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
