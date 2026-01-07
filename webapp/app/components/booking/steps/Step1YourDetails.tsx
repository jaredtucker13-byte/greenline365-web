'use client';

type Step1YourDetailsProps = {
  onNext: () => void;
  data: { fullName?: string; company?: string };
  onUpdate: (data: { fullName?: string; company?: string }) => void;
};

export default function Step1YourDetails({ onNext, data, onUpdate }: Step1YourDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Details</h2>
        <p className="text-white/60">Let&apos;s start with the basics.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={data.fullName || ''}
            onChange={(e) => onUpdate({ ...data, fullName: e.target.value })}
            placeholder="Jane Doe"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Company (optional)
          </label>
          <input
            type="text"
            value={data.company || ''}
            onChange={(e) => onUpdate({ ...data, company: e.target.value })}
            placeholder="GreenLine365"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!data.fullName?.trim()}
        className="w-full py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
