'use client';

/**
 * Booking Command Center
 *
 * Real-time table that listens to Supabase REALTIME changes on the bookings table.
 * Displays: Status (Pending/Confirmed), Customer Name, Service Type, Staff Assigned.
 * Wrapped in BookingSuiteGate for feature gating.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import { BookingSuiteGate } from './BookingSuiteGate';
import {
  Calendar, Clock, User, Briefcase, Phone, Mail,
  CheckCircle, AlertCircle, XCircle, RefreshCw,
  Zap, Activity, ChevronDown, ChevronUp, Search,
  Bell, Filter,
} from 'lucide-react';

interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  start_time: string;
  end_time?: string;
  preferred_datetime: string;
  duration_minutes: number;
  service_id?: string;
  booked_by: string;
  confirmation_number?: string;
  notes?: string;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
  // Joined service data
  service_name?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending' },
  confirmed: { color: 'text-[#39FF14]', bg: 'bg-[#39FF14]/10 border-[#39FF14]/30', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Confirmed' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Completed' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Cancelled' },
  no_show: { color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'No Show' },
};

function BookingCommandCenterInner() {
  const { activeBusiness } = useBusiness();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'start_time' | 'created_at' | 'status'>('start_time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [newBookingFlash, setNewBookingFlash] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch initial bookings
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings?slots=false');
      const data = await response.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('[BookingCommandCenter] Fetch error:', err);
    }
    setIsLoading(false);
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    fetchBookings();

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('[Realtime] Booking change:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new as Booking;
            setBookings(prev => [newBooking, ...prev]);
            // Flash the new booking row
            setNewBookingFlash(newBooking.id);
            setTimeout(() => setNewBookingFlash(null), 3000);
          }

          if (payload.eventType === 'UPDATE') {
            setBookings(prev =>
              prev.map(b => b.id === (payload.new as Booking).id ? { ...b, ...payload.new } : b)
            );
          }

          if (payload.eventType === 'DELETE') {
            setBookings(prev => prev.filter(b => b.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  // Filter & sort bookings
  const filteredBookings = bookings
    .filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.full_name?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          b.confirmation_number?.toLowerCase().includes(q) ||
          b.phone?.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    today: bookings.filter(b => {
      const d = new Date(b.start_time || b.preferred_datetime);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-[#0CE293]/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#39FF14]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Booking Command Center</h2>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className={`inline-flex items-center gap-1 ${isLive ? 'text-[#39FF14]' : 'text-amber-400'}`}>
                <Activity className={`w-3 h-3 ${isLive ? 'animate-pulse' : ''}`} />
                {isLive ? 'LIVE' : 'Connecting...'}
              </span>
              <span>|</span>
              <span>{stats.total} total bookings</span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today" value={stats.today} color="#3B82F6" icon={<Calendar className="w-4 h-4" />} />
        <StatCard label="Pending" value={stats.pending} color="#F59E0B" icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Confirmed" value={stats.confirmed} color="#39FF14" icon={<CheckCircle className="w-4 h-4" />} />
        <StatCard label="Total" value={stats.total} color="#8B5CF6" icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, email, or confirmation #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#39FF14]/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <FilterButton label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterButton label="Pending" active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
          <FilterButton label="Confirmed" active={statusFilter === 'confirmed'} onClick={() => setStatusFilter('confirmed')} />
          <FilterButton label="Cancelled" active={statusFilter === 'cancelled'} onClick={() => setStatusFilter('cancelled')} />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr_0.6fr] gap-4 px-6 py-3 bg-white/5 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider">
          <button className="flex items-center gap-1 hover:text-white/80 text-left" onClick={() => toggleSort('status')}>
            Status <SortIcon field="status" />
          </button>
          <span>Customer</span>
          <span>Service</span>
          <button className="flex items-center gap-1 hover:text-white/80 text-left" onClick={() => toggleSort('start_time')}>
            Date/Time <SortIcon field="start_time" />
          </button>
          <span>Source</span>
        </div>

        {/* Table Body */}
        <div className="max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              <span>No bookings found</span>
            </div>
          ) : (
            <AnimatePresence>
              {filteredBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  isNew={newBookingFlash === booking.id}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, isNew }: { booking: Booking; isNew: boolean }) {
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const dt = booking.start_time || booking.preferred_datetime;
  const formattedDate = dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
  const formattedTime = dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

  const sourceLabels: Record<string, string> = {
    ai: 'AI', retell: 'Retell', calcom: 'Cal.com', self: 'Self', human: 'Manual', unknown: '—',
  };

  return (
    <motion.div
      initial={isNew ? { backgroundColor: 'rgba(57, 255, 20, 0.15)' } : {}}
      animate={{ backgroundColor: 'rgba(57, 255, 20, 0)' }}
      transition={{ duration: 3 }}
      className={`grid grid-cols-[1fr_1.2fr_1fr_0.8fr_0.6fr] gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
        isNew ? 'ring-1 ring-[#39FF14]/30' : ''
      }`}
    >
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Customer */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">{booking.full_name}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {booking.email && (
            <span className="text-xs text-white/40 flex items-center gap-1 truncate">
              <Mail className="w-3 h-3" />{booking.email}
            </span>
          )}
        </div>
      </div>

      {/* Service */}
      <div className="flex items-center gap-1.5">
        <Briefcase className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <span className="text-sm text-white/70 truncate">
          {booking.service_name || booking.notes || `${booking.duration_minutes || 30} min`}
        </span>
      </div>

      {/* Date/Time */}
      <div className="flex flex-col justify-center">
        <span className="text-sm text-white/80">{formattedDate}</span>
        <span className="text-xs text-white/40">{formattedTime}</span>
      </div>

      {/* Source */}
      <div className="flex items-center">
        <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
          {sourceLabels[booking.booked_by || booking.source || 'unknown'] || booking.booked_by || '—'}
        </span>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50">{label}</span>
        <span style={{ color }} className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
        active ? 'bg-[#39FF14]/20 text-[#39FF14] font-medium' : 'text-white/50 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  );
}

// Exported component wrapped in BookingSuiteGate
export default function BookingCommandCenter() {
  return (
    <BookingSuiteGate>
      <BookingCommandCenterInner />
    </BookingSuiteGate>
  );
}
