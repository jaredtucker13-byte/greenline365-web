'use client';

import { useState, useEffect } from 'react';

interface BookingWidgetProps {
  source?: string; // For tracking which company/widget
  primaryColor?: string;
  onBookingComplete?: (data: BookingData) => void;
}

interface BookingData {
  selectedDate: string;
  selectedTime: string;
  name: string;
  email: string;
  phone?: string;
}

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

export default function BookingWidget({ 
  source = 'greenline365', 
  primaryColor = '#10b981',
  onBookingComplete 
}: BookingWidgetProps) {
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Generate dates only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    setAvailableDates(dates);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save to Supabase via API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
          preferred_datetime: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
          source,
          status: 'pending'
        })
      });

      if (!response.ok) throw new Error('Failed to create booking');

      setIsComplete(true);
      onBookingComplete?.({
        selectedDate,
        selectedTime,
        name,
        email,
        phone
      });
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 mb-6">
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600">We&apos;ll send confirmation to {email}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {['date', 'time', 'details', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${
              ['date', 'time', 'details', 'confirm'].indexOf(step) >= i
                ? ''
                : 'bg-gray-200'
            }`}
            style={['date', 'time', 'details', 'confirm'].indexOf(step) >= i ? { backgroundColor: primaryColor } : {}}
          />
        ))}
      </div>

      {step === 'date' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select a Date
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {availableDates.map((date) => {
              const { dayName, dayNum, month } = formatDate(date);
              
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setStep('time');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedDate === date
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs text-gray-500">{dayName}</div>
                  <div className="text-lg font-bold text-gray-900">{dayNum}</div>
                  <div className="text-xs text-gray-500">{month}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'time' && (
        <div>
          <button
            type="button"
            onClick={() => setStep('date')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </button>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select a Time
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  setSelectedTime(time);
                  setStep('details');
                }}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedTime === time
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('time')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {selectedTime} on {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </button>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep('confirm')}
            disabled={!name.trim() || !email.trim()}
            className="w-full py-3 rounded-lg text-white font-semibold transition disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('details')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to details
          </button>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Confirm Your Booking</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900 font-medium">
                  {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="text-gray-900 font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-900 font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 font-medium">{email}</span>
              </div>
              {phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900 font-medium">{phone}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
