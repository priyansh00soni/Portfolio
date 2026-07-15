'use strict';

export function initSettings() {
  const btn = document.getElementById('settingsBtn');
  const panel = document.getElementById('settingsPanel');
  const toggleIntro = document.getElementById('toggleIntro');
  const toggleCursor = document.getElementById('toggleCursor');
  const toggleParticles = document.getElementById('toggleParticles');

  if (!btn || !panel) return;

  /* ── Load saved preferences (default: all ON) ── */
  const prefIntro     = localStorage.getItem('pref_intro') !== 'off';
  const prefCursor    = localStorage.getItem('pref_cursor') !== 'off';
  const prefParticles = localStorage.getItem('pref_particles') !== 'off';

  if (toggleIntro)     toggleIntro.checked = prefIntro;
  if (toggleCursor)    toggleCursor.checked = prefCursor;
  if (toggleParticles) toggleParticles.checked = prefParticles;

  /* Apply particles attribute immediately on load */
  if (!prefParticles) {
    document.documentElement.setAttribute('data-no-particles', '');
  }

  /* ── Toggle panel open/close ── */
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
  });

  /* Close on outside click */
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
      btn.classList.remove('active');
    }
  });

  /* ── Intro toggle (takes effect on next page load) ── */
  if (toggleIntro) {
    toggleIntro.addEventListener('change', () => {
      localStorage.setItem('pref_intro', toggleIntro.checked ? 'on' : 'off');
    });
  }

  /* ── Cursor trail toggle (takes effect on next page load) ── */
  if (toggleCursor) {
    toggleCursor.addEventListener('change', () => {
      localStorage.setItem('pref_cursor', toggleCursor.checked ? 'on' : 'off');
      // Immediately show/hide the cursor canvas
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.style.display = toggleCursor.checked ? '' : 'none';
      }
    });
  }

  /* ── Card particles & glow toggle (takes effect immediately) ── */
  if (toggleParticles) {
    toggleParticles.addEventListener('change', () => {
      localStorage.setItem('pref_particles', toggleParticles.checked ? 'on' : 'off');
      if (toggleParticles.checked) {
        document.documentElement.removeAttribute('data-no-particles');
      } else {
        document.documentElement.setAttribute('data-no-particles', '');
      }
    });
  }
}
