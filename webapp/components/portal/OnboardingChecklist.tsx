'use client';

import Link from 'next/link';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href: string;
  proOnly?: boolean;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  isPro: boolean;
}

export default function OnboardingChecklist({ items, isPro }: OnboardingChecklistProps) {
  const visibleItems = items.filter((item) => !item.proOnly || isPro);
  const completedCount = visibleItems.filter((i) => i.completed).length;
  const totalCount = visibleItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (completedCount === totalCount) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Getting Started</h3>
        <span className="text-xs text-white/50">
          {completedCount}/{totalCount} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-neon-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.completed ? '#' : item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.completed
                  ? 'text-white/40'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  item.completed
                    ? 'border-neon-green-500 bg-neon-green-500'
                    : 'border-white/30'
                }`}
              >
                {item.completed && (
                  <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={item.completed ? 'line-through' : ''}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
