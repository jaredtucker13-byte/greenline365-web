/**
 * Calendar/Booking Management Page
 * Full calendar view with booking management
 * Hub-and-Spoke: This is the "Spoke" - dedicated full page
 * 
 * TIER REQUIREMENT: Tier 3 (Enterprise)
 */

'use client';

import { FeatureGate } from '../components/FeatureGate';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  service_type?: string;
  service_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmation_number?: string;
  notes?: string;
  booked_by: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  price_type: string;
  color: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booking?: Booking;
}

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  confirmed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);

  // Fetch bookings for current view
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate date range based on view
      let startDate: Date, endDate: Date;
      
      if (viewMode === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else if (viewMode === 'week') {
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
      }

      const response = await fetch(
        `/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (response.ok) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, [fetchBookings]);

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter(b => {
      const bookingDate = new Date(b.start_time);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];

    // Add padding for days before the 1st
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Generate week days
  const generateWeekDays = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Generate time slots for day view
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status }),
      });
      
      if (response.ok) {
        fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: status as Booking['status'] });
        }
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const isToday = (date: Date | null) => date ? date.toDateString() === new Date().toDateString() : false;
  const isSelected = (date: Date | null) => date && selectedDate ? selectedDate.toDateString() === date.toDateString() : false;

  return (
    <FeatureGate feature="calendar">
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin-v2" className="text-white/50 hover:text-white transition">
                  ← Command Center
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📅</span> Calendar
                </h1>
              </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 text-sm capitalize transition ${
                      viewMode === mode
                        ? 'bg-[#39FF14] text-black font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowNewBooking(true)}
                className="px-4 py-2 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] transition"
              >
                + New Booking
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={navigatePrev}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-white">
              {viewMode === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
              {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition text-sm"
            >
              Today
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold">{bookings.filter(b => b.status === 'confirmed').length}</span>
              <span className="text-emerald-400/70 text-sm ml-2">Confirmed</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <span className="text-yellow-400 font-bold">{bookings.filter(b => b.status === 'pending').length}</span>
              <span className="text-yellow-400/70 text-sm ml-2">Pending</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {/* Month View */}
          {viewMode === 'month' && (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-white/10">
                {DAYS.map((day) => (
                  <div key={day} className="px-4 py-3 text-center text-white/60 text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7">
                {generateMonthDays().map((date, index) => {
                  const dayBookings = date ? getBookingsForDate(date) : [];
                  
                  return (
                    <div
                      key={index}
                      onClick={() => date && setSelectedDate(date)}
                      className={`min-h-[120px] p-2 border-b border-r border-white/5 cursor-pointer transition ${
                        date ? 'hover:bg-white/5' : 'bg-white/2'
                      } ${isToday(date!) ? 'bg-[#39FF14]/5' : ''} ${isSelected(date!) ? 'ring-2 ring-[#39FF14] ring-inset' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm mb-2 ${isToday(date) ? 'text-[#39FF14] font-bold' : 'text-white/60'}`}>
                            {date.getDate()}
                          </div>
                          
                          {/* Booking indicators */}
                          <div className="space-y-1">
                            {dayBookings.slice(0, 3).map((booking) => (
                              <div
                                key={booking.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                                className={`px-2 py-1 rounded text-xs truncate ${STATUS_COLORS[booking.status]?.bg} ${STATUS_COLORS[booking.status]?.text}`}
                              >
                                {new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {booking.full_name}
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-white/40 px-2">
                                +{dayBookings.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="flex">
              {/* Time column */}
              <div className="w-20 border-r border-white/10 flex-shrink-0">
                <div className="h-12 border-b border-white/10" /> {/* Header spacer */}
                {generateTimeSlots().filter((_, i) => i % 2 === 0).map((time) => (
                  <div key={time} className="h-16 px-2 py-1 text-xs text-white/40 border-b border-white/5">
                    {time}
                  </div>
                ))}
              </div>
              
              {/* Days columns */}
              <div className="flex-1 grid grid-cols-7">
                {generateWeekDays().map((date) => {
                  const dayBookings = getBookingsForDate(date);
                  
                  return (
                    <div key={date.toISOString()} className="border-r border-white/5">
                      {/* Day header */}
                      <div className={`h-12 px-2 py-2 border-b border-white/10 text-center ${isToday(date) ? 'bg-[#39FF14]/10' : ''}`}>
                        <div className="text-xs text-white/40">{DAYS[date.getDay()]}</div>
                        <div className={`text-sm font-medium ${isToday(date) ? 'text-[#39FF14]' : 'text-white'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                      
                      {/* Time slots */}
                      <div className="relative">
                        {generateTimeSlots().filter((_, i) => i % 2 === 0).map((time) => (
                          <div key={time} className="h-16 border-b border-white/5" />
                        ))}
                        
                        {/* Booking overlays */}
                        {dayBookings.map((booking) => {
                          const startTime = new Date(booking.start_time);
                          const hours = startTime.getHours();
                          const minutes = startTime.getMinutes();
                          const top = (hours * 64) + (minutes / 60 * 64); // 64px per hour
                          const height = (booking.duration_minutes / 60) * 64;
                          
                          return (
                            <div
                              key={booking.id}
                              onClick={() => setSelectedBooking(booking)}
                              style={{ top: `${top}px`, height: `${height}px` }}
                              className={`absolute left-1 right-1 rounded px-2 py-1 cursor-pointer overflow-hidden ${STATUS_COLORS[booking.status]?.bg} ${STATUS_COLORS[booking.status]?.border} border`}
                            >
                              <div className={`text-xs font-medium truncate ${STATUS_COLORS[booking.status]?.text}`}>
                                {booking.full_name}
                              </div>
                              <div className="text-xs text-white/40 truncate">
                                {booking.service_type}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="flex">
              {/* Time column */}
              <div className="w-20 border-r border-white/10 flex-shrink-0">
                {generateTimeSlots().map((time) => (
                  <div key={time} className="h-12 px-2 py-1 text-xs text-white/40 border-b border-white/5">
                    {time}
                  </div>
                ))}
              </div>
              
              {/* Day content */}
              <div className="flex-1 relative">
                {generateTimeSlots().map((time) => (
                  <div key={time} className="h-12 border-b border-white/5 hover:bg-white/5 cursor-pointer" />
                ))}
                
                {/* Booking overlays */}
                {getBookingsForDate(currentDate).map((booking) => {
                  const startTime = new Date(booking.start_time);
                  const hours = startTime.getHours();
                  const minutes = startTime.getMinutes();
                  const top = (hours * 48) + (minutes / 60 * 48); // 48px per hour (12px per 15min slot)
                  const height = (booking.duration_minutes / 60) * 48;
                  
                  return (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                      className={`absolute left-2 right-2 rounded-lg p-3 cursor-pointer ${STATUS_COLORS[booking.status]?.bg} ${STATUS_COLORS[booking.status]?.border} border`}
                    >
                      <div className={`font-medium ${STATUS_COLORS[booking.status]?.text}`}>
                        {booking.full_name}
                      </div>
                      <div className="text-white/60 text-sm">
                        {new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {booking.service_type || 'Appointment'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Panel */}
        {selectedDate && viewMode === 'month' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {getBookingsForDate(selectedDate).length === 0 ? (
              <p className="text-white/40">No bookings for this day.</p>
            ) : (
              <div className="space-y-3">
                {getBookingsForDate(selectedDate).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={`p-4 rounded-xl cursor-pointer transition hover:scale-[1.02] ${STATUS_COLORS[booking.status]?.bg} ${STATUS_COLORS[booking.status]?.border} border`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${STATUS_COLORS[booking.status]?.text}`}>
                          {booking.full_name}
                        </div>
                        <div className="text-white/60 text-sm">
                          {new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {booking.service_type || 'Appointment'} • {booking.duration_minutes} min
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs capitalize ${STATUS_COLORS[booking.status]?.bg} ${STATUS_COLORS[booking.status]?.text}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Booking Detail Drawer */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedBooking(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedBooking.full_name}</h2>
                    <p className="text-white/50">
                      {new Date(selectedBooking.start_time).toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    ✕
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 ${STATUS_COLORS[selectedBooking.status]?.bg} ${STATUS_COLORS[selectedBooking.status]?.text}`}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </div>

                {/* Details */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-white/50 text-sm mb-1">Time</div>
                    <div className="text-white font-medium">
                      {new Date(selectedBooking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' '}({selectedBooking.duration_minutes} minutes)
                    </div>
                  </div>
                  
                  {selectedBooking.service_type && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-white/50 text-sm mb-1">Service</div>
                      <div className="text-white font-medium">{selectedBooking.service_type}</div>
                    </div>
                  )}
                  
                  {selectedBooking.email && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-white/50 text-sm mb-1">Email</div>
                      <a href={`mailto:${selectedBooking.email}`} className="text-[#39FF14] hover:underline">
                        {selectedBooking.email}
                      </a>
                    </div>
                  )}
                  
                  {selectedBooking.phone && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-white/50 text-sm mb-1">Phone</div>
                      <a href={`tel:${selectedBooking.phone}`} className="text-[#39FF14] hover:underline">
                        {selectedBooking.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedBooking.confirmation_number && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-white/50 text-sm mb-1">Confirmation #</div>
                      <div className="text-white font-mono">{selectedBooking.confirmation_number}</div>
                    </div>
                  )}
                  
                  {selectedBooking.notes && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-white/50 text-sm mb-1">Notes</div>
                      <div className="text-white">{selectedBooking.notes}</div>
                    </div>
                  )}
                  
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-white/50 text-sm mb-1">Booked By</div>
                    <div className="text-white capitalize">{selectedBooking.booked_by || 'AI'}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="text-white/50 text-sm mb-2">Update Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBooking.status !== 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        className="py-2 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                      >
                        Confirm
                      </button>
                    )}
                    {selectedBooking.status !== 'completed' && (
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                        className="py-2 px-4 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                      >
                        Complete
                      </button>
                    )}
                    {selectedBooking.status !== 'cancelled' && (
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="py-2 px-4 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Booking Modal (placeholder) */}
      <AnimatePresence>
        {showNewBooking && (
          <NewBookingModal
            services={services}
            onClose={() => setShowNewBooking(false)}
            onSuccess={() => {
              setShowNewBooking(false);
              fetchBookings();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// New Booking Modal Component
function NewBookingModal({ 
  services, 
  onClose, 
  onSuccess 
}: { 
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    service_id: '',
    date: '',
    time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const selectedService = services.find(s => s.id === formData.service_id);
      const startTime = new Date(`${formData.date}T${formData.time}`);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_time: startTime.toISOString(),
          duration_minutes: selectedService?.duration_minutes || 30,
          service_type: selectedService?.name,
          booked_by: 'human',
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6">New Booking</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Service *</label>
              <select
                required
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
              >
                <option value="">Select a service...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Time *</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] disabled:opacity-50 transition"
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
