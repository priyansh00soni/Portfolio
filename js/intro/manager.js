/**
 * intro/manager.js — cinematic intro lifecycle.
 *
 * Builds the intro DOM, wires the particle field + GSAP timeline, handles
 * reduced-motion, runs the animation, and tears everything down cleanly.
 */

'use strict';

import { CONFIG, KEYWORDS } from './config.js';
import { ensureFont } from './logo.js';
import { createField } from './particles.js';
import { buildTimeline } from './timeline.js';

export async function runIntro(onReveal) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onReveal();
    return;
  }

  await ensureFont();

  /* ── Build DOM ── */
  const container = document.createElement('div');
  container.id = 'cinematic-intro';
  Object.assign(container.style, {
    position: 'fixed', inset: '0', zIndex: '10000',
    background: '#000', overflow: 'hidden',
    pointerEvents: 'all',
  });

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    opacity: '0',
  });
  container.appendChild(canvas);

  const brackets = document.createElement('div');
  brackets.setAttribute('aria-hidden', 'true');
  Object.assign(brackets.style, {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '72px', fontWeight: '200', color: '#fff',
    letterSpacing: '0.3em', userSelect: 'none',
    textShadow: '0 0 20px rgba(255,255,255,0.15)',
    opacity: '0', willChange: 'transform, opacity',
    fontFamily: CONFIG.monoFont,
  });
  brackets.textContent = '< >';
  container.appendChild(brackets);

  const keywordsWrap = document.createElement('div');
  Object.assign(keywordsWrap.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none',
  });
  container.appendChild(keywordsWrap);

 const shuffled = KEYWORDS.slice().sort(() => Math.random() - 0.5);
const kwCount = Math.min(CONFIG.keywordCount, shuffled.length);
const keywordEls = [];

// Large cinematic ellipse around the brackets
const radiusX = Math.min(window.innerWidth * 0.38, 520);
const radiusY = Math.min(window.innerHeight * 0.30, 340);

for (let i = 0; i < kwCount; i++) {
  const el = document.createElement('span');

  // Even spacing with slight randomness
  const angle =
    (i / kwCount) * Math.PI * 2 +
    (Math.random() - 0.5) * 0.22;

const radiusX = Math.min(window.innerWidth * 0.38, 520);
const radiusY = Math.min(window.innerHeight * 0.28, 320);

const rx = radiusX + Math.random() * 80;
const ry = radiusY + Math.random() * 60;

  const ox = Math.cos(angle) * rx;
  const oy = Math.sin(angle) * ry;

  Object.assign(el.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',

    fontFamily: CONFIG.monoFont,
    fontSize: `${18 + Math.random() * 2}px`,
    fontWeight: '500',
    letterSpacing:'0.03em',
    color:'rgba(255,255,255,0.9)',

opacity:'0',

filter:`blur(${Math.random()*1.2}px)`,

    whiteSpace: 'nowrap',
    textAlign: 'center',

    userSelect: 'none',
    willChange: 'transform, opacity',

    padding: '2px 8px',
  });

  el.textContent = shuffled[i];

  el.dataset.ox = String(ox);
  el.dataset.oy = String(oy);

  gsap.set(el, {
    x: ox,
    y: oy,
  });

  keywordsWrap.appendChild(el);
  keywordEls.push(el);
}

  const bloom = document.createElement('div');
  Object.assign(bloom.style, {
    position: 'absolute', top: '50%', left: '50%',
    width: '120px', height: '120px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%', background: '#fff',
    opacity: '0', willChange: 'transform, opacity',
    filter: 'blur(40px)',
  });
  container.appendChild(bloom);

  document.body.appendChild(container);

  /* ── Particle field ── */
  const field = createField(canvas);
  field.start(CONFIG.maxParticles);

  /* ── GSAP timeline ── */
  const dom = { container, canvas, brackets, bloom, keywordsWrap, keywordEls };
  let revealed = false;
  let cleaned = false;

  function reveal() {
    if (!revealed) { revealed = true; onReveal(); }
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    tl.kill();
    field.destroy();
    if (container.parentNode) container.parentNode.removeChild(container);
  }

  const tl = buildTimeline(dom, field, reveal);

  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => {
      cleanup();
      resolve();
    });
    tl.play();

    setTimeout(() => {
      reveal();
      cleanup();
      resolve();
    }, (CONFIG.t.end.at + 0.5) * 1000);
  });
}
