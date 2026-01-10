'use client';

/**
 * Tactical Multi-Command Center - Main Page
 * GreenLine365 Admin V2
 * 
 * A production-scale command center featuring:
 * - Tactical Dark aesthetic with Neon Green accents
 * - Collapsible Sidebar (icons-only when collapsed)
 * - Hybrid Calendar (Bookings + Content)
 * - Content Forge modal
 * - Local Pulse trend hunter
 * - Analytics widgets
 * 
 * @author GreenLine365
 * @version 2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import TacticalHeader from './components/TacticalHeader';
import HybridCalendar from './components/HybridCalendar';
import ContentForge from './components/ContentForge';
import LocalPulse from './components/LocalPulse';
import WeeklyTrendBatch from './components/WeeklyTrendBatch';
import LiveLocalPulse from './components/LiveLocalPulse';
import AnalyticsWidgets from './components/AnalyticsWidgets';
import DemoController from './components/DemoController';
import type { CalendarEvent, LocalTrend, ActivityItem, TeamMetrics, PipelineStage, BookingTrend } from './lib/types';

// ============================================
// DEMO CONFIG TYPE
// ============================================
interface DemoConfig {
  businessName: string;
  city: string;
  primaryColor: string;
  accentColor: string;
}

const defaultDemoConfig: DemoConfig = {
  businessName: 'GreenLine365',
  city: 'Tampa, FL',
  primaryColor: '#39FF14',
  accentColor: '#0CE293',
};

// ============================================
// CALENDAR EVENTS - Start empty (connect to Supabase)
// ============================================

// Empty initial state - will be populated from Supabase or user actions
const initialEvents: CalendarEvent[] = [];

// Mock trends removed - using live data from LiveLocalPulse and WeeklyTrendBatch components

// Empty initial states for analytics widgets (will connect to real data later)
const emptyActivities: ActivityItem[] = [];

const emptyTeamMetrics: TeamMetrics[] = [
  { label: 'Mon', value: 0, percentage: 0 },
  { label: 'Tue', value: 0, percentage: 0 },
  { label: 'Wed', value: 0, percentage: 0 },
  { label: 'Thu', value: 0, percentage: 0 },
  { label: 'Fri', value: 0, percentage: 0 },
];

const emptyPipeline: PipelineStage[] = [
  { name: 'Content Creation', count: 0, percentage: 0 },
  { name: 'Review Stage', count: 0, percentage: 0 },
  { name: 'Launch Pipeline', count: 0, percentage: 0 },
];

const emptyBookingTrends: BookingTrend[] = [
  { day: 'Mon', current: 0, previous: 0 },
  { day: 'Tue', current: 0, previous: 0 },
  { day: 'Wed', current: 0, previous: 0 },
  { day: 'Thu', current: 0, previous: 0 },
  { day: 'Fri', current: 0, previous: 0 },
  { day: 'Sat', current: 0, previous: 0 },
  { day: 'Sun', current: 0, previous: 0 },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function TacticalCommandCenter() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showContentForge, setShowContentForge] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Demo Controller State
  const [showDemoController, setShowDemoController] = useState(false);
  const [demoConfig, setDemoConfig] = useState<DemoConfig>(defaultDemoConfig);

  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setDate(prev.getDate() - 7);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + 1);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowContentForge(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // Could open a detail modal here
    console.log('Event clicked:', event);
  };

  const handleScheduleContent = (content: any) => {
    console.log('Content scheduled:', content);
    // Add to events
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: content.title,
      start: content.scheduledDate,
      type: 'content',
      status: 'scheduled',
      color: '#0CE293',
      glowColor: 'rgba(12,226,147,0.4)',
      data: content,
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleForgeFromTrend = (trend: LocalTrend) => {
    setSelectedDate(new Date(trend.event_date));
    setShowContentForge(true);
  };

  // Calculate pending count
  const pendingCount = useMemo(() => 
    events.filter(e => e.type === 'review' || e.status === 'pending').length,
    [events]
  );

  return (
    <div className="min-h-screen bg-[#121212] flex">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        activeItem="schedule"
        onNewBooking={() => console.log('New booking')}
        onNewContent={() => {
          setSelectedDate(new Date());
          setShowContentForge(true);
        }}
        pendingCount={pendingCount}
        onDemoControllerToggle={() => setShowDemoController(true)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <TacticalHeader
          title="COMMAND CENTER"
          subtitle="BOOKING & CONTENT CALENDAR"
          onToday={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
          viewMode={viewMode}
          onViewChange={setViewMode}
        />

        {/* Main Grid */}
        <main className="p-6 space-y-6">
          {/* Top Row: Calendar + Real-Time Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar - 2/3 width */}
            <div className="lg:col-span-2">
              <HybridCalendar
                currentDate={currentDate}
                events={events}
                viewMode={viewMode}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
              />
            </div>

            {/* Live Local Pulse - 1/3 width */}
            <div>
              <LiveLocalPulse />
            </div>
          </div>

          {/* Weekly Trends Section */}
          <div className="grid grid-cols-1">
            <WeeklyTrendBatch />
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-[#1A1A1A] rounded-xl border border-[#39FF14]/20 flex items-center gap-4 hover:border-[#39FF14]/40 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center">
                <span className="text-2xl">📞</span>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Make Phone Call</p>
                <p className="text-xs text-gray-400">Quick dial contacts</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(12, 226, 147, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-[#1A1A1A] rounded-xl border border-[#0CE293]/20 flex items-center gap-4 hover:border-[#0CE293]/40 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0CE293]/10 border border-[#0CE293]/30 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Analytics Dashboard</p>
                <p className="text-xs text-gray-400">ROI +25% • View Details</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255, 200, 0, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-[#1A1A1A] rounded-xl border border-[#FFC800]/20 flex items-center gap-4 hover:border-[#FFC800]/40 transition relative"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFC800]/10 border border-[#FFC800]/30 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Review Suggested Posts</p>
                <p className="text-xs text-gray-400">{pendingCount} posts ready for review</p>
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-[#FFC800] rounded-full text-black text-xs font-bold flex items-center justify-center">{pendingCount}</span>
              )}
            </motion.button>
          </div>

          {/* Analytics Widgets Row */}
          <AnalyticsWidgets
            activities={emptyActivities}
            teamMetrics={emptyTeamMetrics}
            pipeline={emptyPipeline}
            bookingTrends={emptyBookingTrends}
          />
        </main>
      </div>

      {/* Content Forge Modal */}
      <ContentForge
        isOpen={showContentForge}
        onClose={() => setShowContentForge(false)}
        selectedDate={selectedDate}
        onSchedule={handleScheduleContent}
      />

      {/* Demo Controller Modal - Hidden, activated by triple-click on version */}
      <DemoController
        isOpen={showDemoController}
        onClose={() => setShowDemoController(false)}
        currentConfig={demoConfig}
        onConfigChange={setDemoConfig}
      />

      {/* Dynamic CSS Variables for Demo Mode */}
      <style jsx global>{`
        :root {
          --demo-primary: ${demoConfig.primaryColor};
          --demo-accent: ${demoConfig.accentColor};
        }
      `}</style>
    </div>
  );
}
