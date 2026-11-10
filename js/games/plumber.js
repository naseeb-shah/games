/* PLUMBER — rotate pipe tiles so water reaches every pipe */
(function () {
  'use strict';
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [N, E, S, W];
  const opp = (d) => ((d << 2) | (d >> 2)) & 15;
  const rot1 = (m) => ((m << 1) | (m >> 3)) & 15;
  const rotK = (m, k) => { k = ((k % 4) + 4) % 4; while (k--) m = rot1(m); return m; };
  const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

  function config(level) {
    if (level <= 4) return { w: 4, h: 4 };
    if (level <= 12) return { w: 5, h: 5 };
    if (level <= 25) return { w: 6, h: 6 };
    if (level <= 45) return { w: 6, h: 7 };
    if (level <= 70) return { w: 7, h: 8 };
    return { w: 8, h: 9 };
  }

  function neighbor(i, d, w, h) {
    const x = i % w, y = (i / w) | 0;
    if (d === N) return y > 0 ? i - w : -1;
    if (d === S) return y < h - 1 ? i + w : -1;
    if (d === E) return x < w - 1 ? i + 1 : -1;
    return x > 0 ? i - 1 : -1;
  }

  function generate(w, h, r) {
    const n = w * h;
    const mask = new Array(n).fill(0);
    const inT = new Array(n).fill(false);
    const src = ((h / 2) | 0) * w + ((w / 2) | 0);
    const frontier = [];
    const add = (c) => DIRS.forEach((d) => { const nb = neighbor(c, d, w, h); if (nb >= 0 && !inT[nb]) frontier.push([c, nb, d]); });
    inT[src] = true;
    add(src);
    while (frontier.length) {
      const i = Math.floor(r() * frontier.length);
      const [c, nb, d] = frontier[i];
      frontier[i] = frontier[frontier.length - 1];
      frontier.pop();
      if (inT[nb]) continue;
      // discourage 4-way crosses (keep the edge in the pool for later if skipped)
      if (bits(mask[c]) >= 3 && r() < 0.7 && frontier.some((f) => f[1] === nb && f[0] !== c)) continue;
      mask[c] |= d;
      mask[nb] |= opp(d);
      inT[nb] = true;
      add(nb);
    }
    return { mask, src };
  }

  function pipeSvg(m, isSrc) {
    let s = '<svg viewBox="0 0 100 100">';
    const ends = { [N]: [50, -2], [E]: [102, 50], [S]: [50, 102], [W]: [-2, 50] };
    let outer = '', inner = '';
    DIRS.forEach((d) => {
      if (!(m & d)) return;
      const [x, y] = ends[d];
      outer += `<line class="pipe" x1="50" y1="50" x2="${x}" y2="${y}"/>`;
      inner += `<line class="pipe-in" x1="50" y1="50" x2="${x}" y2="${y}"/>`;
    });
    s += outer + inner;
    if (isSrc) s += '<circle class="node" cx="50" cy="50" r="24"/><circle cx="50" cy="50" r="10" fill="#fff" opacity=".85"/>';
    else if (bits(m) === 1) s += '<circle class="node" cx="50" cy="50" r="17"/><circle cx="50" cy="50" r="7" fill="#07061a" opacity=".6"/>';
    return s + '</svg>';
  }

  MS.register({
    id: 'plumber',
    name: 'Plumber',
    tagline: 'Twist pipes. Make it flow.',
    color: '#39ff14',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h14a6 6 0 0 1 6 6v8a6 6 0 0 0 6 6h10"/><path d="M26 24h16" opacity=".5"/><circle cx="6" cy="14" r="3" fill="currentColor"/></svg>',
    howTo: [
      'Tap a tile to rotate it (right-click rotates the other way).',
      'Water flows out of the pink pump.',
      'Connect every pipe with no open ends to win.',
    ],
    _gen: generate,

    start(ctx) {
      const { w, h } = config(ctx.level);
      const { mask, src } = generate(w, h, ctx.rng);
      const n = w * h;
      const rot = mask.map(() => MS.randInt(ctx.rng, 0, 3));
      // make sure it isn't already solved / mostly solved
      for (let i = 0; i < n; i++) if (rotK(mask[i], rot[i]) === mask[i] && ctx.rng() < 0.75 && bits(mask[i]) < 4) rot[i] += 1 + MS.randInt(ctx.rng, 0, 1);
      const eff = (i) => rotK(mask[i], rot[i]);
      let par = 0;
      for (let i = 0; i < n; i++) { let k = 0; while (rotK(mask[i], rot[i] + k) !== mask[i]) k++; par += Math.min(k, 4 - k === 4 ? 0 : 4 - k); }
      const locked = new Array(n).fill(false);
      let taps = 0, hints = 0;

      const grid = MS.h('div', { class: 'pl-grid' });
      ctx.stage.appendChild(grid);
      const tiles = [];
      for (let i = 0; i < n; i++) {
        const rotEl = MS.h('div', { class: 'rot', html: pipeSvg(mask[i], i === src) });
        const t = MS.h('div', { class: 'tile' + (i === src ? ' src' : '') }, rotEl);
        t.addEventListener('pointerdown', (e) => { e.preventDefault(); turn(i, e.button === 2 ? -1 : 1); });
        t.addEventListener('contextmenu', (e) => e.preventDefault());
        tiles.push({ el: t, rotEl });
        grid.appendChild(t);
      }

      function layout() {
        const W = ctx.stage.clientWidth, H = ctx.stage.clientHeight;
        const ts = Math.floor(Math.min((W - 4) / w, (H - 4) / h, 86));
        grid.style.gridTemplateColumns = `repeat(${w}, ${ts - 3}px)`;
        grid.style.gridAutoRows = ts - 3 + 'px';
        grid.style.left = (W - ts * w) / 2 + 'px';
        grid.style.top = (H - ts * h) / 2 + 'px';
      }

      function setRot(i) { tiles[i].rotEl.style.transform = `rotate(${rot[i] * 90}deg)`; }

      function flow() {
        const wet = new Array(n).fill(false);
        const q = [src];
        wet[src] = true;
        while (q.length) {
          const c = q.shift();
          const m = eff(c);
          for (const d of DIRS) {
            if (!(m & d)) continue;
            const nb = neighbor(c, d, w, h);
            if (nb < 0 || wet[nb]) continue;
            if (eff(nb) & opp(d)) { wet[nb] = true; q.push(nb); }
          }
        }
        return wet;
      }

      function refresh() {
        const wet = flow();
        let count = 0;
        wet.forEach((v, i) => { tiles[i].el.classList.toggle('wet', v); if (v) count++; });
        ctx.info(MS.chip('Flow', `${Math.round((count / n) * 100)}%`, count === n ? 'hl' : '') + MS.chip('Taps', taps) + MS.chip('Par', par));
        return count === n;
      }

      function solved() {
        for (let i = 0; i < n; i++) {
          const m = eff(i);
          for (const d of DIRS) {
            if (!(m & d)) continue;
            const nb = neighbor(i, d, w, h);
            if (nb < 0 || !(eff(nb) & opp(d))) return false;
          }
        }
        return true;
      }

      let done = false;
      function turn(i, dir) {
        if (done || !ctx.alive) return;
        if (locked[i]) { MS.shake(tiles[i].el); MS.sfx.bad(); return; }
        rot[i] += dir;
        taps++;
        setRot(i);
        MS.sfx.rotate();
        MS.haptic(6);
        check();
      }
      function check() {
        const all = refresh();
        if (all && solved()) {
          done = true;
          grid.classList.add('won');
          let stars = taps <= par + 2 ? 3 : taps <= par * 1.6 + 4 ? 2 : 1;
          stars -= hints;
          ctx.timeout(() => ctx.win({ stars, text: `${taps} taps (par ${par})` }), 450);
        }
      }

      function hint() {
        if (done) return;
        const wrong = [];
        for (let i = 0; i < n; i++) if (!locked[i] && eff(i) !== mask[i]) wrong.push(i);
        if (!wrong.length) return;
        // prefer one touching the water
        const wet = flow();
        const near = wrong.filter((i) => DIRS.some((d) => { const nb = neighbor(i, d, w, h); return nb >= 0 && wet[nb]; }));
        const pool = near.length ? near : wrong;
        const i = pool[Math.floor(Math.random() * pool.length)];
        while (eff(i) !== mask[i]) rot[i]++;
        locked[i] = true;
        tiles[i].el.classList.add('locked');
        setRot(i);
        hints++;
        MS.sfx.good();
        check();
      }

      for (let i = 0; i < n; i++) setRot(i);
      const hintBtn = ctx.actions([{
        icon: 'hint', label: 'Hint (1 per level)', count: 1,
        onClick: () => {
          if (hints >= 1) { MS.sfx.bad(); ctx.toast('Only 1 hint per level'); return; }
          hint();
          if (hints >= 1) { hintBtn.disabled = true; hintBtn.querySelector('.count').textContent = '0'; ctx.toast('Hint used — the rest is up to you!'); }
        },
      }])[0];
      ctx.onResize(layout);
      layout();
      refresh();
      return {};
    },
  });
})();
