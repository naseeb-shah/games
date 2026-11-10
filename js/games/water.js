/* WATER SORT — pour colored liquid until every tube holds one color */
(function () {
  'use strict';
  const CAP = 4;

  const top = (t) => t[t.length - 1];
  const uniform = (t) => t.every((v) => v === t[0]);
  const isSolved = (tubes) => tubes.every((t) => t.length === 0 || (t.length === CAP && uniform(t)));
  function canPour(tubes, a, b) {
    const s = tubes[a], d = tubes[b];
    if (a === b || !s.length || d.length >= CAP) return false;
    return !d.length || top(d) === top(s);
  }
  function runLen(t) {
    let n = 0;
    for (let i = t.length - 1; i >= 0 && t[i] === top(t); i--) n++;
    return n;
  }
  function pour(tubes, a, b) {
    const amt = Math.min(runLen(tubes[a]), CAP - tubes[b].length);
    for (let i = 0; i < amt; i++) tubes[b].push(tubes[a].pop());
    return amt;
  }

  /** DFS solver. true = solvable (or search budget exhausted), false = proven unsolvable */
  function solvable(start, limit = 40000) {
    const seen = new Set();
    const stack = [start.map((t) => t.slice())];
    let count = 0;
    while (stack.length) {
      const s = stack.pop();
      const key = s.map((t) => t.join(',')).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      if (++count > limit) return true;
      if (isSolved(s)) return true;
      for (let a = 0; a < s.length; a++) {
        if (!s[a].length) continue;
        if (s[a].length === CAP && uniform(s[a])) continue;
        let triedEmpty = false;
        for (let b = 0; b < s.length; b++) {
          if (!canPour(s, a, b)) continue;
          if (!s[b].length) {
            if (uniform(s[a]) || triedEmpty) continue;
            triedEmpty = true;
          }
          const ns = s.map((t) => t.slice());
          pour(ns, a, b);
          stack.push(ns);
        }
      }
    }
    return false;
  }

  function generate(n, r) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const balls = [];
      for (let c = 0; c < n; c++) for (let i = 0; i < CAP; i++) balls.push(c);
      MS.shuffle(r, balls);
      const tubes = [];
      for (let i = 0; i < n; i++) tubes.push(balls.slice(i * CAP, i * CAP + CAP));
      if (tubes.some(uniform)) continue;
      tubes.push([], []);
      if (solvable(tubes)) return tubes;
    }
    // fallback: guaranteed-solvable easy layout
    const t = [];
    for (let c = 0; c < n; c++) t.push([c, c, c, (c + 1) % n]);
    t.push([], []);
    return t;
  }

  const config = (level) => ({ n: Math.min(3 + Math.floor((level - 1) / 3), 12) });

  MS.register({
    id: 'water',
    name: 'Water Sort',
    tagline: 'Relax & sort the liquids.',
    color: '#00e5ff',
    type: 'levels',
    maxLevel: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M9 6v32a5 5 0 0 0 10 0V6"/><path d="M29 6v32a5 5 0 0 0 10 0V6"/><path d="M9 28h10M29 20h10" /><path d="M10 30h8v8a4 4 0 0 1-8 0Z" fill="currentColor" stroke="none"/><path d="M30 22h8v16a4 4 0 0 1-8 0Z" fill="currentColor" stroke="none" opacity=".5"/></svg>',
    howTo: [
      'Tap a tube, then tap another to pour.',
      'You can only pour onto the same color or into an empty tube.',
      'Sort every color into its own tube. Stuck? Undo or add a tube.',
    ],
    _gen: generate,
    _solvable: solvable,

    start(ctx) {
      const { n } = config(ctx.level);
      let tubes = generate(n, ctx.rng);
      const colors = MS.COLORS;
      let sel = -1, busy = false, moves = 0, undos = 5, extraUsed = false;
      const history = [];

      const wrap = MS.h('div', { class: 'ws-wrap' });
      ctx.stage.appendChild(wrap);
      let tubeEls = [];

      function build() {
        wrap.innerHTML = '';
        tubeEls = [];
        const T = tubes.length;
        const W = ctx.stage.clientWidth, H = ctx.stage.clientHeight;
        const thFor = (s) => CAP * s + s * 0.7 + 8;
        // pick the row count that gives the biggest tubes for this screen
        let rows = 1, tw = 0, sh = 0;
        for (let rr = 1; rr <= 3; rr++) {
          const pr = Math.ceil(T / rr);
          const twW = Math.min(58, (W - 20) / (pr * 1.5));
          const shH = ((H - 30 - (rr - 1) * 40) / rr - 8) / (CAP + 0.7);
          const s = Math.min(twW * 1.05, shH);
          if (s > sh + 0.5) { rows = rr; sh = s; tw = Math.min(twW, s); }
        }
        sh = Math.max(sh, 12); tw = Math.max(tw, 14);
        const per = Math.ceil(T / rows);
        wrap.style.setProperty('--tw', tw + 'px');
        wrap.style.setProperty('--sh', sh + 'px');
        wrap.style.setProperty('--th', thFor(sh) + 'px');
        wrap.style.setProperty('--gap', tw * 0.5 + 'px');
        for (let r = 0; r < rows; r++) {
          const row = MS.h('div', { class: 'ws-row' });
          for (let i = r * per; i < Math.min(T, (r + 1) * per); i++) {
            const el = MS.h('div', { class: 'tube' });
            el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
            row.appendChild(el);
            tubeEls[i] = el;
          }
          wrap.appendChild(row);
        }
        tubes.forEach((_, i) => paint(i));
      }

      function paint(i, fresh = 0) {
        const el = tubeEls[i];
        const t = tubes[i];
        el.innerHTML = '';
        t.forEach((c, j) => {
          const s = MS.h('div', { class: 'seg' + (j >= t.length - fresh ? ' in' : '') });
          s.style.background = colors[c];
          s.style.boxShadow = `0 0 12px ${colors[c]}66`;
          if (fresh) s.style.animationDelay = (j - (t.length - fresh)) * 0.08 + 's';
          el.appendChild(s);
        });
        el.classList.toggle('done', t.length === CAP && uniform(t));
        el.classList.toggle('sel', i === sel);
      }

      function updateInfo() {
        ctx.info(MS.chip('Moves', moves) + MS.chip('Sorted', `${tubes.filter((t) => t.length === CAP && uniform(t)).length}/${n}`));
      }

      function tap(i) {
        if (busy || !ctx.alive) return;
        MS.unlockAudio();
        if (sel < 0) {
          if (!tubes[i].length || (tubes[i].length === CAP && uniform(tubes[i]))) { MS.shake(tubeEls[i]); MS.sfx.tap(); return; }
          sel = i; MS.sfx.select(); MS.haptic(8); paint(i); return;
        }
        if (sel === i) { sel = -1; MS.sfx.tap(); paint(i); return; }
        const a = sel;
        if (!canPour(tubes, a, i)) {
          MS.sfx.bad(); MS.shake(tubeEls[i]);
          sel = -1; paint(a); return;
        }
        doPour(a, i);
      }

      function doPour(a, b) {
        busy = true;
        sel = -1;
        const src = tubeEls[a], dst = tubeEls[b];
        src.classList.remove('sel');
        const sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect();
        const dir = dr.left > sr.left ? 1 : -1;
        const tx = dr.left + dr.width / 2 - dir * dr.width * 0.35 - (sr.left + sr.width / 2);
        const ty = dr.top - sr.top - sr.width * 0.4;
        src.classList.add('moving');
        src.style.transition = 'transform .32s cubic-bezier(.3,.8,.3,1)';
        src.style.transform = `translate(${tx}px, ${ty}px) rotate(${dir * 100}deg)`;
        history.push({ tubes: tubes.map((t) => t.slice()), moves });
        ctx.timeout(() => {
          const amt = pour(tubes, a, b);
          moves++;
          MS.sfx.pour();
          MS.haptic(10);
          paint(a);
          paint(b, amt);
          ctx.timeout(() => {
            src.style.transform = '';
            ctx.timeout(() => {
              src.classList.remove('moving');
              src.style.transition = '';
              busy = false;
              if (tubes[b].length === CAP && uniform(tubes[b])) MS.sfx.good();
              updateInfo();
              if (isSolved(tubes)) finish();
            }, 300);
          }, 330);
        }, 330);
      }

      function finish() {
        let stars = moves <= n * 3 ? 3 : moves <= n * 5 ? 2 : 1;
        if (extraUsed) stars--;
        ctx.win({ stars, text: `Sorted in ${moves} moves` });
      }

      let btns;
      function setActions() {
        btns = ctx.actions([
          { icon: 'undo', label: 'Undo', count: undos, onClick: undo },
          { icon: 'plus', label: 'Add tube', count: extraUsed ? 0 : 1, onClick: addTube },
        ]);
        btns[0].disabled = !undos;
        btns[1].disabled = extraUsed;
      }
      function undo() {
        if (busy || !history.length || !undos) { MS.sfx.bad(); return; }
        const s = history.pop();
        tubes = s.tubes; moves = s.moves; undos--;
        sel = -1;
        MS.sfx.tap();
        tubes.forEach((_, i) => paint(i));
        updateInfo();
        setActions();
      }
      function addTube() {
        if (busy || extraUsed) return;
        extraUsed = true;
        tubes.push([]);
        history.forEach((hs) => hs.tubes.push([]));
        sel = -1;
        MS.sfx.good();
        build();
        setActions();
        ctx.toast('Extra tube added (−1 ★)');
      }

      setActions();
      ctx.onResize(build);
      build();
      updateInfo();
      return {};
    },
  });
})();
