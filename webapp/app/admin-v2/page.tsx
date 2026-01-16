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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import TacticalHeader from './components/TacticalHeader';
import HybridCalendar from './components/HybridCalendar';
import ContentForge from './components/ContentForge';
import LocalPulse from './components/LocalPulse';
import WeeklyTrendBatch from './components/WeeklyTrendBatch';
import LiveLocalPulse from './components/LiveLocalPulse';
import AnalyticsWidgets from './components/AnalyticsWidgets';
import DemoController from './components/DemoController';
import DraftsPanel from './components/DraftsPanel';
import OnboardingBanner from './components/OnboardingBanner';
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
  const router = useRouter();
  
  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/admin-v2');
      }
    };
    checkAuth();
  }, [router]);
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showContentForge, setShowContentForge] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Content Forge initial data (for pre-filling from trends)
  const [forgeInitialTitle, setForgeInitialTitle] = useState<string | undefined>();
  const [forgeInitialContext, setForgeInitialContext] = useState<string | undefined>();
  
  // Demo Controller State
  const [showDemoController, setShowDemoController] = useState(false);
  const [demoConfig, setDemoConfig] = useState<DemoConfig>(defaultDemoConfig);

  // Preview Mode - See what customers will see
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    setForgeInitialTitle(trend.title);
    setForgeInitialContext(trend.suggested_action || trend.description);
    setShowContentForge(true);
  };

  // Handler for Weekly Trend Batch
  const handleForgeFromWeeklyTrend = (trend: { title: string; description: string; suggested_action: string }) => {
    setForgeInitialTitle(trend.title);
    setForgeInitialContext(trend.suggested_action || trend.description);
    setShowContentForge(true);
  };

  // Reset initial data when Content Forge closes
  const handleCloseContentForge = () => {
    setShowContentForge(false);
    setForgeInitialTitle(undefined);
    setForgeInitialContext(undefined);
  };

  // Calculate pending count
  const pendingCount = useMemo(() => 
    events.filter(e => e.type === 'review' || e.status === 'pending').length,
    [events]
  );

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2127&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm text-white text-center py-2 px-4 flex items-center justify-center gap-4">
          <span className="font-medium">👁️ PREVIEW MODE - Viewing as Customer</span>
          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
          >
            Exit Preview
          </button>
        </div>
      )}

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
        isPreviewMode={isPreviewMode}
        onPreviewModeToggle={() => setIsPreviewMode(!isPreviewMode)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 relative z-10">
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
        <main className="p-8 space-y-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WeeklyTrendBatch onCreateContent={handleForgeFromWeeklyTrend} />
            </div>
            {/* Drafts Panel */}
            <div>
              <DraftsPanel userId="demo-user" />
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 backdrop-blur-2xl rounded-2xl flex items-center gap-5 transition-all duration-300"
              style={{ background: 'var(--theme-bg-glass)', border: '1px solid var(--theme-glass-border)', boxShadow: '0 8px 32px 0 var(--theme-shadow)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--theme-success) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-success) 30%, transparent)' }}>
                <span className="text-2xl">📞</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-lg" style={{ color: 'var(--theme-text-primary)' }}>Make Phone Call</p>
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Quick dial contacts</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 backdrop-blur-2xl rounded-2xl flex items-center gap-5 transition-all duration-300"
              style={{ background: 'var(--theme-bg-glass)', border: '1px solid var(--theme-glass-border)', boxShadow: '0 8px 32px 0 var(--theme-shadow)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--theme-info) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-info) 30%, transparent)' }}>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-lg" style={{ color: 'var(--theme-text-primary)' }}>Analytics Dashboard</p>
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>ROI +25% • View Details</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 backdrop-blur-2xl rounded-2xl flex items-center gap-5 transition-all duration-300 relative"
              style={{ background: 'var(--theme-bg-glass)', border: '1px solid var(--theme-glass-border)', boxShadow: '0 8px 32px 0 var(--theme-shadow)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--theme-warning) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-warning) 30%, transparent)' }}>
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-lg" style={{ color: 'var(--theme-text-primary)' }}>Review Suggested Posts</p>
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{pendingCount} posts ready for review</p>
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-4 right-4 w-6 h-6 rounded-full text-black text-xs font-bold flex items-center justify-center" style={{ background: 'var(--theme-warning)', boxShadow: '0 0 15px var(--theme-glow)' }}>{pendingCount}</span>
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
        onClose={handleCloseContentForge}
        selectedDate={selectedDate}
        onSchedule={handleScheduleContent}
        initialTitle={forgeInitialTitle}
        initialContext={forgeInitialContext}
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
