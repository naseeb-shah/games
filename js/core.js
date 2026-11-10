/* MindSpark core: registry, RNG, storage, audio, helpers */
(function () {
  'use strict';
  const MS = (window.MS = { games: [] });

  MS.register = (def) => MS.games.push(def);

  /* ---------- seeded random ---------- */
  MS.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  MS.hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  MS.randInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  MS.pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  MS.shuffle = (r, arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  MS.COLORS = ['#ff2e88', '#00e5ff', '#ffe600', '#39ff14', '#b026ff', '#ff8a00',
    '#ff3131', '#3d6bff', '#00ffb3', '#ff9ef5', '#f4f4ff', '#a0522d'];

  /* ---------- storage ---------- */
  const KEY = 'mindspark.v1';
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* ignore */ }
  data = Object.assign({ games: {}, sound: true, vibrate: true, streak: { count: 0, last: null } }, data || {});

  const dayStr = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  MS.today = () => dayStr(new Date());

  MS.store = {
    get data() { return data; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } },
    game(id) {
      if (!data.games[id]) data.games[id] = { unlocked: 1, stars: {}, best: 0, bestStars: 0, plays: 0 };
      return data.games[id];
    },
    totalStars() {
      let t = 0;
      for (const id in data.games) {
        const g = data.games[id];
        for (const k in g.stars) t += g.stars[k];
        t += g.bestStars || 0;
      }
      return t;
    },
    touchStreak() {
      const today = MS.today();
      const s = data.streak;
      if (s.last === today) return;
      const y = new Date(); y.setDate(y.getDate() - 1);
      s.count = s.last === dayStr(y) ? s.count + 1 : 1;
      s.last = today;
      this.save();
    },
    streak() {
      const s = data.streak;
      const y = new Date(); y.setDate(y.getDate() - 1);
      if (s.last === MS.today() || s.last === dayStr(y)) return s.count;
      return 0;
    },
    reset() { data = { games: {}, sound: data.sound, vibrate: data.vibrate, streak: { count: 0, last: null } }; this.save(); },
  };

  /* ---------- audio (synthesized, no files) ---------- */
  let ac = null;
  function audio() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0, slide = 0) {
    if (!data.sound) return;
    const c = audio();
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349, 2637, 3136, 3520];
  MS.sfx = {
    tap() { tone(660, 0.06, 'triangle', 0.08); },
    select() { tone(540, 0.08, 'sine', 0.12, 0, 120); },
    pop() { tone(700, 0.09, 'sine', 0.14, 0, 500); },
    good() { tone(784, 0.1, 'triangle', 0.12); tone(1175, 0.14, 'triangle', 0.1, 0.07); },
    bad() { tone(190, 0.2, 'sawtooth', 0.07, 0, -70); },
    connect() { tone(988, 0.12, 'sine', 0.12); tone(1319, 0.14, 'sine', 0.08, 0.05); },
    pour() { tone(260, 0.3, 'sine', 0.09, 0, 380); },
    rotate() { tone(380, 0.05, 'square', 0.035, 0, 60); },
    step(i = 0) { tone(SCALE[(i + 4) % SCALE.length], 0.09, 'triangle', 0.08); },
    note(i) { tone(SCALE[i % SCALE.length], 0.32, 'sine', 0.16); },
    tick() { tone(1400, 0.03, 'square', 0.03); },
    win() { [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.11, i * 0.08)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.24, 'sawtooth', 0.06, i * 0.13)); },
  };
  MS.unlockAudio = () => audio();
  MS.haptic = (ms = 12) => {
    if (data.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } }
  };

  /* ---------- DOM helpers ---------- */
  MS.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k.startsWith('--')) el.style.setProperty(k, v);
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(kid) : kid);
    }
    return el;
  };
  MS.fmtTime = (s) => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };
  MS.shake = (el) => {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };
  /** Set up a hi-dpi canvas; returns 2d context scaled to CSS pixels. */
  MS.fitCanvas = (canvas, w, h) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  };
  MS.chip = (label, value, cls = '') => `<span class="chip ${cls}"><em>${label}</em>${value}</span>`;
})();
