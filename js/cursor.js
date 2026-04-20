/**
 * cursor.js — Magnetic canvas cursor
 * Draws trails following mouse movement
 */

'use strict';

export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  /* ── Config (verbatim from original) ── */
  const FRICTION   = 0.5;
  const TRAILS     = 20;
  const SIZE       = 50;
  const DAMPENING  = 0.25;
  const TENSION    = 0.98;
  const MIN_ALPHA  = 0.1;
  const MAX_ALPHA  = 0.4;
  const MIN_WIDTH  = 0.9;
  const MAX_WIDTH  = 1.8;
  /* Unpacked hex literals — faster than parseInt in hot path */
  const SR = 0x3B, SG = 0x82, SB = 0xF6; /* #3B82F6 */
  const ER = 0x22, EG = 0xD3, EB = 0xEE; /* #22D3EE */

  /* ── Precomputed per-trail values ── */
  const lineWidths   = new Float32Array(TRAILS);
  const strokeColors = new Array(TRAILS);
  const tSpring      = new Float32Array(TRAILS); /* per-trail spring (with jitter) */
  const tFriction    = new Float32Array(TRAILS); /* per-trail friction (with jitter) */

  function buildStyles() {
    const max = TRAILS - 1;
    for (let i = 0; i < TRAILS; i++) {
      const t = i / max;
      lineWidths[i] = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * t;
      const R = (SR + (ER - SR) * t + 0.5) | 0;
      const G = (SG + (EG - SG) * t + 0.5) | 0;
      const B = (SB + (EB - SB) * t + 0.5) | 0;
      const A = (MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * t).toFixed(3);
      strokeColors[i] = `rgba(${R},${G},${B},${A})`;
    }
  }

  /* ── Mouse ── */
  let mouseX = 0, mouseY = 0;
  let W = 0, H = 0;

  /* ── Float32Array node store ──
     One flat array. Per node: [x, y, vx, vy] (stride = 4).
     Access: base = trail * SIZE*4 + node*4
  ── */
  const STRIDE       = 4;
  const TRAIL_FLOATS = SIZE * STRIDE;
  const nodeData     = new Float32Array(TRAILS * TRAIL_FLOATS);

  function nodeBase(t, n) { return t * TRAIL_FLOATS + n * STRIDE; }

  function initTrails() {
    for (let t = 0; t < TRAILS; t++) {
      const base = 0.4 + (t / TRAILS) * 0.025;
      tSpring[t]   = base + 0.1 * Math.random() - 0.02;
      tFriction[t] = FRICTION + 0.01 * Math.random() - 0.002;
      for (let n = 0; n < SIZE; n++) {
        const b = nodeBase(t, n);
        nodeData[b]   = mouseX;
        nodeData[b+1] = mouseY;
        nodeData[b+2] = 0;
        nodeData[b+3] = 0;
      }
    }
  }

  function snapToMouse() {
    for (let t = 0; t < TRAILS; t++) {
      for (let n = 0; n < SIZE; n++) {
        const b = nodeBase(t, n);
        nodeData[b]   = mouseX;
        nodeData[b+1] = mouseY;
        nodeData[b+2] = 0;
        nodeData[b+3] = 0;
      }
    }
  }

  /* ── Idle detection — stop RAF when trails settle ── */
  let lastMoveAt = 0;
  let idleChecked = false;

  /* ── RAF ── */
  let rafId  = null;
  let running = false;

  function render(now) {
    if (!running) { rafId = null; return; }

    /* Idle check: stop loop if no movement for 3s and head velocities ~0 */
    if (!idleChecked && (now - lastMoveAt) > 3000) {
      idleChecked = true;
      let settled = true;
      for (let t = 0; t < TRAILS; t++) {
        const b = nodeBase(t, 0);
        if (Math.abs(nodeData[b+2]) > 0.05 || Math.abs(nodeData[b+3]) > 0.05) {
          settled = false; break;
        }
      }
      if (settled) { running = false; rafId = null; return; }
    }

    /* Clear */
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    /* Shared state — set ONCE per frame, not once per trail */
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    for (let t = 0; t < TRAILS; t++) {
      let sp       = tSpring[t];     /* decays along chain */
      const fric   = tFriction[t];

      /* ── Physics ── */
      const h = nodeBase(t, 0);      /* head */
      nodeData[h+2] += (mouseX - nodeData[h])   * sp;
      nodeData[h+3] += (mouseY - nodeData[h+1]) * sp;

      for (let n = 0; n < SIZE; n++) {
        const b = nodeBase(t, n);
        if (n > 0) {
          const p = nodeBase(t, n - 1);
          nodeData[b+2] += (nodeData[p]   - nodeData[b])   * sp;
          nodeData[b+3] += (nodeData[p+1] - nodeData[b+1]) * sp;
          nodeData[b+2] += nodeData[p+2]  * DAMPENING;
          nodeData[b+3] += nodeData[p+3]  * DAMPENING;
        }
        nodeData[b+2] *= fric;
        nodeData[b+3] *= fric;
        nodeData[b]   += nodeData[b+2];
        nodeData[b+1] += nodeData[b+3];
        sp            *= TENSION;
      }

      /* ── Draw ── */
      ctx.strokeStyle = strokeColors[t];
      ctx.lineWidth   = lineWidths[t];
      ctx.beginPath();

      const b0 = nodeBase(t, 0);
      ctx.moveTo(nodeData[b0], nodeData[b0+1]);

      const last = SIZE - 2;
      for (let n = 1; n < last; n++) {
        const b  = nodeBase(t, n);
        const b1 = nodeBase(t, n + 1);
        ctx.quadraticCurveTo(
          nodeData[b],  nodeData[b+1],
          0.5 * (nodeData[b] + nodeData[b1]),
          0.5 * (nodeData[b+1] + nodeData[b1+1])
        );
      }
      const bA = nodeBase(t, last);
      const bB = nodeBase(t, last + 1);
      ctx.quadraticCurveTo(nodeData[bA], nodeData[bA+1], nodeData[bB], nodeData[bB+1]);
      ctx.stroke();
    }

    rafId = requestAnimationFrame(render);
  }

  function startRender() {
    idleChecked = false;
    if (!rafId) { running = true; rafId = requestAnimationFrame(render); }
  }

  function stopRender() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ── Resize — debounced so resize events don't cause 60 layout recalcs/s ── */
  let resizeTimer = null;
  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(_applyResize, 100);
  }
  function _applyResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); /* clamp: 3× screens → 2× */
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width        = (W * dpr) | 0;
    canvas.height       = (H * dpr) | 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  /* ── Mouse handlers ── */
  let started = false;

  function onMove(e) {
    mouseX = 'touches' in e ? e.touches[0].pageX : e.clientX;
    mouseY = 'touches' in e ? e.touches[0].pageY : e.clientY;
    lastMoveAt = performance.now();
    if (!running) startRender(); /* wake from idle */
  }

  function onFirstMove(e) {
    document.removeEventListener('mousemove',  onFirstMove);
    document.removeEventListener('touchstart', onFirstMove);
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    if (!started) {
      started = true;
      onMove(e);
      initTrails();
      startRender();
    } else {
      onMove(e);
    }
  }

  /* ── Focus/blur ── */
  function onFocus() {
    stopRender();
    buildStyles();
    _applyResize();
    initTrails();
    snapToMouse();
    startRender();
  }
  function onBlur() { stopRender(); }
  function onHide() { document.hidden ? stopRender() : onFocus(); }

  /* ── Boot ── */
  buildStyles();
  _applyResize();

  document.addEventListener('mousemove',  onFirstMove, { passive: true });
  document.addEventListener('touchstart', onFirstMove, { passive: true });
  window.addEventListener('resize',            resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('focus',  onFocus);
  window.addEventListener('blur',   onBlur);
  document.addEventListener('visibilitychange', onHide);
}
