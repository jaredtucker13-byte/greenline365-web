'use client';

/**
 * Onboarding CTA Banner
 * Persistent "Set Your Flight Plan" prompt for users who haven't completed onboarding
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X, Sparkles } from 'lucide-react';
import { useBusiness } from '@/lib/business';
import { useRouter } from 'next/navigation';

export function OnboardingBanner() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Check if onboarding is complete
    const checkOnboarding = () => {
      if (!activeBusiness) return;
      
      // Check if business has completed onboarding
      // For now, check if brand_voice has content
      const hasIdentity = activeBusiness.brand_voice && 
        (activeBusiness.brand_voice.mission || 
         (activeBusiness.brand_voice.tone && activeBusiness.brand_voice.tone.length > 0));
      
      setOnboardingComplete(!!hasIdentity);
    };

    checkOnboarding();
  }, [activeBusiness]);

  // Check if user previously dismissed
  useEffect(() => {
    const dismissedKey = `onboarding_dismissed_${activeBusiness?.id}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
    setDismissed(wasDismissed);
  }, [activeBusiness]);

  const handleDismiss = () => {
    if (activeBusiness) {
      const dismissedKey = `onboarding_dismissed_${activeBusiness.id}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
    }
  };

  const handleStartOnboarding = () => {
    if (activeBusiness) {
      router.push(`/onboarding?businessId=${activeBusiness.id}`);
    }
  };

  // Don't show if dismissed, completed, or no business
  if (dismissed || onboardingComplete || !activeBusiness) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#39FF14]/20 to-[#0CE293]/20 backdrop-blur-xl border-b border-[#39FF14]/30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#39FF14] to-[#0CE293] rounded-full flex items-center justify-center">
                <Rocket className="w-5 h-5 text-black" />
              </div>
              
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#39FF14]" />
                  Ready to Set Your Flight Plan?
                </h3>
                <p className="text-sm text-white/70 mt-0.5">
                  Let our AI build your business profile in under 60 seconds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartOnboarding}
                className="px-6 py-2.5 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold rounded-lg hover:opacity-90 transition shadow-lg"
              >
                Start Onboarding
              </button>
              
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Dismiss (you can start onboarding anytime from Settings)"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OnboardingBanner;
