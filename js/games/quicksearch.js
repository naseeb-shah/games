/* QUICK SEARCH — pop the floating number bubbles in order, fast */
(function () {
  'use strict';
  const BUB = ['#00e5ff', '#ff2e88', '#b026ff', '#39ff14', '#ffe600', '#ff8a00', '#3d6bff'];

  function config(level) {
    const count = Math.min(6 + level, 30);
    const mode = level % 5 === 0 ? 'random' : level % 3 === 0 ? 'down' : 'up';
    const speed = 18 + Math.min(level, 60) * 1.4;
    return { count, mode, speed };
  }

  MS.register({
    id: 'quicksearch',
    name: 'Quick Search',
    tagline: 'Pop the numbers in order. Fast!',
    color: '#3d9bff',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><circle cx="15" cy="16" r="9"/><circle cx="34" cy="13" r="6"/><circle cx="31" cy="33" r="10" fill="currentColor" fill-opacity=".25"/><path d="M13 13l3-2v10M29 30h4l-3 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    howTo: [
      'Bubbles float around — tap them in order.',
      'Some levels count DOWN, some use random numbers (smallest first).',
      'Wrong tap = +2 seconds. Beat the target time for 3 stars.',
    ],

    start(ctx) {
      const { count, mode, speed } = config(ctx.level);
      const r = ctx.rng;
      let values;
      if (mode === 'random') {
        const set = new Set();
        while (set.size < count) set.add(MS.randInt(r, 1, 99));
        values = [...set];
      } else values = Array.from({ length: count }, (_, i) => i + 1);
      const order = mode === 'down' ? [...values].sort((a, b) => b - a) : [...values].sort((a, b) => a - b);
      let idx = 0, penalty = 0, started = false, t0 = 0, done = false;
      const par = count * 0.95 + 2;

      const field = MS.h('div', { style: { position: 'absolute', inset: '0', overflow: 'hidden', borderRadius: '20px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' } });
      ctx.stage.appendChild(field);
      let W = 0, H = 0, R = 30;
      const bubbles = values.map((v, i) => {
        const el = MS.h('div', { class: 'bubble', '--c': BUB[i % BUB.length] }, String(v));
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
        field.appendChild(el);
        const a = r() * Math.PI * 2;
        const b = { v, el, x: 0, y: 0, vx: Math.cos(a), vy: Math.sin(a), alive: true, rr: 1 };
        return b;
      });

      function layout(initial) {
        W = field.clientWidth; H = field.clientHeight;
        const area = W * H;
        R = Math.max(20, Math.min(40, Math.sqrt(area / (count * 3.6 * Math.PI))));
        bubbles.forEach((b) => {
          b.rr = R * (0.9 + (b.v % 3) * 0.08);
          b.el.style.width = b.el.style.height = b.rr * 2 + 'px';
          b.el.style.fontSize = b.rr * 0.72 + 'px';
          if (initial) {
            // spread out without heavy overlap
            let tries = 0;
            do {
              b.x = b.rr + r() * (W - 2 * b.rr);
              b.y = b.rr + r() * (H - 2 * b.rr);
            } while (tries++ < 60 && bubbles.some((o) => o !== b && o.x && Math.hypot(o.x - b.x, o.y - b.y) < o.rr + b.rr));
          } else {
            b.x = Math.min(Math.max(b.x, b.rr), W - b.rr);
            b.y = Math.min(Math.max(b.y, b.rr), H - b.rr);
          }
        });
      }

      const target = () => order[idx];
      function elapsed() { return started ? (performance.now() - t0) / 1000 + penalty : 0; }
      function updateInfo() {
        const label = mode === 'down' ? 'Count ↓' : mode === 'random' ? 'Low → High' : 'Count ↑';
        ctx.info(
          MS.chip(label, done ? '✓' : `Next <b style="color:var(--cyan);font-size:18px">${target()}</b>`) +
          MS.chip('Time', elapsed().toFixed(1) + 's', elapsed() > par ? 'warn' : '') +
          MS.chip('Target', par.toFixed(0) + 's'),
        );
      }

      function tap(b) {
        if (!started || done || !b.alive || !ctx.alive) return;
        if (b.v === target()) {
          b.alive = false;
          b.el.classList.add('popped');
          b.el.style.transform = `translate(${b.x - b.rr}px, ${b.y - b.rr}px) scale(1.6)`;
          MS.sfx.pop();
          MS.haptic(8);
          idx++;
          if (idx >= order.length) finish();
        } else {
          penalty += 2;
          MS.sfx.bad();
          MS.haptic(50);
          b.el.classList.add('wrong');
          ctx.timeout(() => b.el.classList.remove('wrong'), 300);
          floatText('+2s', b.x, b.y);
        }
        updateInfo();
      }

      function floatText(txt, x, y) {
        const f = MS.h('div', { class: 'float-pts', style: { left: x - 20 + 'px', top: y - 40 + 'px', color: '#ff3b5c' } }, txt);
        field.appendChild(f);
        ctx.timeout(() => f.remove(), 800);
      }

      function finish() {
        done = true;
        const t = elapsed();
        const stars = t <= par ? 3 : t <= par * 1.6 ? 2 : 1;
        ctx.timeout(() => ctx.win({ stars, text: `${t.toFixed(1)}s · target ${par.toFixed(0)}s` }), 300);
      }

      let tickAcc = 0;
      ctx.loop((dt) => {
        for (const b of bubbles) {
          if (!b.alive) continue;
          b.x += b.vx * speed * dt;
          b.y += b.vy * speed * dt;
          if (b.x < b.rr) { b.x = b.rr; b.vx = Math.abs(b.vx); }
          if (b.x > W - b.rr) { b.x = W - b.rr; b.vx = -Math.abs(b.vx); }
          if (b.y < b.rr) { b.y = b.rr; b.vy = Math.abs(b.vy); }
          if (b.y > H - b.rr) { b.y = H - b.rr; b.vy = -Math.abs(b.vy); }
        }
        // soft separation
        for (let i = 0; i < bubbles.length; i++) {
          const a = bubbles[i];
          if (!a.alive) continue;
          for (let j = i + 1; j < bubbles.length; j++) {
            const b = bubbles[j];
            if (!b.alive) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 0.01;
            const min = a.rr + b.rr + 2;
            if (d < min) {
              const push = (min - d) * 0.25;
              const nx = dx / d, ny = dy / d;
              a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
              const tvx = a.vx, tvy = a.vy;
              a.vx = a.vx * 0.5 + b.vx * 0.5 - nx * 0.3; a.vy = a.vy * 0.5 + b.vy * 0.5 - ny * 0.3;
              b.vx = b.vx * 0.5 + tvx * 0.5 + nx * 0.3; b.vy = b.vy * 0.5 + tvy * 0.5 + ny * 0.3;
              const la = Math.hypot(a.vx, a.vy) || 1, lb = Math.hypot(b.vx, b.vy) || 1;
              a.vx /= la; a.vy /= la; b.vx /= lb; b.vy /= lb;
            }
          }
        }
        for (const b of bubbles) if (b.alive) b.el.style.transform = `translate(${b.x - b.rr}px, ${b.y - b.rr}px)`;
        tickAcc += dt;
        if (started && !done && tickAcc > 0.1) { tickAcc = 0; updateInfo(); }
      });

      // countdown
      const ov = MS.h('div', { class: 'overlay-msg' });
      ctx.stage.appendChild(ov);
      const steps = ['3', '2', '1', 'GO!'];
      steps.forEach((s, i) => ctx.timeout(() => {
        ov.textContent = s;
        ov.classList.remove('pop'); void ov.offsetWidth; ov.classList.add('pop');
        if (i < 3) MS.sfx.tick(); else MS.sfx.good();
        if (i === 3) { started = true; t0 = performance.now(); updateInfo(); }
      }, 200 + i * 600));

      ctx.onResize(() => layout(false));
      layout(true);
      updateInfo();
      return {};
    },
  });
})();
