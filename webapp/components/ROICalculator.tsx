'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/os';

export default function ROICalculator() {
  const [showReport, setShowReport] = useState(false);
  const [blogsPerWeek, setBlogsPerWeek] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [postsToStayVisible, setPostsToStayVisible] = useState(5);
  
  // Calculations
  const hoursPerBlog = 2; // Assume 2 hours per blog post
  const hoursPerMonth = blogsPerWeek * hoursPerBlog * 4.33; // weeks per month
  const monthlyCost = hoursPerMonth * hourlyRate;
  const yearlyManualCost = monthlyCost * 12;
  
  // With GreenLine365 (80% time savings)
  const hoursPerMonthWithSystem = hoursPerMonth * 0.2;
  const monthlyCostWithSystem = hoursPerMonthWithSystem * hourlyRate;
  const yearlyCostWithSystem = monthlyCostWithSystem * 12;
  
  const monthlySavings = monthlyCost - monthlyCostWithSystem;
  const hourlySavings = hoursPerMonth - hoursPerMonthWithSystem;
  const yearlySavings = yearlyManualCost - yearlyCostWithSystem;
  
  const handleGenerateReport = () => {
    setShowReport(true);
  };
  
  const handleReset = () => {
    setShowReport(false);
  };
  
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-os-dark to-os-dark-900" />
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-radial-green opacity-10 blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Calculate Your <span className="text-gradient-green glow-text">ROI</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            See how much time and money you'll save by automating your content creation
          </p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!showReport ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="glass-strong rounded-3xl p-8 md:p-12 border border-neon-green-500/20"
            >
              {/* Slider 1 */}
              <div className="mb-10">
                <label className="block text-white font-semibold mb-4">
                  How many blog posts do you create per week?
                </label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={blogsPerWeek}
                    onChange={(e) => setBlogsPerWeek(Number(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-green"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-display font-bold text-neon-green-500">
                      {blogsPerWeek}
                    </span>
                    <div className="text-xs text-white/50">posts</div>
                  </div>
                </div>
              </div>
              
              {/* Slider 2 */}
              <div className="mb-10">
                <label className="block text-white font-semibold mb-4">
                  What's your hourly rate? (or what you pay yourself)
                </label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-green"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-display font-bold text-neon-green-500">
                      ${hourlyRate}
                    </span>
                    <div className="text-xs text-white/50">/hour</div>
                  </div>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="mb-10 p-6 glass rounded-2xl border border-white/10">
                <label className="block text-white font-semibold mb-3">
                  💡 Did you know?
                </label>
                <p className="text-white/70 text-sm leading-relaxed">
                  Most local businesses need to post <span className="text-neon-green-500 font-semibold">{postsToStayVisible}+ times per week</span> across 
                  all platforms (Google, Facebook, Instagram, etc.) to stay visible to their local community. 
                  That's a lot of time creating, editing, and posting content!
                </p>
              </div>
              
              {/* CTA Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleGenerateReport}
                className="text-lg"
              >
                Generate My ROI Report
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-green rounded-3xl p-8 md:p-12 border border-neon-green-500/30"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-neon-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg className="w-10 h-10 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <h3 className="text-3xl font-display font-bold text-white mb-2">
                  Your ROI Report
                </h3>
                <p className="text-white/60">Based on your inputs</p>
              </div>
              
              {/* Report Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Current Situation */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-2xl p-6 border border-white/10"
                >
                  <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                    Without GreenLine365
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        {hoursPerMonth.toFixed(1)} hours
                      </div>
                      <div className="text-sm text-white/60">per month creating content</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        ${monthlyCost.toFixed(0)}
                      </div>
                      <div className="text-sm text-white/60">monthly cost</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        ${yearlyManualCost.toFixed(0)}
                      </div>
                      <div className="text-sm text-white/60">yearly cost</div>
                    </div>
                  </div>
                </motion.div>
                
                {/* With GreenLine365 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-green rounded-2xl p-6 border border-neon-green-500/30"
                >
                  <h4 className="text-sm font-semibold text-neon-green-400 uppercase tracking-wider mb-4">
                    With GreenLine365
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        {hoursPerMonthWithSystem.toFixed(1)} hours
                      </div>
                      <div className="text-sm text-white/60">per month (80% reduction!)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        ${monthlyCostWithSystem.toFixed(0)}
                      </div>
                      <div className="text-sm text-white/60">monthly cost</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-white">
                        ${yearlyCostWithSystem.toFixed(0)}
                      </div>
                      <div className="text-sm text-white/60">yearly cost</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Savings Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-neon-green-500/20 to-neon-green-500/10 rounded-2xl p-8 mb-6"
              >
                <h4 className="text-center text-sm font-semibold text-neon-green-400 uppercase tracking-wider mb-6">
                  Your Potential Savings
                </h4>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-display font-black text-neon-green-500 mb-2">
                      {hourlySavings.toFixed(0)}
                    </div>
                    <div className="text-sm text-white/70">Hours Saved<br />Per Month</div>
                  </div>
                  <div>
                    <div className="text-4xl font-display font-black text-neon-green-500 mb-2">
                      ${monthlySavings.toFixed(0)}
                    </div>
                    <div className="text-sm text-white/70">Monthly<br />Savings</div>
                  </div>
                  <div>
                    <div className="text-4xl font-display font-black text-neon-green-500 mb-2">
                      ${yearlySavings.toFixed(0)}
                    </div>
                    <div className="text-sm text-white/70">Yearly<br />Savings</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleReset}
                >
                  Recalculate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx>{`
        .slider-green::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #00FF00;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .slider-green::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #00FF00;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .slider-green::-webkit-slider-track {
          background: linear-gradient(to right, #00FF00 0%, #00FF00 ${(blogsPerWeek / 20) * 100}%, rgba(255,255,255,0.1) ${(blogsPerWeek / 20) * 100}%);
        }
      `}</style>
    </section>
  );
}
