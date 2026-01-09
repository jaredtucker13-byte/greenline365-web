'use client';

import { GlassCard, OSPanel, Button, NeonText } from '@/components/ui/os';
import Link from 'next/link';

export default function DesignSystemDemo() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold">
            Design System <NeonText variant="gradient">Demo</NeonText>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Phase 1 Complete: Futuristic OS Design System
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 bg-neon-green-500 rounded-xl shadow-neon-green"></div>
              <p className="text-sm text-white/80 font-medium">Neon Green</p>
              <p className="text-xs text-white/50">#00FF00</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-neon-teal-500 rounded-xl shadow-neon-teal"></div>
              <p className="text-sm text-white/80 font-medium">Neon Teal</p>
              <p className="text-xs text-white/50">#00FFFF</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-neon-amber-500 rounded-xl shadow-neon-amber"></div>
              <p className="text-sm text-white/80 font-medium">Neon Amber</p>
              <p className="text-xs text-white/50">#FF9500</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-os-dark rounded-xl border border-white/20"></div>
              <p className="text-sm text-white/80 font-medium">OS Dark</p>
              <p className="text-xs text-white/50">#0A0A0A</p>
            </div>
          </div>
        </section>

        {/* Glassmorphism Cards */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Glassmorphism Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard variant="default" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Default Glass</h3>
              <p className="text-sm text-white/60">Standard glassmorphism with subtle blur</p>
            </GlassCard>
            <GlassCard variant="strong" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Strong Glass</h3>
              <p className="text-sm text-white/60">Enhanced blur and opacity</p>
            </GlassCard>
            <GlassCard variant="green" glow="green" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Green Glass</h3>
              <p className="text-sm text-white/60">Neon green accent with glow</p>
            </GlassCard>
            <GlassCard variant="teal" glow="teal" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Teal Glass</h3>
              <p className="text-sm text-white/60">Neon teal accent with glow</p>
            </GlassCard>
          </div>
        </section>

        {/* OS Panels */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            OS Panels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OSPanel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-neon-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">System Panel</h3>
                  <p className="text-sm text-white/50">With neon accent</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                OS panels include subtle top border glow and layered depth effect for that control center vibe.
              </p>
            </OSPanel>
            <OSPanel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-neon-teal-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Status Monitor</h3>
                  <p className="text-sm text-white/50">Real-time data</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Perfect for dashboards and control interfaces with a futuristic aesthetic.
              </p>
            </OSPanel>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Button System
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg">
              Primary CTA
            </Button>
            <Button variant="secondary" size="lg">
              Secondary Action
            </Button>
            <Button variant="ghost" size="lg">
              Ghost Button
            </Button>
            <Button 
              variant="primary" 
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              }
            >
              With Icon
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="secondary" size="sm">
              Small
            </Button>
            <Button variant="primary" fullWidth>
              Full Width
            </Button>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Typography & Neon Text
          </h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-display font-bold text-white mb-2">
                The Operating System for <NeonText variant="green" glow>Local Business</NeonText>
              </h1>
              <p className="text-white/60">Poppins Bold 5xl + Neon Green accent</p>
            </div>
            <div>
              <h2 className="text-4xl font-display font-bold text-white mb-2">
                Build Your <NeonText variant="gradient">Digital Empire</NeonText>
              </h2>
              <p className="text-white/60">Poppins Bold 4xl + Gradient accent</p>
            </div>
            <div>
              <p className="text-lg text-white/80 font-body leading-relaxed">
                Body text uses Inter for optimal readability at all sizes. Perfect for descriptions, paragraphs, and UI elements.
              </p>
              <p className="text-white/60 text-sm">Inter Regular 18px</p>
            </div>
          </div>
        </section>

        {/* Special Effects */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Special Effects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neon-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Neon Border</h3>
              <p className="text-sm text-white/60">Green glow effect</p>
            </div>
            <div className="neon-border-teal rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Teal Border</h3>
              <p className="text-sm text-white/60">Cyan glow effect</p>
            </div>
            <div className="circuit-bg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Circuit BG</h3>
              <p className="text-sm text-white/60">Tech grid pattern</p>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center pt-8">
          <Link href="/">
            <Button variant="secondary">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
