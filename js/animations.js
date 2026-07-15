/**
 * animations.js — GSAP animations + preloading
 * Handles cinematic intro, hero entrance, scroll triggers, and image preloading
 */

'use strict';

import { getLenis } from './scroll.js';
import { preloadMoreWork } from './more-work.js';
import { runIntro } from './intro/manager.js';

const PROJECT_IMAGES = [
  'images/gfg.png',
  'images/pixel_chai.png',
  'images/coming-soon.png',
];

function preloadProjectImages() {
  PROJECT_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

export const ENABLE_INTRO = true; // Set to false to skip the cinematic intro

export function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  preloadProjectImages();

  /* ── Lock scroll during intro, scroll to top ── */
  const scrollLock = () => window.scrollTo(0, 0);
  
  if (ENABLE_INTRO) {
    window.addEventListener('scroll', scrollLock, { once: false });
  }

  window.scrollTo(0, 0);
  setTimeout(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 0 });
      if (ENABLE_INTRO) lenis.stop();
    }
  }, 10);

  /* Hide hero elements so they don't flash before intro completes */
  gsap.set('.nav-logo, .nav-right', { opacity: 0, y: -10 });
  gsap.set('.hero-eyebrow span',    { yPercent: 110 });
  gsap.set('.hero-title .tl span',  { yPercent: 110 });
  gsap.set('.hero-desc',            { opacity: 0, y: 24 });
  gsap.set('.pill',                 { opacity: 0, x: 36 });
  gsap.set('.scroll-hint',          { opacity: 0 });

  preloadMoreWork();

  /* ── Cinematic intro replaces the old preloader ── */
  if (ENABLE_INTRO) {
    runIntro(() => {
      /* onReveal — called during bloom, portfolio emerges underneath */
      window.removeEventListener('scroll', scrollLock);
      const lenis = getLenis();
      if (lenis) lenis.start();
      heroIn();
      initTilt();
    });
  } else {
    heroIn();
    initTilt();
  }
}

/* ─────────────────────────────────────────────────────────── */

function heroIn() {
  /* Initial states already set in initAnimations() */
  const mob = window.matchMedia('(max-width: 600px)').matches;
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl.to('.nav-logo',            { opacity: 1, y: 0, duration: mob ? 1.0 : 0.7 }, 0)
    .to('.nav-right',           { opacity: 1, y: 0, duration: mob ? 1.0 : 0.7 }, mob ? 0.18 : 0.12)
    .to('.hero-eyebrow span',   { yPercent: 0, duration: mob ? 1.2 : 0.85 },      mob ? 0.14 : 0.08)
    .to('.hero-title .tl span', { yPercent: 0, duration: mob ? 1.6 : 1.15, stagger: mob ? 0.2 : 0.13 }, mob ? 0.2 : 0.12)
    .to('.hero-desc',           { opacity: 1, y: 0, duration: mob ? 1.2 : 0.85 }, mob ? 1.0 : 0.68)
    .to('.pill',                { opacity: 1, x: 0, duration: mob ? 0.9 : 0.65, stagger: mob ? 0.18 : 0.12 }, mob ? 1.2 : 0.80)
    .to('.scroll-hint',         { opacity: 1, duration: mob ? 0.9 : 0.6 }, mob ? 2.0 : 1.35);

  tl.call(initScrollTriggers, null, 0.4);
}

/* ─────────────────────────────────────────────────────────── */

function initScrollTriggers() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  gsap.utils.toArray('.s-title').forEach(el => {
    gsap.to(el.querySelectorAll('.tl span'), {
      yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  gsap.utils.toArray('.pcard').forEach(el => {
    gsap.fromTo(el,
      { scale: 0.85, opacity: 0.3, y: 50 },
      { scale: 1, opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 1 } }
    );
  });

  /* Parallax removed to prevent clipping and layout tear on exactly-sized banners */

  gsap.utils.toArray('.sc-card').forEach((el, i) => {
    gsap.fromTo(el,
      { scale: 0.85, opacity: 0.3, y: 50 },
      { scale: 1, opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 1 } }
    );
  });

  gsap.fromTo('.pdf-strip',
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out',
      scrollTrigger: { trigger: '.pdf-strip', start: 'top 88%' } }
  );

  gsap.fromTo('.contact-headline .tl span',
    { yPercent: 110 },
    { yPercent: 0, duration: 1.05, stagger: 0.14, ease: 'power4.out',
      scrollTrigger: { trigger: '.contact-headline', start: 'top 88%' } }
  );

  gsap.fromTo('.contact-footer',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-footer', start: 'top 90%' } }
  );

  /* Debounced refresh — fires once after fonts + layout settle */
  let refreshTimer = null;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  setTimeout(scheduleRefresh, 300);
  window.addEventListener('load', scheduleRefresh, { once: true });
}

/* ─────────────────────────────────────────────────────────── */

function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll('.pcard');
  cards.forEach(card => {
    // We tilt the inner wrapper so the outer bounds stay stable
    const inner = card; 
    
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPct = (x / rect.width) - 0.5;
      const yPct = (y / rect.height) - 0.5;
      
      gsap.to(inner, {
        rotationY: xPct * 4,
        rotationX: -yPct * 4,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 1000,
        transformOrigin: "center center"
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(inner, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.7,
        ease: 'power2.out'
      });
    });
  });
}