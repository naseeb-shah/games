/* DOT — connect matching colored dots, fill every cell */
(function () {
  'use strict';

  function config(level) {
    const N = level <= 8 ? 5 : level <= 22 ? 6 : level <= 42 ? 7 : level <= 70 ? 8 : 9;
    const base = { 5: 4, 6: 5, 7: 6, 8: 7, 9: 8 }[N];
    const k = Math.min(base + (level % 3 === 0 ? 1 : 0), MS.COLORS.length);
    return { N, k };
  }

  /** Random Hamiltonian path on an NxN grid via backbite moves, split into k segments. */
  function generate(N, k, r) {
    let path = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) path.push(y * N + (y % 2 ? N - 1 - x : x));
    const nb = (c) => {
      const x = c % N, y = (c / N) | 0, out = [];
      if (x > 0) out.push(c - 1);
      if (x < N - 1) out.push(c + 1);
      if (y > 0) out.push(c - N);
      if (y < N - 1) out.push(c + N);
      return out;
    };
    const iters = N * N * N * 25;
    for (let it = 0; it < iters; it++) {
      if (r() < 0.5) path.reverse();
      const e = path[0];
      const ns = nb(e);
      const n = ns[Math.floor(r() * ns.length)];
      const i = path.indexOf(n);
      if (i <= 1) continue;
      const head = path.slice(0, i).reverse();
      path = head.concat(path.slice(i));
    }
    // split into k segments with length >= 3, uneven sizes
    const total = N * N;
    const lens = new Array(k).fill(3);
    let rest = total - 3 * k;
    const w = lens.map(() => 0.3 + r() * r() * 3);
    const ws = w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < k; i++) { const add = Math.floor((rest * w[i]) / ws); lens[i] += add; }
    let sum = lens.reduce((a, b) => a + b, 0);
    while (sum < total) { lens[Math.floor(r() * k)]++; sum++; }
    const order = MS.shuffle(r, [...Array(k).keys()]);
    const sol = [];
    let p = 0;
    for (let i = 0; i < k; i++) { sol[order[i]] = path.slice(p, p + lens[i]); p += lens[i]; }
    return sol;
  }

  MS.register({
    id: 'dot',
    name: 'Dot',
    tagline: 'Link the colors. Fill the board.',
    color: '#ff2e88',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v14h14v14h14"/><circle cx="10" cy="10" r="5" fill="currentColor"/><circle cx="38" cy="38" r="5" fill="currentColor"/><path d="M38 10h-6v8" opacity=".55"/><circle cx="38" cy="10" r="4" fill="currentColor" opacity=".55"/></svg>',
    howTo: [
      'Drag from a dot to the other dot of the same color.',
      'Lines can’t cross — drawing over a line cuts it.',
      'Connect every pair AND fill every cell to win.',
    ],
    _gen: generate,
    _config: config,

    start(ctx) {
      const { N, k } = config(ctx.level);
      const sol = generate(N, k, ctx.rng);
      const colors = MS.COLORS.slice(0, k);
      const dotAt = new Array(N * N).fill(-1);
      sol.forEach((seg, c) => { dotAt[seg[0]] = c; dotAt[seg[seg.length - 1]] = c; });
      let paths = sol.map(() => []);
      let owner = new Array(N * N).fill(-1);
      let active = -1, lastMoved = -1, moves = 0, hints = 0;
      let pointer = null;

      const canvas = MS.h('canvas', { class: 'game-canvas' });
      const wrap = MS.h('div', { class: 'center-fill' }, canvas);
      ctx.stage.appendChild(wrap);
      let g, size, cell;

      function layout() {
        const w = ctx.stage.clientWidth, hh = ctx.stage.clientHeight;
        size = Math.floor(Math.min(w, hh, 640));
        cell = size / N;
        g = MS.fitCanvas(canvas, size, size);
        draw();
      }

      const isDone = (c) => {
        const p = paths[c];
        return p.length > 1 && dotAt[p[0]] === c && dotAt[p[p.length - 1]] === c;
      };
      function rebuildOwner() {
        owner.fill(-1);
        paths.forEach((p, c) => p.forEach((i) => (owner[i] = c)));
      }
      function updateInfo() {
        const flows = paths.filter((_, c) => isDone(c)).length;
        const filled = owner.filter((o) => o >= 0).length;
        const pct = Math.round((filled / (N * N)) * 100);
        ctx.info(
          MS.chip('Flows', `${flows}/${k}`, flows === k ? 'hl' : '') +
          MS.chip('Fill', pct + '%', pct === 100 ? 'hl' : '') +
          MS.chip('Moves', moves),
        );
      }

      function cellAt(e) {
        const rc = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rc.left) / cell);
        const y = Math.floor((e.clientY - rc.top) / cell);
        if (x < 0 || y < 0 || x >= N || y >= N) return -1;
        return y * N + x;
      }
      const adj = (a, b) => {
        const ax = a % N, ay = (a / N) | 0, bx = b % N, by = (b / N) | 0;
        return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
      };

      function tryStep(c) {
        const p = paths[active];
        const last = p[p.length - 1];
        if (c === last) return true;
        const idx = p.indexOf(c);
        if (idx >= 0) { paths[active] = p.slice(0, idx + 1); return true; }
        if (!adj(last, c)) return false;
        if (p.length > 1 && dotAt[last] === active) return false; // already complete
        if (dotAt[c] >= 0 && dotAt[c] !== active) return false;
        if (owner[c] >= 0 && owner[c] !== active) {
          const o = owner[c];
          const oi = paths[o].indexOf(c);
          paths[o] = paths[o].slice(0, oi);
        }
        p.push(c);
        rebuildOwner();
        if (dotAt[c] === active) { MS.sfx.connect(); MS.haptic(15); } else MS.sfx.step(p.length);
        return true;
      }

      function moveTo(c) {
        // walk step by step towards c so fast drags don't skip cells
        for (let guard = 0; guard < N * 2; guard++) {
          const p = paths[active];
          const last = p[p.length - 1];
          if (last === c || p.indexOf(c) >= 0) { tryStep(c); break; }
          const lx = last % N, ly = (last / N) | 0, cx = c % N, cy = (c / N) | 0;
          const dx = cx - lx, dy = cy - ly;
          let next;
          if (Math.abs(dx) >= Math.abs(dy)) next = last + Math.sign(dx);
          else next = last + Math.sign(dy) * N;
          if (!tryStep(next)) break;
        }
        rebuildOwner();
      }

      canvas.addEventListener('pointerdown', (e) => {
        if (!ctx.alive) return;
        const c = cellAt(e);
        if (c < 0) return;
        canvas.setPointerCapture(e.pointerId);
        pointer = { x: e.clientX, y: e.clientY };
        if (dotAt[c] >= 0) {
          active = dotAt[c];
          paths[active] = [c];
          MS.sfx.select();
        } else if (owner[c] >= 0) {
          active = owner[c];
          const p = paths[active];
          paths[active] = p.slice(0, p.indexOf(c) + 1);
        } else return;
        rebuildOwner();
        MS.haptic(8);
        draw();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (active < 0) return;
        pointer = { x: e.clientX, y: e.clientY };
        const c = cellAt(e);
        if (c >= 0) moveTo(c);
        draw();
      });
      const up = () => {
        if (active < 0) return;
        if (active !== lastMoved) { moves++; lastMoved = active; }
        active = -1;
        pointer = null;
        // drop dangling single-cell paths
        paths = paths.map((p) => (p.length === 1 ? [] : p));
        rebuildOwner();
        draw();
        updateInfo();
        checkWin();
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);

      function checkWin() {
        const allDone = paths.every((_, c) => isDone(c));
        if (!allDone) return;
        const full = owner.every((o) => o >= 0);
        if (!full) { ctx.toast('All linked — now fill every cell!'); return; }
        const stars = Math.max(1, (moves <= k ? 3 : moves <= k + 3 ? 2 : 1) - hints);
        ctx.win({ stars, text: `Solved in ${moves} moves` });
      }

      function hint() {
        const wrong = sol.map((s, c) => c).filter((c) => {
          const p = paths[c];
          const s = sol[c];
          return !(p.length === s.length && (p.every((v, i) => v === s[i]) || p.every((v, i) => v === s[s.length - 1 - i])));
        });
        if (!wrong.length) return;
        const c = wrong[Math.floor(Math.random() * wrong.length)];
        for (const cellI of sol[c]) {
          const o = owner[cellI];
          if (o >= 0 && o !== c) { const oi = paths[o].indexOf(cellI); paths[o] = paths[o].slice(0, oi); if (paths[o].length === 1) paths[o] = []; rebuildOwner(); }
        }
        paths[c] = sol[c].slice();
        rebuildOwner();
        hints++;
        MS.sfx.good();
        draw();
        updateInfo();
        checkWin();
      }

      function draw() {
        if (!g) return;
        g.clearRect(0, 0, size, size);
        // board
        g.fillStyle = 'rgba(255,255,255,0.025)';
        roundRect(g, 0, 0, size, size, 14); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.07)';
        g.lineWidth = 1;
        for (let i = 1; i < N; i++) {
          g.beginPath(); g.moveTo(i * cell, 4); g.lineTo(i * cell, size - 4); g.stroke();
          g.beginPath(); g.moveTo(4, i * cell); g.lineTo(size - 4, i * cell); g.stroke();
        }
        // cell fills
        for (let i = 0; i < N * N; i++) {
          if (owner[i] < 0) continue;
          const x = i % N, y = (i / N) | 0;
          g.fillStyle = colors[owner[i]] + (isDone(owner[i]) ? '33' : '1c');
          g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
        }
        // paths
        g.lineCap = 'round'; g.lineJoin = 'round';
        paths.forEach((p, c) => {
          if (p.length < 2) return;
          g.strokeStyle = colors[c];
          g.shadowColor = colors[c];
          g.shadowBlur = 14;
          g.lineWidth = cell * 0.3;
          g.beginPath();
          p.forEach((i, j) => {
            const x = (i % N + 0.5) * cell, y = (((i / N) | 0) + 0.5) * cell;
            j ? g.lineTo(x, y) : g.moveTo(x, y);
          });
          g.stroke();
        });
        g.shadowBlur = 0;
        // dots
        for (let i = 0; i < N * N; i++) {
          if (dotAt[i] < 0) continue;
          const c = dotAt[i];
          const x = (i % N + 0.5) * cell, y = (((i / N) | 0) + 0.5) * cell;
          g.fillStyle = colors[c];
          g.shadowColor = colors[c];
          g.shadowBlur = isDone(c) ? 22 : 12;
          g.beginPath(); g.arc(x, y, cell * 0.33, 0, 6.283); g.fill();
          g.shadowBlur = 0;
          g.fillStyle = 'rgba(255,255,255,0.45)';
          g.beginPath(); g.arc(x - cell * 0.1, y - cell * 0.1, cell * 0.09, 0, 6.283); g.fill();
        }
        // finger halo
        if (pointer && active >= 0) {
          const rc = canvas.getBoundingClientRect();
          g.fillStyle = colors[active] + '30';
          g.beginPath(); g.arc(pointer.x - rc.left, pointer.y - rc.top, cell * 0.7, 0, 6.283); g.fill();
        }
      }
      function roundRect(g, x, y, w, h, r) {
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
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
      return {};
    },
  });
})();
