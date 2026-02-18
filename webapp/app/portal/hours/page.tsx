'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '17:00', closed: false };

export default function HoursPage() {
  const { activeListing } = usePortalContext();
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!activeListing) return;

    fetch(`/api/portal/listing/hours?listing_id=${activeListing.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.hours) {
          const loaded: Record<string, DayHours> = {};
          for (const day of DAYS) {
            loaded[day.key] = data.hours[day.key]
              ? {
                  open: data.hours[day.key].open || '09:00',
                  close: data.hours[day.key].close || '17:00',
                  closed: data.hours[day.key].closed || false,
                }
              : { ...DEFAULT_HOURS };
          }
          setHours(loaded);
        } else {
          const defaults: Record<string, DayHours> = {};
          for (const day of DAYS) defaults[day.key] = { ...DEFAULT_HOURS };
          setHours(defaults);
        }
      });
  }, [activeListing]);

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  const updateDay = (key: string, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const copyToAll = () => {
    const first = hours[DAYS[0].key];
    if (!first) return;
    const copied: Record<string, DayHours> = {};
    for (const day of DAYS) {
      copied[day.key] = { ...first };
    }
    setHours(copied);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/portal/listing/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: activeListing.id,
        hours,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'Business hours saved.' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Hours</h1>
          <p className="mt-1 text-sm text-white/50">
            Set your operating hours for each day of the week.
          </p>
        </div>
        <button
          onClick={copyToAll}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Copy Monday to all
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {DAYS.map((day) => {
          const dayHours = hours[day.key] || DEFAULT_HOURS;
          return (
            <div
              key={day.key}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"
            >
              <span className="w-24 text-sm font-medium text-white">{day.label}</span>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!dayHours.closed}
                  onChange={(e) => updateDay(day.key, 'closed', !e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-white/5 text-neon-green-500 focus:ring-neon-green-500"
                />
                <span className="text-xs text-white/50">
                  {dayHours.closed ? 'Closed' : 'Open'}
                </span>
              </label>

              {!dayHours.closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => updateDay(day.key, 'open', e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-neon-green-500 focus:outline-none"
                  />
                  <span className="text-xs text-white/40">to</span>
                  <input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => updateDay(day.key, 'close', e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-neon-green-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-neon-green-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neon-green-400 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>
    </div>
  );
}
