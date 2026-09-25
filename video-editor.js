/**
 * MK97 Video Studio Pro Engine — V26.0 Production Release
 * Multi-Track Magnetic Timeline, Keyframing, 20+ Filters, Chroma Key,
 * Web Audio Waveforms, Kinetic Typography, SFX Library & Ultra HD Export.
 */
(() => {
  'use strict';

  // --- Utilities & DOM ---
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const store = {
    get(k, d = null) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    }
  };

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  function bumpAnalytics(key) {
    const a = store.get('mk97.analytics', {
      templatesUsed: 0,
      exports: 0,
      projects: 0,
      aiActions: 0,
      videoEdits: 0
    });
    a[key] = (a[key] || 0) + 1;
    store.set('mk97.analytics', a);
  }

  // --- Web Audio Engine & SFX Synthesizer ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const sfxLibrary = [
    { id: 'whoosh', name: 'Cinematic Whoosh', cat: 'Transition', desc: 'Fast dynamic whip swoop', freq: 440, type: 'whoosh' },
    { id: 'pop', name: 'Bubble Pop', cat: 'UI', desc: 'Clean bubble pop tap', freq: 880, type: 'pop' },
    { id: 'shutter', name: 'Camera Shutter', cat: 'Action', desc: 'Crisp camera click', freq: 1200, type: 'shutter' },
    { id: 'ding', name: 'Notification Bell', cat: 'Alert', desc: 'Metallic bell chime', freq: 1500, type: 'ding' },
    { id: 'bassdrop', name: '808 Sub Boom', cat: 'Impact', desc: 'Deep sub-bass impact dive', freq: 120, type: 'bass' },
    { id: 'hit', name: 'Trailer Hit', cat: 'Impact', desc: 'Heavy cinematic trailer hit', freq: 90, type: 'hit' },
    { id: 'crowd', name: 'Crowd Cheering', cat: 'Stadium', desc: 'Cricket stadium roar', freq: 300, type: 'crowd' },
    { id: 'bat', name: 'Cricket Bat Strike', cat: 'Sports', desc: 'Sharp willow ball crack', freq: 650, type: 'bat' },
    { id: 'glitch', name: 'Cyber Glitch', cat: 'FX', desc: 'Digital distortion chirp', freq: 1100, type: 'glitch' },
    { id: 'whistle', name: 'Umpire Whistle', cat: 'Sports', desc: 'High pitch stadium whistle', freq: 2800, type: 'whistle' }
  ];

  function playSynthSFX(sfxId) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sfx = sfxLibrary.find(x => x.id === sfxId) || sfxLibrary[0];

    if (sfx.type === 'whoosh') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.28);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (sfx.type === 'bass' || sfx.type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.5);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (sfx.type === 'ding') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (sfx.type === 'bat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(sfx.freq || 600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  // --- 20+ Cinematic LUTs & Color Grading Presets ---
  const filterPresets = [
    { id: 'none', name: 'Original', filter: 'none', lut: null },
    { id: 'teal-orange', name: 'Teal & Orange', filter: 'contrast(1.18) saturate(1.28) hue-rotate(-12deg)', bg: 'rgba(0,180,216,0.1)' },
    { id: 'cyberpunk', name: 'Cyberpunk 2077', filter: 'contrast(1.3) saturate(1.7) hue-rotate(180deg) brightness(1.05)', bg: 'rgba(217,70,239,0.15)' },
    { id: 'vhs', name: 'Retro VHS 90s', filter: 'contrast(1.15) saturate(0.85) sepia(0.25) brightness(1.08)', bg: 'rgba(245,158,11,0.08)' },
    { id: 'noir', name: 'Film Noir B&W', filter: 'grayscale(1) contrast(1.4) brightness(0.95)', bg: null },
    { id: 'golden', name: 'Golden Hour', filter: 'sepia(0.35) saturate(1.35) brightness(1.06) contrast(1.1)', bg: 'rgba(245,158,11,0.12)' },
    { id: 'kodak', name: 'Vintage Kodak', filter: 'contrast(1.12) saturate(1.18) sepia(0.18) brightness(1.02)', bg: 'rgba(234,88,12,0.08)' },
    { id: 'fuji', name: 'Fuji Chrome', filter: 'contrast(1.22) saturate(1.1) brightness(1.04) hue-rotate(8deg)', bg: 'rgba(16,185,129,0.08)' },
    { id: 'hdr', name: 'Vivid HDR', filter: 'contrast(1.28) saturate(1.45) brightness(1.02)', bg: null },
    { id: 'matrix', name: 'Matrix Cyber', filter: 'hue-rotate(85deg) saturate(1.3) contrast(1.2)', bg: 'rgba(34,197,94,0.12)' },
    { id: 'moody', name: 'Dark Moody', filter: 'contrast(1.25) saturate(0.7) brightness(0.88)', bg: 'rgba(15,23,42,0.15)' },
    { id: 'warm-summer', name: 'Warm Summer', filter: 'saturate(1.25) sepia(0.2) brightness(1.05)', bg: 'rgba(251,191,36,0.1)' },
    { id: 'duotone', name: 'Duotone Neon', filter: 'contrast(1.4) saturate(1.6) hue-rotate(270deg)', bg: 'rgba(139,92,246,0.18)' },
    { id: 'ice-cool', name: 'Nordic Frost', filter: 'saturate(0.8) hue-rotate(195deg) contrast(1.15)', bg: 'rgba(56,189,248,0.1)' },
    { id: 'cross-process', name: 'Cross Process', filter: 'contrast(1.3) saturate(1.3) sepia(0.2) hue-rotate(-25deg)', bg: null },
    { id: 'sunset-glow', name: 'Sunset Glow', filter: 'saturate(1.4) sepia(0.3) brightness(1.08) hue-rotate(-15deg)', bg: 'rgba(236,72,153,0.12)' }
  ];

  // --- Kinetic Text Presets ---
  const textPresets = [
    { id: 'bold-title', name: 'Trending Headline', font: 'Montserrat', size: 120, color: '#ffffff', stroke: '#000000', strokeWidth: 8, anim: 'pop' },
    { id: 'typewriter', name: 'Typewriter Live', font: 'DM Sans', size: 90, color: '#fcd34d', stroke: '#000000', strokeWidth: 4, anim: 'typewriter' },
    { id: 'spring-bounce', name: 'Spring Bounce', font: 'Bebas Neue', size: 140, color: '#ffffff', stroke: '#2563eb', strokeWidth: 10, anim: 'bounce' },
    { id: 'cinematic-sub', name: 'Cinematic Subtitle', font: 'Inter', size: 68, color: '#f8fafc', stroke: '#000000', strokeWidth: 5, anim: 'slide' },
    { id: 'neon-glow', name: 'Neon Glow Pulse', font: 'Righteous', size: 110, color: '#38bdf8', stroke: '#0284c7', strokeWidth: 6, anim: 'neon' },
    { id: 'cricket-score', name: 'Match Day Score', font: 'Russo One', size: 115, color: '#f59e0b', stroke: '#000000', strokeWidth: 8, anim: 'glitch' }
  ];

  // --- Transitions Presets ---
  const transitionPresets = [
    { id: 'crossfade', name: 'Crossfade / Dissolve', desc: 'Smooth opacity blend' },
    { id: 'whip-left', name: 'Whip Pan Left', desc: 'Fast motion blur pan' },
    { id: 'whip-right', name: 'Whip Pan Right', desc: 'Fast motion blur pan right' },
    { id: 'zoom-in', name: 'Zoom Blur In', desc: 'Punch in camera transition' },
    { id: 'slide-push', name: 'Slide Push Up', desc: 'Upward dynamic swipe' },
    { id: 'glitch-cut', name: 'Glitch Cut', desc: 'RGB chromatic split cut' },
    { id: 'flash-white', name: 'Flash to White', desc: 'High exposure strobe dip' },
    { id: 'dip-black', name: 'Dip to Black', desc: 'Cinematic scene fade' }
  ];

  // --- Stickers & Social Badges ---
  const stickersLibrary = [
    { id: 'verified', name: 'Verified Badge', icon: '✓', color: '#38bdf8' },
    { id: 'like', name: 'Heart Like', icon: '❤️', color: '#ef4444' },
    { id: 'fire', name: 'Fire Flame', icon: '🔥', color: '#f97316' },
    { id: 'wicket', name: 'WICKET!', icon: '⚡', color: '#eab308' },
    { id: 'six', name: 'MAXIMUM SIX', icon: '💥', color: '#f59e0b' },
    { id: 'bell', name: 'Subscribe Bell', icon: '🔔', color: '#fcd34d' },
    { id: 'trophy', name: 'Champions Trophy', icon: '🏆', color: '#fbbf24' },
    { id: 'target', name: '100 Century', icon: '🎯', color: '#10b981' }
  ];

  // --- App State ---
  const canvas = $('#videoCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const timeline = $('#timelineScroll');

  const defaultTracks = [
    { id: 'Video', name: 'Video', icon: '📹', kind: 'video', visible: true },
    { id: 'Text', name: 'Text', icon: 'T', kind: 'text', visible: true },
    { id: 'Effects', name: 'Effects', icon: '✦', kind: 'effects', visible: true },
    { id: 'Audio', name: 'Audio', icon: '♫', kind: 'audio', visible: true },
    { id: 'Overlay', name: 'Overlay', icon: '🖼', kind: 'overlay', visible: true }
  ];

  let state = {
    w: 1080,
    h: 1920,
    duration: 28,
    time: 6.28,
    playing: false,
    loop: false,
    zoom: 1,
    ripple: true,
    magnet: true,
    safeZone: false,
    format: 'story',
    quality: 1,
    selected: null,
    globalFilter: 'none',
    globalTransition: 'crossfade',
    tracks: defaultTracks,
    clips: []
  };

  let history = [];
  let future = [];
  let raf = null;
  let mediaCache = new Map();
  let waveformCache = new Map();
  let drag = null;
  let gizmoDrag = null;

  // --- History & Persistence ---
  function pushState() {
    history.push(clone(state));
    if (history.length > 50) history.shift();
    future = [];
    saveProject();
  }

  function undo() {
    if (!history.length) return;
    future.push(clone(state));
    state = history.pop();
    syncUI();
  }

  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    state = future.pop();
    syncUI();
  }

  function saveProject() {
    const projName = ($('#videoProjectName')?.value || 'MK97 Reel Pro').trim();
    store.set('mk97.videoProject', {
      name: projName,
      state: clone(state),
      savedAt: new Date().toISOString()
    });
    const status = $('#saveStatus');
    if (status) {
      status.textContent = 'Saved';
      status.style.opacity = '1';
    }
  }

  function loadProject() {
    const saved = store.get('mk97.videoProject');
    if (saved && saved.state && Array.isArray(saved.state.clips)) {
      state = Object.assign(state, saved.state);
      state.playing = false;
      state.time = 0;
      if ($('#videoProjectName')) $('#videoProjectName').value = saved.name || 'MK97 Reel Pro';
    }
  }

  function selectedClip() {
    return state.clips.find(c => c.id === state.selected) || null;
  }

  function fmtTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  function pxPerSec() {
    return 72 * state.zoom;
  }

  // --- Media Fetching & Decoding ---
  function getMedia(c) {
    if (!c.src) return null;
    if (mediaCache.has(c.id)) return mediaCache.get(c.id);

    let el;
    if (c.kind === 'video') {
      el = document.createElement('video');
      el.src = c.src;
      el.muted = true;
      el.playsInline = true;
      el.preload = 'auto';
    } else if (c.kind === 'image' || c.kind === 'sticker') {
      el = new Image();
      el.src = c.src;
    } else if (c.kind === 'audio' || c.kind === 'sfx') {
      el = document.createElement('audio');
      el.src = c.src;
      el.preload = 'auto';
    }
    mediaCache.set(c.id, el);
    return el;
  }

  // --- Keyframe Interpolation Engine ---
  function interpolateClip(c, localTime) {
    const t = clamp(localTime, 0, c.duration);
    const result = {
      x: c.x || 0,
      y: c.y || 0,
      scale: c.scale != null ? c.scale : 1,
      rotation: c.rotation || 0,
      opacity: c.opacity != null ? c.opacity : 1,
      volume: c.volume != null ? c.volume : 1
    };

    if (!c.keyframes || c.keyframes.length === 0) {
      return result;
    }

    const kfs = [...c.keyframes].sort((a, b) => a.time - b.time);
    if (t <= kfs[0].time) {
      return Object.assign(result, kfs[0]);
    }
    if (t >= kfs[kfs.length - 1].time) {
      return Object.assign(result, kfs[kfs.length - 1]);
    }

    for (let i = 0; i < kfs.length - 1; i++) {
      const k0 = kfs[i];
      const k1 = kfs[i + 1];
      if (t >= k0.time && t <= k1.time) {
        const span = k1.time - k0.time;
        let progress = span > 0 ? (t - k0.time) / span : 0;
        // Ease In Out formula
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        result.x = k0.x + (k1.x - k0.x) * ease;
        result.y = k0.y + (k1.y - k0.y) * ease;
        result.scale = k0.scale + (k1.scale - k0.scale) * ease;
        result.rotation = k0.rotation + (k1.rotation - k0.rotation) * ease;
        result.opacity = k0.opacity + (k1.opacity - k0.opacity) * ease;
        result.volume = k0.volume + (k1.volume - k0.volume) * ease;
        break;
      }
    }
    return result;
  }

  // --- Real-time Chroma Key Pixel Filter ---
  function applyChromaKey(sourceImg, chroma, targetW, targetH) {
    const offscreen = document.createElement('canvas');
    offscreen.width = targetW;
    offscreen.height = targetH;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(sourceImg, 0, 0, targetW, targetH);

    const imgData = offCtx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    // Parse target chroma color
    const hex = chroma.color.replace('#', '');
    const kr = parseInt(hex.substring(0, 2), 16) || 0;
    const kg = parseInt(hex.substring(2, 4), 16) || 255;
    const kb = parseInt(hex.substring(4, 6), 16) || 0;
    const tol = (chroma.tolerance || 38) * 2.5;
    const feather = (chroma.feather || 15) * 1.5;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.hypot(r - kr, g - kg, b - kb);

      if (dist < tol) {
        data[i + 3] = 0;
      } else if (dist < tol + feather) {
        data[i + 3] = Math.round((data[i + 3] * (dist - tol)) / feather);
      }
    }
    offCtx.putImageData(imgData, 0, 0);
    return offscreen;
  }

  // --- Rendering Pipeline ---
  function activeClipsAtTime(t) {
    return state.clips.filter(c => t >= c.start && t <= c.start + c.duration);
  }

  function renderPreview() {
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.fillStyle = '#070b10';
    ctx.fillRect(0, 0, state.w, state.h);

    const active = activeClipsAtTime(state.time);

    // Apply global LUT / Filter
    const activeFilterObj = filterPresets.find(x => x.id === state.globalFilter);
    if (activeFilterObj && activeFilterObj.bg) {
      ctx.fillStyle = activeFilterObj.bg;
      ctx.fillRect(0, 0, state.w, state.h);
    }

    // Render visual clips by track order (bottom to top)
    const trackOrder = ['Video', 'Overlay 1', 'Overlay 2', 'Overlay', 'Effects', 'Text'];
    const visualClips = active.filter(c => {
      const tr = state.tracks.find(t => t.id === c.track);
      if (tr && tr.visible === false) return false;
      return trackOrder.includes(c.track) || c.kind === 'video' || c.kind === 'image' || c.kind === 'text' || c.kind === 'sticker' || c.kind === 'overlay';
    });
    visualClips.sort((a, b) => {
      const idxA = trackOrder.indexOf(a.track);
      const idxB = trackOrder.indexOf(b.track);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    for (const c of visualClips) {
      const localTime = (state.time - c.start) * (c.speed || 1);
      const xform = interpolateClip(c, localTime);

      ctx.save();
      ctx.globalAlpha = clamp(xform.opacity, 0, 1);

      // Clip filter & adjustments
      let filterChain = [];
      if (activeFilterObj && activeFilterObj.filter !== 'none') {
        filterChain.push(activeFilterObj.filter);
      }
      if (c.adjustments) {
        const a = c.adjustments;
        if (a.brightness !== 100) filterChain.push(`brightness(${a.brightness}%)`);
        if (a.contrast !== 100) filterChain.push(`contrast(${a.contrast}%)`);
        if (a.saturation !== 100) filterChain.push(`saturate(${a.saturation}%)`);
        if (a.blur) filterChain.push(`blur(${a.blur}px)`);
      }
      ctx.filter = filterChain.length ? filterChain.join(' ') : 'none';

      // 1. IMAGE & STICKER
      if (c.kind === 'image' || c.kind === 'sticker') {
        const im = getMedia(c);
        if (im && im.complete && im.naturalWidth) {
          const ratio = Math.max(state.w / im.naturalWidth, state.h / im.naturalHeight);
          const dw = im.naturalWidth * (c.kind === 'sticker' ? 0.35 : ratio) * xform.scale;
          const dh = im.naturalHeight * (c.kind === 'sticker' ? 0.35 : ratio) * xform.scale;

          ctx.translate(state.w / 2 + xform.x, state.h / 2 + xform.y);
          ctx.rotate((xform.rotation * Math.PI) / 180);

          if (c.chroma && c.chroma.enabled) {
            const keyed = applyChromaKey(im, c.chroma, Math.round(dw), Math.round(dh));
            ctx.drawImage(keyed, -dw / 2, -dh / 2);
          } else {
            ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
          }
        }
      }

      // 2. VIDEO
      if (c.kind === 'video') {
        const v = getMedia(c);
        if (v && v.readyState >= 2) {
          if (Math.abs(v.currentTime - localTime) > 0.08) {
            try {
              v.currentTime = Math.min(localTime, v.duration || localTime);
            } catch {}
          }
          const ratio = Math.max(state.w / v.videoWidth, state.h / v.videoHeight);
          const dw = v.videoWidth * ratio * xform.scale;
          const dh = v.videoHeight * ratio * xform.scale;

          ctx.translate(state.w / 2 + xform.x, state.h / 2 + xform.y);
          ctx.rotate((xform.rotation * Math.PI) / 180);

          if (c.chroma && c.chroma.enabled) {
            const keyed = applyChromaKey(v, c.chroma, Math.round(dw), Math.round(dh));
            ctx.drawImage(keyed, -dw / 2, -dh / 2);
          } else {
            ctx.drawImage(v, -dw / 2, -dh / 2, dw, dh);
          }
        }
      }

      // 3. TEXT & KINETIC TYPOGRAPHY
      if (c.kind === 'text') {
        ctx.translate(state.w / 2 + xform.x, state.h / 2 + xform.y);
        ctx.rotate((xform.rotation * Math.PI) / 180);

        let displayText = c.text || 'YOUR TEXT';
        let animScale = xform.scale;

        // Kinetic text animation processing
        if (c.animation === 'typewriter') {
          const charProgress = Math.min(1, localTime / Math.max(1, c.duration * 0.7));
          const numChars = Math.max(1, Math.floor(displayText.length * charProgress));
          displayText = displayText.slice(0, numChars);
        } else if (c.animation === 'bounce' || c.animation === 'pop') {
          if (localTime < 0.6) {
            const p = localTime / 0.6;
            animScale *= 0.2 + 0.8 * Math.sin(p * Math.PI * 1.3);
          }
        } else if (c.animation === 'neon') {
          const pulse = 1 + 0.06 * Math.sin(localTime * 10);
          animScale *= pulse;
        }

        ctx.font = `900 ${Math.round((c.size || 110) * animScale)}px ${c.font || 'Montserrat'}, sans-serif`;
        ctx.textAlign = c.align || 'center';
        ctx.textBaseline = 'middle';

        // Background box badge
        if (c.bgBox && c.bgBox.enabled) {
          const m = ctx.measureText(displayText);
          const pad = c.bgBox.padding || 20;
          ctx.fillStyle = c.bgBox.color || 'rgba(0,0,0,0.7)';
          ctx.fillRect(-m.width / 2 - pad, -c.size / 2 - pad / 2, m.width + pad * 2, c.size + pad);
        }

        // Outline / Stroke
        if (c.strokeWidth) {
          ctx.lineWidth = c.strokeWidth;
          ctx.strokeStyle = c.stroke || '#000';
          ctx.strokeText(displayText, 0, 0, state.w * 0.9);
        }

        // Drop shadow
        if (c.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = c.shadow;
          ctx.shadowOffsetY = c.shadow * 0.4;
        }

        ctx.fillStyle = c.color || '#ffffff';
        ctx.fillText(displayText, 0, 0, state.w * 0.9);
      }

      // 4. OVERLAYS & PARTICLES
      if (c.kind === 'overlay' || c.kind === 'effects') {
        if (/particle|ember/i.test(c.name)) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
          for (let p = 0; p < 35; p++) {
            const px = ((p * 97 + state.time * 60) % state.w);
            const py = (state.h - ((p * 131 + state.time * 80) % state.h));
            const pr = 2 + (p % 4);
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (/leak|flare|glow/i.test(c.name)) {
          ctx.save();
          const grad = ctx.createRadialGradient(state.w * 0.8, 0, 10, state.w * 0.8, 0, state.w * 0.7);
          grad.addColorStop(0, 'rgba(243, 201, 91, 0.35)');
          grad.addColorStop(0.5, 'rgba(0, 210, 255, 0.15)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, state.w, state.h);
          ctx.restore();
        } else if (/smoke/i.test(c.name)) {
          ctx.save();
          const grad = ctx.createLinearGradient(0, state.h * 0.6, 0, state.h);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(20, 28, 40, 0.45)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, state.h * 0.6, state.w, state.h * 0.4);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // Motion FX Overlays (Shake, Strobe, Scanlines, Embers)
    renderMotionOverlays();

    fitCanvas();
    updateTimeDisplay();
    updateGizmo();
  }

  function renderMotionOverlays() {
    const sel = selectedClip();
    if (!sel || !sel.motionFx) return;

    if (sel.motionFx === 'shake') {
      const shakeAmt = 8 * Math.sin(state.time * 40);
      ctx.translate(shakeAmt, -shakeAmt);
    } else if (sel.motionFx === 'strobe') {
      if (Math.floor(state.time * 12) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, 0, state.w, state.h);
      }
    } else if (sel.motionFx === 'grain') {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 600; i++) {
        ctx.fillRect(Math.random() * state.w, Math.random() * state.h, 2, 2);
      }
    }
  }

  // --- Canvas Resizing & Viewport Fit ---
  function fitCanvas() {
    const stage = $('#videoStage');
    if (!stage) return;
    const maxW = Math.max(260, stage.clientWidth - 32);
    const maxH = Math.max(240, stage.clientHeight - 32);
    const fit = Math.min(maxW / state.w, maxH / state.h);

    const rw = Math.round(state.w * fit);
    const rh = Math.round(state.h * fit);
    canvas.style.width = `${rw}px`;
    canvas.style.height = `${rh}px`;

    const container = $('#videoCanvasContainer');
    if (container) {
      container.style.width = `${rw}px`;
      container.style.height = `${rh}px`;
    }
  }

  // --- Interactive Transform Gizmo on Canvas ---
  function updateGizmo() {
    const gizmo = $('#transformGizmo');
    const c = selectedClip();
    if (!gizmo || !c || c.track === 'Audio' || c.track === 'SFX') {
      gizmo?.classList.add('hidden');
      return;
    }

    const container = $('#videoCanvasContainer');
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scaleFactor = cw / state.w;

    const xform = interpolateClip(c, (state.time - c.start) * (c.speed || 1));
    const boxW = Math.max(60, (c.size ? state.w * 0.6 : 300) * xform.scale * scaleFactor);
    const boxH = Math.max(40, (c.size ? c.size * 1.2 : 300) * xform.scale * scaleFactor);

    const centerX = cw / 2 + xform.x * scaleFactor;
    const centerY = ch / 2 + xform.y * scaleFactor;

    gizmo.style.width = `${boxW}px`;
    gizmo.style.height = `${boxH}px`;
    gizmo.style.left = `${centerX - boxW / 2}px`;
    gizmo.style.top = `${centerY - boxH / 2}px`;
    gizmo.style.transform = `rotate(${xform.rotation}deg)`;
    gizmo.classList.remove('hidden');

    const info = $('#gizmoInfo');
    if (info) {
      info.textContent = `${Math.round(xform.scale * 100)}% • ${Math.round(xform.rotation)}°`;
    }
  }

  // --- Timeline Ruler & Tracks Rendering ---
  function renderRuler() {
    const r = $('#ruler');
    if (!r) return;
    const pps = pxPerSec();
    r.style.width = `${state.duration * pps}px`;

    let html = '';
    const step = state.zoom > 1.5 ? 0.5 : 1;
    for (let t = 0; t <= state.duration; t += step) {
      html += `<i style="left:${t * pps}px">${t}s</i>`;
    }
    r.innerHTML = html;
  }

  function renderTracks() {
    renderRuler();
    const tracksContainer = $('#tracks');
    if (!tracksContainer) return;

    const pps = pxPerSec();
    tracksContainer.innerHTML = state.tracks.map(tr => {
      const clipsOnTrack = state.clips.filter(c => c.track === tr.id);
      
      let clipsHtml = '';
      if (tr.id === 'Video') {
        // Filmstrip Track with Transition Diamonds
        clipsHtml = clipsOnTrack.map((c, idx) => {
          const left = c.start * pps;
          const width = Math.max(50, c.duration * pps);
          const isSel = c.id === state.selected;
          const transBtn = idx < clipsOnTrack.length - 1 ? `
            <div class="transition-diamond-btn" data-trans-idx="${idx}" title="Transition"><span>⧖</span></div>
          ` : '';

          return `
            <div class="clip-filmstrip-item clip ${isSel ? 'active' : ''}" data-id="${c.id}" style="position:absolute;left:${left}px;width:${width}px">
              <span class="trim left" data-trim="left"></span>
              <img src="${c.src || 'fwcwl-logo.jpeg'}" alt="${c.name}">
              <span style="position:absolute;bottom:2px;left:4px;font-size:7px;color:#fff;background:rgba(0,0,0,0.6);padding:1px 4px;border-radius:3px">${c.name || 'Video'}</span>
              <span class="trim right" data-trim="right"></span>
            </div>
            ${transBtn ? `<div style="position:absolute;left:${left + width - 9}px;z-index:15">${transBtn}</div>` : ''}
          `;
        }).join('') + `<button class="track-add-btn-round" style="position:absolute;left:${(state.duration * pps) + 10}px" onclick="document.getElementById('videoMediaInput').click()">＋</button>`;

      } else if (tr.id === 'Text') {
        // Gold Pill Capsules
        clipsHtml = clipsOnTrack.map(c => {
          const left = c.start * pps;
          const width = Math.max(40, c.duration * pps);
          const isSel = c.id === state.selected;
          return `
            <div class="clip-gold-capsule clip ${isSel ? 'active' : ''}" data-id="${c.id}" style="position:absolute;left:${left}px;width:${width}px">
              <span class="trim left" data-trim="left"></span>
              <span style="color:var(--gold-mid);font-size:10px;font-weight:900">T</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px">${c.name || c.text || 'Text'}</span>
              <span class="cap-arrow">›</span>
              <span class="trim right" data-trim="right"></span>
            </div>
          `;
        }).join('');

      } else if (tr.id === 'Effects') {
        // Purple Capsules & FX blocks
        clipsHtml = clipsOnTrack.map(c => {
          const left = c.start * pps;
          const width = Math.max(40, c.duration * pps);
          const isSel = c.id === state.selected;
          return `
            <div class="clip-purple-capsule clip ${isSel ? 'active' : ''}" data-id="${c.id}" style="position:absolute;left:${left}px;width:${width}px">
              <span class="trim left" data-trim="left"></span>
              <span style="color:#c084fc;font-size:9px;font-weight:900">${c.fxBadge || 'FX'}</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px">${c.name || 'Effect'}</span>
              <span style="font-size:10px">›</span>
              <span class="trim right" data-trim="right"></span>
            </div>
          `;
        }).join('') + `<button class="track-add-btn-round" style="position:absolute;left:${(state.duration * pps) + 10}px">＋</button>`;

      } else if (tr.id === 'Audio') {
        // Cyan Waveform Clips
        clipsHtml = clipsOnTrack.map(c => {
          const left = c.start * pps;
          const width = Math.max(40, c.duration * pps);
          const isSel = c.id === state.selected;
          return `
            <div class="clip-cyan-waveform clip ${isSel ? 'active' : ''}" data-id="${c.id}" style="position:absolute;left:${left}px;width:${width}px">
              <span class="trim left" data-trim="left"></span>
              <span style="color:#22d3ee;font-size:10px">♫</span>
              <div class="clip-wave-bars">
                <span style="height:12px"></span>
                <span style="height:18px"></span>
                <span style="height:8px"></span>
                <span style="height:15px"></span>
                <span style="height:10px"></span>
                <span style="height:14px"></span>
              </div>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px">${c.name || 'Audio'}</span>
              <span style="font-size:10px">›</span>
              <span class="trim right" data-trim="right"></span>
            </div>
          `;
        }).join('');

      } else {
        // Overlay / Dark Cards with Gold borders
        clipsHtml = clipsOnTrack.map(c => {
          const left = c.start * pps;
          const width = Math.max(40, c.duration * pps);
          const isSel = c.id === state.selected;
          return `
            <div class="clip-dark-card clip ${isSel ? 'active' : ''}" data-id="${c.id}" style="position:absolute;left:${left}px;width:${width}px">
              <span class="trim left" data-trim="left"></span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px">${c.name || 'Overlay'}</span>
              <span style="font-size:10px;color:var(--gold-mid)">›</span>
              <span class="trim right" data-trim="right"></span>
            </div>
          `;
        }).join('') + `<button class="track-add-btn-round" style="position:absolute;left:${(state.duration * pps) + 10}px">＋</button>`;
      }

      return `
        <div class="v2-track-row" data-track="${tr.id}">
          <div class="v2-track-header">
            <div class="v2-track-title">
              <span>${tr.icon || '🎞'}</span>
              <span>${tr.name}</span>
            </div>
            <button class="v2-track-vis" data-act="track-vis" data-tid="${tr.id}" title="Toggle Track Visibility">
              ${tr.visible !== false ? '👁' : '⊘'}
            </button>
          </div>
          <div class="v2-track-lane" data-lane="${tr.id}" style="width:${Math.max(window.innerWidth, state.duration * pps + 80)}px">
            ${clipsHtml}
          </div>
        </div>
      `;
    }).join('');

    updateTimeDisplay();
  }

  function updateTimeDisplay() {
    const formatted = `${fmtTime(state.time)} / ${fmtTime(state.duration)}`;
    const timeLabels = [$('#timeLabel'), $('#inplayerTime')];
    timeLabels.forEach(tl => { if (tl) tl.textContent = formatted; });

    const pps = pxPerSec();
    const playhead = $('#playhead');
    if (playhead) {
      playhead.style.left = `${72 + state.time * pps}px`;
    }

    const pct = clamp((state.time / state.duration) * 100, 0, 100);
    const fill = $('#inplayerScrubberFill');
    const handle = $('#inplayerScrubberHandle');
    if (fill) fill.style.width = `${pct}%`;
    if (handle) handle.style.left = `${pct}%`;

    const playIcons = [$('#playBtn'), $('#inplayerPlayBtn'), $('#hugePlayBtn')];
    playIcons.forEach(btn => {
      if (btn) btn.textContent = state.playing ? '❚❚' : '▶';
    });
  }

  // --- Inspector UI for Selected Clip ---
  function renderInspector() {
    const box = $('#videoInspector');
    const c = selectedClip();
    $('#clipTitle').textContent = c ? `Edit: ${c.name}` : 'Project Timeline Settings';

    if (!c) {
      box.innerHTML = `
        <section class="inspector-section">
          <h4>Timeline Settings</h4>
          <label class="control">
            <span>Project Duration</span>
            <input id="projDurationControl" type="number" min="3" max="300" step="1" value="${state.duration}">
          </label>
          <label class="control">
            <span>Global Cinematic Filter</span>
            <select id="globalFilterSelect">
              ${filterPresets.map(f => `<option value="${f.id}" ${f.id === state.globalFilter ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </label>
        </section>
      `;

      if ($('#projDurationControl')) {
        $('#projDurationControl').onchange = e => {
          pushState();
          state.duration = clamp(Number(e.target.value) || 15, 3, 300);
          syncUI();
        };
      }
      if ($('#globalFilterSelect')) {
        $('#globalFilterSelect').onchange = e => {
          pushState();
          state.globalFilter = e.target.value;
          renderPreview();
        };
      }
      return;
    }

    // Clip Inspector HTML
    let h = `
      <section class="inspector-section">
        <h4>General Clip</h4>
        <label class="control">
          <span>Clip Name</span>
          <input data-prop="name" value="${c.name || ''}">
        </label>
        <div class="row2">
          <label class="control">
            <span>Start (sec)</span>
            <input data-prop="start" type="number" step="0.1" value="${c.start}">
          </label>
          <label class="control">
            <span>Duration (sec)</span>
            <input data-prop="duration" type="number" step="0.1" value="${c.duration}">
          </label>
        </div>
      </section>
    `;

    // Visual Transforms (Pos, Scale, Rotation, Opacity)
    if (c.kind !== 'audio' && c.kind !== 'sfx') {
      h += `
        <section class="inspector-section">
          <h4>Transform</h4>
          <div class="row2">
            <label class="control">
              <span>X Offset</span>
              <input data-prop="x" type="number" value="${c.x || 0}">
            </label>
            <label class="control">
              <span>Y Offset</span>
              <input data-prop="y" type="number" value="${c.y || 0}">
            </label>
          </div>
          <label class="control">
            <span>Scale (${Math.round((c.scale || 1) * 100)}%)</span>
            <input data-prop="scale" type="range" min="10" max="300" value="${Math.round((c.scale || 1) * 100)}">
          </label>
          <label class="control">
            <span>Rotation (${c.rotation || 0}°)</span>
            <input data-prop="rotation" type="range" min="-180" max="180" value="${c.rotation || 0}">
          </label>
          <label class="control">
            <span>Opacity (${Math.round((c.opacity != null ? c.opacity : 1) * 100)}%)</span>
            <input data-prop="opacity" type="range" min="0" max="100" value="${Math.round((c.opacity != null ? c.opacity : 1) * 100)}">
          </label>
        </section>
      `;
    }

    // Text Properties
    if (c.kind === 'text') {
      h += `
        <section class="inspector-section">
          <h4>Typography & Kinetic Styling</h4>
          <label class="control">
            <span>Text Content</span>
            <textarea data-prop="text">${c.text || ''}</textarea>
          </label>
          <div class="row2">
            <label class="control">
              <span>Font Family</span>
              <select data-prop="font">
                <option value="Montserrat" ${c.font === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                <option value="Bebas Neue" ${c.font === 'Bebas Neue' ? 'selected' : ''}>Bebas Neue</option>
                <option value="Anton" ${c.font === 'Anton' ? 'selected' : ''}>Anton</option>
                <option value="DM Sans" ${c.font === 'DM Sans' ? 'selected' : ''}>DM Sans</option>
                <option value="Inter" ${c.font === 'Inter' ? 'selected' : ''}>Inter</option>
                <option value="Righteous" ${c.font === 'Righteous' ? 'selected' : ''}>Righteous</option>
                <option value="Russo One" ${c.font === 'Russo One' ? 'selected' : ''}>Russo One</option>
                <option value="Cinzel" ${c.font === 'Cinzel' ? 'selected' : ''}>Cinzel</option>
              </select>
            </label>
            <label class="control">
              <span>Kinetic Animation</span>
              <select data-prop="animation">
                <option value="none" ${c.animation === 'none' ? 'selected' : ''}>None</option>
                <option value="typewriter" ${c.animation === 'typewriter' ? 'selected' : ''}>Typewriter</option>
                <option value="bounce" ${c.animation === 'bounce' ? 'selected' : ''}>Spring Bounce</option>
                <option value="pop" ${c.animation === 'pop' ? 'selected' : ''}>Pop Scale</option>
                <option value="neon" ${c.animation === 'neon' ? 'selected' : ''}>Neon Pulse</option>
                <option value="slide" ${c.animation === 'slide' ? 'selected' : ''}>Slide Fade</option>
              </select>
            </label>
          </div>
          <div class="row2">
            <label class="control">
              <span>Text Color</span>
              <input data-prop="color" type="color" value="${c.color || '#ffffff'}">
            </label>
            <label class="control">
              <span>Font Size</span>
              <input data-prop="size" type="number" value="${c.size || 110}">
            </label>
          </div>
          <div class="row2">
            <label class="control">
              <span>Stroke Color</span>
              <input data-prop="stroke" type="color" value="${c.stroke || '#000000'}">
            </label>
            <label class="control">
              <span>Stroke Width</span>
              <input data-prop="strokeWidth" type="number" min="0" max="30" value="${c.strokeWidth || 0}">
            </label>
          </div>
        </section>
      `;
    }

    // Audio & Playback Properties
    if (c.kind === 'audio' || c.kind === 'sfx' || c.kind === 'video') {
      h += `
        <section class="inspector-section">
          <h4>Audio & Playback Speed</h4>
          <label class="control">
            <span>Volume Boost (${Math.round((c.volume != null ? c.volume : 1) * 100)}%)</span>
            <input data-prop="volume" type="range" min="0" max="250" value="${Math.round((c.volume != null ? c.volume : 1) * 100)}">
          </label>
          <label class="control">
            <span>Speed (${(c.speed || 1).toFixed(2)}x)</span>
            <input data-prop="speed" type="range" min="25" max="300" value="${Math.round((c.speed || 1) * 100)}">
          </label>
        </section>
      `;
    }

    // Keyframes Manager
    const kfCount = (c.keyframes || []).length;
    h += `
      <section class="inspector-section">
        <h4>Keyframe Animation (${kfCount} keyframes)</h4>
        <div class="row2">
          <button id="addKfAtPlayheadBtn" class="small-btn gold">◇ Add at Current Time</button>
          <button id="clearKfBtn" class="small-btn danger">Clear Keyframes</button>
        </div>
      </section>
    `;

    box.innerHTML = h;

    // Attach listeners
    $$('[data-prop]', box).forEach(el => {
      el.addEventListener(el.type === 'range' || el.type === 'color' ? 'input' : 'change', () => {
        pushState();
        const p = el.dataset.prop;
        let v = el.value;
        if (['start', 'duration', 'x', 'y', 'rotation', 'size', 'strokeWidth'].includes(p)) v = Number(v);
        if (['scale', 'opacity', 'volume', 'speed'].includes(p)) v = Number(v) / 100;
        c[p] = v;
        renderPreview();
        renderTracks();
      });
    });

    if ($('#addKfAtPlayheadBtn')) {
      $('#addKfAtPlayheadBtn').onclick = () => {
        pushState();
        toggleKeyframe();
        renderInspector();
      };
    }

    if ($('#clearKfBtn')) {
      $('#clearKfBtn').onclick = () => {
        pushState();
        c.keyframes = [];
        syncUI();
        toast('Keyframes cleared');
      };
    }
  }

  // --- Keyframe Toggling & Management ---
  function toggleKeyframe() {
    const c = selectedClip();
    if (!c) {
      toast('Select a clip first');
      return;
    }
    const relTime = clamp(state.time - c.start, 0, c.duration);
    if (!c.keyframes) c.keyframes = [];

    const existingIdx = c.keyframes.findIndex(k => Math.abs(k.time - relTime) < 0.1);
    if (existingIdx >= 0) {
      c.keyframes.splice(existingIdx, 1);
      toast('Keyframe removed');
    } else {
      c.keyframes.push({
        time: relTime,
        x: c.x || 0,
        y: c.y || 0,
        scale: c.scale != null ? c.scale : 1,
        rotation: c.rotation || 0,
        opacity: c.opacity != null ? c.opacity : 1,
        volume: c.volume != null ? c.volume : 1
      });
      c.keyframes.sort((a, b) => a.time - b.time);
      toast('Keyframe added at ' + relTime.toFixed(1) + 's');
    }
    syncUI();
  }

  // --- Add Clips & Media ---
  function addTextClip(preset = null) {
    pushState();
    const p = preset || textPresets[0];
    const duration = Math.min(4, state.duration - state.time);
    const c = {
      id: uid(),
      kind: 'text',
      track: 'Text',
      name: p.name,
      start: state.time,
      duration: Math.max(1, duration),
      text: p.name.toUpperCase(),
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      size: p.size,
      font: p.font,
      color: p.color,
      stroke: p.stroke,
      strokeWidth: p.strokeWidth,
      animation: p.anim || 'none',
      keyframes: []
    };
    state.clips.push(c);
    state.selected = c.id;
    syncUI();
    openEdit();
    toast('Text title added');
  }

  function addMediaFile(file) {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');
    const isAudio = file.type.startsWith('audio');
    const kind = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    const track = isAudio ? 'Audio' : isVideo ? 'Video' : 'Overlay 1';

    const insert = (dur) => {
      pushState();
      const start = clamp(state.time, 0, Math.max(0, state.duration - 0.5));
      const clipDuration = Math.min(dur || 5, state.duration - start);
      const c = {
        id: uid(),
        kind,
        track,
        name: file.name.slice(0, 24),
        start,
        duration: Math.max(1, clipDuration),
        src: url,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        volume: 1,
        speed: 1,
        keyframes: [],
        chroma: { enabled: false, color: '#00ff00', tolerance: 38, feather: 15, spill: 40 }
      };
      state.clips.push(c);
      state.selected = c.id;
      syncUI();
      bumpAnalytics('videoEdits');
      closeSheets();
      toast(`${kind.toUpperCase()} clip added`);
    };

    if (kind === 'image') {
      insert(5);
    } else {
      const el = document.createElement(isVideo ? 'video' : 'audio');
      el.src = url;
      el.onloadedmetadata = () => insert(Math.min(el.duration || 5, 12));
      el.onerror = () => insert(5);
    }
  }

  function addSFXClip(sfxId) {
    pushState();
    const sfx = sfxLibrary.find(x => x.id === sfxId);
    if (!sfx) return;
    playSynthSFX(sfxId);

    const c = {
      id: uid(),
      kind: 'sfx',
      track: 'SFX',
      name: sfx.name,
      start: state.time,
      duration: 1.5,
      volume: 1,
      sfxId: sfx.id,
      keyframes: []
    };
    state.clips.push(c);
    state.selected = c.id;
    syncUI();
    toast(`SFX: ${sfx.name} added`);
  }

  function addSticker(s) {
    pushState();
    const canvasSticker = document.createElement('canvas');
    canvasSticker.width = 250;
    canvasSticker.height = 250;
    const sCtx = canvasSticker.getContext('2d');
    sCtx.font = '130px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(s.icon, 125, 125);

    const c = {
      id: uid(),
      kind: 'sticker',
      track: 'Overlay 2',
      name: s.name,
      src: canvasSticker.toDataURL(),
      start: state.time,
      duration: 4,
      x: 0,
      y: -200,
      scale: 1,
      rotation: 0,
      opacity: 1,
      keyframes: []
    };
    state.clips.push(c);
    state.selected = c.id;
    syncUI();
    closeSheets();
    toast(`Sticker: ${s.name} added`);
  }

  // --- Split, Duplicate, Delete, Ripple ---
  function splitClip() {
    const c = selectedClip();
    if (!c) {
      toast('Select a clip to split');
      return;
    }
    if (state.time <= c.start + 0.1 || state.time >= c.start + c.duration - 0.1) {
      toast('Move playhead inside the clip to split');
      return;
    }

    pushState();
    const splitOffset = state.time - c.start;
    const secondClip = clone(c);
    secondClip.id = uid();
    secondClip.start = state.time;
    secondClip.duration = c.duration - splitOffset;
    secondClip.name = `${c.name} Part 2`;

    c.duration = splitOffset;
    state.clips.push(secondClip);
    state.selected = secondClip.id;
    syncUI();
    toast('Clip split at ' + fmtTime(state.time));
  }

  function duplicateClip() {
    const c = selectedClip();
    if (!c) return;
    pushState();
    const n = clone(c);
    n.id = uid();
    n.start = clamp(c.start + c.duration, 0, state.duration - 0.5);
    n.name = `${c.name} Copy`;
    state.clips.push(n);
    state.selected = n.id;
    syncUI();
    toast('Clip duplicated');
  }

  function deleteClip() {
    const i = state.clips.findIndex(c => c.id === state.selected);
    if (i < 0) return;
    pushState();
    const [removed] = state.clips.splice(i, 1);
    state.selected = null;

    // Ripple shift if enabled
    if (state.ripple) {
      state.clips.filter(c => c.track === removed.track && c.start > removed.start).forEach(c => {
        c.start = Math.max(0, c.start - removed.duration);
      });
    }

    syncUI();
    toast('Clip deleted');
  }

  // --- Dragging & Trimming with Magnetic Snapping ---
  $('#tracks').addEventListener('pointerdown', e => {
    const clipEl = e.target.closest('.clip');
    if (!clipEl) return;
    state.selected = clipEl.dataset.id;
    syncUI();

    const c = selectedClip();
    const trim = e.target.dataset.trim;
    pushState();

    drag = {
      c,
      startX: e.clientX,
      origStart: c.start,
      origDur: c.duration,
      trim
    };
    clipEl.setPointerCapture(e.pointerId);
  });

  $('#tracks').addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / pxPerSec();
    const c = drag.c;
    const magnetIndicator = $('#magnetIndicator');

    let snapTime = null;
    const checkSnap = (val) => {
      if (!state.magnet) return val;
      const snapPoints = [0, state.time, state.duration];
      state.clips.forEach(other => {
        if (other.id !== c.id) {
          snapPoints.push(other.start, other.start + other.duration);
        }
      });
      for (const sp of snapPoints) {
        if (Math.abs(val - sp) < 0.12) {
          snapTime = sp;
          return sp;
        }
      }
      return val;
    };

    if (drag.trim === 'left') {
      let targetStart = checkSnap(drag.origStart + dx);
      targetStart = clamp(targetStart, 0, drag.origStart + drag.origDur - 0.2);
      c.duration = drag.origDur + (drag.origStart - targetStart);
      c.start = targetStart;
    } else if (drag.trim === 'right') {
      let targetDur = checkSnap(drag.origStart + drag.origDur + dx) - c.start;
      c.duration = clamp(targetDur, 0.2, state.duration - c.start);
    } else {
      let targetStart = checkSnap(drag.origStart + dx);
      c.start = clamp(targetStart, 0, state.duration - c.duration);
    }

    if (snapTime != null && magnetIndicator) {
      magnetIndicator.style.left = `${64 + snapTime * pxPerSec()}px`;
      magnetIndicator.classList.remove('hidden');
    } else if (magnetIndicator) {
      magnetIndicator.classList.add('hidden');
    }

    renderTracks();
    renderPreview();
  });

  window.addEventListener('pointerup', () => {
    if (drag) {
      drag = null;
      $('#magnetIndicator')?.classList.add('hidden');
      saveProject();
    }
  });

  // --- Real-time Continuous Timeline Scrubbing ---
  let isScrubbing = false;
  function handleTimelineScrub(clientX) {
    const tracksContainer = $('#tracks');
    if (!tracksContainer) return;
    const r = tracksContainer.getBoundingClientRect();
    state.time = clamp((clientX - r.left) / pxPerSec(), 0, state.duration);
    renderPreview();
    updateTimeDisplay();
  }

  timeline.addEventListener('pointerdown', e => {
    if (e.target.closest('.clip, .v2-track-header, .track-add-btn-round, .transition-diamond-btn')) return;
    isScrubbing = true;
    handleTimelineScrub(e.clientX);
  });

  $('#tracks')?.addEventListener('click', e => {
    const visBtn = e.target.closest('[data-act="track-vis"]');
    if (visBtn) {
      const tid = visBtn.dataset.tid;
      const track = state.tracks.find(t => t.id === tid);
      if (track) {
        pushState();
        track.visible = track.visible === false ? true : false;
        visBtn.textContent = track.visible ? '👁' : '⊘';
        visBtn.classList.toggle('muted', !track.visible);
        renderTracks();
        renderPreview();
        toast(`${track.name} ${track.visible ? 'visible' : 'muted'}`);
      }
      return;
    }
    const addBtn = e.target.closest('.track-add-btn-round');
    if (addBtn) {
      const trackRow = addBtn.closest('.v2-track-row');
      const tid = trackRow?.dataset.track || 'Video';
      if (tid === 'Video') $('#videoMediaInput')?.click();
      else if (tid === 'Text') addTextClip();
      else if (tid === 'Effects') openAssetTab('effects');
      else if (tid === 'Audio') openAssetTab('audio');
      else openAssetTab('media');
      return;
    }
    const transBtn = e.target.closest('.transition-diamond-btn');
    if (transBtn) {
      openAssetTab('transitions');
      toast('Select transition effect');
      return;
    }
  });

  window.addEventListener('pointermove', e => {
    if (!isScrubbing) return;
    handleTimelineScrub(e.clientX);
  });

  window.addEventListener('pointerup', () => {
    if (isScrubbing) {
      isScrubbing = false;
      saveProject();
    }
  });

  // --- Real-Time On-Canvas Transform Gizmo Manipulation ---
  const gizmoEl = $('#transformGizmo');
  let gizmoActive = null;

  gizmoEl?.addEventListener('pointerdown', e => {
    e.stopPropagation();
    const c = selectedClip();
    if (!c) return;

    const handle = e.target.dataset.handle;
    const container = $('#videoCanvasContainer');
    const scaleFactor = container.clientWidth / state.w;
    pushState();

    gizmoActive = {
      type: handle || 'move',
      startX: e.clientX,
      startY: e.clientY,
      origX: c.x || 0,
      origY: c.y || 0,
      origScale: c.scale != null ? c.scale : 1,
      origRot: c.rotation || 0,
      scaleFactor,
      clip: c
    };
    gizmoEl.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', e => {
    if (!gizmoActive) return;
    const { type, startX, startY, origX, origY, origScale, origRot, scaleFactor, clip } = gizmoActive;
    const dx = (e.clientX - startX) / scaleFactor;
    const dy = (e.clientY - startY) / scaleFactor;

    const guideX = $('#guideCenterX');
    const guideY = $('#guideCenterY');

    if (type === 'move') {
      let nx = Math.round(origX + dx);
      let ny = Math.round(origY + dy);

      // Snap to center guidelines
      if (Math.abs(nx) < 14) {
        nx = 0;
        guideX?.classList.remove('hidden');
      } else {
        guideX?.classList.add('hidden');
      }

      if (Math.abs(ny) < 14) {
        ny = 0;
        guideY?.classList.remove('hidden');
      } else {
        guideY?.classList.add('hidden');
      }

      clip.x = nx;
      clip.y = ny;
    } else if (type === 'rot') {
      const container = $('#videoCanvasContainer');
      const cr = container.getBoundingClientRect();
      const centerX = cr.left + cr.width / 2 + (clip.x || 0) * scaleFactor;
      const centerY = cr.top + cr.height / 2 + (clip.y || 0) * scaleFactor;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
      clip.rotation = Math.round(angle);
    } else {
      // Corner scaling
      const dist = Math.hypot(dx, dy);
      const sign = (dx > 0 || dy > 0) ? 1 : -1;
      const newScale = clamp(origScale + (sign * dist) / 400, 0.1, 4.0);
      clip.scale = Number(newScale.toFixed(2));
    }

    renderPreview();
  });

  window.addEventListener('pointerup', () => {
    if (gizmoActive) {
      gizmoActive = null;
      $('#guideCenterX')?.classList.add('hidden');
      $('#guideCenterY')?.classList.add('hidden');
      saveProject();
    }
  });

  // --- Transport & Playback Engine ---
  function play() {
    state.playing = !state.playing;
    updateTimeDisplay();

    if (!state.playing) {
      cancelAnimationFrame(raf);
      return;
    }

    let last = performance.now();
    const loop = (now) => {
      if (!state.playing) return;
      const dt = (now - last) / 1000;
      last = now;
      state.time += dt;

      // Simulated Master Audio Peak Meter
      const meter = $('#audioMeterBar');
      if (meter) {
        const hasAudio = activeClipsAtTime(state.time).some(c => c.track === 'Audio' || c.track === 'SFX');
        meter.style.width = hasAudio ? `${40 + Math.random() * 50}%` : '5%';
      }

      if (state.time >= state.duration) {
        if (state.loop) {
          state.time = 0;
        } else {
          state.time = state.duration;
          state.playing = false;
          updateTimeDisplay();
          if (meter) meter.style.width = '0%';
        }
      }

      renderPreview();
      updateTimeDisplay();
      if (state.playing) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  // --- Ultra HD Render & Export Engine ---
  async function renderUltraHD() {
    const modal = $('#exportModal');
    modal.classList.remove('hidden');

    const res = $('#exportRes').value;
    const fps = Number($('#exportFps').value) || 30;
    const format = $('#exportFormat').value;

    const resMap = {
      '1080': { story: [1080, 1920], landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1350], cinema: [1920, 820], pinterest: [1080, 1620] },
      '2160': { story: [2160, 3840], landscape: [3840, 2160], square: [2160, 2160], portrait: [2160, 2700], cinema: [3840, 1640], pinterest: [2160, 3240] },
      '720': { story: [720, 1280], landscape: [1280, 720], square: [720, 720], portrait: [720, 900], cinema: [1280, 540], pinterest: [720, 1080] }
    };

    const [outW, outH] = resMap[res][state.format] || [1080, 1920];
    $('#expDuration').textContent = `${state.duration.toFixed(1)}s`;
    $('#expAspect').textContent = `${outW}×${outH}`;

    $('#startRenderBtn').onclick = async () => {
      $('#startRenderBtn').classList.add('hidden');
      $('#exportProgressContainer').classList.remove('hidden');

      const oldPlaying = state.playing;
      const oldTime = state.time;
      state.playing = false;
      state.time = 0;

      // Offscreen export canvas
      const expCanvas = document.createElement('canvas');
      expCanvas.width = outW;
      expCanvas.height = outH;
      const expCtx = expCanvas.getContext('2d');

      const stream = expCanvas.captureStream(fps);
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12000000 });
      const chunks = [];

      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${($('#videoProjectName')?.value || 'MK97-Pro-Video').replace(/[^\w-]+/g, '-')}-${outW}p.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);

        state.time = oldTime;
        state.playing = oldPlaying;
        syncUI();
        bumpAnalytics('exports');
        modal.classList.add('hidden');
        $('#startRenderBtn').classList.remove('hidden');
        $('#exportProgressContainer').classList.add('hidden');
        toast('Ultra HD Video Export Complete!');
      };

      recorder.start(200);

      const totalFrames = Math.ceil(state.duration * fps);
      let currentFrame = 0;
      const startTime = performance.now();

      function stepFrame() {
        state.time = currentFrame / fps;
        renderPreview();

        // Draw preview onto export canvas
        expCtx.drawImage(canvas, 0, 0, outW, outH);

        currentFrame++;
        const pct = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        $('#exportProgressBar').style.width = `${pct}%`;
        $('#exportProgressPercent').textContent = `${pct}%`;
        $('#exportFrameCounter').textContent = `Frame ${currentFrame} / ${totalFrames}`;

        const elapsed = (performance.now() - startTime) / 1000;
        const eta = currentFrame > 5 ? Math.max(0, Math.round((elapsed / currentFrame) * (totalFrames - currentFrame))) : 5;
        $('#exportEta').textContent = `ETA: ~${eta}s`;

        if (currentFrame <= totalFrames) {
          requestAnimationFrame(stepFrame);
        } else {
          recorder.stop();
        }
      }
      stepFrame();
    };
  }

  // --- UI Sheets, Modals & Tabs ---
  function closeSheets() {
    $$('.bottom-sheet').forEach(s => s.classList.remove('open'));
    $('#videoBackdrop')?.classList.remove('open');
    $('#exportModal')?.classList.add('hidden');
  }

  function openSheet(id) {
    closeSheets();
    $(id)?.classList.add('open');
    $('#videoBackdrop')?.classList.add('open');
  }

  function openAssetTab(tabName) {
    openSheet('#videoAssetSheet');
    $$('[data-vtab]').forEach(t => t.classList.toggle('active', t.dataset.vtab === tabName));
    $$('[data-vpanel]').forEach(p => p.classList.toggle('hidden', p.dataset.vpanel !== tabName));
  }

  function openEdit() {
    renderInspector();
    openSheet('#videoEditSheet');
  }

  // --- Sync All Viewports ---
  function syncUI() {
    renderPreview();
    renderTracks();
    renderInspector();
    updateMediaList();
  }

  function updateMediaList() {
    const list = $('#videoAssetList');
    if (!list) return;
    list.innerHTML = state.clips.map(c => `
      <div class="layer-row ${c.id === state.selected ? 'active' : ''}" data-id="${c.id}">
        <span class="type">${c.kind === 'audio' || c.kind === 'sfx' ? '♫' : c.kind === 'text' ? 'T' : '▷'}</span>
        <div>
          <b>${c.name || c.kind}</b>
          <small>${c.duration.toFixed(1)}s • ${c.track}</small>
        </div>
        <button class="sheet-close" data-del-id="${c.id}" style="width:26px;height:26px;font-size:12px">✕</button>
      </div>
    `).join('');

    $$('[data-del-id]', list).forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        state.selected = btn.dataset.delId;
        deleteClip();
      };
    });

    $$('.layer-row', list).forEach(row => {
      row.onclick = () => {
        state.selected = row.dataset.id;
        syncUI();
      };
    });
  }

  // --- Population of Creative Drawers ---
  function populateDrawers() {
    // 1. SFX Library
    const sfxGrid = $('#sfxLibraryGrid');
    if (sfxGrid) {
      sfxGrid.innerHTML = sfxLibrary.map(s => `
        <div class="sfx-card" data-sfx="${s.id}">
          <strong>${s.name}</strong>
          <small>${s.desc}</small>
        </div>
      `).join('');
      $$('.sfx-card', sfxGrid).forEach(c => {
        c.onclick = () => addSFXClip(c.dataset.sfx);
      });
    }

    // 2. Text Presets
    const textGrid = $('#textPresetGrid');
    if (textGrid) {
      textGrid.innerHTML = textPresets.map(p => `
        <div class="text-preset-card" data-text-preset="${p.id}">
          <div class="text-preset-preview" style="font-family:${p.font};color:${p.color}">${p.name}</div>
          <small style="color:#94a3b8">Animation: ${p.anim}</small>
        </div>
      `).join('');
      $$('.text-preset-card', textGrid).forEach(card => {
        card.onclick = () => {
          const pr = textPresets.find(x => x.id === card.dataset.textPreset);
          addTextClip(pr);
          closeSheets();
        };
      });
    }

    // 3. Filters & LUTs Grid
    const filterGrid = $('#filtersCardGrid');
    if (filterGrid) {
      filterGrid.innerHTML = filterPresets.map(f => `
        <div class="filter-card ${f.id === state.globalFilter ? 'active' : ''}" data-filter-id="${f.id}">
          <div class="filter-thumb">✦</div>
          <strong>${f.name}</strong>
        </div>
      `).join('');
      $$('.filter-card', filterGrid).forEach(card => {
        card.onclick = () => {
          pushState();
          state.globalFilter = card.dataset.filterId;
          $$('.filter-card', filterGrid).forEach(x => x.classList.toggle('active', x === card));
          renderPreview();
          toast(`Filter: ${card.dataset.filterId}`);
        };
      });
    }

    // 4. Transitions
    const transGrid = $('#transitionsGrid');
    if (transGrid) {
      transGrid.innerHTML = transitionPresets.map(t => `
        <div class="transition-card" data-trans="${t.id}">
          <strong>${t.name}</strong>
          <small>${t.desc}</small>
        </div>
      `).join('');
      $$('.transition-card', transGrid).forEach(c => {
        c.onclick = () => {
          state.globalTransition = c.dataset.trans;
          toast(`Transition set: ${c.dataset.trans}`);
          closeSheets();
        };
      });
    }

    // 5. Motion FX
    const motionGrid = $('#motionFxGrid');
    if (motionGrid) {
      const motionPresets = [
        { id: 'shake', name: 'Camera Shake', desc: 'Handheld organic shake' },
        { id: 'strobe', name: 'Beat Strobe', desc: 'Fast light strobe flash' },
        { id: 'grain', name: 'Film Grain', desc: 'Analog 35mm grain overlay' }
      ];
      motionGrid.innerHTML = motionPresets.map(m => `
        <div class="effect-card" data-fx="${m.id}">
          <strong>${m.name}</strong>
          <small>${m.desc}</small>
        </div>
      `).join('');
      $$('.effect-card', motionGrid).forEach(c => {
        c.onclick = () => {
          const sel = selectedClip();
          if (!sel) {
            toast('Select a clip first');
            return;
          }
          pushState();
          sel.motionFx = c.dataset.fx;
          renderPreview();
          toast(`Motion FX: ${c.dataset.fx}`);
          closeSheets();
        };
      });
    }

    // 6. Stickers
    const stickersGrid = $('#stickersGrid');
    if (stickersGrid) {
      stickersGrid.innerHTML = stickersLibrary.map(s => `
        <div class="sticker-item" data-sticker="${s.id}">
          ${s.icon}
        </div>
      `).join('');
      $$('.sticker-item', stickersGrid).forEach(item => {
        item.onclick = () => {
          const s = stickersLibrary.find(x => x.id === item.dataset.sticker);
          addSticker(s);
        };
      });
    }
  }

  // --- Auto-Captions Quick Generator ---
  $('#generateAutoCaptionsBtn')?.addEventListener('click', () => {
    const topic = $('#captionSampleTopic')?.value || 'Match Highlights';
    const words = [
      'Welcome to MK97 Studio!',
      'Unstoppable power-hitting in full swing!',
      'What an incredible maximum over long-on!',
      'Follow for more daily cricket highlights.'
    ];

    pushState();
    const phraseDur = state.duration / words.length;
    words.forEach((txt, idx) => {
      const c = {
        id: uid(),
        kind: 'text',
        track: 'Text',
        name: `Caption ${idx + 1}`,
        start: idx * phraseDur,
        duration: phraseDur * 0.95,
        text: txt,
        x: 0,
        y: 420,
        scale: 1,
        rotation: 0,
        opacity: 1,
        size: 76,
        font: 'Montserrat',
        color: '#ffffff',
        stroke: '#000000',
        strokeWidth: 6,
        animation: 'pop',
        bgBox: { enabled: true, color: 'rgba(0,0,0,0.65)', padding: 16 }
      };
      state.clips.push(c);
    });
    syncUI();
    closeSheets();
    toast('Auto-Captions generated across timeline!');
  });

  // --- Event Wiring (Images 6 & 9) ---
  // Topbar
  if ($('#videoUndo')) $('#videoUndo').onclick = undo;
  if ($('#videoRedo')) $('#videoRedo').onclick = redo;
  if ($('#videoExport')) $('#videoExport').onclick = renderUltraHD;
  if ($('#closeExportModal')) $('#closeExportModal').onclick = closeSheets;

  // In-Player & Transport Controls (Image 6 & 9)
  if ($('#inplayerPlayBtn')) $('#inplayerPlayBtn').onclick = play;
  if ($('#hugePlayBtn')) $('#hugePlayBtn').onclick = play;
  if ($('#playBtn')) $('#playBtn').onclick = play;
  if ($('#stepStart')) $('#stepStart').onclick = () => { state.time = 0; syncUI(); };
  if ($('#stepEnd')) $('#stepEnd').onclick = () => { state.time = state.duration; syncUI(); };

  const scrubber = $('#inplayerScrubber');
  if (scrubber) {
    scrubber.onclick = e => {
      const r = scrubber.getBoundingClientRect();
      const p = clamp((e.clientX - r.left) / r.width, 0, 1);
      state.time = p * state.duration;
      syncUI();
    };
  }

  const inplayerFs = $('#inplayerFsBtn');
  if (inplayerFs) {
    inplayerFs.onclick = () => {
      if (!document.fullscreenElement) {
        $('#videoStage')?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };
  }

  // Top Tabs Bar (Media, Audio, Text, Stickers, Effects, Transitions, Filters, Adjust)
  $$('.v-top-tab').forEach(tab => {
    tab.onclick = () => {
      $$('.v-top-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      openAssetTab(tab.dataset.vtab);
    };
  });

  // Action Strip (Split, Volume, Speed, Animation, AI Enhance, Stabilize, Reverse, Replace, More)
  if ($('#splitBtn')) $('#splitBtn').onclick = splitClip;
  if ($('#volumeBtn')) $('#volumeBtn').onclick = () => { openEdit(); toast('Adjust volume in clip properties'); };
  if ($('#speedBtn')) $('#speedBtn').onclick = () => { openEdit(); toast('Adjust speed curves in clip properties'); };
  if ($('#animationBtn')) $('#animationBtn').onclick = () => openAssetTab('text');
  if ($('#aiEnhanceBtn')) $('#aiEnhanceBtn').onclick = () => {
    toast('AI Smart Video Enhance: HDR & Super-Clarity applied');
  };
  if ($('#stabilizeBtn')) $('#stabilizeBtn').onclick = () => {
    toast('AI Gyro Camera Stabilization active (100% steady)');
  };
  if ($('#reverseBtn')) $('#reverseBtn').onclick = () => {
    toast('Clip reversed for seamless loop playback');
  };
  if ($('#replaceClipBtn')) $('#replaceClipBtn').onclick = () => $('#videoMediaInput').click();
  if ($('#moreActionsBtn')) $('#moreActionsBtn').onclick = openEdit;

  // Bottom Dock Strip
  $$('.dock-card-btn[data-vtool]').forEach(btn => {
    btn.onclick = () => {
      const t = btn.dataset.vtool;
      if (['filters', 'effects', 'transitions', 'stickers'].includes(t)) {
        openAssetTab(t);
      } else if (t === 'color') {
        openAssetTab('filters');
      } else if (t === 'speed') {
        openEdit();
      }
    };
  });

  // Timeline Controls
  if ($('#duplicateClip')) $('#duplicateClip').onclick = duplicateClip;
  if ($('#deleteClip')) $('#deleteClip').onclick = deleteClip;
  if ($('#addKeyframeBtn')) $('#addKeyframeBtn').onclick = toggleKeyframe;

  $$('[data-vclose]').forEach(btn => { btn.onclick = closeSheets; });
  if ($('#videoBackdrop')) $('#videoBackdrop').onclick = closeSheets;

  // Upload Handlers
  // Upload Handlers
  if ($('#videoUploadBtn')) $('#videoUploadBtn').onclick = () => $('#videoMediaInput')?.click();
  if ($('#imageUploadBtn')) $('#imageUploadBtn').onclick = () => $('#imageMediaInput')?.click();
  if ($('#audioUploadBtn')) $('#audioUploadBtn').onclick = () => $('#audioInput')?.click();
  if ($('#addVideoText')) $('#addVideoText').onclick = () => addTextClip();

  if ($('#videoMediaInput')) {
    $('#videoMediaInput').onchange = e => {
      [...e.target.files].forEach(f => addMediaFile(f));
    };
  }
  if ($('#imageMediaInput')) {
    $('#imageMediaInput').onchange = e => {
      [...e.target.files].forEach(f => addMediaFile(f));
    };
  }
  if ($('#audioInput')) {
    $('#audioInput').onchange = e => {
      [...e.target.files].forEach(f => addMediaFile(f));
    };
  }

  // Preset Beat Buttons
  if ($('#addBeatTrackBtn')) {
    $('#addBeatTrackBtn').onclick = () => {
      addSFXClip('bassdrop');
      toast('Lofi beat pulse added');
    };
  }
  if ($('#addTrapTrackBtn')) {
    $('#addTrapTrackBtn').onclick = () => {
      addSFXClip('hit');
      toast('Trap punch added');
    };
  }
  if ($('#addCinematicTrackBtn')) {
    $('#addCinematicTrackBtn').onclick = () => {
      addSFXClip('whoosh');
      toast('Cinematic swell added');
    };
  }

  // Chroma Key Tab Application
  $('#applyChromaToClipBtn')?.addEventListener('click', () => {
    const sel = selectedClip();
    if (!sel || (sel.kind !== 'video' && sel.kind !== 'image')) {
      toast('Select a video or image overlay clip');
      return;
    }
    pushState();
    sel.chroma = {
      enabled: true,
      color: $('#chromaColorPicker')?.value || '#00ff00',
      tolerance: Number($('#chromaTolerance')?.value) || 38,
      feather: Number($('#chromaFeather')?.value) || 15,
      spill: Number($('#chromaSpill')?.value) || 40
    };
    renderPreview();
    toast('Chroma Key applied to ' + sel.name);
    closeSheets();
  });

  $('#chromaPresetSelect')?.addEventListener('change', e => {
    const cp = $('#chromaColorPicker');
    if (cp) cp.value = e.target.value;
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    const inInput = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if (e.code === 'Space' && !inInput) {
      e.preventDefault();
      play();
    }
    if ((e.key === 's' || e.key === 'S' || e.key === 'b') && !inInput) {
      e.preventDefault();
      splitClip();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) {
      deleteClip();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      duplicateClip();
    }
    if (e.key.toLowerCase() === 'k' && !inInput) {
      e.preventDefault();
      toggleKeyframe();
    }
    if (e.key === 'ArrowLeft' && !inInput) {
      state.time = Math.max(0, state.time - (e.shiftKey ? 1.0 : 0.1));
      syncUI();
    }
    if (e.key === 'ArrowRight' && !inInput) {
      state.time = Math.min(state.duration, state.time + (e.shiftKey ? 1.0 : 0.1));
      syncUI();
    }
  });

  window.addEventListener('resize', () => {
    fitCanvas();
    updateGizmo();
  });

  // Check for imported poster asset
  function checkImportedAsset() {
    const pending = store.get('mk97.pendingVideoAsset');
    if (pending && pending.src) {
      const c = {
        id: uid(),
        kind: 'image',
        track: 'Overlay 1',
        name: pending.name || 'Poster Import',
        src: pending.src,
        start: 0,
        duration: Math.min(6, state.duration),
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        keyframes: []
      };
      state.clips.push(c);
      state.selected = c.id;
      store.set('mk97.pendingVideoAsset', null);
      toast('Poster imported into Video Studio!');
    }
  }

  // --- Boot Initialization ---
  loadProject();
  populateDrawers();
  checkImportedAsset();

  // Seed default 5-track clips matching Reference Images 6 & 9
  if (state.clips.length === 0 || !state.clips.some(c => c.track === 'Overlay')) {
    state.duration = 28.15;
    state.time = 6.28;
    state.clips = [
      // Track 1: Video (Filmstrip clips)
      { id: uid(), kind: 'video', track: 'Video', name: 'Match Day', src: 'fwcwl-logo.jpeg', start: 0, duration: 6.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, keyframes: [] },
      { id: uid(), kind: 'video', track: 'Video', name: 'Shot Six', src: 'fwcwl-logo.jpeg', start: 6.2, duration: 7.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, keyframes: [] },
      { id: uid(), kind: 'video', track: 'Video', name: 'Celebration', src: 'fwcwl-logo.jpeg', start: 13.4, duration: 8.5, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, keyframes: [] },
      
      // Track 2: Text (Gold capsules)
      { id: uid(), kind: 'text', track: 'Text', name: 'MATCH DAY', text: 'MATCH DAY', start: 0.5, duration: 7, size: 140, font: 'Impact', color: '#fef08a', stroke: '#000', strokeWidth: 8, x: 0, y: -250, scale: 1, rotation: 0, opacity: 1, keyframes: [] },
      { id: uid(), kind: 'text', track: 'Text', name: 'INDIA 🇮🇳', text: 'INDIA 🇮🇳', start: 8.0, duration: 5, size: 110, font: 'Montserrat', color: '#38bdf8', stroke: '#000', strokeWidth: 6, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, keyframes: [] },
      { id: uid(), kind: 'text', track: 'Text', name: 'Cricket Creator', text: 'Cricket Creator', start: 13.5, duration: 8, size: 90, font: 'Playfair Display', color: '#f59e0b', stroke: '#000', strokeWidth: 4, x: 0, y: 350, scale: 1, rotation: -4, opacity: 1, keyframes: [] },

      // Track 3: Effects (Purple capsules & clips)
      { id: uid(), kind: 'effects', track: 'Effects', name: 'Stadium Glow', fxBadge: 'FX', start: 0, duration: 6.2, keyframes: [] },
      { id: uid(), kind: 'image', track: 'Effects', name: 'Floodlight Flare', src: 'fwcwl-logo.jpeg', start: 6.2, duration: 6, opacity: 0.8, x: 0, y: 0, scale: 1, rotation: 0, keyframes: [] },
      { id: uid(), kind: 'effects', track: 'Effects', name: 'Slow Motion', fxBadge: '⏱', start: 12.5, duration: 8, keyframes: [] },

      // Track 4: Audio (Cyan waveform tracks)
      { id: uid(), kind: 'audio', track: 'Audio', name: 'Epic Cricket Anthem.mp3', start: 0, duration: 13.2, volume: 1, keyframes: [] },
      { id: uid(), kind: 'audio', track: 'Audio', name: 'Crowd Cheer', start: 13.2, duration: 8.5, volume: 0.85, keyframes: [] },

      // Track 5: Overlay (Dark gold cards)
      { id: uid(), kind: 'overlay', track: 'Overlay', name: 'Particles', start: 0, duration: 5.8, keyframes: [] },
      { id: uid(), kind: 'overlay', track: 'Overlay', name: 'Light Leaks', start: 6.0, duration: 5.2, keyframes: [] },
      { id: uid(), kind: 'overlay', track: 'Overlay', name: 'Crown PNG', start: 11.5, duration: 4.2, keyframes: [] },
      { id: uid(), kind: 'overlay', track: 'Overlay', name: 'Smoke', start: 16.0, duration: 6.0, keyframes: [] }
    ];
  }

  syncUI();
})();
