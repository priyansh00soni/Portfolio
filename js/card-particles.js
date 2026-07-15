export function initCardParticles() {
  if (localStorage.getItem('pref_particles') === 'off') return;

  /* ── Object pool to avoid constant DOM creation/destruction ── */
  const POOL_SIZE = 300;
  const pool = [];
  let poolIndex = 0;

  function getParticle() {
    let p = pool[poolIndex];
    if (!p) {
      p = document.createElement('div');
      p.className = 'card-particle';
      pool[poolIndex] = p;
    }
    poolIndex = (poolIndex + 1) % POOL_SIZE;
    return p;
  }

  const cards = document.querySelectorAll('.pcard');

  cards.forEach(card => {
    let spawnInterval = null;

    card.addEventListener('mouseenter', () => {
      /* Check live attribute so toggle works mid-session */
      if (document.documentElement.hasAttribute('data-no-particles')) return;
      spawnInterval = setInterval(() => {
        for (let i = 0; i < 4; i++) spawnParticle(card);
      }, 35);
    });

    card.addEventListener('mouseleave', () => {
      if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
      }
    });
  });

  function spawnParticle(card) {
    if (document.documentElement.hasAttribute('data-no-particles')) return;

    const w = card.offsetWidth;
    const h = card.offsetHeight;

    const perimeter = 2 * (w + h);
    const p = Math.random() * perimeter;

    let spawnLeft, spawnTop;
    let moveX, moveY;

    const spread = 30 + Math.random() * 40;
    const drift = (Math.random() - 0.5) * 30;

    if (p < w) {
      spawnLeft = p; spawnTop = 0;
      moveX = drift; moveY = -spread;
    } else if (p < w + h) {
      spawnLeft = w; spawnTop = p - w;
      moveX = spread; moveY = drift;
    } else if (p < 2 * w + h) {
      spawnLeft = w - (p - w - h); spawnTop = h;
      moveX = drift; moveY = spread;
    } else {
      spawnLeft = 0; spawnTop = h - (p - 2 * w - h);
      moveX = -spread; moveY = drift;
    }

    const particle = getParticle();
    gsap.killTweensOf(particle); // Important: stop any lingering old animations before reusing
    card.appendChild(particle);

    particle.style.left = spawnLeft + 'px';
    particle.style.top = spawnTop + 'px';

    gsap.set(particle, {
      x: 0, y: 0,
      opacity: 0.7 + Math.random() * 0.3,
      scale: 0.6 + Math.random() * 0.8
    });

    gsap.to(particle, {
      x: moveX,
      y: moveY,
      opacity: 0,
      scale: 0,
      duration: 1.2 + Math.random() * 0.8,
      ease: 'power2.out',
      onComplete: () => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }
    });
  }
}
