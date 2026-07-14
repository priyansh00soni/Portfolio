
import { initCursor }       from './cursor.js';
import { initClickSpark }   from './clickspark.js';
import { initScroll }       from './scroll.js';
import { initAnimations }   from './animations.js';
import { initTheme, initCopyEmail, initShowcaseDrag, getSparkColor } from './ui.js';
import { mountLogoLoop, PORTFOLIO_SKILL_LOGOS } from './LogoLoop.js';
import { initMoreWork } from './more-work.js';

const BACKGROUND_TRACK = new URL(
  '../images/Tame Impala - The Less I Know The Better (Original Instrumental).mp3',
  import.meta.url,
).href;
const BACKGROUND_VOLUME = 0.14;
const BACKGROUND_GAIN = 1.25;
const SPEAKER_ON_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 5L6 9H3v6h3l5 4z" />
    <path d="M16.5 8.5a5 5 0 010 7" />
    <path d="M19.5 5.5a9.5 9.5 0 010 13" />
  </svg>
`;
const SPEAKER_OFF_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 5L6 9H3v6h3l5 4z" />
    <path d="M16 9l5 6" />
    <path d="M21 9l-5 6" />
  </svg>
`;

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

  function initBackgroundMusic() {
    const audioBtn = document.getElementById('audioBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioPopup = document.getElementById('audioPopup');
    const audio = document.createElement('audio');
    audio.src = BACKGROUND_TRACK;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 1;
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audio.load();

    let isPlaying = false;
    let fadeFrame = 0;
    let audioContext = null;
    let mediaSource = null;
    let gainNode = null;
    const soundPref = localStorage.getItem('priyansh_sound');

    /* If user already enabled sound, hide the popup immediately */
    if (soundPref === 'on' && audioPopup) {
      audioPopup.style.display = 'none';
    }

    /* Auto-hide popup after 8s if still visible */
    if (audioPopup && soundPref !== 'on') {
      setTimeout(() => {
        if (!audioPopup.classList.contains('hidden')) {
          audioPopup.classList.add('hidden');
        }
      }, 8000);
    }

    const setButtonState = (playing) => {
      if (!audioBtn || !audioIcon) return;
      audioBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      audioBtn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
      audioIcon.innerHTML = playing ? SPEAKER_ON_ICON : SPEAKER_OFF_ICON;
    };

    const fadeInMusic = () => {
      window.cancelAnimationFrame(fadeFrame);
      if (gainNode) {
        gainNode.gain.value = 0;
      }

      const duration = 2000;
      const startedAt = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        if (gainNode) {
          gainNode.gain.value = BACKGROUND_GAIN * progress;
        }

        if (progress < 1 && isPlaying) {
          fadeFrame = window.requestAnimationFrame(tick);
        }
      };

      fadeFrame = window.requestAnimationFrame(tick);
    };

    const playMusic = async () => {
      try {
        if (!audioContext) {
          audioContext = new AudioContext();
          mediaSource = audioContext.createMediaElementSource(audio);
          gainNode = audioContext.createGain();
          gainNode.gain.value = 0;
          mediaSource.connect(gainNode);
          gainNode.connect(audioContext.destination);
        }

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        await audio.play();
        isPlaying = true;
        setButtonState(true);
        fadeInMusic();
      } catch (err) {
        isPlaying = false;
        setButtonState(false);
        console.error('Background music failed to start:', err);
      }
    };

    const pauseMusic = () => {
      window.cancelAnimationFrame(fadeFrame);
      audio.pause();
      if (gainNode) {
        gainNode.gain.value = BACKGROUND_GAIN;
      }
      isPlaying = false;
      setButtonState(false);
    };

    const toggleMusic = () => {
      /* First-time click: save preference and reload */
      if (soundPref !== 'on' && !isPlaying) {
        localStorage.setItem('priyansh_sound', 'on');
        if (audioPopup) audioPopup.classList.add('hidden');
        /* Small delay so popup exit animation plays, then reload */
        setTimeout(() => window.location.reload(), 350);
        return;
      }

      if (isPlaying) {
        pauseMusic();
        localStorage.setItem('priyansh_sound', 'off');
        return;
      }

      playMusic();
      localStorage.setItem('priyansh_sound', 'on');
    };

    setButtonState(false);

    if (audioBtn) {
      audioBtn.addEventListener('click', toggleMusic);
    }

    /* Auto-play if returning from reload with sound preference on */
    if (soundPref === 'on') {
      /* Wait for intro to settle, then auto-play */
      const autoPlay = () => {
        playMusic();
        if (audioPopup) audioPopup.style.display = 'none';
      };
      /* Try immediately (works after reload since gesture is recent) */
      setTimeout(autoPlay, 800);
    }

    audio.addEventListener('error', (event) => console.error('Background music error:', event));

    return audio;
  }

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

  initBackgroundMusic();
});
