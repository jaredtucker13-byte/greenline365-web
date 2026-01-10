'use client';

/**
 * GSAP Animation Utilities for GreenLine365
 * 
 * Premium animations for:
 * - Hero entrance effects
 * - Scroll-triggered reveals
 * - Text animations
 * - Parallax effects
 * - Hover interactions
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================
// HERO ENTRANCE ANIMATION
// ============================================
export function useHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      // Animate hero elements in sequence
      tl.from('[data-hero-badge]', {
        y: -30,
        opacity: 0,
        duration: 0.8,
      })
      .from('[data-hero-title]', {
        y: 50,
        opacity: 0,
        duration: 1,
      }, '-=0.4')
      .from('[data-hero-subtitle]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
      }, '-=0.6')
      .from('[data-hero-cta]', {
        y: 20,
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
      }, '-=0.4')
      .from('[data-hero-image]', {
        x: 100,
        opacity: 0,
        duration: 1,
      }, '-=0.8');
      
    }, containerRef);
    
    return () => ctx.revert();
  }, []);
  
  return containerRef;
}

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
export function useScrollReveal(options?: {
  stagger?: number;
  start?: string;
  y?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll('[data-reveal]');
      
      if (elements) {
        gsap.from(elements, {
          scrollTrigger: {
            trigger: containerRef.current,
            start: options?.start || 'top 80%',
            toggleActions: 'play none none none',
          },
          y: options?.y || 60,
          opacity: 0,
          duration: 0.8,
          stagger: options?.stagger || 0.15,
          ease: 'power3.out',
        });
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, [options?.stagger, options?.start, options?.y]);
  
  return containerRef;
}

// ============================================
// PARALLAX EFFECT
// ============================================
export function useParallax(speed: number = 0.5) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        scrollTrigger: {
          trigger: elementRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: () => window.innerHeight * speed * -1,
        ease: 'none',
      });
    }, elementRef);
    
    return () => ctx.revert();
  }, [speed]);
  
  return elementRef;
}

// ============================================
// STAGGERED CARDS ANIMATION
// ============================================
export function useStaggerCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const cards = containerRef.current?.querySelectorAll('[data-card]');
      
      if (cards) {
        gsap.from(cards, {
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
          },
          y: 80,
          opacity: 0,
          duration: 0.6,
          stagger: {
            amount: 0.4,
            from: 'start',
          },
          ease: 'power2.out',
        });
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, []);
  
  return containerRef;
}

// ============================================
// TEXT REVEAL ANIMATION (Character by character)
// ============================================
export function useTextReveal() {
  const textRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!textRef.current) return;
    
    const text = textRef.current.innerText;
    textRef.current.innerHTML = text
      .split('')
      .map(char => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
      .join('');
    
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.querySelectorAll('span') || [], {
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 80%',
        },
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.02,
        ease: 'power2.out',
      });
    }, textRef);
    
    return () => ctx.revert();
  }, []);
  
  return textRef;
}

// ============================================
// COUNTER ANIMATION
// ============================================
export function useCountUp(endValue: number, duration: number = 2) {
  const counterRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!counterRef.current) return;
    
    const ctx = gsap.context(() => {
      const counter = { value: 0 };
      
      gsap.to(counter, {
        scrollTrigger: {
          trigger: counterRef.current,
          start: 'top 80%',
        },
        value: endValue,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.innerText = Math.round(counter.value).toLocaleString();
          }
        },
      });
    }, counterRef);
    
    return () => ctx.revert();
  }, [endValue, duration]);
  
  return counterRef;
}

// ============================================
// MAGNETIC BUTTON EFFECT
// ============================================
export function useMagneticButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: 'power2.out',
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });
    };
    
    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  return buttonRef;
}

// ============================================
// FLOATING ANIMATION (for decorative elements)
// ============================================
export function useFloating(amplitude: number = 20, duration: number = 3) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        y: amplitude,
        duration,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, elementRef);
    
    return () => ctx.revert();
  }, [amplitude, duration]);
  
  return elementRef;
}

// ============================================
// GRADIENT SHIFT ANIMATION
// ============================================
export function useGradientShift() {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        backgroundPosition: '200% center',
        duration: 8,
        ease: 'none',
        repeat: -1,
      });
    }, elementRef);
    
    return () => ctx.revert();
  }, []);
  
  return elementRef;
}

// ============================================
// SECTION FADE IN ON SCROLL
// ============================================
export function useSectionFade() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
      });
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);
  
  return sectionRef;
}

// Export a component wrapper for easy use
export function AnimatedSection({ 
  children, 
  className = '',
  animation = 'fadeUp'
}: { 
  children: React.ReactNode; 
  className?: string;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale';
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const animations = {
      fadeUp: { y: 60, opacity: 0 },
      fadeIn: { opacity: 0 },
      slideLeft: { x: -100, opacity: 0 },
      slideRight: { x: 100, opacity: 0 },
      scale: { scale: 0.8, opacity: 0 },
    };
    
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
        },
        ...animations[animation],
        duration: 0.8,
        ease: 'power3.out',
      });
    }, ref);
    
    return () => ctx.revert();
  }, [animation]);
  
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
