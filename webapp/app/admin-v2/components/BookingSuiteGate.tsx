'use client';

/**
 * Booking Suite Gate Component (HOC Wrapper)
 *
 * Checks the has_booking_suite boolean on the active business.
 * - If false: renders a "Feature Locked" state with CTA to upgrade.
 * - If true: reveals Retell AI Settings, Cal.com Integration, and Booking Analytics tabs.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '@/lib/business';
import { Lock, X, ArrowRight, Phone, Calendar, BarChart3, Zap, Shield, Clock } from 'lucide-react';

interface BookingSuiteGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function BookingSuiteGate({ children, fallback }: BookingSuiteGateProps) {
  const { activeBusiness } = useBusiness();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Check has_booking_suite on the business record
  const hasBookingSuite = (activeBusiness as any)?.has_booking_suite === true;

  if (hasBookingSuite) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="relative min-h-[400px] rounded-2xl overflow-hidden">
        {/* Blurred preview background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 to-[#0a0a0a]/90 backdrop-blur-md z-0" />

        {/* Lock overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] p-8">
          {/* Icon cluster */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Phone className="w-6 h-6 text-amber-400" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-[#0CE293]/20 border border-[#39FF14]/30 flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#39FF14]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Booking Suite Locked</h2>
          <p className="text-white/60 text-center max-w-md mb-8">
            Unlock the full AI-powered booking suite including Retell AI voice receptionist,
            Cal.com calendar integration, and real-time booking analytics.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
            <FeatureCard
              icon={<Phone className="w-5 h-5" />}
              title="Retell AI Settings"
              description="Configure AI voice receptionist for 24/7 call handling"
              color="amber"
            />
            <FeatureCard
              icon={<Calendar className="w-5 h-5" />}
              title="Cal.com Integration"
              description="Sync bookings with Cal.com calendar and availability"
              color="blue"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Booking Analytics"
              description="Real-time booking dashboard with conflict detection"
              color="green"
            />
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-bold rounded-xl shadow-lg shadow-[#39FF14]/20 hover:shadow-xl hover:shadow-[#39FF14]/30 transition-all"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Unlock Booking Suite
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <p className="text-xs text-white/40 mt-3">Included in Professional and Enterprise plans</p>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </AnimatePresence>
    </>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: ReactNode;
  title: string;
  description: string;
  color: 'amber' | 'blue' | 'green';
}) {
  const colorMap = {
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    green: 'border-[#39FF14]/20 bg-[#39FF14]/5 text-[#39FF14]',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-sm font-semibold text-white mb-1">{title}</div>
      <div className="text-xs text-white/50">{description}</div>
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const benefits = [
    { icon: <Phone className="w-4 h-4" />, text: 'AI Voice Receptionist (Retell AI)' },
    { icon: <Calendar className="w-4 h-4" />, text: 'Cal.com Calendar Sync' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'Real-time Booking Analytics' },
    { icon: <Shield className="w-4 h-4" />, text: 'Double-booking Prevention' },
    { icon: <Clock className="w-4 h-4" />, text: '15-minute Buffer Logic' },
    { icon: <Zap className="w-4 h-4" />, text: '24/7 AI Booking Capability' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-br from-[#39FF14]/10 to-[#0CE293]/10">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/60" />
          </button>
          <h2 className="text-2xl font-bold text-white">Unlock Booking Suite</h2>
          <p className="text-sm text-white/60 mt-1">Everything you need for automated booking management</p>
        </div>

        <div className="p-6 space-y-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/80">
              <div className="text-[#39FF14]">{benefit.icon}</div>
              <span>{benefit.text}</span>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10 mt-6">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold rounded-lg hover:opacity-90 transition-all">
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * HOC version - wraps a page component with BookingSuiteGate
 */
export function withBookingSuiteGate<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function BookingSuiteGatedComponent(props: P) {
    return (
      <BookingSuiteGate>
        <WrappedComponent {...props} />
      </BookingSuiteGate>
    );
  };
}

export default BookingSuiteGate;
