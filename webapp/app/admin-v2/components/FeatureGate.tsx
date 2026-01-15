'use client';

/**
 * Feature Gate Component
 * 
 * Wraps features and shows lock/upgrade UI for users without access.
 * Automatically checks tier-based permissions.
 */

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness, type Business } from '@/lib/business';
import { Lock, X, ArrowRight, Check } from 'lucide-react';

interface FeatureGateProps {
  feature: keyof Business['settings']['features'];
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeModal?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradeModal = true 
}: FeatureGateProps) {
  const { hasFeature, activeBusiness, getTierName, getTierPrice } = useBusiness();
  const [showModal, setShowModal] = useState(false);

  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked UI
  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => showUpgradeModal && setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Lock className="w-4 h-4" />
            Unlock Feature
          </motion.button>
        </div>
        
        {/* Blurred preview */}
        <div className="pointer-events-none opacity-30 blur-sm">
          {children}
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showModal && (
          <UpgradeModal
            feature={feature}
            currentTier={activeBusiness?.tier || 'tier1'}
            currentTierName={getTierName()}
            currentPrice={getTierPrice()}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface UpgradeModalProps {
  feature: string;
  currentTier: string;
  currentTierName: string;
  currentPrice: string;
  onClose: () => void;
}

function UpgradeModal({ feature, currentTier, currentTierName, currentPrice, onClose }: UpgradeModalProps) {
  const featureNames: Record<string, string> = {
    content_forge: 'Content Forge',
    mockup_generator: 'Mockup Generator',
    social_posting: 'Social Media Posting',
    crm: 'CRM & Lead Management',
    analytics: 'Advanced Analytics',
    knowledge_base: 'Knowledge Base',
    blog: 'Blog Management',
    email: 'Email Campaigns',
    sms: 'SMS Marketing',
    bookings: 'Booking System',
    ai_receptionist: 'AI Receptionist',
    calendar: 'Calendar Management',
  };

  const tierFeatures = {
    tier1: ['content_forge', 'mockup_generator', 'social_posting'],
    tier2: ['content_forge', 'mockup_generator', 'social_posting', 'crm', 'analytics', 'knowledge_base', 'blog'],
    tier3: ['content_forge', 'mockup_generator', 'social_posting', 'crm', 'analytics', 'knowledge_base', 'blog', 'email', 'sms', 'bookings', 'ai_receptionist', 'calendar'],
  };

  const requiredTier = feature in tierFeatures.tier2 && !(feature in tierFeatures.tier1) 
    ? 'tier2' 
    : 'tier3';

  const tierInfo = {
    tier2: { name: 'Professional', price: '$599', features: tierFeatures.tier2 },
    tier3: { name: 'Enterprise', price: '$999', features: tierFeatures.tier3 },
  };

  const targetTier = tierInfo[requiredTier as 'tier2' | 'tier3'];

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
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-br from-[#39FF14]/10 to-[#0CE293]/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39FF14] to-[#0CE293] flex items-center justify-center">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Unlock {featureNames[feature]}</h2>
              <p className="text-sm text-white/60 mt-0.5">Upgrade to access this feature</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Current vs Required */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-white/50 mb-1">Current Plan</div>
              <div className="text-lg font-bold text-white">{currentTierName}</div>
              <div className="text-sm text-white/60 mt-1">{currentPrice}/month</div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-[#39FF14]/20 to-[#0CE293]/20 rounded-lg border border-[#39FF14]/30">
              <div className="text-xs text-[#39FF14] mb-1">Upgrade To</div>
              <div className="text-lg font-bold text-white">{targetTier.name}</div>
              <div className="text-sm text-white/60 mt-1">{targetTier.price}/month</div>
            </div>
          </div>

          {/* Features List */}
          <div>
            <div className="text-sm font-semibold text-white mb-3">
              Included in {targetTier.name}:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {targetTier.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                  <span className={f === feature ? 'text-[#39FF14] font-medium' : ''}>
                    {featureNames[f]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-white/10">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold rounded-lg hover:opacity-90 transition-all">
              Upgrade to {targetTier.name}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-white/40 text-center mt-3">
              30% discount for additional locations
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default FeatureGate;
