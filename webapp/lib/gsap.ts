'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

// Custom hook for GSAP animations
export function useGSAP(callback: () => gsap.core.Timeline | void, deps: any[] = []) {
  useEffect(() => {
    const ctx = gsap.context(callback);
    return () => ctx.revert();
  }, deps);
}

// Scroll animation utilities
export const scrollAnimations = {
  // Fade in elements as they enter viewport
  fadeIn: (element: string | Element, options = {}) => {
    return gsap.from(element, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        ...options,
      },
    });
  },

  // Stagger animation for multiple elements
  staggerFadeIn: (elements: string, options = {}) => {
    return gsap.from(elements, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: elements,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        ...options,
      },
    });
  },

  // Parallax effect
  parallax: (element: string | Element, speed: number = 0.5) => {
    return gsap.to(element, {
      y: () => -ScrollTrigger.maxScroll(window) * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  },

  // Pin section while content animates
  pinSection: (element: string | Element, options = {}) => {
    return ScrollTrigger.create({
      trigger: element,
      pin: true,
      start: 'top top',
      end: '+=500',
      ...options,
    });
  },

  // Scale animation
  scaleIn: (element: string | Element, options = {}) => {
    return gsap.from(element, {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        ...options,
      },
    });
  },
};

// Text animation utilities
export const textAnimations = {
  // Split text and animate by words
  animateWords: (element: string | Element, options = {}) => {
    return gsap.from(`${element} .word`, {
      opacity: 0,
      y: 20,
      rotateX: -90,
      stagger: 0.05,
      duration: 0.8,
      ease: 'power3.out',
      ...options,
    });
  },

  // Typewriter effect
  typewriter: (element: string | Element, duration: number = 2) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    const text = el.textContent || '';
    el.textContent = '';
    
    return gsap.to(el, {
      duration,
      text: { value: text },
      ease: 'none',
    });
  },
};

// Nav bar blur on scroll
export const createNavBlur = (navElement: string | Element) => {
  return ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: {
      className: 'nav-scrolled',
      targets: navElement,
    },
  });
};
