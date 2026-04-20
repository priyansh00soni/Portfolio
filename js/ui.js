/**
 * ui.js — Non-animation UI interactions
 * Theme toggle · Copy email · Showcase drag-to-scroll
 */

'use strict';

/* ── THEME ── */
export function initTheme() {
  const html  = document.documentElement;
  const tBtn  = document.getElementById('themeBtn');
  const tIcon = document.getElementById('tIcon');
  const tLbl  = document.getElementById('tLabel');
  let   dark  = true;

  function applyTheme(d) {
    dark = d;
    html.setAttribute('data-theme', d ? 'dark' : 'light');
    tIcon.textContent = d ? '◐' : '◑';
    tLbl.textContent  = d ? 'Light' : 'Dark';
    localStorage.setItem('dvdrod_theme', d ? 'dark' : 'light');
    
    /* Dispatch custom event for spark color update */
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: d } }));
  }

  const stored = localStorage.getItem('dvdrod_theme');
  if (stored) applyTheme(stored === 'dark');
  else        applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);

  tBtn.addEventListener('click', () => applyTheme(!dark));
}

/* Get spark color based on current theme */
export function getSparkColor() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark ? '#EDEDE8' : '#1a1a1a'; /* Light for dark mode, dark for light mode */
}

/* ── COPY EMAIL ── */
export function initCopyEmail() {
  const btn = document.getElementById('copyBtn');
  if (!btn) return;

  const iconCopy = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="7" height="7" rx="1.2"/><path d="M1.5 8.5V2.5a1 1 0 0 1 1-1h6"/></svg>`;
  const iconCheck = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>`;

  btn.addEventListener('click', () => {
    navigator.clipboard.writeText('priyansh.worskspace@gmail.com').then(() => {
      btn.classList.add('copied');
      btn.innerHTML = iconCheck;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = iconCopy;
      }, 2000);
    });
  });
}

/* ── SHOWCASE DRAG-TO-SCROLL ── */
export function initShowcaseDrag() {
  const track = document.getElementById('showcaseTrack');
  if (!track) return;

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  let isDown   = false;
  let startX   = 0;
  let scrollLeft = 0;

  if (!isTouchDevice) {
    /* Mouse drag on desktop */
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX     = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.6;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  /* Touch support for all devices */
  let touchStartX = 0;
  let touchScrollLeft = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX    = e.touches[0].pageX;
    touchScrollLeft = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const diff = touchStartX - e.touches[0].pageX;
    track.scrollLeft = touchScrollLeft + diff;
  }, { passive: true });
}
