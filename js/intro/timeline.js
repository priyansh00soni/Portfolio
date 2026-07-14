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
  const logo = sampleWordmark(cx, cy, vw);
  field.setLogoTargets(logo.points, logo.count);

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
      tl.to(el, { opacity: 0.35 + Math.random() * 0.2, duration: 0.3, ease: 'power2.out' }, delay);
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

  /* Stage 8 — white bloom */
  tl.to(dom.bloom, {
    opacity: 1, scale: 4, duration: t.bloom.dur, ease: 'expo.out',
  }, t.bloom.at);

  /* Stage 10 — reveal portfolio */
  tl.call(() => { if (onReveal) onReveal(); }, null, t.reveal.at);

  /* Stage 9 — disperse + fade out */
  tl.call(() => field.setPhase(field.PHASE_DISPERSE), null, t.disperse.at);
  tl.to(dom.bloom, { opacity: 0, duration: 0.4, ease: 'power2.out' }, t.disperse.at);
// Change disperse canvas fade from 0.45 → 0.9
  tl.to(dom.canvas,    { opacity: 0, duration: 0.9,  ease: 'power1.out' }, t.disperse.at + 0.05);
  tl.to(dom.container, { opacity: 0, duration: 0.6,  ease: 'power1.out' }, t.disperse.at + 0.3);

  tl.call(() => field.setPhase(field.PHASE_DONE), null, t.end.at);

  return tl;
}
