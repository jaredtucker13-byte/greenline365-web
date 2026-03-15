export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'minLength', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export function validatePassword(password: string) {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));
  return {
    isValid: results.every((r) => r.passed),
    results,
  };
}

export function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'Weak' as const, color: 'text-red-400' };

  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

  if (passed <= 1) return { score: passed, label: 'Weak' as const, color: 'text-red-400' };
  if (passed <= 2) return { score: passed, label: 'Fair' as const, color: 'text-orange-400' };
  if (passed <= 3) return { score: passed, label: 'Fair' as const, color: 'text-orange-400' };
  if (passed === 4) return { score: passed, label: 'Good' as const, color: 'text-yellow-400' };
  return { score: passed, label: 'Strong' as const, color: 'text-green-400' };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
