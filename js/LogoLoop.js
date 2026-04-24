
'use strict';

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = (value) => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

/**
 * @typedef {{ title: string, href?: string, ariaLabel?: string, src?: string, alt?: string, width?: number, height?: number }} LogoItem
 */

/**
 * @param {HTMLElement} container
 * @param {{
 *   logos: LogoItem[],
 *   speed?: number,
 *   direction?: 'left'|'right'|'up'|'down',
 *   width?: number|string,
 *   logoHeight?: number,
 *   gap?: number,
 *   pauseOnHover?: boolean,
 *   hoverSpeed?: number,
 *   fadeOut?: boolean,
 *   fadeOutColor?: string,
 *   scaleOnHover?: boolean,
 *   ariaLabel?: string,
 *   className?: string,
 * }} options
 */
export function mountLogoLoop(container, options) {
  const {
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    ariaLabel = 'Partner logos',
    className = '',
  } = options;

  if (!container || !Array.isArray(logos) || logos.length === 0) return { destroy() {} };

  let effectiveHoverSpeed;
  if (hoverSpeed !== undefined) effectiveHoverSpeed = hoverSpeed;
  else if (pauseOnHover === true) effectiveHoverSpeed = 0;
  else if (pauseOnHover === false) effectiveHoverSpeed = undefined;
  else effectiveHoverSpeed = 0;

  const isVertical = direction === 'up' || direction === 'down';

  const magnitude = Math.abs(speed);
  let directionMultiplier;
  if (isVertical) directionMultiplier = direction === 'up' ? 1 : -1;
  else directionMultiplier = direction === 'left' ? 1 : -1;
  const speedMultiplier = speed < 0 ? -1 : 1;
  const targetVelocity = magnitude * directionMultiplier * speedMultiplier;

  const root = document.createElement('div');
  const rootClasses = [
    'logoloop',
    isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
    fadeOut && 'logoloop--fade',
    scaleOnHover && 'logoloop--scale-hover',
    'logoloop--skills',
    className,
  ].filter(Boolean);
  root.className = rootClasses.join(' ');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', ariaLabel);
  root.style.setProperty('--logoloop-gap', `${gap}px`);
  root.style.setProperty('--logoloop-logoHeight', `${logoHeight}px`);
  if (fadeOutColor) root.style.setProperty('--logoloop-fadeColor', fadeOutColor);
  else root.style.setProperty('--logoloop-fadeColor', 'var(--bg)');

  if (isVertical) {
    const w = toCssLength(width);
    if (w && w !== '100%') root.style.width = w;
  } else {
    root.style.width = toCssLength(width) ?? '100%';
  }

  const track = document.createElement('div');
  track.className = 'logoloop__track';
  root.appendChild(track);
  container.appendChild(root);

  let copyCount = ANIMATION_CONFIG.MIN_COPIES;
  let seqWidth = 0;
  let seqHeight = 0;
  let seqRef = null;
  let isHovered = false;
  let offset = 0;
  let velocity = 0;
  let lastTs = null;
  let rafId = null;

  function renderLogoItem(item, key) {
    const li = document.createElement('li');
    li.className = 'logoloop__item';
    li.setAttribute('role', 'listitem');

    const isImage = Boolean(item.src);
    let content;
    if (isImage) {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt ?? '';
      if (item.title) img.title = item.title;
      if (item.width) img.width = item.width;
      if (item.height) img.height = item.height;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      content = img;
    } else {
      const node = document.createElement('span');
      node.className = 'logoloop__node';
      node.textContent = item.title ?? '';
      content = node;
    }

    const itemAriaLabel = isImage ? (item.alt ?? item.title) : (item.ariaLabel ?? item.title);
    if (item.href) {
      const a = document.createElement('a');
      a.className = 'logoloop__link';
      a.href = item.href;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.setAttribute('aria-label', itemAriaLabel || item.title || 'logo link');
      a.appendChild(content);
      li.appendChild(a);
    } else {
      li.appendChild(content);
    }
    return li;
  }

  function rebuildLists() {
    track.textContent = '';
    for (let copyIndex = 0; copyIndex < copyCount; copyIndex++) {
      const ul = document.createElement('ul');
      ul.className = 'logoloop__list';
      ul.setAttribute('role', 'list');
      if (copyIndex > 0) ul.setAttribute('aria-hidden', 'true');
      logos.forEach((item, itemIndex) => {
        ul.appendChild(renderLogoItem(item, `${copyIndex}-${itemIndex}`));
      });
      track.appendChild(ul);
    }
    seqRef = track.querySelector('.logoloop__list');
    loadImagesAndMeasure();
  }

  function loadImagesAndMeasure() {
    const images = seqRef ? seqRef.querySelectorAll('img') : [];
    if (images.length === 0) {
      requestAnimationFrame(updateDimensions);
      return;
    }
    let remaining = images.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) requestAnimationFrame(updateDimensions);
    };
    images.forEach((img) => {
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  function updateDimensions() {
    const containerWidth = root.clientWidth ?? 0;
    const sequenceRect = seqRef?.getBoundingClientRect?.();
    const sequenceWidth = sequenceRect?.width ?? 0;
    const sequenceHeight = sequenceRect?.height ?? 0;

    if (isVertical) {
      const parentHeight = root.parentElement?.clientHeight ?? 0;
      if (parentHeight > 0 && root.style.height !== `${Math.ceil(parentHeight)}px`) {
        root.style.height = `${Math.ceil(parentHeight)}px`;
      }
      if (sequenceHeight > 0) {
        seqHeight = Math.ceil(sequenceHeight);
        const viewport = root.clientHeight || parentHeight || sequenceHeight;
        const copiesNeeded = Math.ceil(viewport / sequenceHeight) + ANIMATION_CONFIG.COPY_HEADROOM;
        const next = Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded);
        if (next !== copyCount) {
          copyCount = next;
          offset = 0;
          rebuildLists();
          return;
        }
      }
    } else if (sequenceWidth > 0) {
      seqWidth = Math.ceil(sequenceWidth);
      const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      const next = Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded);
      if (next !== copyCount) {
        copyCount = next;
        offset = 0;
        rebuildLists();
        return;
      }
    }
    syncTransformImmediate();
  }

  function syncTransformImmediate() {
    const seqSize = isVertical ? seqHeight : seqWidth;
    if (seqSize > 0) {
      offset = ((offset % seqSize) + seqSize) % seqSize;
      if (isVertical) track.style.transform = `translate3d(0, ${-offset}px, 0)`;
      else track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }
  }

  function animate(ts) {
    if (lastTs === null) lastTs = ts;
    const deltaTime = Math.max(0, ts - lastTs) / 1000;
    lastTs = ts;

    let target;
    if (isDragging) {
      target = dragVelocity;
    } else {
      if (Math.abs(dragVelocity) > MIN_VELOCITY) {
        dragVelocity *= INERTIA_DAMPING;
      } else {
        dragVelocity = 0;
      }
      target = dragVelocity > 0 ? dragVelocity : (isHovered && effectiveHoverSpeed !== undefined ? effectiveHoverSpeed : targetVelocity);
    }
    
    const easingFactor = isDragging ? 1 : (1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU));
    velocity += (target - velocity) * easingFactor;

    const seqSize = isVertical ? seqHeight : seqWidth;
    if (seqSize > 0) {
      let nextOffset = offset + velocity * deltaTime;
      nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
      offset = nextOffset;
      if (isVertical) track.style.transform = `translate3d(0, ${-offset}px, 0)`;
      else track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    rafId = requestAnimationFrame(animate);
  }

  function startLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    lastTs = null;
    rafId = requestAnimationFrame(animate);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = null;
  }

  const onResize = () => updateDimensions();
  let ro;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(onResize);
    ro.observe(root);
    ro.observe(track);
  } else {
    window.addEventListener('resize', onResize);
  }

  const onEnter = () => {
    if (effectiveHoverSpeed !== undefined) isHovered = true;
  };
  const onLeave = () => {
    if (effectiveHoverSpeed !== undefined) isHovered = false;
  };
  track.addEventListener('mouseenter', onEnter);
  track.addEventListener('mouseleave', onLeave);

  /* ── DRAG/GRAB FUNCTIONALITY ── */
  let isDragging = false;
  let dragLastPos = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;
  const INERTIA_DAMPING = 0.92;
  const MIN_VELOCITY = 0.5;

  function onDragStart(e) {
    if (e.button !== 0) return; /* left mouse button only */
    isDragging = true;
    dragVelocity = 0;
    dragLastTime = Date.now();
    dragLastPos = isVertical ? e.clientY : e.clientX;
    track.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const currentPos = isVertical ? e.clientY : e.clientX;
    const now = Date.now();
    const deltaTime = Math.max(0.001, (now - dragLastTime) / 1000);
    const deltaPos = currentPos - dragLastPos;
    
    dragVelocity = -deltaPos / deltaTime;
    offset -= deltaPos;
    dragLastPos = currentPos;
    dragLastTime = now;
    syncTransformImmediate();
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
  }

  root.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);

  rebuildLists();
  requestAnimationFrame(() => updateDimensions());

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onReduce = () => {
    if (mqReduce.matches) stopLoop();
    else startLoop();
  };
  mqReduce.addEventListener?.('change', onReduce);

  if (!mqReduce.matches) startLoop();

  return {
    destroy() {
      stopLoop();
      mqReduce.removeEventListener?.('change', onReduce);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', onResize);
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mousedown', onDragStart);
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      root.remove();
    },
  };
}

/** Default skills strip for this portfolio (text items; tech links optional). */
export const PORTFOLIO_SKILL_LOGOS = [
  { title: 'C++' },
  { title: 'React' },
  { title: 'JavaScript' },
  { title: 'Tailwind CSS' },
  { title: 'Framer Motion' },
  { title: 'Node.js' },
  { title: 'Express.js' },
  { title: 'Mongo-DB' },
  { title: 'Postman' },
  { title: 'Leadership' },
  { title: 'Teamwork' },
  { title: 'Communication' },
  { title: 'Problem Solving' },
  { title: 'Freelance Projects' },
  { title: 'Real-world Apps' },
];
