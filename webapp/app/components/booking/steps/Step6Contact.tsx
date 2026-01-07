'use client';

type Step6ContactProps = {
  onBack: () => void;
  onNext: () => void;
  data: { contactName?: string; email?: string; phone?: string };
  onUpdate: (data: { contactName?: string; email?: string; phone?: string }) => void;
};

export default function Step6Contact({ onBack, onNext, data, onUpdate }: Step6ContactProps) {
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contact Info</h2>
        <p className="text-white/60">How can we reach you?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Contact Name *
          </label>
          <input
            type="text"
            value={data.contactName || ''}
            onChange={(e) => onUpdate({ ...data, contactName: e.target.value })}
            placeholder="Jane Doe"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => onUpdate({ ...data, email: e.target.value })}
            placeholder="jane@company.com"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onUpdate({ ...data, phone: e.target.value })}
            placeholder="(555) 555-5555"
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
          disabled={!data.contactName?.trim() || !data.email || !isValidEmail(data.email)}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
