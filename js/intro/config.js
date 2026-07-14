/**
 * intro/config.js — single source of truth for the cinematic intro.
 *
 * Nothing here touches the portfolio. Tune the story from this file:
 * keyword list, wordmark, particle budget and the master timing map.
 * All durations are in SECONDS (GSAP native) unless noted.
 */

'use strict';

/* The exact wordmark used by the portfolio — Syne 800 (var(--font-display)). */
export const WORDMARK = 'Priyansh Soni';

/* Engineering vocabulary that orbits the brackets. Isolated words only. */
export const KEYWORDS = [
  'Node.js',
  'TypeScript',
  'PostgreSQL',
  'Redis',
  'Docker',
  'BullMQ',
  'MongoDB',
  'Express',
  'JWT',
  'Cloudinary',
  'Gemini AI',
  'Architecture',
  'Infrastructure',
  'Performance',
  'Observability',
];

export const CONFIG = {
  /* Particle budget. Scaled down on mobile for GPU performance. */
  maxParticles: (typeof window !== 'undefined' && window.innerWidth <= 600) ? 800 : 1850,

  /* How many keywords to actually place (kept modest for calm, not clutter). */
  keywordCount: 15,

  /* Monospace stack — no webfont is loaded, so ride the system mono. */
  monoFont:
    "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

  /* Intro palette — black / white / subtle gray only. */
  color: {
    particle: '255, 255, 255',   // rgb, alpha applied per-particle
  },

  /* Particle look. */
  particle: {
    minSize: 3.3,
    maxSize: 2.4,
    orbitMinR: 190,   // ambient cloud inner radius (px)
    orbitMaxR: 500,   // ambient cloud outer radius (px)
    baseSpin: 0.10,   // rad/s — calm ambient rotation
    compileSpin: 0.28,// rad/s — accelerated "gravity" during compilation
    ease: 9,        // position spring stiffness (higher = snappier)
    logoJitter: 0.3,  // px of shimmer once assembled
  },


  /* Master timeline (seconds). Total visual runtime stays < 6s desktop, ~7.5s mobile. */
t: (() => {
  const mob = typeof window !== 'undefined' && window.innerWidth <= 600;
  return {
    brackets:   { at: 0.30, dur: 1.10 },
    keywordsIn: { at: 0.90, dur: 1.20 },
    compile:    { at: 2.10, dur: 1.00 },
    assemble:   { at: 2.70, dur: mob ? 2.6  : 2.2  },
    energy:     { at: mob ? 4.20 : 3.90, dur: mob ? 0.85 : 0.60 },
    charge:     { at: mob ? 5.10 : 4.55, dur: mob ? 0.50 : 0.35 },
    bloom:      { at: mob ? 4.85 : 4.32, dur: mob ? 0.85 : 0.58 },
    reveal:     { at: mob ? 5.60 : 4.90 },
    disperse:   { at: mob ? 5.60 : 4.90, dur: mob ? 1.30 : 0.95 },
    end:        { at: mob ? 7.40 : 6.25 },
  };
})(),

};
