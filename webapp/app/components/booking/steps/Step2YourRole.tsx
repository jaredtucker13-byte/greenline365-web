'use client';

type Step2YourRoleProps = {
  onBack: () => void;
  onNext: () => void;
  data: { role?: string };
  onUpdate: (data: { role: string }) => void;
};

const roles = [
  { value: 'owner', label: 'Owner / Founder' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin / Assistant' },
  { value: 'marketing', label: 'Marketing / Sales' },
  { value: 'other', label: 'Other' },
];

export default function Step2YourRole({ onBack, onNext, data, onUpdate }: Step2YourRoleProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Role</h2>
        <p className="text-white/60">What best describes your position?</p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onUpdate({ role: role.value })}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              data.role === role.value
                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'
            }`}
          >
            {role.label}
          </button>
        ))}
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
          disabled={!data.role}
          className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
