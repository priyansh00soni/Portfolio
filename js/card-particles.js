export function initCardParticles() {
  if (localStorage.getItem('pref_particles') === 'off') return;

  const cards = document.querySelectorAll('.pcard');

  cards.forEach(card => {
    let spawnInterval = null;

    card.addEventListener('mouseenter', () => {
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
    const w = card.offsetWidth;
    const h = card.offsetHeight;

    // Total perimeter, pick a random point along it
    const perimeter = 2 * (w + h);
    const p = Math.random() * perimeter;

    let spawnLeft, spawnTop; // exact border position
    let moveX, moveY;        // outward direction

    const spread = 30 + Math.random() * 40; // 30–70px outward
    const drift = (Math.random() - 0.5) * 30; // slight sideways drift

    if (p < w) {
      // Top edge
      spawnLeft = p;
      spawnTop = 0;
      moveX = drift;
      moveY = -spread;
    } else if (p < w + h) {
      // Right edge
      spawnLeft = w;
      spawnTop = p - w;
      moveX = spread;
      moveY = drift;
    } else if (p < 2 * w + h) {
      // Bottom edge
      spawnLeft = w - (p - w - h);
      spawnTop = h;
      moveX = drift;
      moveY = spread;
    } else {
      // Left edge
      spawnLeft = 0;
      spawnTop = h - (p - 2 * w - h);
      moveX = -spread;
      moveY = drift;
    }

    const particle = document.createElement('div');
    particle.className = 'card-particle';
    card.appendChild(particle);

    // Position exactly on the border using left/top
    particle.style.left = spawnLeft + 'px';
    particle.style.top = spawnTop + 'px';

    const startScale = 0.6 + Math.random() * 0.8;

    gsap.set(particle, {
      opacity: 0.7 + Math.random() * 0.3,
      scale: startScale
    });

    gsap.to(particle, {
      x: moveX,
      y: moveY,
      opacity: 0,
      scale: 0,
      duration: 1.2 + Math.random() * 0.8,
      ease: 'power2.out',
      onComplete: () => {
        particle.remove();
      }
    });
  }
}
