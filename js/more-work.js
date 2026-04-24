
'use strict';

const IMAGES = [
  '../song-coverImages/cover-1 ajab prem.jpg',
  '../song-coverImages/cover-2 rakhlo chupake.png',
  '../song-coverImages/cover-3 2states.jpg',
  '../song-coverImages/cover-4 sunflower.jpg',
  '../song-coverImages/cover-5 starboy.jpg',
  '../song-coverImages/cover-6 dil nu.jpg',
  '../song-coverImages/cover-7 intentions.jpg',
  '../song-coverImages/cover-8 khat.jpg',
  '../song-coverImages/cover-9 raaston.jpg',
  '../song-coverImages/cover-10 aasmani.jpg',
  '../song-coverImages/cover -11 sun sawariya.jpg',
  '../song-coverImages/cover-12 imagine dragoons.jpg',
  '../song-coverImages/cover-13 for a reason.jpg',
  '../song-coverImages/cover-14 attention.jpg',
  '../song-coverImages/cover-15 bairan.jpg',
  '../song-coverImages/cover-16 heat waves.jpg',
  '../song-coverImages/cover-17 rang jo.jpg',
  '../song-coverImages/cover-18 badlapur.jpg',
  '../song-coverImages/cover-19 all the satrs.jpg',
  '../song-coverImages/cover-20 lata ji.jpg',
  '../song-coverImages/cover-21 dilwale.jpg',
  '../song-coverImages/cover-22 aaj se.jpg',
  '../song-coverImages/cover-23 atif.jpg',
  '../song-coverImages/cover-24 7years.jpg',
  '../song-coverImages/cover-25 darkhaast.jpg',
];

const CONFIG = {
  minDistance:  120,
  imgMinSize:   110,
  imgMaxSize:   210,
  maxRotation:   18,
  maxImages:     14,
  fadeDuration:  75,
  lifeMs:      1800,
  fadeOutMs:    280,
  airDrag:    0.985,
  bounce:         0,
  spinMax:        0,
  speedGain:      0,
};

let section     = null;
let container   = null;
let spawnedImgs = [];
let lastX       = -9999;
let lastY       = -9999;
let imgIdx      = 0;
let isActive    = false;
let trailsVisible = true;
let rafId       = null;
let prevTick    = 0;


let ptrX = null, ptrY = null, ptrT = null;
let pendingCx = null, pendingCy = null;
let ptrPending = false;  


const pool = [];

function acquireEl(size) {
  const img = pool.pop() || document.createElement('img');
  img.draggable = false;
  img.style.cssText = [
    'position:absolute',
    `width:${size}px`,
    `height:${size}px`,
    'left:0',
    'top:0',
    'object-fit:cover',
    'border-radius:6px',
    'opacity:1',
    'pointer-events:none',
    'will-change:transform',
    'user-select:none',
    'display:block',
    'transition:none',
  ].join(';');
  return img;
}

function releaseEl(img) {
  img.style.cssText = 'position:absolute;left:-9999px;top:-9999px;display:none;will-change:auto';
  img.className = '';
  pool.push(img);
}

/*Cursor-trail toggle*/
function setTrails(show) {
  if (show === trailsVisible) return;
  trailsVisible = show;
  const c = document.getElementById('canvas');
  if (c) { c.style.transition = 'opacity 0.35s ease'; c.style.opacity = show ? '1' : '0'; }
}

/* Remove an item*/
function removeImage(item) {
  const i = spawnedImgs.indexOf(item);
  if (i !== -1) spawnedImgs.splice(i, 1);
  if (item.el) {
    if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    releaseEl(item.el);
    item.el = null;
  }
}

function startDying(item, now) {
  if (item.dying) return;
  item.dying = true;
  item.dieAt = now;
  /* Write opacity + scale-down in one style flush, no transition override mid-frame */
  item.el.style.transition = `opacity ${CONFIG.fadeOutMs}ms ease, transform ${CONFIG.fadeOutMs}ms ease`;
  item.el.style.opacity = '0';
  item._deadTransform = `translate3d(${item.x}px,${item.y}px,0) rotate(${item.angle}deg) scale(0)`;
  item.el.style.transform = item._deadTransform;
}

function enforceImageCap(now) {
  const overflow = spawnedImgs.length - CONFIG.maxImages;
  for (let i = 0; i < overflow; i++) {
    if (spawnedImgs[i] && !spawnedImgs[i].dying) startDying(spawnedImgs[i], now);
  }
}

/*Spawn (called from tick, so already inside rAF)*/
function spawn(cx, cy, pointerVx, pointerVy, now) {
  const rect  = container.getBoundingClientRect();
  const size  = CONFIG.imgMinSize + Math.random() * (CONFIG.imgMaxSize - CONFIG.imgMinSize);
  const angle = (Math.random() * 2 - 1) * CONFIG.maxRotation;
  const src   = IMAGES[imgIdx++ % IMAGES.length];
  const x     = cx - rect.left  - size / 2;
  const y     = cy - rect.top   - size / 2;

  let vx = 0, vy = 0;
  const cursorMag = Math.hypot(pointerVx, pointerVy);
  if (cursorMag > 1) {
    const fixedSpeed = 120;
    vx = (pointerVx / cursorMag) * fixedSpeed;
    vy = (pointerVy / cursorMag) * fixedSpeed;
  }

  const img = acquireEl(size);
  img.src = src;

  /* Set initial transform before appending so no layout jank */
  const initTransform = `translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(0)`;
  img.style.transform = initTransform;

  container.appendChild(img);

  /* Force reflow to register initial scale(0) state */
  void img.offsetHeight;

  img.style.transition = `transform ${CONFIG.fadeDuration}ms ease`;
  img.style.transform = `translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(1)`;

  const item = {
    el: img, x, y, w: size, h: size,
    vx, vy,
    angle, omega: 0,
    bornAt: now,
    expireAt: now + CONFIG.lifeMs,
    dieAt: 0,
    dying: false,
    _lastTransform: initTransform,
  };
  spawnedImgs.push(item);
  enforceImageCap(now);
}

/* Physics tick*/
function tick(now) {
  if (!container) return;

  /* del pending pointer-move spawn */
  if (ptrPending && isActive) {
    ptrPending = false;
    const cx = pendingCx, cy = pendingCy;
    const d  = Math.hypot(cx - lastX, cy - lastY);
    if (d >= CONFIG.minDistance) {
      spawn(cx, cy, pendingVx, pendingVy, now);
      lastX = cx; lastY = cy;
    }
  }

  const dtMs = prevTick ? (now - prevTick) : 16.67;
  prevTick   = now;
  const dt   = Math.min(dtMs, 48) / 1000;
  const drag = Math.pow(CONFIG.airDrag, dt * 60);

  for (let i = spawnedImgs.length - 1; i >= 0; i--) {
    const item = spawnedImgs[i];

    if (!item.dying && now >= item.expireAt) startDying(item, now);

    if (item.dying) {
      if (now - item.dieAt >= CONFIG.fadeOutMs) removeImage(item);
      continue;  
    }

    item.vx *= drag;
    item.vy *= drag;
    item.x  += item.vx * dt;
    item.y  += item.vy * dt;
    item.angle += item.omega * dt;

    const tf = `translate3d(${item.x.toFixed(1)}px,${item.y.toFixed(1)}px,0) rotate(${item.angle.toFixed(2)}deg) scale(1)`;
    if (tf !== item._lastTransform) {
      item.el.style.transform = tf;
      item._lastTransform = tf;
    }
  }

  rafId = requestAnimationFrame(tick);
}

/*Pointer velocity (shared between mouse & touch)*/
let pendingVx = 0, pendingVy = 0;

function onMove(cx, cy) {
  if (!isActive) return;

  const now = performance.now();
  if (ptrX !== null) {
    const dtMs = Math.max(1, now - ptrT);
    pendingVx = ((cx - ptrX) / dtMs) * 1000;
    pendingVy = ((cy - ptrY) / dtMs) * 1000;
  }
  ptrX = cx; ptrY = cy; ptrT = now;

  /* Throttle: store latest coords, let tick() consume them */
  pendingCx  = cx;
  pendingCy  = cy;
  ptrPending = true;   // tick() will process at next frame, at most once per frame
}

function onMouseMove(e) { onMove(e.clientX, e.clientY); }
function onTouchMove(e) { onMove(e.touches[0].clientX, e.touches[0].clientY); }

/* ── Build ── */
function build() {
  section = document.getElementById('more-work');
  if (!section) return false;
  container = document.createElement('div');
  container.className = 'mw-scatter-container';
  section.appendChild(container);
  return true;
}

function initObserver() {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      isActive = e.isIntersecting;
      setTrails(!isActive);
      if (!isActive) {
        lastX = -9999; lastY = -9999;
        ptrX  = null;  ptrY  = null; ptrT = null;
        ptrPending = false;
      }
    });
  }, { threshold: 0.1 }).observe(section);
}

export function initMoreWork() {
  if (!build()) return;
  
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  
  /* Preload all images */
  IMAGES.forEach(s => { const i = new Image(); i.src = s; });
  
  if (isTouchDevice) {
    /* Mobile: spawn images on tap */
    let touchStartX = 0, touchStartY = 0;
    
    section.addEventListener('touchstart', (e) => {
      if (!isActive) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      
      /* Spawn on tap */
      const now = performance.now();
      spawn(touch.clientX, touch.clientY, 0, 0, now);
    }, { passive: true });
    
    /* Only spawn on touchmove if user is dragging (not scrolling) */
    section.addEventListener('touchmove', (e) => {
      if (!isActive || !e.touches.length) return;
      
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      
      /* Only spawn if horizontal movement is significant (dragging, not scrolling) */
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        const now = performance.now();
        const distance = Math.hypot(dx, dy);
        if (distance > CONFIG.minDistance) {
          onMove(touch.clientX, touch.clientY);
        }
      }
    }, { passive: true });
  } else {
    /* Desktop, spawn images on mousemove (hover) */
    section.addEventListener('mousemove', onMouseMove, { passive: true });
  }
  
  initObserver();
  if (!rafId) { prevTick = 0; rafId = requestAnimationFrame(tick); }
}