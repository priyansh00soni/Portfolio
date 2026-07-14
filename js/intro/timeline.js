'use strict';

import { CONFIG } from './config.js';
import { sampleWordmark } from './logo.js';

export function buildTimeline(dom, field, onReveal) {
  const t = CONFIG.t;
  const tl = gsap.timeline({ paused: true });

  const vw = dom.container.clientWidth;
  const vh = dom.container.clientHeight;
  const cx = vw / 2;
  const cy = vh / 2;
  const revealFeather = Math.min(Math.max(Math.round(Math.min(vw, vh) * 0.16), 180), 240);
  const revealRadius = Math.hypot(vw / 2, vh / 2) + revealFeather + 160;
  const logo = sampleWordmark(cx, cy, vw);
  field.setLogoTargets(logo.points, logo.count);

  function setRevealMask(radius) {
    const outer = Math.max(0, radius);
    const inner = Math.max(0, outer - revealFeather);
    dom.container.style.setProperty('--reveal-inner', `${inner}px`);
    dom.container.style.setProperty('--reveal-outer', `${outer}px`);
  }

  setRevealMask(0);

  /* Stage 1 — void */
  tl.set(dom.canvas, { opacity: 1 }, 0);

  const alphaObj = { v: 0 };
  tl.to(alphaObj, {
    v: 1, duration: 0.4,
    onUpdate() { field.setAlpha(alphaObj.v); },
  }, 0.05);

  /* Stage 2 — brackets */
  tl.fromTo(dom.brackets, { opacity: 0, scale: 0.7 },
    { opacity: 1, scale: 1, duration: t.brackets.dur, ease: 'power2.out' },
    t.brackets.at);

  tl.to(dom.brackets, {
    scale: 1.04, duration: 0.35, ease: 'power2.inOut', yoyo: true, repeat: 1,
  }, t.brackets.at + t.brackets.dur);

  /* Stage 4 — keywords appear */
  if (dom.keywordEls && dom.keywordEls.length) {
    dom.keywordEls.forEach((el, i) => {
      const delay = t.keywordsIn.at + (i / dom.keywordEls.length) * t.keywordsIn.dur;
      tl.fromTo(el,
        { opacity: 0, scale: 0.88 },
        { opacity: 0.6, scale: 1, duration: 0.5, ease: 'power1.out' },
        delay);
    });
  }

  /* Stage 5 — compilation */
  const compileAt = t.compile.at;
  if (dom.keywordEls && dom.keywordEls.length) {
    dom.keywordEls.forEach((el) => {
      tl.to(el, {
        x: 0, y: 0, opacity: 0, scale: 0.3, duration: t.compile.dur, ease: 'power3.in',
      }, compileAt);
    });
  }

  tl.to(dom.brackets, { opacity: 0, scale: 0.5, duration: 0.3, ease: 'power2.in' }, compileAt + 0.1);

  tl.call(() => field.setPhase(field.PHASE_COMPILE), null, compileAt);
  const compObj = { p: 0 };
  tl.to(compObj, {
    p: 1, duration: t.compile.dur, ease: 'power2.in',
    onUpdate() { field.setAssembleProgress(compObj.p); },
  }, compileAt);

  /* Stage 6 — wordmark assembly */
  tl.call(() => field.setPhase(field.PHASE_ASSEMBLE), null, t.assemble.at);
  const asmObj = { p: 0 };
  tl.to(asmObj, {
    p: 1, duration: t.assemble.dur, ease: 'power3.out',
    onUpdate() { field.setAssembleProgress(asmObj.p); },
  }, t.assemble.at);

  tl.call(() => field.setPhase(field.PHASE_HOLD), null, t.assemble.at + t.assemble.dur);

  /* Stage 7 — energy glow */
  tl.to(dom.bloom, { opacity: 0.25, duration: t.energy.dur, ease: 'power2.in' }, t.energy.at);
  tl.to(dom.canvas, { scale: 1.012, duration: t.charge.dur, ease: 'power4.out' }, t.charge.at);

  const chargeState = { p: 0 };
  tl.to(chargeState, {
    p: 1,
    duration: t.charge.dur,
    ease: 'power4.in',
    onUpdate() { field.setChargeProgress(chargeState.p); },
  }, t.charge.at);

  /* Stage 8 — white bloom */
  tl.to(dom.bloom, {
    opacity: 1,
    scale: 4.45,
    duration: t.bloom.dur,
    ease: 'expo.out',
  }, t.bloom.at);

  /* Stage 10 — reveal portfolio (slower on mobile) */
  const isMobile = dom.container.clientWidth <= 600;
  const revealState = { r: 0 };
  tl.to(revealState, {
    r: revealRadius,
    duration: isMobile ? 2.2 : 1.32,
    ease: 'expo.out',
    onUpdate() { setRevealMask(revealState.r); },
  }, t.reveal.at);

  const burstState = { p: 0 };
  tl.call(() => {
    field.setPhase(field.PHASE_DISPERSE);
    if (onReveal) onReveal();
  }, null, t.reveal.at);

  tl.to(burstState, {
    p: 1,
    duration: isMobile ? 0.35 : 0.18,
    ease: 'power4.out',
    onUpdate() { field.setBurstProgress(burstState.p); },
  }, t.reveal.at);

  tl.to(dom.revealPulse, {
    opacity: 0.95,
    scale: 0.75,
    duration: isMobile ? 0.22 : 0.12,
    ease: 'power2.out',
  }, t.reveal.at + 0.05);

  tl.to(dom.container, {
    x: -22,
    y: 10,
    rotation: -2.2,
    duration: 0.025,
    ease: 'none',
  }, t.reveal.at + 0.12);

  tl.to(dom.container, {
    x: 18,
    y: -8,
    rotation: 1.9,
    duration: 0.03,
    ease: 'none',
  }, t.reveal.at + 0.155);

  tl.to(dom.container, {
    x: -14,
    y: 6,
    rotation: -1.2,
    duration: 0.025,
    ease: 'none',
  }, t.reveal.at + 0.195);

  tl.to(dom.container, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.06,
    ease: 'power2.out',
  }, t.reveal.at + 0.235);

  tl.to(dom.revealPulse, {
    opacity: 0,
    scale: 5.8,
    duration: isMobile ? 3.6 : 2.48,
    ease: 'expo.out',
  }, t.reveal.at + 0.16);

  /* Stage 9 — disperse + fade out */
  tl.to(dom.bloom, { opacity: 0, scale: 5.2, duration: isMobile ? 0.8 : 0.5, ease: 'power3.out' }, t.disperse.at);
  tl.to(dom.canvas, { opacity: 0, duration: t.disperse.dur + 0.12, ease: 'expo.out' }, t.disperse.at + 0.02);
  tl.to(dom.container, { opacity: 0, duration: isMobile ? 0.8 : 0.52, ease: 'power2.out' }, t.disperse.at + (isMobile ? 0.8 : 0.56));

  tl.call(() => field.setPhase(field.PHASE_DONE), null, t.end.at);

  return tl;
}
