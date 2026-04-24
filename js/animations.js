/**
 nimations.js — GSAP animations + preloading
 Handles preloader, hero entrance, scroll triggers, and image preloading
 */

'use strict';

import { getLenis } from './scroll.js';

/* Song cover images for preloading */
const SONG_IMAGES = [
  '../song-coverImages/cover-1 ajab prem.jpg',
  '../song-coverImages/cover-2 rakhlo chupake.png',
  '../song-coverImages/cover-3 2states.jpg',
  '../song-coverImages/cover-4 sunflower.jpg',
  '../song-coverImages/cover-5 starboy.jpg',
  '../song-coverImages/cover-6 dil nu.jpg',
  '../song-coverImages/cover-7 intentions.jpg',
  '../song-coverImages/cover-8 khat.jpg',
  '../song-coverImages/cover-9 raaston.jpg',
  '../song-coverImages/cover-10 aasmani.jpg',
  '../song-coverImages/cover -11 sun sawariya.jpg',
  '../song-coverImages/cover-12 imagine dragoons.jpg',
  '../song-coverImages/cover-13 for a reason.jpg',
  '../song-coverImages/cover-14 attention.jpg',
  '../song-coverImages/cover-15 bairan.jpg',
  '../song-coverImages/cover-16 heat waves.jpg',
  '../song-coverImages/cover-17 rang jo.jpg',
  '../song-coverImages/cover-18 badlapur.jpg',
  '../song-coverImages/cover-19 all the satrs.jpg',
  '../song-coverImages/cover-20 lata ji.jpg',
  '../song-coverImages/cover-21 dilwale.jpg',
  '../song-coverImages/cover-22 aaj se.jpg',
  '../song-coverImages/cover-23 atif.jpg',
  '../song-coverImages/cover-24 7years.jpg',
  '../song-coverImages/cover-25 darkhaast.jpg',
];

/* Preload first N images during preloader, remainder after hero animations */
const PRIORITY_PRELOAD_COUNT = 6;

function preloadImages(startIdx = 0, count = 6) {
  const endIdx = Math.min(startIdx + count, SONG_IMAGES.length);
  for (let i = startIdx; i < endIdx; i++) {
    const img = new Image();
    img.src = SONG_IMAGES[i];
  }
}

export function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

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

  /* START preloading images during preloader display (1300ms window) */
  preloadImages(0, PRIORITY_PRELOAD_COUNT);

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

  /* Preload remaining images after hero animations (non-blocking background load) */
  setTimeout(() => {
    preloadImages(PRIORITY_PRELOAD_COUNT, SONG_IMAGES.length - PRIORITY_PRELOAD_COUNT);
  }, 1000);
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
