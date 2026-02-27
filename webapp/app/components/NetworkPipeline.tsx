'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

/**
 * Phase 5: Network Pipeline Animation
 * Shows how content flows from a camera/phone → through GreenLine365 AI → to multiple output channels.
 * Lines connect nodes, data pulses flow through connections, and nodes light up sequentially.
 */

interface PipelineNode {
  id: string;
  icon: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

const inputNodes: PipelineNode[] = [
  { id: 'photos', icon: '📸', label: 'Photos', x: 60, y: 60, color: 'rgba(59, 130, 246, 0.3)' },
  { id: 'videos', icon: '🎬', label: 'Videos', x: 60, y: 160, color: 'rgba(168, 85, 247, 0.3)' },
  { id: 'reviews', icon: '⭐', label: 'Reviews', x: 60, y: 260, color: 'rgba(234, 179, 8, 0.3)' },
  { id: 'trends', icon: '📊', label: 'Trends', x: 60, y: 360, color: 'rgba(34, 197, 94, 0.3)' },
];

const outputNodes: PipelineNode[] = [
  { id: 'instagram', icon: '📱', label: 'Instagram', x: 740, y: 60, color: 'rgba(236, 72, 153, 0.3)' },
  { id: 'facebook', icon: '💻', label: 'Facebook', x: 740, y: 140, color: 'rgba(59, 130, 246, 0.3)' },
  { id: 'google', icon: '🔍', label: 'Google', x: 740, y: 220, color: 'rgba(34, 197, 94, 0.3)' },
  { id: 'email', icon: '📧', label: 'Email', x: 740, y: 300, color: 'rgba(168, 85, 247, 0.3)' },
  { id: 'booking', icon: '📅', label: 'Bookings', x: 740, y: 380, color: 'rgba(201, 169, 110, 0.3)' },
];

export default function NetworkPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const inputEls = containerRef.current.querySelectorAll('[data-input-node]');
    const hubEl = containerRef.current.querySelector('[data-hub]');
    const outputEls = containerRef.current.querySelectorAll('[data-output-node]');
    const inputLines = containerRef.current.querySelectorAll('[data-input-line]');
    const outputLines = containerRef.current.querySelectorAll('[data-output-line]');
    const pulses = containerRef.current.querySelectorAll('[data-pulse]');
    const hubGlow = containerRef.current.querySelector('[data-hub-glow]');

    // Initial states
    gsap.set(inputEls, { opacity: 0, x: -30, scale: 0.8 });
    gsap.set(outputEls, { opacity: 0, x: 30, scale: 0.8 });
    gsap.set(hubEl, { opacity: 0, scale: 0.5 });
    gsap.set(inputLines, { opacity: 0 });
    gsap.set(outputLines, { opacity: 0 });
    gsap.set(pulses, { opacity: 0 });
    if (hubGlow) gsap.set(hubGlow, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 60%',
        end: 'bottom 20%',
        scrub: 1.5,
      },
    });

    // Step 1: Input nodes appear (0–15%)
    tl.to(inputEls, {
      opacity: 1, x: 0, scale: 1,
      stagger: 0.02, duration: 0.12, ease: 'back.out(1.5)',
    });

    // Step 2: Input lines fade in (15–25%)
    tl.to(inputLines, {
      opacity: 1,
      stagger: 0.015, duration: 0.08,
    }, 0.12);

    // Step 3: Central hub appears (25–40%)
    tl.to(hubEl, {
      opacity: 1, scale: 1,
      duration: 0.12, ease: 'back.out(2)',
    }, 0.22);

    if (hubGlow) {
      tl.to(hubGlow, { opacity: 1, duration: 0.1 }, 0.28);
    }

    // Step 4: Pulses flow from input to hub (40–55%)
    tl.to(pulses, {
      opacity: 1,
      duration: 0.05,
      stagger: 0.02,
    }, 0.38);

    // Step 5: Output lines appear (55–65%)
    tl.to(outputLines, {
      opacity: 1,
      stagger: 0.015, duration: 0.08,
    }, 0.52);

    // Step 6: Output nodes appear (65–80%)
    tl.to(outputEls, {
      opacity: 1, x: 0, scale: 1,
      stagger: 0.02, duration: 0.12, ease: 'back.out(1.5)',
    }, 0.6);

    // Step 7: Continuous pulse animation loop (after scroll completes)
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 30%',
      onEnter: () => {
        gsap.to('[data-pulse]', {
          opacity: (i) => [1, 0.6, 1, 0.6][i % 4],
          duration: 1.5,
          stagger: { each: 0.3, repeat: -1, yoyo: true },
          ease: 'sine.inOut',
        });
      },
    });
  }, []);

  const hubX = 400;
  const hubY = 210;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Connection lines: inputs → hub */}
        {inputNodes.map((node) => (
          <g key={`line-in-${node.id}`}>
            <line
              data-input-line
              x1={node.x + 40}
              y1={node.y + 20}
              x2={hubX - 50}
              y2={hubY}
              stroke="rgba(201, 169, 110, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Animated pulse dot */}
            <circle
              data-pulse
              r="3"
              fill="rgba(201, 169, 110, 0.8)"
            >
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={`M${node.x + 40},${node.y + 20} L${hubX - 50},${hubY}`}
              />
            </circle>
          </g>
        ))}

        {/* Connection lines: hub → outputs */}
        {outputNodes.map((node) => (
          <g key={`line-out-${node.id}`}>
            <line
              data-output-line
              x1={hubX + 50}
              y1={hubY}
              x2={node.x - 40}
              y2={node.y + 20}
              stroke="rgba(201, 169, 110, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Animated pulse dot */}
            <circle
              data-pulse
              r="3"
              fill="rgba(201, 169, 110, 0.8)"
            >
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={`M${hubX + 50},${hubY} L${node.x - 40},${node.y + 20}`}
              />
            </circle>
          </g>
        ))}

        {/* Input nodes */}
        {inputNodes.map((node) => (
          <g key={node.id} data-input-node>
            <rect
              x={node.x - 15}
              y={node.y - 5}
              width="90"
              height="50"
              rx="12"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <rect
              x={node.x - 15}
              y={node.y - 5}
              width="90"
              height="50"
              rx="12"
              fill={node.color}
            />
            <text x={node.x + 30} y={node.y + 17} fontSize="18" textAnchor="middle">{node.icon}</text>
            <text x={node.x + 30} y={node.y + 35} fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">{node.label}</text>
          </g>
        ))}

        {/* Central Hub */}
        <g data-hub>
          {/* Glow */}
          <circle data-hub-glow cx={hubX} cy={hubY} r="70" fill="rgba(201, 169, 110, 0.08)" />
          {/* Outer ring */}
          <circle cx={hubX} cy={hubY} r="50" fill="rgba(13, 27, 42, 0.95)" stroke="rgba(201, 169, 110, 0.4)" strokeWidth="1.5" />
          {/* Inner ring */}
          <circle cx={hubX} cy={hubY} r="38" fill="none" stroke="rgba(201, 169, 110, 0.2)" strokeWidth="0.5" strokeDasharray="4 4">
            <animateTransform attributeName="transform" type="rotate" from="0 400 210" to="360 400 210" dur="20s" repeatCount="indefinite" />
          </circle>
          {/* Center icon */}
          <text x={hubX} y={hubY - 8} fontSize="22" textAnchor="middle">⚡</text>
          <text x={hubX} y={hubY + 12} fill="rgba(201,169,110,1)" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">GL365</text>
          <text x={hubX} y={hubY + 24} fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace" textAnchor="middle">AI ENGINE</text>
        </g>

        {/* Output nodes */}
        {outputNodes.map((node) => (
          <g key={node.id} data-output-node>
            <rect
              x={node.x - 35}
              y={node.y - 5}
              width="90"
              height="50"
              rx="12"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <rect
              x={node.x - 35}
              y={node.y - 5}
              width="90"
              height="50"
              rx="12"
              fill={node.color}
            />
            <text x={node.x + 10} y={node.y + 17} fontSize="18" textAnchor="middle">{node.icon}</text>
            <text x={node.x + 10} y={node.y + 35} fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">{node.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
