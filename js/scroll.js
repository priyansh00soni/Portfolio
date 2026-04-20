/**
 * scroll.js — Lenis smooth scroll initialization
 * Handles desktop smooth scroll and mobile native scroll
 */

'use strict';

let lenis;

/* Shared easing — expo decay. Extracted so it's allocated once. */
const expoDecay = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function initScroll() {
  /* Disable Lenis on touch devices — use native scroll instead */
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  
  if (isTouchDevice) {
    /* Mobile: use native browser scroll with smooth behavior */
    document.documentElement.style.scrollBehavior = 'smooth';
    
    /* Anchor links still work smoothly */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    return;
  }
  
  /* Desktop: use Lenis smooth scroll */
  lenis = new Lenis({
    duration:         1.2,
    easing:           expoDecay,
    direction:        'vertical',
    gestureDirection: 'vertical',
    smooth:           true,
    smoothTouch:      true,
    touchMultiplier:  2,
  });

  /* Sync Lenis → ScrollTrigger */
  lenis.on('scroll', ScrollTrigger.update);

  /* Plug Lenis into GSAP's RAF */
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Nav pill state */
  const navEl = document.getElementById('nav');
  let navScrolled = false;

  lenis.on('scroll', ({ scroll }) => {
    const s = scroll > 60;
    if (s === navScrolled) return;
    navScrolled = s;
    navEl.classList.toggle('scrolled', s);
  });

  /* Smooth anchor links — one delegated listener instead of N listeners */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.4, easing: expoDecay });
  });
}

export function getLenis() { return lenis; }
