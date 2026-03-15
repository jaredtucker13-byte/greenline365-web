'use client';

import { useMemo } from 'react';
import { validatePassword, getPasswordStrength, PASSWORD_RULES } from '@/lib/auth/password-validation';

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const validation = useMemo(() => validatePassword(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const segmentCount = 4;
  const filledSegments = Math.min(segmentCount, Math.round((strength.score / PASSWORD_RULES.length) * segmentCount));

  const barColor =
    strength.score <= 1 ? 'bg-red-500' :
    strength.score <= 3 ? 'bg-orange-500' :
    strength.score === 4 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className="mt-3 space-y-2" id="password-strength">
      {/* Strength bar */}
      <div className="flex gap-1">
        {Array.from({ length: segmentCount }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < filledSegments ? barColor : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <p className={`text-xs font-medium ${strength.color} transition-colors`} aria-live="polite" role="status">
        {strength.label}
      </p>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {validation.results.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            {rule.passed ? (
              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={rule.passed ? 'text-white/60' : 'text-white/30'}>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
