
'use strict';

export function initClickSpark(options = {}) {
  const config = {
    sparkColor:  options.sparkColor  || '#fff',
    sparkSize:   options.sparkSize   ?? 10,
    sparkRadius: options.sparkRadius ?? 15,
    sparkCount:  options.sparkCount  ?? 8,
    duration:    options.duration    ?? 400,
    easing:      options.easing      || 'ease-out',
    extraScale:  options.extraScale  ?? 1.0,
  };

  const canvas = document.createElement('canvas');
  canvas.id = 'clickspark-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* ── Easing function ── */
  const getEaseFunc = () => {
    switch (config.easing) {
      case 'linear':
        return (t) => t;
      case 'ease-in':
        return (t) => t * t;
      case 'ease-in-out':
        return (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return (t) => t * (2 - t); /* ease-out */
    }
  };
  const easeFunc = getEaseFunc();

  /* ── Canvas size ── */
  let CW = window.innerWidth;
  let CH = window.innerHeight;
  let resizeTimer = null;

  function resizeCanvas() {
    CW = canvas.width = window.innerWidth;
    CH = canvas.height = window.innerHeight;
  }

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 100);
  }

  window.addEventListener('resize', handleResize, { passive: true });
  resizeCanvas();

  /* ── Spark storage — simple array ── */
  let sparks = [];
  let animationId = null;
  let currentColor = config.sparkColor;

  /* ── Animation loop ── */
  function draw(timestamp) {
    ctx.clearRect(0, 0, CW, CH);

    /* Filter and draw sparks */
    sparks = sparks.filter(spark => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= config.duration) {
        return false; /* Remove expired spark */
      }

      const progress = elapsed / config.duration;
      const eased = easeFunc(progress);
      const distance = eased * config.sparkRadius * config.extraScale;
      const lineLength = config.sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true; /* Keep spark */
    });

    /* Continue loop if sparks exist */
    if (sparks.length > 0) {
      animationId = requestAnimationFrame(draw);
    } else {
      animationId = null;
    }
  }

  /* ── Click handler ── */
  function handleClick(e) {
    const now = performance.now();
    const cx = e.clientX;
    const cy = e.clientY;

    /* Create new sparks */
    for (let i = 0; i < config.sparkCount; i++) {
      sparks.push({
        x: cx,
        y: cy,
        angle: (2 * Math.PI * i) / config.sparkCount,
        startTime: now
      });
    }

    /* Start animation if not already running */
    if (!animationId) {
      animationId = requestAnimationFrame(draw);
    }
  }

  /* ── Theme change listener ── */
  function handleThemeChange(e) {
    currentColor = e.detail?.isDark ? '#EDEDE8' : '#1a1a1a';
  }
  window.addEventListener('themeChange', handleThemeChange);

  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleClick);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('themeChange', handleThemeChange);
    if (animationId) cancelAnimationFrame(animationId);
    canvas.remove();
  };
}
