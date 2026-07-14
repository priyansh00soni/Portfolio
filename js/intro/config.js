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
  /* Particle budget. Actual count = min(sampled logo points, maxParticles). */
  maxParticles: 1850,

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


  /* Master timeline (seconds). Total visual runtime stays < 6s. */
t: {
  brackets:   { at: 0.30, dur: 1.10 }, // Stage 2 — brackets fade/scale in
  keywordsIn: { at: 0.90, dur: 1.20 }, // Stage 4 — keywords appear + orbit
  compile:    { at: 2.10, dur: 1.00 }, // Stage 5 — converge / gravity
  assemble:   { at: 2.70, dur: 2.2  }, // Stage 6 — wordmark builds L→R
  energy:     {  at: 3.90, dur: 1.80 }, // Stage 7 — glow builds
  bloom:      { at: 4.40, dur: 2.80  }, // Stage 8 — white bloom fills
  reveal:     {  at: 4.90 },            // Stage 10 — hero begins under bloom
  disperse:   { at: 5.4,  dur: 3.20 }, // Stage 9 — particles fly outward
  end:        { at: 8.50 }             // hard teardown ceiling
},

};
