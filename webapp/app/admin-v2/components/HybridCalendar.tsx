'use client';

/**
 * HybridCalendar Component - Glassmorphism Edition
 * GreenLine365 Admin V2 - Nature Glass Design
 * 
 * Premium calendar with frosted glass effects
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import type { CalendarEvent } from '../lib/types';

interface HybridCalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  viewMode: 'month' | 'week';
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HybridCalendar({ 
  currentDate, 
  events, 
  viewMode, 
  onEventClick, 
  onDateClick 
}: HybridCalendarProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = firstDay.getDay();
      const totalDays = lastDay.getDate();
      
      const days: Date[] = [];
      
      for (let i = startPadding - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }
      
      for (let i = 1; i <= totalDays; i++) {
        days.push(new Date(year, month, i));
      }
      
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push(new Date(year, month + 1, i));
      }
      
      return days;
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    }
  }, [currentDate, viewMode]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'booking':
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-l-emerald-400',
          text: 'text-emerald-300',
          dot: 'bg-emerald-400',
          icon: '📅',
        };
      case 'content':
        return {
          bg: 'bg-sky-500/20',
          border: 'border-l-sky-400',
          text: 'text-sky-300',
          dot: 'bg-sky-400',
          icon: '📝',
        };
      case 'review':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-l-amber-400',
          text: 'text-amber-300',
          dot: 'bg-amber-400',
          icon: '⏳',
        };
      case 'launch':
        return {
          bg: 'bg-violet-500/20',
          border: 'border-l-violet-400',
          text: 'text-violet-300',
          dot: 'bg-violet-400',
          icon: '🚀',
        };
      default:
        return {
          bg: 'bg-white/10',
          border: 'border-l-white/40',
          text: 'text-white/80',
          dot: 'bg-white/60',
          icon: '📌',
        };
    }
  };

  return (
    <div className="backdrop-blur-2xl rounded-3xl border overflow-hidden shadow-[0_8px_32px_0_var(--theme-shadow)]" style={{ background: 'var(--theme-bg-glass)', borderColor: 'var(--theme-glass-border)' }}>
      {/* Calendar Header */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--theme-glass-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long' })}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {currentDate.getFullYear()}
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6">
            {[
              { color: 'var(--theme-success)', label: 'Booking' },
              { color: 'var(--theme-info)', label: 'Content' },
              { color: 'var(--theme-warning)', label: 'Review' },
              { color: '#8B5CF6', label: 'Launch' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--theme-glass-border)', background: 'var(--theme-bg-secondary)' }}>
        {DAYS.map((day) => (
          <div key={day} className="py-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'min-h-[400px]' : ''}`}>
        {calendarDays.map((date, idx) => {
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);
          const currentMonth = isCurrentMonth(date);
          const isHovered = hoveredDate === idx;

          return (
            <motion.div
              key={idx}
              onHoverStart={() => setHoveredDate(idx)}
              onHoverEnd={() => setHoveredDate(null)}
              onClick={() => onDateClick(date)}
              className={`
                relative min-h-[120px] p-3 
                border-r border-b border-white/[0.08] 
                cursor-pointer transition-all duration-300
                ${today ? 'bg-[#84A98C]/10' : ''}
                ${!currentMonth ? 'opacity-30' : ''}
                ${isHovered && currentMonth ? 'bg-white/[0.06]' : ''}
              `}
            >
              {/* Date Number */}
              <div className="flex justify-end mb-2">
                <span className={`
                  text-sm font-medium transition-all duration-300
                  ${today 
                    ? 'w-8 h-8 rounded-full bg-[#84A98C] text-white flex items-center justify-center shadow-[0_0_20px_rgba(132,169,140,0.4)]'
                    : currentMonth 
                      ? 'text-white/70' 
                      : 'text-white/30'
                  }
                `}>
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1.5">
                <AnimatePresence>
                  {dayEvents.slice(0, 3).map((event) => {
                    const styles = getEventStyles(event.type);
                    const isEventHovered = hoveredEvent === event.id;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        whileHover={{ scale: 1.02, x: 2 }}
                        onHoverStart={() => setHoveredEvent(event.id)}
                        onHoverEnd={() => setHoveredEvent(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`
                          px-2 py-1.5 rounded-lg text-xs truncate 
                          backdrop-blur-md border-l-2 cursor-pointer
                          transition-all duration-200
                          ${styles.bg} ${styles.border} ${styles.text}
                          ${isEventHovered ? 'bg-white/20 shadow-lg' : ''}
                        `}
                      >
                        {event.title}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-white/40 text-center font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>

              {/* Hover indicator */}
              {isHovered && currentMonth && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-2 right-2"
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs">+</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
