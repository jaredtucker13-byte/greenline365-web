'use client';

import { useState } from 'react';
import MultiStepBookingForm from './components/MultiStepBookingForm';
import BookingWidget from './components/BookingWidget';

export default function HomePage() {
  const [showFullForm, setShowFullForm] = useState(false);
  const [showWidget, setShowWidget] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-300">Now accepting early access signups</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="text-white">Your Daily</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              AI Planning Partner
            </span>
          </h1>
          
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop guessing, start growing. GreenLine365 is your AI-assisted planning 
            and accountability partner that helps you dominate your market.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setShowFullForm(true)}
              className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
            >
              Schedule Your Demo
            </button>
            <button
              onClick={() => setShowWidget(true)}
              className="px-8 py-4 border-2 border-emerald-500/50 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/10 transition"
            >
              Quick Book
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose GreenLine365?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Insights</h3>
              <p className="text-white/60">Get intelligent recommendations based on your business goals and market trends.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Scheduling</h3>
              <p className="text-white/60">Seamlessly integrate with your calendar. Book demos, meetings, and follow-ups effortlessly.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Accountability System</h3>
              <p className="text-white/60">Stay on track with daily check-ins and progress tracking that keeps you accountable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Calendar Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-transparent to-emerald-950/20" id="booking">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Book Your Strategy Session</h2>
            <p className="text-white/60">Complete our quick form and we&apos;ll schedule a personalized demo for your business.</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)]">
            <MultiStepBookingForm />
          </div>
        </div>
      </section>

      {/* Widget Demo Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Universal Booking Widget</h2>
              <p className="text-white/60 mb-6">
                Our embeddable booking widget can be added to any website. Perfect for businesses 
                that want to offer seamless scheduling to their customers.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customizable colors to match your brand
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Integrates with Google Calendar, Cal.com, and more
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track bookings from multiple sources
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  White-label solution for agencies
                </li>
              </ul>
              <button
                onClick={() => setShowWidget(true)}
                className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition"
              >
                Try the Widget
              </button>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Quick Book Demo</h3>
              <BookingWidget source="landing-page-demo" />
            </div>
          </div>
        </div>
      </section>

      {/* Full Form Modal */}
      {showFullForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black/90 border border-white/10 rounded-3xl p-8">
            <button
              onClick={() => setShowFullForm(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Schedule Your Demo</h2>
            <MultiStepBookingForm />
          </div>
        </div>
      )}

      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <button
              onClick={() => setShowWidget(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Quick Book</h3>
            <BookingWidget 
              source="quick-book-modal" 
              onBookingComplete={() => {
                setTimeout(() => setShowWidget(false), 2000);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
