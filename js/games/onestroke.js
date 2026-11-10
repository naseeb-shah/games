/* ONE STROKE — trace every line exactly once without lifting your finger */
(function () {
  'use strict';

  function config(level) {
    if (level <= 5) return { C: 3, R: 3, E: 5 + (level % 2) };
    if (level <= 15) return { C: 3, R: 4, E: 8 + (level % 3) };
    if (level <= 35) return { C: 4, R: 4, E: 11 + (level % 3) };
    if (level <= 60) return { C: 4, R: 5, E: 14 + (level % 3) };
    return { C: 5, R: 5, E: 17 + (level % 4) };
  }

  const ek = (a, b) => (a < b ? a + '-' + b : b + '-' + a);

  function generate(C, R, E, r) {
    const n = C * R;
    const nbrs = (i) => {
      const x = i % C, y = (i / C) | 0, out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < C && ny < R) out.push(ny * C + nx);
      }
      return out;
    };
    // diagonal crossing key: square top-left + which diagonal
    const diagInfo = (a, b) => {
      const ax = a % C, ay = (a / C) | 0, bx = b % C, by = (b / C) | 0;
      if (ax === bx || ay === by) return null;
      const sx = Math.min(ax, bx), sy = Math.min(ay, by);
      const main = (bx - ax) * (by - ay) > 0; // "\" diagonal
      return { sq: sx + ',' + sy, main };
    };
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const used = new Set();
      const diag = new Map();
      let cur = Math.floor(r() * n);
      const walk = [cur];
      for (let s = 0; s < E; s++) {
        const opts = nbrs(cur).filter((nb) => {
          if (used.has(ek(cur, nb))) return false;
          const d = diagInfo(cur, nb);
          if (d && diag.has(d.sq) && diag.get(d.sq) !== d.main) return false;
          return true;
        });
        if (!opts.length) break;
        // slight preference for straight edges (cleaner shapes)
        const straight = opts.filter((o) => !diagInfo(cur, o));
        const pool = straight.length && r() < 0.6 ? straight : opts;
        const nb = pool[Math.floor(r() * pool.length)];
        used.add(ek(cur, nb));
        const d = diagInfo(cur, nb);
        if (d) diag.set(d.sq, d.main);
        walk.push(nb);
        cur = nb;
      }
      const deg = {};
      for (let i = 1; i < walk.length; i++) { deg[walk[i]] = (deg[walk[i]] || 0) + 1; deg[walk[i - 1]] = (deg[walk[i - 1]] || 0) + 1; }
      const interesting = Object.values(deg).some((d) => d >= 3);
      if (walk.length - 1 >= E && interesting) return walk;
      if (!best || walk.length > best.length) best = walk;
    }
    return best;
  }

  MS.register({
    id: 'onestroke',
    name: 'One Stroke',
    tagline: 'Draw it all in a single line.',
    color: '#ffe600',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40 24 8l16 32H8l16-12 16 12"/><circle cx="8" cy="40" r="3.5" fill="currentColor"/><circle cx="24" cy="8" r="3.5" fill="currentColor"/><circle cx="40" cy="40" r="3.5" fill="currentColor"/><circle cx="24" cy="28" r="3.5" fill="currentColor"/></svg>',
    howTo: [
      'Press on a dot and drag along the lines.',
      'Every line must be drawn exactly once — no lifting, no repeats.',
      'Tip: if a dot has an odd number of lines, start there.',
    ],
    _gen: generate,
    _config: config,

    start(ctx) {
      const { C, R, E } = config(ctx.level);
      const walk = generate(C, R, E, ctx.rng);
      const edges = new Map(); // key -> [a,b]
      for (let i = 1; i < walk.length; i++) edges.set(ek(walk[i - 1], walk[i]), [walk[i - 1], walk[i]]);
      const verts = [...new Set(walk)];
      const total = edges.size;
      let used = new Set();
      let trail = [];
      let resets = 0, hints = 0, done = false;
      let pointer = null, drawing = false, flashBad = 0;

      const canvas = MS.h('canvas', { class: 'game-canvas' });
      ctx.stage.appendChild(MS.h('div', { class: 'center-fill' }, canvas));
      let g, cw, ch, sp, ox, oy;

      function layout() {
        const W = ctx.stage.clientWidth, H = ctx.stage.clientHeight;
        sp = Math.min((W - 40) / (C - 1 + 0.6), (H - 40) / (R - 1 + 0.6), 150);
        cw = sp * (C - 1) + sp * 0.8; ch = sp * (R - 1) + sp * 0.8;
        ox = sp * 0.4; oy = sp * 0.4;
        g = MS.fitCanvas(canvas, cw, ch);
      }
      const pos = (i) => [ox + (i % C) * sp, oy + ((i / C) | 0) * sp];

      function vertexAt(e) {
        const rc = canvas.getBoundingClientRect();
        const x = e.clientX - rc.left, y = e.clientY - rc.top;
        let best = -1, bd = sp * 0.36;
        for (const v of verts) { const [px, py] = pos(v); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = v; } }
        return best;
      }
      const cur = () => trail[trail.length - 1];

      function updateInfo() {
        ctx.info(MS.chip('Lines', `${used.size}/${total}`, used.size === total ? 'hl' : '') + MS.chip('Resets', resets));
      }

      function reset(count = true) {
        if (trail.length > 1 && count) resets++;
        used = new Set(); trail = [];
        updateInfo();
      }

      canvas.addEventListener('pointerdown', (e) => {
        if (done || !ctx.alive) return;
        const v = vertexAt(e);
        if (v < 0) return;
        canvas.setPointerCapture(e.pointerId);
        const rc = canvas.getBoundingClientRect();
        pointer = [e.clientX - rc.left, e.clientY - rc.top];
        if (trail.length && v === cur()) { drawing = true; return; }
        reset();
        trail = [v];
        drawing = true;
        MS.sfx.select();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const rc = canvas.getBoundingClientRect();
        pointer = [e.clientX - rc.left, e.clientY - rc.top];
        const v = vertexAt(e);
        if (v < 0 || v === cur()) return;
        const k = ek(cur(), v);
        if (!edges.has(k)) return;
        if (used.has(k)) { if (flashBad <= 0) { MS.sfx.bad(); flashBad = 1; } return; }
        used.add(k);
        trail.push(v);
        MS.sfx.step(used.size);
        MS.haptic(8);
        updateInfo();
        if (used.size === total) { win(); return; }
        // stuck?
        const any = [...edges.entries()].some(([kk, [a, b]]) => !used.has(kk) && (a === v || b === v));
        if (!any) {
          drawing = false;
          MS.sfx.bad();
          MS.haptic(40);
          ctx.toast('Dead end — try another start');
          flashBad = 1.5;
          ctx.timeout(() => { reset(); }, 650);
        }
      });
      const up = () => { drawing = false; pointer = null; };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);

      function win() {
        done = true;
        drawing = false;
        pointer = null;
        MS.sfx.good();
        const stars = (resets === 0 ? 3 : resets <= 2 ? 2 : 1) - hints;
        ctx.timeout(() => ctx.win({ stars, text: resets ? `Done after ${resets} retries` : 'Flawless — first try!' }), 500);
      }

      function hint() {
        if (done) return;
        hints++;
        used = new Set();
        trail = [walk[0]];
        const steps = Math.max(1, Math.ceil(total / 3));
        for (let i = 1; i <= steps; i++) { used.add(ek(walk[i - 1], walk[i])); trail.push(walk[i]); }
        MS.sfx.good();
        ctx.toast('Continue from the glowing dot');
        updateInfo();
      }

      const LINE = '#ffe600';
      function draw(dt, t) {
        flashBad = Math.max(0, flashBad - dt * 2);
        g.clearRect(0, 0, cw, ch);
        g.lineCap = 'round'; g.lineJoin = 'round';
        // unused edges
        g.lineWidth = Math.max(8, sp * 0.09);
        edges.forEach(([a, b], k) => {
          if (used.has(k)) return;
          const [x1, y1] = pos(a), [x2, y2] = pos(b);
          g.strokeStyle = 'rgba(255,255,255,0.16)';
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        });
        // trail
        if (trail.length > 1) {
          g.strokeStyle = flashBad > 0.5 && !done ? '#ff3b5c' : LINE;
          g.shadowColor = g.strokeStyle;
          g.shadowBlur = done ? 26 + Math.sin(t / 120) * 10 : 16;
          g.beginPath();
          trail.forEach((v, i) => { const [x, y] = pos(v); i ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.stroke();
          g.shadowBlur = 0;
        }
        // rubber band
        if (drawing && pointer && trail.length) {
          const [x, y] = pos(cur());
          g.strokeStyle = 'rgba(255,230,0,0.45)';
          g.lineWidth = Math.max(4, sp * 0.04);
          g.setLineDash([8, 8]);
          g.beginPath(); g.moveTo(x, y); g.lineTo(pointer[0], pointer[1]); g.stroke();
          g.setLineDash([]);
        }
        // vertices
        for (const v of verts) {
          const [x, y] = pos(v);
          const active = trail.length && v === cur();
          g.fillStyle = active ? LINE : '#ffffff';
          g.shadowColor = active ? LINE : 'rgba(255,255,255,.6)';
          g.shadowBlur = active ? 20 : 8;
          g.beginPath(); g.arc(x, y, Math.max(7, sp * 0.075), 0, 6.283); g.fill();
          g.shadowBlur = 0;
          if (active && !done) {
            const pr = sp * 0.12 + (Math.sin(t / 200) + 1) * sp * 0.04;
            g.strokeStyle = 'rgba(255,230,0,.6)'; g.lineWidth = 2;
            g.beginPath(); g.arc(x, y, pr, 0, 6.283); g.stroke();
          }
        }
      }

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
      updateInfo();
      ctx.loop(draw);
      return {};
    },
  });
})();
