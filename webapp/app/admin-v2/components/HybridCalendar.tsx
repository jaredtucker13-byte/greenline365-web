'use client';

/**
 * HybridCalendar Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Unified calendar view for both Bookings and Social Media Content
 * Color Logic:
 * - Green Glow: Confirmed Booking Slots
 * - Teal Glow: Content Creation/Posting Slots
 * - Gold Glow: Review Stage (needs attention)
 * - Purple Glow: Launch Stage
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
      
      // Previous month padding
      for (let i = startPadding - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }
      
      // Current month
      for (let i = 1; i <= totalDays; i++) {
        days.push(new Date(year, month, i));
      }
      
      // Next month padding
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push(new Date(year, month + 1, i));
      }
      
      return days;
    } else {
      // Week view
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
          bg: 'bg-[#10B981]/20',
          border: 'border-[#10B981]',
          text: 'text-[#10B981]',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
          icon: '📅',
        };
      case 'content':
        return {
          bg: 'bg-[#0CE293]/20',
          border: 'border-[#0CE293]',
          text: 'text-[#0CE293]',
          glow: 'shadow-[0_0_15px_rgba(12,226,147,0.4)]',
          icon: '📝',
        };
      case 'review':
        return {
          bg: 'bg-[#FFC800]/20',
          border: 'border-[#FFC800]',
          text: 'text-[#FFC800]',
          glow: 'shadow-[0_0_15px_rgba(255,200,0,0.4)]',
          icon: '⏳',
        };
      case 'launch':
        return {
          bg: 'bg-[#8A2BE2]/20',
          border: 'border-[#8A2BE2]',
          text: 'text-[#8A2BE2]',
          glow: 'shadow-[0_0_15px_rgba(138,43,226,0.4)]',
          icon: '🚀',
        };
      default:
        return {
          bg: 'bg-gray-700/20',
          border: 'border-gray-600',
          text: 'text-gray-400',
          glow: '',
          icon: '📌',
        };
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[#39FF14]/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-gray-400">Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0CE293]" />
              <span className="text-gray-400">Content</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FFC800]" />
              <span className="text-gray-400">Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#8A2BE2]" />
              <span className="text-gray-400">Launch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-[#39FF14]/10">
        {DAYS.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'min-h-[400px]' : ''}`}>
        {calendarDays.map((date, idx) => {
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);
          const currentMonth = isCurrentMonth(date);

          return (
            <motion.div
              key={idx}
              whileHover={{ backgroundColor: 'rgba(57, 255, 20, 0.05)' }}
              onClick={() => onDateClick(date)}
              className={`min-h-[100px] p-2 border-r border-b border-[#1E262E] cursor-pointer transition-colors ${
                today ? 'bg-[#39FF14]/5' : ''
              } ${!currentMonth ? 'opacity-40' : ''}`}
            >
              {/* Date Number */}
              <div className={`text-sm mb-2 ${
                today 
                  ? 'w-7 h-7 rounded-full bg-[#39FF14] text-black font-bold flex items-center justify-center'
                  : 'text-gray-400'
              }`}>
                {date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                <AnimatePresence>
                  {dayEvents.slice(0, 3).map((event) => {
                    const styles = getEventStyles(event.type);
                    const isHovered = hoveredEvent === event.id;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        onHoverStart={() => setHoveredEvent(event.id)}
                        onHoverEnd={() => setHoveredEvent(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`px-2 py-1 rounded text-xs truncate border cursor-pointer transition-all ${
                          styles.bg
                        } ${styles.border} ${styles.text} ${
                          isHovered ? styles.glow : ''
                        }`}
                      >
                        <span className="mr-1">{styles.icon}</span>
                        {event.title}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
