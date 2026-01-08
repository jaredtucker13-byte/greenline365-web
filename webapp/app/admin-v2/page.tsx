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
// MOCK DATA (Replace with Supabase in production)
// ============================================

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Client Strategy Call',
    start: new Date().toISOString(),
    type: 'booking',
    status: 'confirmed',
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.4)',
    data: {} as any,
  },
  {
    id: '2',
    title: 'Instagram Campaign',
    start: new Date(Date.now() + 86400000).toISOString(),
    type: 'content',
    status: 'scheduled',
    color: '#0CE293',
    glowColor: 'rgba(12,226,147,0.4)',
    data: {} as any,
  },
  {
    id: '3',
    title: 'Product Launch Review',
    start: new Date(Date.now() + 86400000 * 2).toISOString(),
    type: 'review',
    status: 'pending',
    color: '#FFC800',
    glowColor: 'rgba(255,200,0,0.4)',
    data: {} as any,
  },
  {
    id: '4',
    title: 'Website Launch',
    start: new Date(Date.now() + 86400000 * 3).toISOString(),
    type: 'launch',
    status: 'scheduled',
    color: '#8A2BE2',
    glowColor: 'rgba(138,43,226,0.4)',
    data: {} as any,
  },
  {
    id: '5',
    title: 'Demo Call - TechCorp',
    start: new Date(Date.now() + 86400000 * 5).toISOString(),
    type: 'booking',
    status: 'confirmed',
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.4)',
    data: {} as any,
  },
];

const mockTrends: LocalTrend[] = [
  {
    id: '1',
    title: 'Hillsborough High Big Game Friday!',
    description: 'Major high school football rivalry game. Expect increased local traffic and community engagement.',
    location: 'Tampa, FL',
    event_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    expected_traffic: 'high',
    category: 'sports',
    suggested_action: 'Should I Forge a "Big Game" BOGO Muffin special for this Friday?',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Tampa Bay Lightning Home Game',
    description: 'NHL game at Amalie Arena. Great opportunity for sports-themed promotions.',
    location: 'Tampa, FL',
    event_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    expected_traffic: 'medium',
    category: 'sports',
    suggested_action: 'Create a "Lightning Strikes" themed social post with game day specials?',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Gasparilla Festival Week',
    description: 'Annual Tampa pirate festival brings massive crowds to the city.',
    location: 'Tampa, FL',
    event_date: new Date(Date.now() + 86400000 * 14).toISOString(),
    expected_traffic: 'high',
    category: 'community',
    suggested_action: 'Launch a pirate-themed content series for Gasparilla week?',
    created_at: new Date().toISOString(),
  },
];

const mockActivities: ActivityItem[] = [
  { id: '1', action: 'New booking confirmed', user: 'GreenLine365', timestamp: '2 minutes ago', metric: 37 },
  { id: '2', action: 'Content published to IG', user: 'System', timestamp: '15 minutes ago' },
  { id: '3', action: 'Lead captured via chat', user: 'AI Concierge', timestamp: '32 minutes ago' },
  { id: '4', action: 'Campaign scheduled', user: 'Marketing', timestamp: '1 hour ago' },
  { id: '5', action: 'Review completed', user: 'Admin', timestamp: '2 hours ago', metric: 5 },
];

const mockTeamMetrics: TeamMetrics[] = [
  { label: 'Mon', value: 45, percentage: 75 },
  { label: 'Tue', value: 62, percentage: 88 },
  { label: 'Wed', value: 38, percentage: 62 },
  { label: 'Thu', value: 71, percentage: 95 },
  { label: 'Fri', value: 55, percentage: 78 },
];

const mockPipeline: PipelineStage[] = [
  { name: 'Content Creation', count: 12, percentage: 78 },
  { name: 'Review Stage', count: 5, percentage: 45 },
  { name: 'Launch Pipeline', count: 8, percentage: 62 },
];

const mockBookingTrends: BookingTrend[] = [
  { day: 'Mon', current: 12, previous: 8 },
  { day: 'Tue', current: 15, previous: 10 },
  { day: 'Wed', current: 18, previous: 14 },
  { day: 'Thu', current: 22, previous: 16 },
  { day: 'Fri', current: 28, previous: 20 },
  { day: 'Sat', current: 35, previous: 25 },
  { day: 'Sun', current: 20, previous: 15 },
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
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
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
    <div className="min-h-screen bg-[#121212]">
      {/* Sidebar */}
      <TacticalSidebar
        activeItem="schedule"
        onNewBooking={() => console.log('New booking')}
        onNewContent={() => {
          setSelectedDate(new Date());
          setShowContentForge(true);
        }}
        pendingCount={pendingCount}
        onDemoControllerToggle={() => setShowDemoController(true)}
      />

      {/* Main Content */}
      <div className="ml-64">
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
          {/* Top Row: Calendar + Local Pulse */}
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

            {/* Local Pulse - 1/3 width */}
            <div>
              <LocalPulse
                location={demoConfig.city}
                trends={mockTrends}
                onForgeContent={handleForgeFromTrend}
              />
            </div>
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
                <p className="text-xs text-gray-400">3 posts ready for review</p>
              </div>
              <span className="absolute top-3 right-3 w-5 h-5 bg-[#FFC800] rounded-full text-black text-xs font-bold flex items-center justify-center">3</span>
            </motion.button>
          </div>

          {/* Analytics Widgets Row */}
          <AnalyticsWidgets
            activities={mockActivities}
            teamMetrics={mockTeamMetrics}
            pipeline={mockPipeline}
            bookingTrends={mockBookingTrends}
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
