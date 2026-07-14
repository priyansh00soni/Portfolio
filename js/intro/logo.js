/**
 * intro/logo.js — logo assembly sampler.
 *
 * Renders the portfolio's existing "Priyansh Soni" wordmark (Syne 800) onto an
 * offscreen canvas, reads the pixels back, and returns a list of target points
 * the particle field flies into. This is how the logo is *built* from particles
 * rather than faded or typed — and it guarantees the shape matches the real
 * typography (same font-family, same weight) instead of a hand-made copy.
 */

'use strict';

import { WORDMARK, CONFIG } from './config.js';

/* Make sure Syne 800 is actually parsed before we rasterize it, otherwise the
   canvas falls back to a system font and the shape is wrong. Bounded so we
   never stall the intro waiting on the network. */
export async function ensureFont(timeoutMs = 700) {
  if (!document.fonts || !document.fonts.load) return;
  try {
    const load = Promise.all([
      document.fonts.load('800 80px "Syne"'),
      document.fonts.load('700 80px "Syne"'),
    ]);
    const timeout = new Promise((res) => setTimeout(res, timeoutMs));
    await Promise.race([load, timeout]);
    // Nudge the shaper so the first measureText/draw is already warm.
    if (document.fonts.check) document.fonts.check('800 80px "Syne"');
  } catch {
    /* font API hiccup — sampling still works with whatever is available */
  }
}

/**
 * Sample the wordmark to particle targets, centred on (cx, cy) in CSS pixels.
 *
 * @returns {{ points: Float32Array, count: number, width: number, height: number }}
 *          points is a flat [x0,y0, x1,y1, ...] array in CSS pixel space.
 */
export function sampleWordmark(cx, cy, viewportW) {
  const text = WORDMARK;

  /* Pick a font size that reads big but always fits with side padding.
     Mirrors the display feel of the hero/preloader wordmark. */
  let fontPx = Math.min(104, Math.max(34, viewportW * 0.11));

  /* Offscreen raster canvas. Sized generously around the measured text. */
  const raster = document.createElement('canvas');
  const rctx = raster.getContext('2d', { willReadFrequently: true });

  const fontStr = (px) => `800 ${px}px "Syne", sans-serif`;

  rctx.font = fontStr(fontPx);
  let metrics = rctx.measureText(text);
  let textW = metrics.width;

  /* Scale down if it would overflow the viewport. */
  const maxW = viewportW * 0.86;
  if (textW > maxW) {
    fontPx *= maxW / textW;
    rctx.font = fontStr(fontPx);
    metrics = rctx.measureText(text);
    textW = metrics.width;
  }

  const ascent = metrics.actualBoundingBoxAscent || fontPx * 0.72;
  const descent = metrics.actualBoundingBoxDescent || fontPx * 0.24;
  const textH = ascent + descent;

  const pad = Math.ceil(fontPx * 0.4);
  const W = Math.ceil(textW) + pad * 2;
  const H = Math.ceil(textH) + pad * 2;
  raster.width = W;
  raster.height = H;

  /* Re-set font (resizing the canvas resets context state). */
  rctx.font = fontStr(fontPx);
  rctx.fillStyle = '#fff';
  rctx.textAlign = 'left';
  rctx.textBaseline = 'alphabetic';
  rctx.letterSpacing = `${(-0.045 * fontPx).toFixed(2)}px`; // match wordmark tracking
  rctx.fillText(text, pad, pad + ascent);

  const img = rctx.getImageData(0, 0, W, H).data;

  /* Step chosen from font size to keep the point count around budget. */
  const step = Math.max(3, Math.round(fontPx / 15));
  const raw = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const alpha = img[(y * W + x) * 4 + 3];
      if (alpha > 128) raw.push(x, y);
    }
  }

  /* Thin down to the particle budget while keeping an even spread. */
  let pairs = raw.length / 2;
  const budget = CONFIG.maxParticles;
  let stride = 1;
  if (pairs > budget) stride = Math.ceil(pairs / budget);

  const originX = cx - W / 2;
  const originY = cy - H / 2;

  const pts = [];
  for (let i = 0; i < pairs; i += stride) {
    pts.push(originX + raw[i * 2], originY + raw[i * 2 + 1]);
  }

  return {
    points: new Float32Array(pts),
    count: pts.length / 2,
    width: W,
    height: H,
    fontPx,
  };
}
