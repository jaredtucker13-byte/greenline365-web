'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';

interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  business_name?: string;
  preferred_datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  needs?: string[];
  created_at: string;
  source?: string;
}

interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    booking: Booking;
  };
}

export default function CommandCenter() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const bookingsArray = bookingData || [];
      setBookings(bookingsArray);

      // Format for calendar
      const formattedEvents: CalendarEvent[] = bookingsArray.map((b: Booking) => ({
        title: b.full_name || 'Booking',
        start: b.preferred_datetime,
        backgroundColor: getStatusColor(b.status),
        borderColor: getStatusColor(b.status),
        extendedProps: { booking: b },
      }));
      setCalendarEvents(formattedEvents);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        total: bookingsArray.length,
        pending: bookingsArray.filter((b: Booking) => b.status === 'pending').length,
        confirmed: bookingsArray.filter((b: Booking) => b.status === 'confirmed').length,
        thisWeek: bookingsArray.filter((b: Booking) => new Date(b.created_at) > weekAgo).length,
      });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#10b981';
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
      completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return styles[status] || styles.pending;
  }

  async function updateBookingStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchData();
      setSelectedBooking(null);
    }
  }

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as Booking;
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a08] p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vision Command Center</h1>
        <p className="text-gray-400">Manage bookings, leads, and track your business performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Pending</div>
          <div className="text-3xl font-bold text-amber-400">{stats.pending}</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Confirmed</div>
          <div className="text-3xl font-bold text-emerald-400">{stats.confirmed}</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">This Week</div>
          <div className="text-3xl font-bold text-white">{stats.thisWeek}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Calendar */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Bookings Calendar</h2>
          <div className="fc-dark-theme">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              height="500px"
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
            />
          </div>
        </div>

        {/* RIGHT: Recent Bookings Table */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Bookings</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No bookings yet</p>
              <p className="text-sm mt-1">Bookings will appear here once created.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium text-sm">Name</th>
                    <th className="pb-3 text-gray-400 font-medium text-sm">Status</th>
                    <th className="pb-3 text-gray-400 font-medium text-sm">Date</th>
                    <th className="pb-3 text-gray-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="py-4">
                        <div className="text-white font-medium">{booking.full_name}</div>
                        <div className="text-gray-500 text-sm">{booking.email}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-400">
                        {new Date(booking.preferred_datetime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Booking Details</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium">{selectedBooking.full_name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{selectedBooking.email}</span>
              </div>
              {selectedBooking.phone && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white">{selectedBooking.phone}</span>
                </div>
              )}
              {selectedBooking.business_name && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                  <span className="text-gray-400">Business</span>
                  <span className="text-white">{selectedBooking.business_name}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <span className="text-gray-400">Scheduled</span>
                <span className="text-white">
                  {new Date(selectedBooking.preferred_datetime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <span className="text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(selectedBooking.status)}`}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>
              {selectedBooking.needs && selectedBooking.needs.length > 0 && (
                <div className="pb-3 border-b border-gray-700">
                  <span className="text-gray-400 block mb-2">Services Requested</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.needs.map((need) => (
                      <span key={need} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                        {need.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <span className="text-gray-400">Source</span>
                <span className="text-gray-300 text-sm">{selectedBooking.source || 'Direct'}</span>
              </div>
            </div>

            {/* Status Actions */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-3">Update Status</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  className="flex-1 py-2 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition text-sm font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition text-sm font-medium"
                >
                  Complete
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for FullCalendar dark theme */}
      <style jsx global>{`
        .fc-dark-theme {
          --fc-border-color: #374151;
          --fc-button-bg-color: #1f2937;
          --fc-button-border-color: #374151;
          --fc-button-hover-bg-color: #374151;
          --fc-button-hover-border-color: #4b5563;
          --fc-button-active-bg-color: #10b981;
          --fc-button-active-border-color: #10b981;
          --fc-today-bg-color: rgba(16, 185, 129, 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #111827;
          --fc-list-event-hover-bg-color: #1f2937;
        }
        
        .fc-dark-theme .fc {
          color: #e5e7eb;
        }
        
        .fc-dark-theme .fc-toolbar-title {
          color: white;
          font-size: 1.25rem;
        }
        
        .fc-dark-theme .fc-col-header-cell-cushion {
          color: #9ca3af;
        }
        
        .fc-dark-theme .fc-daygrid-day-number {
          color: #d1d5db;
        }
        
        .fc-dark-theme .fc-daygrid-day.fc-day-today {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
        
        .fc-dark-theme .fc-button {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #e5e7eb !important;
        }
        
        .fc-dark-theme .fc-button:hover {
          background-color: #374151 !important;
        }
        
        .fc-dark-theme .fc-button-active {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
          color: black !important;
        }
        
        .fc-dark-theme .fc-scrollgrid {
          border-color: #374151 !important;
        }
        
        .fc-dark-theme .fc-scrollgrid td,
        .fc-dark-theme .fc-scrollgrid th {
          border-color: #374151 !important;
        }
        
        .fc-dark-theme .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
        }
        
        .fc-dark-theme .fc-daygrid-day-frame:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
