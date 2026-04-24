
import { initCursor }       from './cursor.js';
import { initClickSpark }   from './clickspark.js';
import { initScroll }       from './scroll.js';
import { initAnimations }   from './animations.js';
import { initTheme, initCopyEmail, initShowcaseDrag, getSparkColor } from './ui.js';
import { mountLogoLoop, PORTFOLIO_SKILL_LOGOS } from './LogoLoop.js';
import { initMoreWork } from './more-work.js';

/* Theme first — avoids flash of wrong color */
initTheme();

/* DOMContentLoaded — everything else */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initClickSpark({
    sparkColor: getSparkColor(),
    sparkSize: 12,
    sparkRadius: 20,
    sparkCount: 12,
    duration: 500,
    easing: 'ease-out',
    extraScale: 1.2,
  });
  initScroll();
  initAnimations();
  initCopyEmail();
  initShowcaseDrag();
  initMoreWork();

  const logoRoot = document.getElementById('logoLoopRoot');
  if (logoRoot) {
    mountLogoLoop(logoRoot, {
      logos: PORTFOLIO_SKILL_LOGOS,
      speed: 120,
      direction: 'left',
      logoHeight: 11,
      gap: 40,
      hoverSpeed: 0,
      scaleOnHover: true,
      fadeOut: true,
      ariaLabel: 'Skills and technologies',
    });
  }
});
