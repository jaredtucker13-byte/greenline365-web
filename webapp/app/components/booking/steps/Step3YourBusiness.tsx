'use client';

type Step3YourBusinessProps = {
  onBack: () => void;
  onNext: () => void;
  data: { businessName?: string; website?: string; industry?: string };
  onUpdate: (data: { businessName?: string; website?: string; industry?: string }) => void;
};

export default function Step3YourBusiness({ onBack, onNext, data, onUpdate }: Step3YourBusinessProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Business</h2>
        <p className="text-white/60">Tell us about your business.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={data.businessName || ''}
            onChange={(e) => onUpdate({ ...data, businessName: e.target.value })}
            placeholder="Acme Plumbing"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Website (optional)
          </label>
          <input
            type="url"
            value={data.website || ''}
            onChange={(e) => onUpdate({ ...data, website: e.target.value })}
            placeholder="https://example.com"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Industry (optional)
          </label>
          <input
            type="text"
            value={data.industry || ''}
            onChange={(e) => onUpdate({ ...data, industry: e.target.value })}
            placeholder="Home services"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
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
          disabled={!data.businessName?.trim()}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
