
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

  /* ── Nexus Demo Interaction ── */
  function initNexusDemo() {
    const btn = document.getElementById('nexusTryBtn');
    const modal = document.getElementById('demoModal');
    const closeBtn = document.getElementById('demoCloseBtn');
    const sendBtn = document.getElementById('demoSendBtn');
    const emailInput = document.getElementById('demoEmail');
    const statusTextModal = document.getElementById('nexusStatusTextModal');

    if (!btn || !modal) return;

    const openModal = () => {
      modal.classList.remove('processing');
      modal.classList.add('active');
      emailInput.value = '';
      setTimeout(() => emailInput.focus(), 100);
    };

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.classList.remove('processing'), 400); // Reset after fade
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendBtn.click();
    });

    const triggerStatusAnimation = () => {
      modal.classList.add('processing');
      const tl = gsap.timeline();
      
      const statuses = ['Accepted...', 'Queued...', 'Processing..', 'Delivered'];
      const interval = 1.0;
      
      statuses.forEach((text, i) => {
        tl.call(() => { statusTextModal.innerHTML = text; }, null, i * interval + 0.3);
        tl.fromTo(statusTextModal, 
          { opacity: 0, y: 4 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
          i * interval + 0.3
        );
        
        if (i < statuses.length - 1) {
          tl.to(statusTextModal, { opacity: 0, y: -4, duration: 0.2, ease: 'power2.in' }, (i + 1) * interval + 0.1);
        }
      });

      // Fire a colorful confetti burst specifically on 'Delivered'
      const deliveredTime = (statuses.length - 1) * interval + 0.3;
      tl.call(() => {
        const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#fbbf24'];
        const view = document.getElementById('demoStatusView');
        for(let i=0; i<35; i++) {
          let p = document.createElement('div');
          p.style.position = 'absolute';
          p.style.width = '7px';
          p.style.height = '7px';
          p.style.borderRadius = i % 2 === 0 ? '50%' : '2px';
          p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          p.style.left = '50%';
          p.style.top = '40%';
          p.style.zIndex = 10;
          p.style.pointerEvents = 'none';
          
          view.appendChild(p);

          gsap.to(p, {
            x: (Math.random() - 0.5) * 350,
            y: (Math.random() - 0.5) * 350,
            rotation: (Math.random() - 0.5) * 360,
            scale: Math.random() + 0.5,
            opacity: 0,
            duration: 0.7 + Math.random() * 0.5,
            ease: 'power3.out',
            onComplete: () => p.remove()
          });
        }
      }, null, deliveredTime + 0.1);

      // Auto close slightly longer to let particles disperse
      tl.call(closeModal, null, statuses.length * interval + 1.8);
    };

    const getDemoFingerprint = () => {
      try {
        // Advanced hardware telemetry for stronger fingerprinting
        const { userAgent, language, platform, hardwareConcurrency, deviceMemory, maxTouchPoints } = navigator;
        const res = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const touch = maxTouchPoints > 0 ? 'touch' : 'no-touch';
        
        const raw = `${userAgent}|${language}|${platform}|${hardwareConcurrency || 'x'}|${deviceMemory || 'x'}|${res}|${tz}|${touch}`;
        
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
          hash = Math.imul(31, hash) + raw.charCodeAt(i) | 0;
        }
        return 'demo_device_limit_' + Math.abs(hash);
      } catch (e) {
        return 'demo_device_limit_fallback';
      }
    };

    sendBtn.addEventListener('click', async () => {
      // Prevent programmatic Enter-key spam when already spinning
      if (sendBtn.disabled) return;

      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        emailInput.style.borderColor = '#ef4444';
        setTimeout(() => emailInput.style.borderColor = '', 1000);
        return;
      }
      
      sendBtn.innerText = 'Verifying...';
      sendBtn.disabled = true;

      // Purely synchronous hardware check guarantees instant, unwavering limit lookup
      const fKey = getDemoFingerprint();
      let attempts = parseInt(localStorage.getItem(fKey) || '0', 10);

      // We maintain the user's customized limit threshold
      if (attempts >= 5) { // Resetting back to 5 uses per device
        let errDiv = document.getElementById('demoUsageErr');
        if (!errDiv) {
          errDiv = document.createElement('div');
          errDiv.id = 'demoUsageErr';
          errDiv.style.color = '#ef4444';
          errDiv.style.fontSize = '12px';
          errDiv.style.marginTop = '12px';
          errDiv.style.textAlign = 'center';
          emailInput.parentElement.after(errDiv);
        }
        errDiv.innerText = "You've reached the maximum of 5 demo attempts on this device.";
        sendBtn.innerText = 'Send';
        sendBtn.disabled = false;
        return;
      }
      
      const errDiv = document.getElementById('demoUsageErr');
      if (errDiv) errDiv.innerText = '';

      sendBtn.innerText = 'Sending...';

      try {
        const response = await fetch('https://nexus-automation-jvm0.onrender.com/api/assistant-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: email })
        });

        if (!response.ok) {
          throw new Error(`Server rejected with status ${response.status}`);
        }

        // Successfully sent payload - consume attempt token securely
        localStorage.setItem(fKey, (attempts + 1).toString());
        
        sendBtn.innerText = 'Send';
        sendBtn.disabled = false;
        triggerStatusAnimation();
      } catch (e) {
        console.error('Demo API rejected execution:', e);
        
        let errResponse = document.getElementById('demoUsageErr');
        if (!errResponse) {
          errResponse = document.createElement('div');
          errResponse.id = 'demoUsageErr';
          errResponse.style.color = '#ef4444';
          errResponse.style.fontSize = '12px';
          errResponse.style.marginTop = '12px';
          errResponse.style.textAlign = 'center';
          emailInput.parentElement.after(errResponse);
        }
        errResponse.innerText = "Failed to send demo email. Please try again.";
        
        sendBtn.innerText = 'Send';
        sendBtn.disabled = false;
      }
    });
  }

  initNexusDemo();
});
