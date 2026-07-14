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
    display: 'grid',
    placeItems: 'center',
    pointerEvents: 'all',
    willChange: 'mask-image, -webkit-mask-image',
    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 0px, transparent var(--reveal-inner), black var(--reveal-outer))',
    maskImage: 'radial-gradient(circle at 50% 50%, transparent 0px, transparent var(--reveal-inner), black var(--reveal-outer))',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    '--reveal-inner': '0px',
    '--reveal-outer': '0px',
  });

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    opacity: '0',
  });
  container.appendChild(canvas);

  const centeredLayer = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const brackets = document.createElement('div');
  brackets.setAttribute('aria-hidden', 'true');
  Object.assign(brackets.style, {
    ...centeredLayer,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.1em',
    fontSize: '72px', fontWeight: '200', color: '#fff',
    lineHeight: '1', letterSpacing: '0.2em',
    whiteSpace: 'nowrap', userSelect: 'none',
    textShadow: '0 0 20px rgba(255,255,255,0.15)',
    opacity: '0', willChange: 'transform, opacity',
    fontFamily: CONFIG.monoFont,
  });

  brackets.innerHTML = '&lt;';

  const avatarImg = document.createElement('img');
  avatarImg.src = '../../images/avatar.png'; // adjust path to wherever you place the file
  avatarImg.setAttribute('aria-hidden', 'true');
  avatarImg.alt = '';
  Object.assign(avatarImg.style, {
    display: 'inline-block',
    width: '96px',
    height: '96px',
    objectFit: 'contain',
    verticalAlign: 'middle',
    willChange: 'transform, opacity',
  });
  brackets.appendChild(avatarImg);

  brackets.insertAdjacentHTML('beforeend', '&gt;');
  container.appendChild(brackets);

  // Continuous, independent pulse for the avatar.
  const starPulse = gsap.to(avatarImg, {
    scale: 1.08,
    opacity: 0.75,
    duration: 0.9,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });

  const keywordsWrap = document.createElement('div');
  Object.assign(keywordsWrap.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
  });
  container.appendChild(keywordsWrap);

  const shuffled = KEYWORDS.slice().sort(() => Math.random() - 0.5);
  const kwCount = Math.min(CONFIG.keywordCount, shuffled.length);
  const keywordEls = [];
  const keywordPositions = [];

  // Keep the keyword ring compact so the loader reads as a centered composition.
  const radiusX = Math.min(window.innerWidth * 0.34, 480);
  const radiusY = Math.min(window.innerHeight * 0.24, 310);
  const phase = -Math.PI / 2;

  for (let i = 0; i < kwCount; i++) {
    const el = document.createElement('span');

    const angle = phase + (i / kwCount) * Math.PI * 2;
    const wobble = i % 2 === 0 ? 0.95 : 1.05;
    const rx = radiusX * wobble;
    const ry = radiusY * (2 - wobble);
    keywordPositions.push({
      el,
      x: Math.cos(angle) * rx,
      y: Math.sin(angle) * ry,
    });

    Object.assign(el.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: CONFIG.monoFont,
      fontSize: `${20 + (i % 3) * 0.5}px`,
      fontWeight: '600',
      letterSpacing: '0.04em',
      color: 'rgba(255,255,255,0.9)',
      opacity: '0',
      background: 'none',
      filter: 'none',
      textShadow: '0 0 4px rgba(255,255,255,0.55), 0 0 10px rgba(255,255,255,0.24), 0 0 18px rgba(255,255,255,0.12)',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      userSelect: 'none',
      willChange: 'transform, opacity',
      padding: '2px 6px',
    });

    el.textContent = shuffled[i];

    keywordsWrap.appendChild(el);
    keywordEls.push(el);
  }

  const centroid = keywordPositions.reduce((acc, item) => {
    acc.x += item.x;
    acc.y += item.y;
    return acc;
  }, { x: 0, y: 0 });

  centroid.x /= keywordPositions.length || 1;
  centroid.y /= keywordPositions.length || 1;

  const ellipseOffsetX = -40;

  keywordPositions.forEach(({ el, x, y }) => {
    const ox = x - centroid.x + ellipseOffsetX;
    const oy = y - centroid.y;
    el.dataset.ox = String(ox);
    el.dataset.oy = String(oy);

    gsap.set(el, {
      x: ox,
      y: oy,
    });
  });

  const bloom = document.createElement('div');
  Object.assign(bloom.style, {
    ...centeredLayer,
    width: '120px', height: '120px',
    borderRadius: '50%', background: '#fff',
    opacity: '0', willChange: 'transform, opacity',
    filter: 'blur(40px)',
  });
  container.appendChild(bloom);

  const revealPulse = document.createElement('div');
  revealPulse.setAttribute('aria-hidden', 'true');
  Object.assign(revealPulse.style, {
    ...centeredLayer,
    width: '180px', height: '180px',
    transform: 'translate(-50%, -50%) scale(0.2)',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.92)',
    boxShadow: '0 0 36px rgba(255,255,255,0.38), inset 0 0 18px rgba(255,255,255,0.16)',
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
    mixBlendMode: 'screen',
  });
  container.appendChild(revealPulse);

  document.body.appendChild(container);

  /* ── Particle field ── */
  const field = createField(canvas);
  field.start(CONFIG.maxParticles);

  /* ── GSAP timeline ── */
  const dom = { container, canvas, brackets, bloom, revealPulse, keywordsWrap, keywordEls };
  let revealed = false;
  let cleaned = false;

  function reveal() {
    if (!revealed) { revealed = true; onReveal(); }
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    tl.kill();
    starPulse.kill();
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