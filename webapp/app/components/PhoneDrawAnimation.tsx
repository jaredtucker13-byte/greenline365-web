'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

/**
 * Phase 5: Phone Drawing Animation
 * SVG line drawing of a phone outline that draws itself as the user scrolls.
 * The phone starts as empty outlines and fills in with the "OS materializing" effect.
 */
export default function PhoneDrawAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const paths = containerRef.current.querySelectorAll<SVGPathElement>('[data-draw-path]');
    const fills = containerRef.current.querySelectorAll<SVGElement>('[data-fill]');
    const uiElements = containerRef.current.querySelectorAll<SVGElement>('[data-ui]');
    const glowEl = containerRef.current.querySelector('[data-phone-glow]');

    // Set initial states for stroke drawing
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });

    gsap.set(fills, { opacity: 0 });
    gsap.set(uiElements, { opacity: 0, y: 10 });
    if (glowEl) gsap.set(glowEl, { opacity: 0 });

    // Master timeline scrubbed by scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 1,
      },
    });

    // Phase 1: Draw phone outline (0-40%)
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.inOut',
    });

    // Phase 2: Fill in the phone body (40-60%)
    tl.to(fills, {
      opacity: 1,
      duration: 0.2,
      stagger: 0.03,
    }, 0.35);

    // Phase 3: UI elements materialize (60-90%)
    tl.to(uiElements, {
      opacity: 1,
      y: 0,
      duration: 0.2,
      stagger: 0.04,
      ease: 'power2.out',
    }, 0.55);

    // Phase 4: Ambient glow (90-100%)
    if (glowEl) {
      tl.to(glowEl, {
        opacity: 1,
        duration: 0.1,
      }, 0.85);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[320px] mx-auto">
      {/* Ambient glow behind phone */}
      <div
        data-phone-glow
        className="absolute inset-0 scale-110 bg-gold/15 blur-[60px] rounded-full pointer-events-none"
      />

      <svg
        viewBox="0 0 280 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-auto"
      >
        {/* Phone body fill */}
        <rect
          data-fill
          x="10"
          y="10"
          width="260"
          height="540"
          rx="36"
          fill="rgba(13, 27, 42, 0.95)"
        />

        {/* Phone outer frame */}
        <rect
          data-draw-path
          x="10"
          y="10"
          width="260"
          height="540"
          rx="36"
          stroke="rgba(201, 169, 110, 0.6)"
          strokeWidth="2"
          fill="none"
        />

        {/* Screen area fill */}
        <rect
          data-fill
          x="20"
          y="50"
          width="240"
          height="470"
          rx="4"
          fill="rgba(5, 11, 24, 0.9)"
        />

        {/* Screen border */}
        <rect
          data-draw-path
          x="20"
          y="50"
          width="240"
          height="470"
          rx="4"
          stroke="rgba(201, 169, 110, 0.3)"
          strokeWidth="1"
          fill="none"
        />

        {/* Notch */}
        <rect
          data-draw-path
          x="100"
          y="14"
          width="80"
          height="24"
          rx="12"
          stroke="rgba(201, 169, 110, 0.4)"
          strokeWidth="1"
          fill="none"
        />
        <rect
          data-fill
          x="100"
          y="14"
          width="80"
          height="24"
          rx="12"
          fill="rgba(0, 0, 0, 0.8)"
        />

        {/* ─── UI Elements ─── */}

        {/* Status bar */}
        <g data-ui>
          <text x="36" y="72" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">9:41</text>
          <text x="210" y="72" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">100%</text>
        </g>

        {/* Header bar */}
        <g data-ui>
          <text x="36" y="100" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" letterSpacing="2">COMMAND CENTER</text>
          <text x="36" y="118" fill="rgba(255,255,255,0.9)" fontSize="14" fontFamily="sans-serif" fontWeight="bold">Good Morning</text>
        </g>

        {/* Stats cards row */}
        <g data-ui>
          {/* Card 1 */}
          <rect x="30" y="135" width="70" height="45" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <text x="38" y="152" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace">LEADS</text>
          <text x="38" y="170" fill="rgba(201,169,110,1)" fontSize="16" fontFamily="sans-serif" fontWeight="bold">12</text>

          {/* Card 2 */}
          <rect x="105" y="135" width="70" height="45" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <text x="113" y="152" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace">CONTENT</text>
          <text x="113" y="170" fill="rgba(201,169,110,1)" fontSize="16" fontFamily="sans-serif" fontWeight="bold">8</text>

          {/* Card 3 */}
          <rect x="180" y="135" width="70" height="45" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <text x="188" y="152" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace">ENGAGE</text>
          <text x="188" y="170" fill="rgba(201,169,110,1)" fontSize="16" fontFamily="sans-serif" fontWeight="bold">89%</text>
        </g>

        {/* Live activity label */}
        <g data-ui>
          <text x="36" y="206" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" letterSpacing="2">LIVE ACTIVITY</text>
          <circle cx="234" cy="202" r="3" fill="rgba(201,169,110,0.8)">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="218" y="206" fill="rgba(201,169,110,0.8)" fontSize="6" fontFamily="monospace">LIVE</text>
        </g>

        {/* Notification cards */}
        <g data-ui>
          <rect x="30" y="218" width="220" height="50" rx="10" fill="rgba(234, 88, 12, 0.15)" stroke="rgba(234, 88, 12, 0.3)" strokeWidth="0.5" />
          <text x="52" y="240" fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Trending Now</text>
          <text x="52" y="254" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Local BBQ Festival this weekend</text>
        </g>

        <g data-ui>
          <rect x="30" y="276" width="220" height="50" rx="10" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="0.5" />
          <text x="52" y="298" fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Content Ready</text>
          <text x="52" y="312" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">&quot;5 Ways to Boost Reviews&quot; generated</text>
        </g>

        <g data-ui>
          <rect x="30" y="334" width="220" height="50" rx="10" fill="rgba(34, 197, 94, 0.15)" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.5" />
          <text x="52" y="356" fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="sans-serif" fontWeight="bold">New Lead Captured</text>
          <text x="52" y="370" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Sarah M. wants a consultation</text>
        </g>

        {/* Quick action buttons */}
        <g data-ui>
          {[
            { x: 38, label: 'Create' },
            { x: 98, label: 'Analytics' },
            { x: 158, label: 'Schedule' },
            { x: 218, label: 'Leads' },
          ].map(({ x, label }) => (
            <g key={label}>
              <rect x={x - 8} y="410" width="48" height="42" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <text x={x + 16} y="444" fill="rgba(255,255,255,0.5)" fontSize="6" fontFamily="sans-serif" textAnchor="middle">{label}</text>
            </g>
          ))}
        </g>

        {/* Bottom nav bar */}
        <g data-ui>
          <rect x="30" y="468" width="220" height="42" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          {/* Home icon (active) */}
          <circle cx="72" cy="484" r="3" fill="rgba(201,169,110,0.8)" />
          <text x="72" y="498" fill="rgba(201,169,110,0.8)" fontSize="5" fontFamily="sans-serif" textAnchor="middle">Home</text>
          {/* Other nav icons */}
          <circle cx="120" cy="484" r="3" fill="rgba(255,255,255,0.3)" />
          <text x="120" y="498" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="sans-serif" textAnchor="middle">Calendar</text>
          <circle cx="168" cy="484" r="3" fill="rgba(255,255,255,0.3)" />
          <text x="168" y="498" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="sans-serif" textAnchor="middle">Alerts</text>
          <circle cx="216" cy="484" r="3" fill="rgba(255,255,255,0.3)" />
          <text x="216" y="498" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="sans-serif" textAnchor="middle">Profile</text>
        </g>

        {/* Home indicator bar */}
        <rect
          data-draw-path
          x="105"
          y="530"
          width="70"
          height="4"
          rx="2"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
          fill="none"
        />
        <rect
          data-fill
          x="105"
          y="530"
          width="70"
          height="4"
          rx="2"
          fill="rgba(255,255,255,0.2)"
        />
      </svg>
    </div>
  );
}
