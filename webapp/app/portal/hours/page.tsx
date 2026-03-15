'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface SpecialHours {
  id: string;
  date: string;
  label: string;
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '17:00', closed: false };

const COMMON_HOLIDAYS = [
  { label: "New Year's Day", date: '01-01' },
  { label: 'Memorial Day', date: '' },
  { label: 'Independence Day', date: '07-04' },
  { label: 'Labor Day', date: '' },
  { label: 'Thanksgiving', date: '' },
  { label: 'Christmas Eve', date: '12-24' },
  { label: 'Christmas Day', date: '12-25' },
  { label: "New Year's Eve", date: '12-31' },
];

function generateId() {
  return crypto.randomUUID();
}

export default function HoursPage() {
  const { activeListing } = usePortalContext();
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
  const [showSpecial, setShowSpecial] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
        if (data?.special_hours) {
          setSpecialHours(data.special_hours);
          if (data.special_hours.length > 0) setShowSpecial(true);
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
    setHasChanges(true);
  };

  const copyToAll = () => {
    const first = hours[DAYS[0].key];
    if (!first) return;
    const copied: Record<string, DayHours> = {};
    for (const day of DAYS) {
      copied[day.key] = { ...first };
    }
    setHours(copied);
    setHasChanges(true);
  };

  const copyWeekdaysToWeekend = () => {
    const friday = hours['fri'];
    if (!friday) return;
    setHours((prev) => ({
      ...prev,
      sat: { ...friday },
      sun: { ...friday },
    }));
    setHasChanges(true);
  };

  const addSpecialHours = (label?: string, date?: string) => {
    const currentYear = new Date().getFullYear();
    setSpecialHours((prev) => [
      ...prev,
      {
        id: generateId(),
        date: date ? `${currentYear}-${date}` : '',
        label: label || '',
        open: '09:00',
        close: '17:00',
        closed: true,
      },
    ]);
    setShowSpecial(true);
    setShowQuickAdd(false);
    setHasChanges(true);
  };

  const updateSpecialHours = (id: string, field: keyof SpecialHours, value: string | boolean) => {
    setSpecialHours((prev) =>
      prev.map((sh) => (sh.id === id ? { ...sh, [field]: value } : sh))
    );
    setHasChanges(true);
  };

  const removeSpecialHours = (id: string) => {
    setSpecialHours((prev) => prev.filter((sh) => sh.id !== id));
    setHasChanges(true);
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
        special_hours: specialHours,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'Business hours saved successfully.' });
      setHasChanges(false);
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save.' });
    }
  };

  // Check for potential issues
  const warnings: string[] = [];
  for (const day of DAYS) {
    const d = hours[day.key];
    if (d && !d.closed && d.open >= d.close) {
      warnings.push(`${day.label}: closing time must be after opening time`);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Hours</h1>
          <p className="mt-1 text-sm text-white/50">
            Set your regular operating hours and special holiday hours.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToAll}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Copy Mon to all
          </button>
          <button
            onClick={copyWeekdaysToWeekend}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Copy Fri to weekend
          </button>
        </div>
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

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-400">{w}</p>
          ))}
        </div>
      )}

      {/* Regular Hours */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-1">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/70">Regular Hours</h2>
        </div>
        <div className="divide-y divide-white/5">
          {DAYS.map((day) => {
            const dayHours = hours[day.key] || DEFAULT_HOURS;
            const isWeekend = day.key === 'sat' || day.key === 'sun';
            return (
              <div
                key={day.key}
                className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center ${
                  isWeekend ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="w-28 text-sm font-medium text-white">{day.label}</span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => updateDay(day.key, 'closed', !dayHours.closed)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      !dayHours.closed ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                        !dayHours.closed ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${dayHours.closed ? 'text-red-400/60' : 'text-green-400/60'}`}>
                    {dayHours.closed ? 'Closed' : 'Open'}
                  </span>
                </label>

                {!dayHours.closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => updateDay(day.key, 'open', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none [color-scheme:dark]"
                    />
                    <span className="text-xs text-white/40">to</span>
                    <input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => updateDay(day.key, 'close', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special / Holiday Hours */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white/70">Special & Holiday Hours</h2>
            {specialHours.length > 0 && (
              <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold text-gold-500">
                {specialHours.length}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Quick Add Holiday
              </button>
              {showQuickAdd && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-white/10 bg-os-dark-900 p-2 shadow-xl">
                  {COMMON_HOLIDAYS.map((holiday) => (
                    <button
                      key={holiday.label}
                      onClick={() => addSpecialHours(holiday.label, holiday.date)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      {holiday.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => addSpecialHours()}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-500 hover:bg-gold-500/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Custom
            </button>
          </div>
        </div>

        {specialHours.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <svg className="mx-auto h-8 w-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-xs text-white/30">No special hours set. Add holidays or seasonal hours.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 p-1">
            {specialHours.map((sh) => (
              <div
                key={sh.id}
                className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex gap-2 sm:w-64">
                  <input
                    type="text"
                    value={sh.label}
                    onChange={(e) => updateSpecialHours(sh.id, 'label', e.target.value)}
                    placeholder="Holiday name"
                    className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={sh.date}
                    onChange={(e) => updateSpecialHours(sh.id, 'date', e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => updateSpecialHours(sh.id, 'closed', !sh.closed)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      !sh.closed ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                        !sh.closed ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${sh.closed ? 'text-red-400/60' : 'text-green-400/60'}`}>
                    {sh.closed ? 'Closed' : 'Open'}
                  </span>
                </label>

                {!sh.closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={sh.open}
                      onChange={(e) => updateSpecialHours(sh.id, 'open', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none [color-scheme:dark]"
                    />
                    <span className="text-xs text-white/40">to</span>
                    <input
                      type="time"
                      value={sh.close}
                      onChange={(e) => updateSpecialHours(sh.id, 'close', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                )}

                <button
                  onClick={() => removeSpecialHours(sh.id)}
                  className="ml-auto text-white/20 hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        {hasChanges && (
          <p className="text-xs text-gold-500/70">You have unsaved changes</p>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>
    </div>
  );
}
