/* FOCUS & MULTITASK — 60-second mix of math, visual memory, odd-one-out and counting */
(function () {
  'use strict';
  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="38"/>',
    square: '<rect x="14" y="14" width="72" height="72" rx="10"/>',
    triangle: '<path d="M50 10 90 84H10Z"/>',
    diamond: '<path d="M50 6 92 50 50 94 8 50Z"/>',
    star: '<path d="m50 6 12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2Z"/>',
    hex: '<path d="M28 10h44l22 40-22 40H28L6 50Z"/>',
    plus: '<path d="M38 8h24v30h30v24H62v30H38V62H8V38h30Z"/>',
    moon: '<path d="M62 8a42 42 0 1 0 30 62A34 34 0 0 1 62 8Z"/>',
  };
  const SHAPE_KEYS = Object.keys(SHAPES);
  const COLS = ['#00e5ff', '#ff2e88', '#ffe600', '#39ff14', '#b026ff', '#ff8a00'];
  const svgShape = (k, c, extra = '') => `<svg viewBox="0 0 100 100" style="filter:drop-shadow(0 0 8px ${c})"><g fill="${c}" ${extra}>${SHAPES[k]}</g></svg>`;

  MS.register({
    id: 'focus',
    name: 'Focus & Multitask',
    tagline: 'Math, memory, focus — 60 seconds.',
    color: '#00ffb3',
    type: 'score',
    starGoals: [150, 300, 500],
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3" fill="currentColor"/><path d="M24 2v8M24 38v8M2 24h8M38 24h8"/></svg>',
    howTo: [
      'Challenges switch fast: quick math, “same as before?”, find the odd one, count the dots.',
      'Correct answers build a combo multiplier (up to ×5).',
      'Mistakes cost 3 seconds. Score as much as you can in 60 seconds!',
    ],

    start(ctx) {
      const R = Math.random;
      const TOTAL = 60;
      let score = 0, streak = 0, timeLeft = TOTAL, running = false, busy = false, lastKind = '';

      const bar = MS.h('i');
      const kindEl = MS.h('div', { class: 'fc-kind' });
      const qEl = MS.h('div', { class: 'fc-q' });
      const body = MS.h('div', { class: 'fc-body' });
      const choices = MS.h('div', { class: 'fc-choices' });
      const combo = MS.h('div', { class: 'fc-combo' });
      const wrap = MS.h('div', { class: 'fc-wrap' }, MS.h('div', { class: 'fc-timebar' }, bar), kindEl, qEl, body, choices, combo);
      ctx.stage.appendChild(wrap);

      const mult = () => Math.min(5, 1 + Math.floor(streak / 3));
      function updateInfo() {
        ctx.info(MS.chip('Score', score, 'hl') + MS.chip('Time', Math.ceil(timeLeft) + 's', timeLeft < 10 ? 'warn' : ''));
        combo.textContent = mult() > 1 ? '×' + mult() : '';
      }

      function floatPts(txt, color) {
        const f = MS.h('div', { class: 'float-pts', style: { left: '50%', top: '40%', color, marginLeft: '-30px' } }, txt);
        wrap.appendChild(f);
        ctx.timeout(() => f.remove(), 800);
      }

      function result(ok) {
        if (!running) return;
        busy = true;
        if (ok) {
          streak++;
          const pts = 10 * mult();
          score += pts;
          MS.sfx.good();
          MS.haptic(6);
          floatPts('+' + pts, '#39ff14');
        } else {
          streak = 0;
          timeLeft -= 3;
          MS.sfx.bad();
          MS.haptic(60);
          MS.shake(body);
          floatPts('−3s', '#ff3b5c');
        }
        updateInfo();
        ctx.timeout(nextTask, ok ? 260 : 520);
      }

      function setChoices(list, correct) {
        choices.innerHTML = '';
        list.forEach((v) => {
          const b = MS.h('button', { html: String(v) });
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!busy) result(v === correct); });
          choices.appendChild(b);
        });
      }
      function numberChoices(ans, spread) {
        const set = new Set([ans]);
        while (set.size < 3) { const d = (1 + Math.floor(R() * spread)) * (R() < 0.5 ? -1 : 1); if (ans + d >= 0) set.add(ans + d); }
        return MS.shuffle(R, [...set]);
      }

      const tasks = {
        math() {
          kindEl.textContent = 'QUICK MATH';
          qEl.textContent = 'Solve it';
          const hard = score > 150;
          const op = MS.pick(R, hard ? ['+', '−', '×'] : ['+', '−']);
          let a = 2 + Math.floor(R() * (hard ? 40 : 15)), b = 2 + Math.floor(R() * (hard ? 30 : 10));
          if (op === '×') { a = 2 + Math.floor(R() * 11); b = 2 + Math.floor(R() * 9); }
          if (op === '−' && b > a) [a, b] = [b, a];
          const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
          body.innerHTML = `<div class="fc-big" style="color:#00e5ff">${a} ${op} ${b}</div>`;
          setChoices(numberChoices(ans, op === '×' ? 8 : 4), ans);
          busy = false;
        },
        memory() {
          kindEl.textContent = 'VISUAL MEMORY';
          qEl.textContent = 'Memorize this…';
          const s1 = [MS.pick(R, SHAPE_KEYS), MS.pick(R, COLS)];
          body.innerHTML = `<div style="width:min(150px,30vw);height:min(150px,30vw)">${svgShape(s1[0], s1[1])}</div>`;
          choices.innerHTML = '';
          busy = true;
          ctx.timeout(() => {
            if (!running) return;
            body.innerHTML = '';
            ctx.timeout(() => {
              if (!running) return;
              const same = R() < 0.5;
              let s2 = s1;
              if (!same) {
                s2 = R() < 0.5 ? [MS.pick(R, SHAPE_KEYS.filter((k) => k !== s1[0])), s1[1]] : [s1[0], MS.pick(R, COLS.filter((c) => c !== s1[1]))];
              }
              qEl.textContent = 'Same as before?';
              body.innerHTML = `<div style="width:min(150px,30vw);height:min(150px,30vw)">${svgShape(s2[0], s2[1])}</div>`;
              setChoices(['NO', 'YES'], same ? 'YES' : 'NO');
              busy = false;
            }, 250);
          }, 1100);
        },
        odd() {
          kindEl.textContent = 'FOCUS';
          qEl.textContent = 'Tap the odd one out';
          const n = score < 120 ? 3 : score < 300 ? 4 : 5;
          const shape = MS.pick(R, SHAPE_KEYS);
          const col = MS.pick(R, COLS);
          const oddIdx = Math.floor(R() * n * n);
          const diffRot = R() < 0.5 && !['circle', 'square', 'plus', 'hex', 'diamond'].includes(shape);
          const W = ctx.stage.clientWidth, H = body.clientHeight || ctx.stage.clientHeight * 0.6;
          const s = Math.floor(Math.min((W - 20) / n, (H - 20) / n, 90) - 10);
          const grid = MS.h('div', { class: 'fc-odd', style: { gridTemplateColumns: `repeat(${n}, 1fr)` }, '--s': s + 'px' });
          for (let i = 0; i < n * n; i++) {
            let html;
            if (i !== oddIdx) html = svgShape(shape, col);
            else if (diffRot) html = svgShape(shape, col, 'transform="rotate(180 50 50)"');
            else html = svgShape(shape, col, `opacity="${score < 150 ? 0.45 : 0.65}"`);
            const b = MS.h('button', { html });
            b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!busy) result(i === oddIdx); });
            grid.appendChild(b);
          }
          body.innerHTML = '';
          body.appendChild(grid);
          choices.innerHTML = '';
          busy = false;
        },
        count() {
          kindEl.textContent = 'FLASH COUNT';
          qEl.textContent = 'How many dots?';
          const k = 3 + Math.floor(R() * (score < 150 ? 5 : 8));
          const S = Math.min(220, ctx.stage.clientWidth - 40);
          const box = MS.h('div', { class: 'fc-dots', style: { width: S + 'px', height: S + 'px' } });
          const pts = [];
          let guard = 0;
          while (pts.length < k && guard++ < 500) {
            const x = 14 + R() * (S - 28), y = 14 + R() * (S - 28);
            if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 30)) pts.push([x, y]);
          }
          const col = MS.pick(R, COLS);
          pts.forEach(([x, y]) => box.appendChild(MS.h('span', { style: { left: x - 10 + 'px', top: y - 10 + 'px', width: '20px', height: '20px', background: col, boxShadow: `0 0 12px ${col}` } })));
          body.innerHTML = '';
          body.appendChild(box);
          choices.innerHTML = '';
          busy = true;
          ctx.timeout(() => {
            if (!running) return;
            box.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;font-size:60px;opacity:.25">?</div>';
            setChoices(numberChoices(pts.length, 2), pts.length);
            busy = false;
          }, 900 + Math.max(0, 300 - score));
        },
      };

      function nextTask() {
        if (!running) return;
        let kind;
        do kind = MS.pick(R, Object.keys(tasks)); while (kind === lastKind && R() < 0.75);
        lastKind = kind;
        body.style.animation = 'none'; void body.offsetWidth; body.style.animation = 'cardIn .3s';
        tasks[kind]();
      }

      let lastSec = TOTAL;
      ctx.loop((dt) => {
        if (!running) return;
        timeLeft -= dt;
        bar.style.width = Math.max(0, (timeLeft / TOTAL) * 100) + '%';
        if (Math.ceil(timeLeft) !== lastSec) {
          lastSec = Math.ceil(timeLeft);
          updateInfo();
          if (lastSec <= 5 && lastSec > 0) MS.sfx.tick();
        }
        if (timeLeft <= 0) {
          running = false;
          timeLeft = 0;
          updateInfo();
          body.innerHTML = '<div class="fc-big" style="color:#ffe600">TIME!</div>';
          choices.innerHTML = '';
          ctx.timeout(() => ctx.over({ score, text: score >= 300 ? 'Laser Focus!' : 'Time’s Up' }), 700);
          return false;
        }
      });

      const ov = MS.h('div', { class: 'overlay-msg' });
      ctx.stage.appendChild(ov);
      ['3', '2', '1', 'GO!'].forEach((s, i) => ctx.timeout(() => {
        ov.textContent = s;
        ov.classList.remove('pop'); void ov.offsetWidth; ov.classList.add('pop');
        if (i < 3) MS.sfx.tick(); else MS.sfx.good();
        if (i === 3) { running = true; nextTask(); }
      }, 200 + i * 600));

      bar.style.width = '100%';
      updateInfo();
      return {};
    },
  });
})();
