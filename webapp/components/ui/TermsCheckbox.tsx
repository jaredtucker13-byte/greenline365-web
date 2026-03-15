'use client';

import Link from 'next/link';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
}

export default function TermsCheckbox({ checked, onChange, error }: TermsCheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
            aria-required="true"
          />
          <div
            className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
              checked
                ? 'bg-gold-500 border-gold-500'
                : error
                ? 'bg-white/5 border-red-500/50'
                : 'bg-white/5 border-white/20 group-hover:border-white/40'
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-white/60">
          I agree to the{' '}
          <Link href="/terms" className="text-gold-400 hover:text-gold-300 underline" target="_blank">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-gold-400 hover:text-gold-300 underline" target="_blank">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && !checked && (
        <p className="text-red-400 text-xs ml-8">You must agree to continue</p>
      )}
    </div>
  );
}
