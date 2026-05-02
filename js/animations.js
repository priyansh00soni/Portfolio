/**
 nimations.js — GSAP animations + preloading
 Handles preloader, hero entrance, scroll triggers, and image preloading
 */

'use strict';

import { getLenis } from './scroll.js';
import { preloadMoreWork } from './more-work.js';

/* Project card images - preload immediately */
const PROJECT_IMAGES = [
  'images/gfg.png',
  'images/pixel_chai.png',
  'images/coming-soon.png',
];

/* Preload all project images immediately for smooth rendering */
function preloadProjectImages() {
  PROJECT_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

export function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  /* Preload project images immediately for smooth rendering */
  preloadProjectImages();

  const preloader = document.getElementById('preloader');
  const plBar     = document.getElementById('plBar');
  const plName    = document.querySelector('.pl-name span');

  /* ── Lock scroll during preloader, scroll to top ── */
  const scrollLock = () => window.scrollTo(0, 0);
  window.addEventListener('scroll', scrollLock, { once: false });
  
  window.scrollTo(0, 0);
  setTimeout(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 0 });
      lenis.stop(); /* Disable Lenis scroll during preloader */
    }
  }, 10);

  /* Hide hero elements from the start so they don't flash before preloader completes */
  gsap.set('.nav-logo, .nav-right', { opacity: 0, y: -10 });
  gsap.set('.hero-eyebrow span',    { yPercent: 110 });
  gsap.set('.hero-title .tl span',  { yPercent: 110 });
  gsap.set('.hero-desc',            { opacity: 0, y: 24 });
  gsap.set('.pill',                 { opacity: 0, x: 36 });
  gsap.set('.scroll-hint',          { opacity: 0 });

  /* Preload all 25 song cover images immediately — parallel fetch via Promise cache */
  preloadMoreWork();

  /* Show preloader on every page load/refresh */
  /* Name slides up */
  gsap.to(plName, { y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });

  /* Bar fills via CSS transition (exactly as dvdrod.com does it) */
  setTimeout(() => { plBar.style.width = '100%'; }, 150);

  /* After 1300ms overlay slides up, then hero plays in onComplete */
  setTimeout(() => {
    gsap.to(preloader, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        
        /* Unlock scroll and restart Lenis */
        window.removeEventListener('scroll', scrollLock);
        const lenis = getLenis();
        if (lenis) lenis.start();
        
        heroIn();
      },
    });
  }, 1300);
}

/* ─────────────────────────────────────────────────────────── */

function heroIn() {
  /* Initial states already set in initAnimations() */
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl.to('.nav-logo',            { opacity: 1, y: 0, duration: 0.7 }, 0)
    .to('.nav-right',           { opacity: 1, y: 0, duration: 0.7 }, 0.12)
    .to('.hero-eyebrow span',   { yPercent: 0, duration: 0.85 },      0.08)
    .to('.hero-title .tl span', { yPercent: 0, duration: 1.15, stagger: 0.13 }, 0.12)
    .to('.hero-desc',           { opacity: 1, y: 0, duration: 0.85 }, 0.68)
    .to('.pill',                { opacity: 1, x: 0, duration: 0.65, stagger: 0.12 }, 0.80)
    .to('.scroll-hint',         { opacity: 1, duration: 0.6 }, 1.35);

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
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } }
    );
  });

  /* Parallax disabled on mobile to prevent jank */
  if (!isMobile) {
    gsap.utils.toArray('.js-parallax').forEach(el => {
      gsap.fromTo(el,
        { yPercent: -4 },
        { yPercent: 4, ease: 'none',
          scrollTrigger: {
            trigger: el.closest('.pcard'),
            start: 'top bottom', end: 'bottom top', scrub: 1.5,
          } }
      );
    });
  }

  gsap.utils.toArray('.sc-card').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 44 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'expo.out', delay: i * 0.08,
        scrollTrigger: { trigger: '#showcase', start: 'top 85%' } }
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