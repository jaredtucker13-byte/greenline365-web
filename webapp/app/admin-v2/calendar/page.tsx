/**
 * Unified Calendar - Multi-functional hub
 * 
 * Shows all event types from multiple sources:
 * - Bookings (blue marker)
 * - Content/Social posts (green marker)
 * - Campaign emails (amber marker)
 * - Blog posts (pink marker)
 * - Newsletters (purple marker)
 * 
 * Rules:
 * - Past days: review only (can click to see what was posted)
 * - Today/Future: can create new events
 * - Full CRUD until event is actually sent
 * - Color-coded markers per event type
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ============ TYPES ============

interface CalendarEvent {
  id: string;
  source: string;
  event_type: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  color: string;
  icon: string;
  status: string;
  metadata: any;
  editable: boolean;
}

// ============ CONSTANTS ============

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  booking: { label: 'Booking', color: '#3B82F6', dotColor: 'bg-blue-500' },
  content: { label: 'Content', color: '#10B981', dotColor: 'bg-emerald-500' },
  campaign_email: { label: 'Campaign', color: '#F59E0B', dotColor: 'bg-amber-500' },
  newsletter: { label: 'Newsletter', color: '#8B5CF6', dotColor: 'bg-purple-500' },
  blog: { label: 'Blog', color: '#EC4899', dotColor: 'bg-pink-500' },
  custom: { label: 'Custom', color: '#6366F1', dotColor: 'bg-indigo-500' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ViewMode = 'month' | 'week';

// ============ MAIN ============

export default function UnifiedCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<string[]>([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: Date, endDate: Date;
      if (viewMode === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      } else {
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      }

      const typeParam = filters.length > 0 ? `&type=${filters[0]}` : '';
      const res = await fetch(`/api/calendar/unified?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${typeParam}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, filters]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start_time);
      return eDate.toDateString() === date.toDateString();
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    if (!isPast(date)) {
      setCreateDate(date);
    }
  };

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const generateWeekDays = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const deleteEvent = async (event: CalendarEvent) => {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/calendar/unified?id=${event.id}&source=${event.source}`, { method: 'DELETE' });
    setSelectedEvent(null);
    fetchEvents();
  };

  const toggleFilter = (type: string) => {
    setFilters(prev => prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="unified-calendar">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Calendar
                </h1>
                <p className="text-sm text-white/40">Bookings, content, campaigns - all in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                {(['month', 'week'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 text-sm capitalize ${viewMode === mode ? 'bg-[#39FF14] text-black font-medium' : 'text-white/60 hover:text-white'}`}>
                    {mode}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm">Today</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation + Filter Legend */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={navigatePrev} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-white" data-testid="calendar-title">
              {viewMode === 'month' ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Week of ${currentDate.toLocaleDateString()}`}
            </h2>
            <button onClick={navigateNext} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Color Legend / Filters */}
          <div className="flex items-center gap-2" data-testid="event-type-filters">
            {Object.entries(EVENT_TYPE_CONFIG).map(([type, cfg]) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  filters.length === 0 || filters.includes(type)
                    ? 'opacity-100 border-white/20'
                    : 'opacity-30 border-transparent'
                }`}
                style={{ background: `${cfg.color}15`, color: cfg.color }}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" data-testid="calendar-grid">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {DAYS.map(day => (
              <div key={day} className="px-4 py-3 text-center text-white/50 text-sm font-medium">{day}</div>
            ))}
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7">
              {generateMonthDays().map((date, idx) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const past = date ? isPast(date) : false;
                const todayClass = date && isToday(date);
                const selected = date && selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={idx}
                    onClick={() => date && handleDayClick(date)}
                    className={`min-h-[110px] p-2 border-b border-r border-white/5 cursor-pointer transition ${
                      !date ? 'bg-white/[0.01]' : past ? 'bg-white/[0.01] hover:bg-white/[0.03]' : 'hover:bg-[#39FF14]/5'
                    } ${todayClass ? 'bg-[#39FF14]/[0.04] ring-1 ring-inset ring-[#39FF14]/20' : ''}
                    ${selected ? 'ring-2 ring-inset ring-[#39FF14]' : ''}`}
                    data-testid={date ? `cal-day-${date.getDate()}` : `cal-empty-${idx}`}
                  >
                    {date && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${todayClass ? 'text-[#39FF14] font-bold' : past ? 'text-white/30' : 'text-white/60'}`}>
                            {date.getDate()}
                          </span>
                          {!past && dayEvents.length === 0 && (
                            <span className="text-white/10 text-xs opacity-0 group-hover:opacity-100">+</span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer hover:opacity-80 transition"
                              style={{ background: `${event.color}20`, color: event.color }}
                              data-testid={`cal-event-${event.id}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: event.color }} />
                              <span className="truncate">{event.title.replace(/^(Booking|Campaign): /, '')}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-white/30 pl-1">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7">
              {generateWeekDays().map(date => {
                const dayEvents = getEventsForDate(date);
                const past = isPast(date);
                const todayClass = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => handleDayClick(date)}
                    className={`min-h-[400px] p-3 border-r border-white/5 cursor-pointer transition ${
                      todayClass ? 'bg-[#39FF14]/[0.04]' : past ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <div className={`text-center mb-3 ${todayClass ? 'text-[#39FF14]' : 'text-white/60'}`}>
                      <div className="text-xs">{DAYS[date.getDay()]}</div>
                      <div className={`text-lg font-bold ${todayClass ? 'text-[#39FF14]' : past ? 'text-white/30' : 'text-white'}`}>{date.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          className="p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 transition border"
                          style={{ background: `${event.color}10`, borderColor: `${event.color}30`, color: event.color }}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: event.color }} />
                            <span className="font-medium truncate">{event.title.replace(/^(Booking|Campaign): /, '')}</span>
                          </div>
                          <p className="text-white/30 truncate">{new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Panel */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02]" data-testid="selected-date-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  <p className="text-white/40 text-sm">{getEventsForDate(selectedDate).length} events {isPast(selectedDate) ? '(past - read only)' : ''}</p>
                </div>
                <div className="flex gap-2">
                  {!isPast(selectedDate) && (
                    <button onClick={() => { setCreateDate(selectedDate); setShowCreate(true); }} className="px-4 py-2 rounded-lg bg-[#39FF14] text-black text-sm font-semibold hover:bg-[#32E012] transition" data-testid="create-event-btn">
                      + New Event
                    </button>
                  )}
                  <button onClick={() => setSelectedDate(null)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-white/25 text-center py-4">
                  {isPast(selectedDate) ? 'No events on this day.' : 'No events yet. Click "New Event" to add one.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition hover:bg-white/[0.03] border border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: event.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{event.title}</p>
                          <p className="text-xs text-white/40">
                            {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {' '}&middot;{' '}
                            {EVENT_TYPE_CONFIG[event.event_type]?.label || event.event_type}
                            {' '}&middot;{' '}
                            <span className={event.status === 'draft' ? 'text-gray-400' : event.status === 'sent' ? 'text-emerald-400' : 'text-white/40'}>{event.status}</span>
                          </p>
                        </div>
                      </div>
                      {event.editable && !isPast(selectedDate) && (
                        <button onClick={(e) => { e.stopPropagation(); deleteEvent(event); }} className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Event Detail Drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailDrawer
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={() => deleteEvent(selectedEvent)}
            onRefresh={fetchEvents}
          />
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreate && createDate && (
          <CreateEventModal
            date={createDate}
            onClose={() => setShowCreate(false)}
            onSuccess={() => { setShowCreate(false); fetchEvents(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ EVENT DETAIL DRAWER ============

function EventDetailDrawer({ event, onClose, onDelete, onRefresh }: {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.custom;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col" data-testid="event-detail-drawer">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ background: typeConfig.color }} />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${typeConfig.color}20`, color: typeConfig.color }}>{typeConfig.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'draft' ? 'bg-gray-500/20 text-gray-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{event.status}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{event.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white/40 text-xs mb-1">Date & Time</p>
            <p className="text-white">{new Date(event.start_time).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>

          {event.description && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white/40 text-xs mb-1">Description</p>
              <p className="text-white/80 text-sm">{event.description}</p>
            </div>
          )}

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white/40 text-xs mb-2">Details</p>
              {Object.entries(event.metadata).map(([k, v]) => (
                v && (
                  <div key={k} className="flex justify-between text-sm py-1">
                    <span className="text-white/40 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="text-white">{String(v)}</span>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Links */}
          {event.event_type === 'campaign_email' && (
            <Link href={`/admin-v2/campaigns`} className="block p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/10 transition text-center">
              Open in Campaign Manager →
            </Link>
          )}
          {event.source === 'scheduled_content' && (
            <Link href="/admin-v2/content-forge" className="block p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/10 transition text-center">
              Open in Content Forge →
            </Link>
          )}
        </div>

        {/* Actions */}
        {event.editable && (
          <div className="p-6 border-t border-white/10">
            <button onClick={onDelete} className="w-full py-3 rounded-lg bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition text-sm" data-testid="delete-event-btn">
              Delete Event
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ============ CREATE EVENT MODAL ============

function CreateEventModal({ date, onClose, onSuccess }: {
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'content',
    content_type: 'photo',
    time: '09:00',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    if (!form.title.trim()) { setError('Title required'); return; }
    setLoading(true);
    setError('');
    try {
      const scheduledDate = new Date(date);
      const [h, m] = form.time.split(':');
      scheduledDate.setHours(parseInt(h), parseInt(m), 0, 0);

      const res = await fetch('/api/calendar/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          event_type: form.event_type,
          content_type: form.content_type,
          scheduled_date: scheduledDate.toISOString(),
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6" data-testid="create-event-modal">
          <h2 className="text-lg font-bold text-white mb-1">New Event</h2>
          <p className="text-sm text-white/40 mb-4">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Event Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['content', 'blog', 'newsletter'].map(type => (
                  <button key={type} onClick={() => setForm({ ...form, event_type: type, content_type: type === 'blog' ? 'blog' : type === 'newsletter' ? 'newsletter' : 'photo' })} className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${form.event_type === type ? 'border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]' : 'border-white/10 text-white/40 hover:text-white'}`}>
                    {EVENT_TYPE_CONFIG[type]?.label || type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekly Newsletter" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none placeholder:text-white/20" data-testid="event-title-input" />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none" />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Add details..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none resize-none placeholder:text-white/20" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60 text-sm">Cancel</button>
              <button onClick={create} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[#39FF14] text-black text-sm font-semibold disabled:opacity-50" data-testid="create-event-submit">
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
