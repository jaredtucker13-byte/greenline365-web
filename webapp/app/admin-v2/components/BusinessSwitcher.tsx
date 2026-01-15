'use client';

/**
 * Business Switcher Component
 * 
 * Dropdown in header to switch between businesses (tenants).
 * Shows current business with tier badge.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '@/lib/business';
import { Building2, ChevronDown, Check, Crown, Sparkles, Rocket } from 'lucide-react';

export function BusinessSwitcher() {
  const { activeBusiness, userBusinesses, switchBusiness, isLoading, getTierName } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show anything if still loading
  if (isLoading) {
    return null;
  }

  // Don't show if no businesses (migration not run yet)
  if (!activeBusiness || userBusinesses.length === 0) {
    return null;
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'tier1':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'tier2':
        return <Rocket className="w-3.5 h-3.5" />;
      case 'tier3':
        return <Crown className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier1':
        return 'text-blue-400 bg-blue-400/10';
      case 'tier2':
        return 'text-purple-400 bg-purple-400/10';
      case 'tier3':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
      >
        <Building2 className="w-4 h-4 text-[#39FF14]" />
        
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold text-white truncate max-w-[140px]">
            {activeBusiness.name}
          </span>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getTierColor(activeBusiness.tier)}`}>
            {getTierIcon(activeBusiness.tier)}
            {getTierName()}
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-72 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 border-b border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40 px-2 py-1 font-semibold">
                  Your Businesses
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto p-2">
                {userBusinesses.map(({ business, role, is_primary }) => {
                  const isActive = business.id === activeBusiness.id;
                  
                  return (
                    <button
                      key={business.id}
                      onClick={() => {
                        if (!isActive) {
                          switchBusiness(business.id);
                        }
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                        ${isActive 
                          ? 'bg-[#39FF14]/10 border border-[#39FF14]/30' 
                          : 'hover:bg-white/5 border border-transparent'
                        }
                      `}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Building2 className={`w-4 h-4 ${isActive ? 'text-[#39FF14]' : 'text-white/50'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${isActive ? 'text-[#39FF14]' : 'text-white'}`}>
                            {business.name}
                          </span>
                          {is_primary && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${getTierColor(business.tier)}`}>
                            {getTierIcon(business.tier)}
                            {getTierName()}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {isActive && (
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Future: Add business button */}
              {/* <div className="p-2 border-t border-white/10">
                <button className="w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Business
                </button>
              </div> */}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BusinessSwitcher;
