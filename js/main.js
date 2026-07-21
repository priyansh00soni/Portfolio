
import { initCursor }       from './cursor.js';
import { initClickSpark }   from './clickspark.js';
import { initScroll }       from './scroll.js';
import { initAnimations }   from './animations.js';
import { initTheme, initCopyEmail, initShowcaseDrag, getSparkColor } from './ui.js';
import { mountLogoLoop, PORTFOLIO_SKILL_LOGOS } from './LogoLoop.js';
import { initMoreWork } from './more-work.js';
import { initCardParticles } from './card-particles.js';
import { initSettings } from './settings.js';

const BACKGROUND_TRACK = new URL(
  '/images/Tame Impala - The Less I Know The Better (Original Instrumental).mp3',
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
  initCardParticles();
  initSettings();

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

    // Restore saved audio time if it exists
    const savedTime = localStorage.getItem('priyansh_audio_time');
    if (savedTime && soundPref === 'on') {
      audio.currentTime = parseFloat(savedTime);
    }

    // Save audio time periodically or on unload
    audio.addEventListener('timeupdate', () => {
      if (isPlaying) {
        localStorage.setItem('priyansh_audio_time', audio.currentTime);
      }
    });

    const showPopup = (instant = false) => {
      if (!audioPopup) return;
      audioPopup.style.display = 'block';
      audioPopup.classList.remove('hidden');
      if (instant) {
        audioPopup.style.animation = 'none';
        void audioPopup.offsetWidth; // Force reflow
        audioPopup.style.opacity = '1';
        audioPopup.style.animation = 'popupBob 2.4s ease-in-out infinite';
      }
    };

    const hidePopup = () => {
      if (!audioPopup) return;
      audioPopup.style.animation = 'none';
      void audioPopup.offsetWidth; // Force reflow
      audioPopup.style.opacity = '';
      audioPopup.style.animation = '';
      audioPopup.classList.add('hidden');
      setTimeout(() => {
        // Only fully hide if sound is genuinely playing
        if (isPlaying) {
          audioPopup.style.display = 'none';
        }
      }, 350);
    };

    /* Ensure popup is visible whenever sound is off */
    const ensurePopupState = () => {
      if (!audioPopup) return;
      if (!isPlaying) {
        // Sound is off — popup must be visible
        if (audioPopup.style.display === 'none' || audioPopup.classList.contains('hidden')) {
          showPopup(true);
        }
      }
    };

    /* Make popup visible everytime sound is off */
    if (soundPref === 'on' && audioPopup) {
      audioPopup.style.display = 'none';
    } else {
      showPopup(false); // Use normal entry animation on load
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
        localStorage.setItem('priyansh_sound', 'off');
        console.error('Background music failed to start:', err);
        showPopup(true); // Autoplay blocked, show popup instantly
      }
    };

    const pauseMusic = () => {
      window.cancelAnimationFrame(fadeFrame);
      isPlaying = false;
      setButtonState(false);
      audio.pause();
      if (gainNode) {
        gainNode.gain.value = BACKGROUND_GAIN;
      }
    };

    const toggleMusic = () => {
      if (isPlaying) {
        pauseMusic();
        localStorage.setItem('priyansh_sound', 'off');
        showPopup(true); // Instant show when toggled off
        return;
      }

      playMusic();
      localStorage.setItem('priyansh_sound', 'on');
      hidePopup();
    };

    setButtonState(false);

    if (audioBtn) {
      audioBtn.addEventListener('click', toggleMusic);
    }

    /* Auto-play if returning from reload with sound preference on */
    if (soundPref === 'on') {
      /* Wait for intro to settle, then auto-play */
      const autoPlay = () => {
        playMusic().then(() => {
          // After attempting play, ensure popup state is correct
          if (isPlaying && audioPopup) {
            audioPopup.style.display = 'none';
          } else {
            // Autoplay failed (common on mobile) — show popup
            ensurePopupState();
          }
        });
      };
      /* Try immediately (works after reload since gesture is recent) */
      setTimeout(autoPlay, 800);
    }

    /* Safety: if audio gets paused externally (e.g. OS interruption on mobile),
       re-show the popup so the user knows sound is off */
    audio.addEventListener('pause', () => {
      if (!isPlaying) return; // Already handled by pauseMusic()
      isPlaying = false;
      setButtonState(false);
      localStorage.setItem('priyansh_sound', 'off');
      showPopup(true);
    });

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
      
      // Reset statuses and UI
      const circle = document.getElementById('demoStatusCircle');
      const loader = document.getElementById('statusLoaderSvg');
      const check = document.getElementById('statusCheckSvg');
      if (circle) gsap.set(circle, { clearProps: "all" });
      if (loader) loader.style.display = 'block';
      if (check) gsap.set(check, { display: 'none', scale: 0 });

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

      // Morph to checkmark and fire confetti precisely on 'Delivered'
      const deliveredTime = (statuses.length - 1) * interval + 0.3;
      
      tl.call(() => {
        const circle = document.getElementById('demoStatusCircle');
        const loader = document.getElementById('statusLoaderSvg');
        const check = document.getElementById('statusCheckSvg');
        
        if (loader) loader.style.display = 'none';
        if (circle) {
          gsap.to(circle, {
            background: '#6EE7B7', 
            borderColor: '#6EE7B7',
            boxShadow: '0 0 24px rgba(110, 231, 183, 0.4)',
            scale: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 1
          });
        }
        if (check) {
          check.style.display = 'block';
          gsap.fromTo(check, { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' });
        }

        const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#fbbf24'];
        const view = document.getElementById('demoStatusView');
        for(let i=0; i<45; i++) {
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
          p.style.willChange = 'transform, opacity';
          
          view.appendChild(p);

          gsap.to(p, {
            x: (Math.random() - 0.5) * 450,
            y: (Math.random() - 0.5) * 450 + 100, // Bias downwards for gravity
            rotation: (Math.random() - 0.5) * 720,
            scale: Math.random() * 1.5 + 0.5,
            opacity: 0,
            duration: 0.8 + Math.random() * 0.7,
            ease: 'circ.out',
            force3D: true, // Forces GPU acceleration on mobile
            onComplete: () => p.remove()
          });
        }
      }, null, deliveredTime + 0.1);

      // Auto close slightly longer to let particles disperse
      tl.call(closeModal, null, statuses.length * interval + 2.4);
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
        // Enforce HTTPS exclusively to bypass aggressive Mobile Mixed Content Security Blocks
        const response = await fetch('https://nexus-automation-lj20.onrender.com/api/assistant-command', {
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

  /* ── Nexus Video Interaction ── */
  function initNexusVideo() {
    const nexusCard = document.querySelector('.p-nexus');
    const video = document.querySelector('.nexus-video');
    const playPauseBtn = document.querySelector('.nv-playpause-btn');
    const muteBtn = document.querySelector('.nv-mute-btn');
    const iconPlay = document.querySelector('.nv-icon-play');
    const iconPause = document.querySelector('.nv-icon-pause');
    const iconMuted = document.querySelector('.nv-icon-muted');
    const iconUnmuted = document.querySelector('.nv-icon-unmuted');
    const audioBtn = document.querySelector('#audioBtn');
    
    if (!nexusCard || !video) return;

    const isMobile = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (isMobile) {
      video.play().catch(e => console.log('Autoplay prevented', e));
      const controls = document.querySelector('.nexus-video-controls');
      if (controls) controls.classList.add('mobile-active');
    }

    nexusCard.addEventListener('mouseenter', () => {
      if (!isMobile) {
        video.play().catch(e => console.log('Autoplay prevented', e));
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
      }
    });

    nexusCard.addEventListener('mouseleave', () => {
      if (!isMobile) {
        video.pause();
        video.currentTime = 0;
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
      }
    });

    playPauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (video.paused) {
        video.play();
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
      } else {
        video.pause();
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
      }
    });

    muteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        iconMuted.style.display = 'block';
        iconUnmuted.style.display = 'none';
      } else {
        iconMuted.style.display = 'none';
        iconUnmuted.style.display = 'block';
        
        // Turn off background music if it's playing
        if (audioBtn && audioBtn.getAttribute('aria-pressed') === 'true') {
          audioBtn.click();
        }
      }
    });

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        // Wait a tick for the aria-pressed attribute to update
        setTimeout(() => {
          if (audioBtn.getAttribute('aria-pressed') === 'true') {
            if (!video.muted) {
              video.muted = true;
              iconMuted.style.display = 'block';
              iconUnmuted.style.display = 'none';
            }
          }
        }, 10);
      });
    }
  }

  initNexusVideo();
});
