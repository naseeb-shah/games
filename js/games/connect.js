/* CONNECT — link planets with orbits; each planet needs exactly its number of links */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const DIRV = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const PLANET = ['#ff2e88', '#00e5ff', '#ffe600', '#b026ff', '#ff8a00', '#39ff14', '#3d6bff', '#00ffb3'];

  function config(level) {
    if (level <= 6) return { W: 6, H: 6, isl: 6 };
    if (level <= 18) return { W: 7, H: 8, isl: 9 };
    if (level <= 35) return { W: 8, H: 9, isl: 12 };
    if (level <= 60) return { W: 9, H: 11, isl: 15 };
    return { W: 10, H: 12, isl: 18 };
  }

  function generate(W, H, target, r) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const isl = [];
      const at = new Map(); // "x,y" -> island idx
      const bcell = new Set(); // cells covered by bridges
      const bridges = [];
      const key = (x, y) => x + ',' + y;
      const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !at.has(key(x, y)) && !bcell.has(key(x, y));
      const addIsl = (x, y) => { at.set(key(x, y), isl.length); isl.push({ x, y }); };
      const addBridge = (a, b, n) => {
        bridges.push({ a, b, n });
        const A = isl[a], B = isl[b];
        const dx = Math.sign(B.x - A.x), dy = Math.sign(B.y - A.y);
        for (let x = A.x + dx, y = A.y + dy; x !== B.x || y !== B.y; x += dx, y += dy) bcell.add(key(x, y));
      };
      addIsl(MS.randInt(r, 1, W - 2), MS.randInt(r, 1, H - 2));
      const maxLen = Math.max(3, Math.floor(Math.max(W, H) / 2) + 1);
      for (let t = 0; t < 4000 && isl.length < target; t++) {
        const a = Math.floor(r() * isl.length);
        const [dx, dy] = DIRV[Math.floor(r() * 4)];
        const len = MS.randInt(r, 2, maxLen);
        const A = isl[a];
        const tx = A.x + dx * len, ty = A.y + dy * len;
        if (!free(tx, ty)) continue;
        let ok = true;
        for (let k = 1; k < len; k++) if (!free(A.x + dx * k, A.y + dy * k)) { ok = false; break; }
        if (!ok) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => at.has(key(tx + ex, ty + ey)))) continue;
        addIsl(tx, ty);
        addBridge(a, isl.length - 1, r() < 0.4 ? 2 : 1);
      }
      if (isl.length < target) continue;
      // extra bridges to create loops
      const has = (a, b) => bridges.some((bb) => (bb.a === a && bb.b === b) || (bb.a === b && bb.b === a));
      for (let a = 0; a < isl.length; a++) {
        for (const [dx, dy] of DIRV) {
          let x = isl[a].x + dx, y = isl[a].y + dy, blocked = false;
          while (x >= 0 && y >= 0 && x < W && y < H && !at.has(key(x, y))) { if (bcell.has(key(x, y))) blocked = true; x += dx; y += dy; }
          if (blocked || !at.has(key(x, y))) continue;
          const b = at.get(key(x, y));
          if (has(a, b) || r() > 0.22) continue;
          if (Math.abs(x - isl[a].x) + Math.abs(y - isl[a].y) < 2) continue;
          addBridge(a, b, r() < 0.35 ? 2 : 1);
        }
      }
      const need = isl.map(() => 0);
      bridges.forEach((b) => { need[b.a] += b.n; need[b.b] += b.n; });
      return { isl, bridges, need };
    }
    return null;
  }

  MS.register({
    id: 'connect',
    name: 'Connect',
    tagline: 'Link the planets into one galaxy.',
    color: '#b026ff',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="11" cy="11" r="6" fill="currentColor"/><circle cx="37" cy="11" r="6"/><circle cx="11" cy="37" r="6"/><path d="M17 9h14M17 13h14M11 17v14"/><circle cx="37" cy="37" r="4" fill="currentColor" opacity=".5"/></svg>',
    howTo: [
      'Drag from one planet to another in a straight line to add an orbit link.',
      'Up to 2 links between two planets; drag again (or tap a link) to change it.',
      'Each number = links that planet needs. Links can’t cross, and all planets must connect.',
    ],
    _gen: generate,
    _config: config,

    start(ctx) {
      const cfg = config(ctx.level);
      let puz = null;
      for (let i = 0; !puz && i < 5; i++) puz = generate(cfg.W, cfg.H, cfg.isl - i, ctx.rng);
      const { isl, need } = puz;
      const { W, H } = cfg;
      const M = isl.length;
      const solution = new Map(puz.bridges.map((b) => [pk(b.a, b.b), b.n]));
      const links = new Map(); // pk -> 1|2
      const hue = isl.map((_, i) => PLANET[i % PLANET.length]);
      let hints = 0, sel = -1;
      const t0 = performance.now();

      function pk(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
      // nearest island in each direction
      const nbr = isl.map((p) => DIRV.map(([dx, dy]) => {
        let best = -1, bd = 1e9;
        isl.forEach((q, j) => {
          if (dx && q.y === p.y && Math.sign(q.x - p.x) === dx) { const d = Math.abs(q.x - p.x); if (d < bd) { bd = d; best = j; } }
          if (dy && q.x === p.x && Math.sign(q.y - p.y) === dy) { const d = Math.abs(q.y - p.y); if (d < bd) { bd = d; best = j; } }
        });
        return best;
      }));

      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.style.position = 'absolute';
      svg.style.overflow = 'visible';
      svg.style.touchAction = 'none';
      ctx.stage.appendChild(svg);
      svg.innerHTML = `<defs>
        <filter id="cglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".08" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        ${hue.map((c, i) => `<radialGradient id="pg${i}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c}"/><stop offset="1" stop-color="#0a0820"/></radialGradient>`).join('')}
      </defs>`;
      const gGrid = el('g'), gLinks = el('g'), gPrev = el('g'), gPl = el('g');
      svg.append(gGrid, gLinks, gPrev, gPl);
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
        gGrid.appendChild(el('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.03, fill: 'rgba(255,255,255,.15)' }));
      }

      function el(tag, attrs = {}) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
      }

      function layout() {
        const SW = ctx.stage.clientWidth, SH = ctx.stage.clientHeight;
        const u = Math.min(SW / W, SH / H, 80);
        svg.style.width = u * W + 'px';
        svg.style.height = u * H + 'px';
        svg.style.left = (SW - u * W) / 2 + 'px';
        svg.style.top = (SH - u * H) / 2 + 'px';
      }

      const degree = (i) => {
        let s = 0;
        links.forEach((n, k) => { const [a, b] = k.split('-').map(Number); if (a === i || b === i) s += n; });
        return s;
      };

      function crosses(a, b) {
        const A = isl[a], B = isl[b];
        for (const k of links.keys()) {
          const [c, d] = k.split('-').map(Number);
          if (c === a || c === b || d === a || d === b) continue;
          const C = isl[c], D = isl[d];
          const h1 = A.y === B.y, h2 = C.y === D.y;
          if (h1 === h2) continue;
          const [Hp, Hq, Vp, Vq] = h1 ? [A, B, C, D] : [C, D, A, B];
          const hx0 = Math.min(Hp.x, Hq.x), hx1 = Math.max(Hp.x, Hq.x);
          const vy0 = Math.min(Vp.y, Vq.y), vy1 = Math.max(Vp.y, Vq.y);
          if (Vp.x > hx0 && Vp.x < hx1 && Hp.y > vy0 && Hp.y < vy1) return k;
        }
        return null;
      }

      function draw() {
        gLinks.innerHTML = '';
        links.forEach((n, k) => {
          const [a, b] = k.split('-').map(Number);
          const A = isl[a], B = isl[b];
          const horiz = A.y === B.y;
          const offs = n === 2 ? [-0.1, 0.1] : [0];
          for (const o of offs) {
            gLinks.appendChild(el('line', {
              x1: A.x + 0.5 + (horiz ? 0 : o), y1: A.y + 0.5 + (horiz ? o : 0),
              x2: B.x + 0.5 + (horiz ? 0 : o), y2: B.y + 0.5 + (horiz ? o : 0),
              stroke: '#7af3ff', 'stroke-width': 0.07, 'stroke-linecap': 'round', filter: 'url(#cglow)',
            }));
          }
        });
        gPl.innerHTML = '';
        isl.forEach((p, i) => {
          const d = degree(i);
          const state = d === need[i] ? 'ok' : d > need[i] ? 'over' : '';
          const g = el('g');
          const ringCol = state === 'ok' ? '#39ff14' : state === 'over' ? '#ff3b5c' : i === sel ? '#ffffff' : 'rgba(255,255,255,.25)';
          g.appendChild(el('circle', { cx: p.x + 0.5, cy: p.y + 0.5, r: 0.46, fill: 'none', stroke: ringCol, 'stroke-width': i === sel ? 0.06 : 0.035, 'stroke-dasharray': state ? '' : '0.12 0.08', filter: state || i === sel ? 'url(#cglow)' : '' }));
          g.appendChild(el('circle', { cx: p.x + 0.5, cy: p.y + 0.5, r: 0.36, fill: `url(#pg${i})` }));
          const t = el('text', {
            x: p.x + 0.5, y: p.y + 0.52, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
            'font-size': 0.42, 'font-weight': 900, fill: '#fff', 'font-family': 'Orbitron, sans-serif',
            style: 'paint-order:stroke;stroke:#000;stroke-width:.06px',
          });
          t.textContent = need[i];
          g.appendChild(t);
          gPl.appendChild(g);
        });
        const ok = isl.filter((_, i) => degree(i) === need[i]).length;
        ctx.info(MS.chip('Planets', `${ok}/${M}`, ok === M ? 'hl' : '') + MS.chip('Links', [...links.values()].reduce((a, b) => a + b, 0)));
      }

      function toPt(e) {
        const rc = svg.getBoundingClientRect();
        return { x: ((e.clientX - rc.left) / rc.width) * W, y: ((e.clientY - rc.top) / rc.height) * H };
      }
      function islandAt(p) {
        let best = -1, bd = 0.55;
        isl.forEach((q, i) => { const d = Math.hypot(q.x + 0.5 - p.x, q.y + 0.5 - p.y); if (d < bd) { bd = d; best = i; } });
        return best;
      }
      function linkAt(p) {
        for (const k of links.keys()) {
          const [a, b] = k.split('-').map(Number);
          const A = isl[a], B = isl[b];
          if (A.y === B.y) {
            if (Math.abs(p.y - (A.y + 0.5)) < 0.3 && p.x > Math.min(A.x, B.x) + 0.5 && p.x < Math.max(A.x, B.x) + 0.5) return k;
          } else if (Math.abs(p.x - (A.x + 0.5)) < 0.3 && p.y > Math.min(A.y, B.y) + 0.5 && p.y < Math.max(A.y, B.y) + 0.5) return k;
        }
        return null;
      }

      function toggle(a, b) {
        const k = pk(a, b);
        const cur = links.get(k) || 0;
        if (cur === 0) {
          const c = crosses(a, b);
          if (c) { MS.sfx.bad(); MS.haptic(30); ctx.toast('Links can’t cross'); return; }
        }
        const next = (cur + 1) % 3;
        if (next) links.set(k, next); else links.delete(k);
        if (next) MS.sfx.connect(); else MS.sfx.tap();
        MS.haptic(8);
        draw();
        check();
      }

      function check() {
        if (!isl.every((_, i) => degree(i) === need[i])) return;
        // connectivity
        const seen = new Set([0]);
        const q = [0];
        while (q.length) {
          const c = q.shift();
          links.forEach((_, k) => {
            const [a, b] = k.split('-').map(Number);
            const o = a === c ? b : b === c ? a : -1;
            if (o >= 0 && !seen.has(o)) { seen.add(o); q.push(o); }
          });
        }
        if (seen.size !== M) { ctx.toast('All planets must form one network'); return; }
        const secs = (performance.now() - t0) / 1000;
        const par = M * 6;
        const stars = (secs <= par ? 3 : secs <= par * 2 ? 2 : 1) - hints;
        ctx.win({ stars, text: `Galaxy linked in ${MS.fmtTime(secs)}` });
      }

      // pointer
      let drag = null;
      svg.addEventListener('pointerdown', (e) => {
        if (!ctx.alive) return;
        const p = toPt(e);
        const i = islandAt(p);
        if (i >= 0) {
          svg.setPointerCapture(e.pointerId);
          drag = { from: i, start: p, target: -1 };
          MS.sfx.select();
          return;
        }
        const k = linkAt(p);
        if (k) { const [a, b] = k.split('-').map(Number); toggle(a, b); sel = -1; return; }
        if (sel >= 0) { sel = -1; draw(); }
      });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const p = toPt(e);
        const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
        gPrev.innerHTML = '';
        drag.target = -1;
        if (Math.hypot(dx, dy) < 0.45) return;
        const di = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 1) : (dy > 0 ? 2 : 3);
        const t = nbr[drag.from][di];
        const A = isl[drag.from];
        if (t >= 0) {
          drag.target = t;
          const B = isl[t];
          gPrev.appendChild(el('line', { x1: A.x + 0.5, y1: A.y + 0.5, x2: B.x + 0.5, y2: B.y + 0.5, stroke: '#fff', 'stroke-width': 0.05, 'stroke-dasharray': '0.15 0.1', opacity: 0.7 }));
          gPrev.appendChild(el('circle', { cx: B.x + 0.5, cy: B.y + 0.5, r: 0.5, fill: 'rgba(255,255,255,.12)' }));
        } else {
          gPrev.appendChild(el('line', { x1: A.x + 0.5, y1: A.y + 0.5, x2: p.x, y2: p.y, stroke: '#ff3b5c', 'stroke-width': 0.04, opacity: 0.6 }));
        }
      });
      const up = (e) => {
        if (!drag) return;
        gPrev.innerHTML = '';
        const p = toPt(e);
        const moved = Math.hypot(p.x - drag.start.x, p.y - drag.start.y) >= 0.45;
        if (moved) {
          if (drag.target >= 0) toggle(drag.from, drag.target);
          sel = -1;
        } else {
          const i = drag.from;
          if (sel >= 0 && sel !== i && nbr[sel].includes(i)) { toggle(sel, i); sel = -1; } else sel = sel === i ? -1 : i;
        }
        drag = null;
        draw();
      };
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', () => { drag = null; gPrev.innerHTML = ''; });

      function hint() {
        const wrong = [...solution.entries()].filter(([k, n]) => links.get(k) !== n);
        const extra = [...links.keys()].filter((k) => !solution.has(k));
        if (extra.length) {
          const k = extra[0];
          links.delete(k);
        } else if (wrong.length) {
          const [k, n] = wrong[Math.floor(Math.random() * wrong.length)];
          links.set(k, n);
        } else return;
        hints++;
        MS.sfx.good();
        draw();
        check();
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
      draw();
      return {};
    },
  });
})();
