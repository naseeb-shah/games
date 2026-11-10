/* MindSpark app shell: screens, level select, game launching, results, FX */
(function () {
  'use strict';
  const { h, store, sfx } = MS;
  const $ = (s) => document.querySelector(s);

  const screens = { home: $('#home'), detail: $('#detail'), play: $('#play') };
  let currentScreen = 'home';
  function show(name) {
    for (const k in screens) screens[k].classList.toggle('active', k === name);
    currentScreen = name;
  }

  const ICON = {
    restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    hint: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  };
  MS.ICON = ICON;

  /* ---------- toast ---------- */
  let toastT = 0;
  MS.toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1600);
  };

  /* ---------- home ---------- */
  function progressOf(def) {
    const g = store.game(def.id);
    if (def.type === 'levels') {
      const done = Object.keys(g.stars).length;
      return { label: 'Lv ' + Math.min(g.unlocked, def.maxLevel), pct: done / def.maxLevel, done };
    }
    return { label: g.best ? 'Best ' + g.best : 'New', pct: (g.bestStars || 0) / 3 };
  }

  function dailyGame() {
    const r = MS.rng(MS.hash(MS.today()));
    return MS.games[Math.floor(r() * MS.games.length)];
  }

  function renderHome() {
    $('#streakVal').textContent = store.streak();
    $('#starsVal').textContent = store.totalStars();

    const dg = dailyGame();
    const dd = $('#daily');
    dd.innerHTML = '';
    dd.style.setProperty('--c', dg.color);
    dd.append(
      h('div', { class: 'd-icon', style: { color: dg.color, filter: `drop-shadow(0 0 10px ${dg.color})` }, html: dg.icon }),
      h('div', null,
        h('div', { class: 'd-label' }, '★ Daily Pick'),
        h('div', { class: 'd-title' }, dg.name),
        h('div', { class: 'd-sub' }, dg.tagline)),
      h('div', { class: 'd-play' }, '▶'),
    );
    dd.onclick = () => { sfx.select(); quickPlay(dg); };

    const grid = $('#grid');
    grid.innerHTML = '';
    MS.games.forEach((def, i) => {
      const p = progressOf(def);
      const card = h('button', { class: 'card', '--c': def.color, style: { animationDelay: i * 0.04 + 's' } },
        h('div', { class: 'c-icon', html: def.icon }),
        h('div', { class: 'c-name' }, def.name),
        h('div', { class: 'c-tag' }, def.tagline),
        h('div', { class: 'c-prog' }, h('span', { class: 'lv' }, p.label),
          def.type === 'levels' ? h('span', null, p.done + '/' + def.maxLevel) : h('span', null, starStr(store.game(def.id).bestStars || 0))),
        h('div', { class: 'bar' }, h('i', { style: { width: Math.round(p.pct * 100) + '%' } })),
      );
      card.onclick = () => { sfx.select(); MS.haptic(); openDetail(def); };
      grid.appendChild(card);
    });
  }

  function starStr(n) {
    return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
  }

  function quickPlay(def) {
    const g = store.game(def.id);
    detailDef = def;
    launch(def, def.type === 'levels' ? Math.min(g.unlocked, def.maxLevel) : 1);
  }

  /* ---------- detail / level select ---------- */
  let detailDef = null;
  function openDetail(def) {
    detailDef = def;
    const g = store.game(def.id);
    const el = screens.detail;
    el.innerHTML = '';
    const back = h('button', { class: 'icon-btn', 'aria-label': 'Back', html: `<svg viewBox="0 0 24 24">${ICON.back}</svg>` });
    back.onclick = () => { sfx.tap(); goHome(); };
    const share = h('button', { class: 'icon-btn', 'aria-label': 'Share', title: 'Share this game', style: { marginLeft: 'auto' },
      html: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>' });
    share.onclick = () => shareGame(def);
    el.append(h('div', { class: 'detail-head' }, back, share));
    setHash(def.id);

    const scroll = h('div', { class: 'detail-scroll' });
    scroll.append(
      h('div', { class: 'hero', '--c': def.color },
        h('div', { class: 'h-icon', html: def.icon }),
        h('h1', null, def.name),
        h('p', null, def.tagline)),
    );

    if (def.type === 'levels') {
      const done = Object.keys(g.stars).length;
      const st = Object.values(g.stars).reduce((a, b) => a + b, 0);
      const cur = Math.min(g.unlocked, def.maxLevel);
      scroll.append(
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', null, cur), h('span', null, 'Current')),
          h('div', { class: 'stat' }, h('b', null, done + '/' + def.maxLevel), h('span', null, 'Cleared')),
          h('div', { class: 'stat' }, h('b', { style: { color: 'var(--yellow)' } }, st + '★'), h('span', null, 'Stars'))),
      );
      const play = h('button', { class: 'big-btn', '--c': def.color }, done ? `▶ CONTINUE · LEVEL ${cur}` : '▶ START');
      play.onclick = () => launch(def, cur);
      scroll.append(play, tutorialBlock(def, true), h('h2', { class: 'section-title' }, 'Levels'));
      const lv = h('div', { class: 'levels' });
      for (let i = 1; i <= def.maxLevel; i++) {
        const s = g.stars[i] || 0;
        const b = h('button', {
          class: 'lvl' + (i > g.unlocked ? ' locked' : '') + (s ? ' done' : '') + (i === cur && !s ? ' current' : ''),
          '--c': def.color,
        }, i > g.unlocked ? h('span', { html: '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' }) : h('span', null, i),
        h('span', { class: 's', html: i <= g.unlocked ? '★'.repeat(s) + `<span class="off">${'★'.repeat(3 - s)}</span>` : '' }));
        b.onclick = () => launch(def, i);
        lv.appendChild(b);
      }
      scroll.append(lv);
    } else {
      scroll.append(
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', null, g.best || 0), h('span', null, 'Best')),
          h('div', { class: 'stat' }, h('b', null, g.plays || 0), h('span', null, 'Plays')),
          h('div', { class: 'stat' }, h('b', { style: { color: 'var(--yellow)' } }, starStr(g.bestStars || 0)), h('span', null, 'Rank'))),
        h('div', { class: 'howto' }, h('h3', null, 'Star goals'),
          h('ol', null, def.starGoals.map((s, i) => h('li', null, `${'★'.repeat(i + 1)}  score ${s}+`)))),
      );
      const play = h('button', { class: 'big-btn', '--c': def.color }, '▶ PLAY');
      play.onclick = () => launch(def, 1);
      scroll.append(play, tutorialBlock(def, true));
    }
    el.append(scroll);
    show('detail');
  }

  /* ---------- deep links (#gameId) + sharing ---------- */
  function setHash(id) {
    try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch (e) { /* file:// in some browsers */ }
    document.title = id ? `${detailDef.name} – Free Brain Game | MindSpark by ShahNlabs` : baseTitle;
  }
  const baseTitle = document.title;
  async function shareGame(def) {
    sfx.tap();
    const url = location.href.split('#')[0] + '#' + def.id;
    const data = { title: `${def.name} – MindSpark`, text: `${def.tagline} Play free on MindSpark by ShahNlabs:`, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      MS.toast('Link copied!');
    } catch (e) { if (e && e.name !== 'AbortError') MS.toast(url); }
  }
  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const def = MS.games.find((g) => g.id === id);
    if (def) openDetail(def);
  }
  window.addEventListener('hashchange', () => { if (!location.hash) { if (currentScreen !== 'home') goHome(); } else if (!session) openFromHash(); });

  function goHome() {
    detailDef = null;
    setHash('');
    cleanupGame();
    renderHome();
    show('home');
  }

  /* ---------- game runtime ---------- */
  let session = null;

  function cleanupGame() {
    if (!session) return;
    session.alive = false;
    session.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    session.rafs.forEach((s) => (s.on = false));
    try { session.inst && session.inst.destroy && session.inst.destroy(); } catch (e) { console.error(e); }
    session = null;
    $('#stage').innerHTML = '';
    $('#info').innerHTML = '';
  }

  function btn(icon, label, onClick, count) {
    const b = h('button', { class: 'icon-btn badge', 'aria-label': label, title: label, html: `<svg viewBox="0 0 24 24">${icon}</svg>` });
    if (count != null) b.appendChild(h('span', { class: 'count' }, count));
    b.onclick = (e) => { e.stopPropagation(); MS.unlockAudio(); onClick(); };
    return b;
  }

  function launch(def, level) {
    cleanupGame();
    closeModal();
    MS.unlockAudio();
    store.touchStreak();
    const g = store.game(def.id);
    $('#playTitle').textContent = def.name;
    $('#playSub').textContent = def.type === 'levels' ? 'Level ' + level : 'Best ' + (g.best || 0);
    const stage = $('#stage');
    const actionsEl = $('#playActions');
    actionsEl.innerHTML = '';

    const s = (session = { def, level, timers: [], rafs: [], resize: [], alive: true, inst: null });
    let custom = [];
    const restart = btn(ICON.restart, 'Restart', () => { sfx.tap(); launch(def, level); });
    const help = btn(ICON.help, 'How to play', () => {
      sfx.tap();
      const tut = MS.TUT[def.id] || {};
      if (tut.timed) { cleanupGame(); showTutorial(def, () => launch(def, level), 'RESTART ▶'); }
      else showTutorial(def, () => {}, 'BACK TO GAME ▶');
    });

    const ctx = {
      def, level, stage,
      rng: MS.rng(MS.hash(def.id) + level * 7919),
      get alive() { return s.alive && session === s; },
      info(html) { $('#info').innerHTML = html; },
      /** list of {icon, label, onClick, count}; returns array of button elements */
      actions(list) {
        custom.forEach((b) => b.remove());
        custom = list.map((a) => btn(ICON[a.icon] || a.icon, a.label, a.onClick, a.count));
        actionsEl.innerHTML = '';
        custom.forEach((b) => actionsEl.appendChild(b));
        actionsEl.appendChild(help);
        actionsEl.appendChild(restart);
        return custom;
      },
      timeout(fn, ms) { const t = setTimeout(() => { if (ctx.alive) fn(); }, ms); s.timers.push(t); return t; },
      interval(fn, ms) { const t = setInterval(() => { if (ctx.alive) fn(); }, ms); s.timers.push(t); return t; },
      /** run fn(dt seconds, now ms) every frame until it returns false or game ends */
      loop(fn) {
        const handle = { on: true };
        s.rafs.push(handle);
        let last = performance.now();
        const step = (now) => {
          if (!handle.on || !ctx.alive) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (fn(dt, now) === false) { handle.on = false; return; }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        return () => (handle.on = false);
      },
      onResize(fn) { s.resize.push(fn); },
      toast: MS.toast,
      win(opts = {}) { if (ctx.alive) finishLevel(def, level, opts); },
      over(opts = {}) { if (ctx.alive) finishScore(def, opts); },
    };
    ctx.actions([]);
    show('play');
    // let layout settle so stage has its size
    const begin = () => requestAnimationFrame(() => {
      if (session !== s) return;
      try { s.inst = def.start(ctx) || {}; } catch (e) { console.error(e); MS.toast('Oops — something broke'); }
    });
    if (!g.tutSeen && MS.TUT[def.id]) {
      showTutorial(def, () => { g.tutSeen = true; store.save(); begin(); }, 'GOT IT — PLAY ▶');
    } else begin();
  }

  /* ---------- tutorial ---------- */
  let tutOpen = false;
  function tutorialBlock(def, compact) {
    const t = MS.TUT[def.id];
    if (!t) return h('div', { class: 'howto' }, h('h3', null, 'How to play'), h('ol', null, def.howTo.map((x) => h('li', null, x))));
    return h('div', { class: 'tut' + (compact ? ' compact' : ''), '--c': def.color },
      h('div', { class: 'tut-demo', html: t.demo }),
      h('div', { class: 'tut-goal' }, h('b', null, 'GOAL  '), t.goal),
      h('div', { class: 'howto' }, h('h3', null, 'How to play'), h('ol', null, t.steps.map((x) => h('li', null, x)))),
      h('div', { class: 'howto tips' }, h('h3', null, 'Pro tips'), h('ul', null, t.tips.map((x) => h('li', null, x)))),
    );
  }
  function showTutorial(def, onDone, btnText) {
    const card = $('#modalCard');
    card.innerHTML = '';
    card.classList.add('tall');
    tutOpen = true;
    const go = h('button', { class: 'big-btn', '--c': def.color }, btnText || 'GOT IT ▶');
    go.onclick = () => { sfx.select(); tutOpen = false; card.classList.remove('tall'); closeModal(); onDone && onDone(); };
    card.append(
      h('h2', { style: { color: def.color, textShadow: `0 0 16px ${def.color}` } }, def.name),
      tutorialBlock(def),
      h('div', { class: 'btns' }, go),
    );
    openModal();
    card.scrollTop = 0;
  }
  MS.showTutorial = showTutorial;

  function finishLevel(def, level, { stars = 3, text } = {}) {
    stars = Math.max(1, Math.min(3, stars));
    const g = store.game(def.id);
    g.stars[level] = Math.max(g.stars[level] || 0, stars);
    g.unlocked = Math.max(g.unlocked, Math.min(level + 1, def.maxLevel));
    g.plays++;
    store.save();
    session.alive = false;
    sfx.win();
    MS.haptic([20, 40, 20]);
    confetti(def.color);
    setTimeout(() => {
      const card = $('#modalCard');
      card.innerHTML = '';
      const hasNext = level < def.maxLevel;
      const next = h('button', { class: 'big-btn', '--c': def.color }, hasNext ? 'NEXT LEVEL ▶' : 'ALL CLEAR ✦');
      next.onclick = () => (hasNext ? launch(def, level + 1) : (closeModal(), openDetail(def)));
      const replay = h('button', { class: 'btn-ghost' }, '↻ Replay');
      replay.onclick = () => launch(def, level);
      const menu = h('button', { class: 'btn-ghost' }, '☰ Levels');
      menu.onclick = () => { closeModal(); cleanupGame(); openDetail(def); };
      card.append(
        h('div', { class: 'stars-row' }, [0, 1, 2].map((i) => h('span', { class: 'st' + (i < stars ? ' on' : ''), style: { animationDelay: 0.15 + i * 0.18 + 's' } }, '★'))),
        h('h2', null, ['Nice!', 'Great!', 'Brilliant!'][stars - 1]),
        h('p', null, text || `Level ${level} complete`),
        h('div', { class: 'btns' }, next, replay, menu),
      );
      openModal();
    }, 650);
  }

  function finishScore(def, { score = 0, text } = {}) {
    const g = store.game(def.id);
    const prevBest = g.best || 0;
    const isBest = score > prevBest;
    g.best = Math.max(prevBest, score);
    g.plays++;
    const stars = def.starGoals.filter((x) => score >= x).length;
    g.bestStars = Math.max(g.bestStars || 0, stars);
    store.save();
    session.alive = false;
    if (stars > 0) { sfx.win(); confetti(def.color); } else sfx.lose();
    setTimeout(() => {
      const card = $('#modalCard');
      card.innerHTML = '';
      const again = h('button', { class: 'big-btn', '--c': def.color }, '↻ PLAY AGAIN');
      again.onclick = () => launch(def, 1);
      const menu = h('button', { class: 'btn-ghost' }, '☰ Menu');
      menu.onclick = () => { closeModal(); cleanupGame(); openDetail(def); };
      const home = h('button', { class: 'btn-ghost' }, '⌂ Home');
      home.onclick = () => { closeModal(); goHome(); };
      card.append(
        h('div', { class: 'stars-row' }, [0, 1, 2].map((i) => h('span', { class: 'st' + (i < stars ? ' on' : ''), style: { animationDelay: 0.15 + i * 0.18 + 's' } }, '★'))),
        h('h2', null, text || 'Game Over'),
        h('div', { class: 'score-big' }, score),
        isBest && score > 0 ? h('div', { class: 'newbest' }, 'NEW BEST!') : h('p', null, 'Best: ' + g.best),
        h('div', { class: 'btns' }, again, menu, home),
      );
      openModal();
    }, 500);
  }

  /* ---------- modal ---------- */
  function openModal() { $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); }

  function openSettings() {
    const d = store.data;
    const card = $('#modalCard');
    card.innerHTML = '';
    const row = (label, key) => {
      const t = h('button', { class: 'toggle' + (d[key] ? ' on' : ''), 'aria-label': label });
      t.onclick = () => { d[key] = !d[key]; t.classList.toggle('on', d[key]); store.save(); sfx.tap(); };
      return h('div', { class: 'setting-row' }, h('span', null, label), t);
    };
    const reset = h('button', { class: 'btn-ghost', style: { color: 'var(--red)' } }, 'Reset progress');
    let armed = false;
    reset.onclick = () => {
      if (!armed) { armed = true; reset.textContent = 'Tap again to confirm'; return; }
      store.reset(); closeModal(); renderHome(); MS.toast('Progress reset');
    };
    const done = h('button', { class: 'big-btn' }, 'DONE');
    done.onclick = () => { closeModal(); renderHome(); };
    card.append(
      h('h2', null, 'Settings'),
      row('Sound effects', 'sound'),
      row('Vibration', 'vibrate'),
      h('div', { style: { height: '18px' } }),
      h('div', { class: 'btns' }, done, reset),
      h('a', { class: 'credit small', href: 'https://www.shahnlabs.com', target: '_blank', rel: 'noopener' }, h('span', null, 'Built by'), ' ', h('b', null, 'ShahNlabs'), ' ', h('span', { class: 'arrow' }, '↗')),
    );
    openModal();
  }
  $('#settingsBtn').onclick = () => { MS.unlockAudio(); sfx.tap(); openSettings(); };
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal' && !session && !tutOpen) closeModal();
  });

  $('#backBtn').onclick = () => {
    sfx.tap();
    cleanupGame();
    closeModal();
    if (detailDef) openDetail(detailDef); else goHome();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (tutOpen) return;
    if (!$('#modal').classList.contains('hidden') && !session) { closeModal(); return; }
    if (currentScreen === 'play') $('#backBtn').click();
    else if (currentScreen === 'detail') goHome();
  });

  /* ---------- resize ---------- */
  let rzPending = false;
  window.addEventListener('resize', () => {
    if (rzPending) return;
    rzPending = true;
    requestAnimationFrame(() => {
      rzPending = false;
      if (session) session.resize.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
      resizeBg();
    });
  });

  /* ---------- background starfield ---------- */
  const bg = $('#bg');
  let bgCtx, stars = [], bw = 0, bh = 0;
  function resizeBg() {
    bw = window.innerWidth; bh = window.innerHeight;
    bgCtx = MS.fitCanvas(bg, bw, bh);
    const n = Math.round((bw * bh) / 5000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * bw, y: Math.random() * bh,
      r: Math.random() * 1.4 + 0.2, s: Math.random() * 0.15 + 0.02,
      p: Math.random() * Math.PI * 2, c: Math.random() < 0.15 ? (Math.random() < 0.5 ? '#ff7ac0' : '#7af3ff') : '#ffffff',
    }));
  }
  let shoot = null;
  function drawBg(t) {
    bgCtx.clearRect(0, 0, bw, bh);
    for (const s of stars) {
      s.y += s.s; if (s.y > bh + 2) { s.y = -2; s.x = Math.random() * bw; }
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 + s.p));
      bgCtx.globalAlpha = a;
      bgCtx.fillStyle = s.c;
      bgCtx.beginPath(); bgCtx.arc(s.x, s.y, s.r, 0, 6.283); bgCtx.fill();
    }
    if (!shoot && Math.random() < 0.003) shoot = { x: Math.random() * bw, y: Math.random() * bh * 0.4, vx: 9 + Math.random() * 5, vy: 3 + Math.random() * 2, life: 1 };
    if (shoot) {
      const g = bgCtx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 10, shoot.y - shoot.vy * 10);
      g.addColorStop(0, 'rgba(255,255,255,' + shoot.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      bgCtx.globalAlpha = 1; bgCtx.strokeStyle = g; bgCtx.lineWidth = 2;
      bgCtx.beginPath(); bgCtx.moveTo(shoot.x, shoot.y); bgCtx.lineTo(shoot.x - shoot.vx * 10, shoot.y - shoot.vy * 10); bgCtx.stroke();
      shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.015;
      if (shoot.life <= 0 || shoot.x > bw + 100) shoot = null;
    }
    bgCtx.globalAlpha = 1;
    requestAnimationFrame(drawBg);
  }
  resizeBg();
  requestAnimationFrame(drawBg);

  /* ---------- confetti ---------- */
  const fx = $('#fx');
  let parts = [], fxOn = false, fxCtx;
  function confetti(color) {
    const w = window.innerWidth, hh = window.innerHeight;
    fxCtx = MS.fitCanvas(fx, w, hh);
    const cols = [color, '#ffe600', '#00e5ff', '#ff2e88', '#ffffff', '#39ff14'];
    for (let i = 0; i < 140; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const v = 8 + Math.random() * 10;
      parts.push({
        x: w / 2 + (Math.random() - 0.5) * 80, y: hh * 0.62,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        s: 5 + Math.random() * 6, c: cols[i % cols.length], life: 1,
      });
    }
    if (!fxOn) { fxOn = true; requestAnimationFrame(stepFx); }
  }
  function stepFx() {
    const w = window.innerWidth, hh = window.innerHeight;
    fxCtx.clearRect(0, 0, w, hh);
    parts = parts.filter((p) => p.life > 0 && p.y < hh + 20);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
      fxCtx.save();
      fxCtx.translate(p.x, p.y); fxCtx.rotate(p.r);
      fxCtx.globalAlpha = Math.min(1, p.life * 2);
      fxCtx.fillStyle = p.c;
      fxCtx.shadowColor = p.c; fxCtx.shadowBlur = 8;
      fxCtx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      fxCtx.restore();
    }
    if (parts.length) requestAnimationFrame(stepFx);
    else { fxOn = false; fxCtx.clearRect(0, 0, w, hh); }
  }
  MS.confetti = confetti;

  renderHome();
  openFromHash();
})();
