/**
 * intro/particles.js — lightweight canvas particle field.
 *
 * Lifecycle: create → start → (orbit / compile / assemble / disperse) → destroy
 * The field is driven by the GSAP timeline via exported setPhase()/setProgress().
 * It never outlives the intro — destroy() tears everything down cleanly.
 */

'use strict';

import { CONFIG } from './config.js';

/* ── Phases ── */
const PHASE_IDLE     = 0; // ambient orbit around centre
const PHASE_COMPILE  = 1; // accelerate + pull inward
const PHASE_ASSEMBLE = 2; // fly to logo target points
const PHASE_HOLD     = 3; // shimmer in place on the wordmark
const PHASE_DISPERSE = 4; // explode outward → off-screen
const PHASE_DONE     = 5;

export function createField(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const cfg = CONFIG.particle;
  const rgb = CONFIG.color.particle;

  let W = 0, H = 0, cx = 0, cy = 0, dpr = 1;
  let phase = PHASE_IDLE;
  let assembleProgress = 0; // 0→1 controls left-to-right logo reveal
  let globalAlpha = 0;      // faded in by timeline
  let rafId = null;
  let running = false;

  /* ── Particle arrays (SoA for cache-friendliness) ── */
  let n = 0; // count
  let px, py;       // current position
  let tx, ty;       // target (logo point or orbit destination)
  let angle, radius, speed, size, alpha;
  let logoOrder;    // normalised 0-1 left-to-right position for staggered assembly

  /* ── Sizing ── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.parentElement.clientWidth;
    H = canvas.parentElement.clientHeight;
    canvas.width  = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
  }

  /* ── Init particles in a circular cloud ── */
  function init(count) {
    n = count;
    px      = new Float32Array(n);
    py      = new Float32Array(n);
    tx      = new Float32Array(n);
    ty      = new Float32Array(n);
    angle   = new Float32Array(n);
    radius  = new Float32Array(n);
    speed   = new Float32Array(n);
    size    = new Float32Array(n);
    alpha   = new Float32Array(n);
    logoOrder = new Float32Array(n);
    

    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = cfg.orbitMinR + Math.random() * (cfg.orbitMaxR - cfg.orbitMinR);
      angle[i]  = a;
      radius[i] = r;
      speed[i]  = (0.6 + Math.random() * 0.8) * cfg.baseSpin;
      size[i]   = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
      alpha[i] = 0.55 + Math.random() * 0.45;
      px[i] = cx + Math.cos(a) * r;
      py[i] = cy + Math.sin(a) * r;
      tx[i] = px[i];
      ty[i] = py[i];
    }
  }

  /* ── Set logo target positions (from logo.js sampler) ── */
  function setLogoTargets(points, count) {
    // points is Float32Array [x0,y0, x1,y1, …]
    // if count < n, remaining particles disperse outward
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < count; i++) {
      const lx = points[i * 2];
      if (lx < minX) minX = lx;
      if (lx > maxX) maxX = lx;
    }
    const rangeX = maxX - minX || 1;
    for (let i = 0; i < n; i++) {
      if (i < count) {
        tx[i] = points[i * 2];
        ty[i] = points[i * 2 + 1];
        logoOrder[i] = (tx[i] - minX) / rangeX; // 0 = left, 1 = right
      } else {
        // overflow particles: push off-screen radially
        const a = Math.random() * Math.PI * 2;
        tx[i] = cx + Math.cos(a) * (W + 200);
        ty[i] = cy + Math.sin(a) * (H + 200);
        logoOrder[i] = 2; // always revealed last (effectively hidden)
      }
    }
  }

  /* ── Per-frame ── */
  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    if (globalAlpha <= 0 || phase === PHASE_DONE) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const ease = (phase === PHASE_DISPERSE) ? 158 : cfg.ease; 
    const jitter = cfg.logoJitter;

    for (let i = 0; i < n; i++) {
      let destX, destY, a = alpha[i] * globalAlpha;

      if (phase === PHASE_IDLE || phase === PHASE_COMPILE) {
        // orbit
        const spinRate = phase === PHASE_COMPILE ? cfg.compileSpin : speed[i];
        angle[i] += spinRate * 0.016; // ~60fps dt
        const r = phase === PHASE_COMPILE
          ? radius[i] * (1 - assembleProgress * 0.6) // shrink orbit
          : radius[i];
        destX = cx + Math.cos(angle[i]) * r;
        destY = cy + Math.sin(angle[i]) * r;
      } else if (phase === PHASE_ASSEMBLE) {
        // particles whose logoOrder ≤ assembleProgress fly to target
        if (logoOrder[i] <= assembleProgress) {
          destX = tx[i];
          destY = ty[i];
        } else {
          // still orbiting but tightening
          angle[i] += cfg.compileSpin * 0.016;
          const r = radius[i] * 0.35;
          destX = cx + Math.cos(angle[i]) * r;
          destY = cy + Math.sin(angle[i]) * r;
        }
      } else if (phase === PHASE_HOLD) {
        destX = tx[i] + (Math.random() - 0.5) * jitter;
        destY = ty[i] + (Math.random() - 0.5) * jitter;
        a = Math.min(1, alpha[i] * globalAlpha * 2.2);
      } else if (phase === PHASE_DISPERSE) {
        // radial explosion from centre
        const dx = tx[i] - cx || 0.01;
        const dy = ty[i] - cy || 0.01;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pushDist = W * 1.6;   // was 1.2 — fly further
        destX = cx + (dx / dist) * pushDist;
        destY = cy + (dy / dist) * pushDist;
      } else {
        destX = px[i]; destY = py[i];
      }

      // spring toward dest
      px[i] += (destX - px[i]) / ease;
      py[i] += (destY - py[i]) / ease;

      // draw
      
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.fillRect(px[i] - size[i] * 0.5, py[i] - size[i] * 0.5, size[i], size[i]);
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ── Public API ── */
  function start(count) {
    resize();
    init(count);
    running = true;
    rafId = requestAnimationFrame(tick);
  }

  function setPhase(p) { phase = p; }
  function setAlpha(v) { globalAlpha = v; }
  function setAssembleProgress(v) { assembleProgress = v; }

  function destroy() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, W, H);
    px = py = tx = ty = angle = radius = speed = size = alpha = logoOrder = null;
  }

  return {
    start,
    resize,
    setPhase,
    setAlpha,
    setAssembleProgress,
    setLogoTargets,
    destroy,
    /* expose constants for timeline */
    PHASE_IDLE, PHASE_COMPILE, PHASE_ASSEMBLE, PHASE_HOLD, PHASE_DISPERSE, PHASE_DONE,
  };
}
