/* LEFT vs RIGHT BRAIN — answer two independent challenges at once */
(function () {
  'use strict';
  const INKS = [['RED', '#ff3b5c'], ['BLUE', '#3d8bff'], ['GREEN', '#39ff14'], ['YELLOW', '#ffe600'], ['PINK', '#ff6ec7'], ['PURPLE', '#b026ff']];

  MS.register({
    id: 'leftright',
    name: 'Left vs Right',
    tagline: 'Logic and color — at the same time.',
    color: '#ff3b5c',
    type: 'score',
    starGoals: [15, 30, 50],
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M23 8c-6-3-15 1-15 9-3 2-3 9 0 11 0 7 7 11 15 8Z"/><path d="M25 8c6-3 15 1 15 9 3 2 3 9 0 11 0 7-7 11-15 8Z" fill="currentColor" fill-opacity=".3"/><path d="M24 6v34"/></svg>',
    howTo: [
      'LEFT side (logic): is the equation TRUE or FALSE?',
      'RIGHT side (color): does the INK color match the WORD?',
      'Both run at once with their own timers. Miss or mistake = lose a life (3 lives). Keys: A/S and K/L.',
    ],

    start(ctx) {
      const R = Math.random;
      let score = 0, lives = 3, running = false;
      const wrap = MS.h('div', { class: 'lr-wrap' });
      ctx.stage.appendChild(wrap);

      function makeSide(cfg) {
        const prompt = MS.h('div', { class: 'lr-prompt' });
        const bar = MS.h('i');
        const no = MS.h('button', { class: 'lr-btn no', html: `${cfg.no}<small>${cfg.keys[0]}</small>` });
        const yes = MS.h('button', { class: 'lr-btn yes', html: `${cfg.yes}<small>${cfg.keys[1]}</small>` });
        const el = MS.h('div', { class: 'lr-side', '--c': cfg.color },
          MS.h('h4', null, cfg.title), MS.h('div', { class: 'q' }, cfg.q),
          MS.h('div', { class: 'lr-timer' }, bar), prompt, MS.h('div', { class: 'lr-btns' }, no, yes));
        wrap.appendChild(el);
        const side = { el, prompt, bar, gen: cfg.gen, answer: null, start: 0, dur: 4, wait: 0 };
        no.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(side, false); });
        yes.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(side, true); });
        return side;
      }

      function genMath(p) {
        const lvl = Math.min(4, Math.floor(score / 10));
        const ops = lvl < 1 ? ['+'] : lvl < 2 ? ['+', '−'] : ['+', '−', '×'];
        const op = ops[Math.floor(R() * ops.length)];
        const max = 6 + lvl * 4;
        let a = 1 + Math.floor(R() * max), b = 1 + Math.floor(R() * max), c;
        if (op === '−' && b > a) [a, b] = [b, a];
        if (op === '×') { a = 2 + Math.floor(R() * 8); b = 2 + Math.floor(R() * 8); }
        c = op === '+' ? a + b : op === '−' ? a - b : a * b;
        const truth = R() < 0.5;
        if (!truth) c += (R() < 0.5 ? -1 : 1) * (1 + Math.floor(R() * (op === '×' ? 4 : 2)));
        p.innerHTML = `<span>${a} ${op} ${b}<br>= ${c}</span>`;
        return truth;
      }
      function genColor(p) {
        const w = INKS[Math.floor(R() * INKS.length)];
        const truth = R() < 0.5;
        let ink = w;
        if (!truth) while (ink === w) ink = INKS[Math.floor(R() * INKS.length)];
        p.innerHTML = `<span style="color:${ink[1]};text-shadow:0 0 18px ${ink[1]}">${w[0]}</span>`;
        return truth;
      }

      const left = makeSide({ title: 'LEFT BRAIN · LOGIC', q: 'Is it correct?', color: '#00e5ff', no: 'FALSE', yes: 'TRUE', keys: ['A', 'S'], gen: genMath });
      const right = makeSide({ title: 'RIGHT BRAIN · COLOR', q: 'Ink matches word?', color: '#ff2e88', no: 'NO', yes: 'YES', keys: ['K', 'L'], gen: genColor });
      const sides = [left, right];

      const durFor = () => Math.max(1.9, 4.6 - score * 0.06);
      function next(side, delay = 0) {
        side.answer = null;
        side.prompt.style.opacity = 0.15;
        side.wait = delay;
        ctx.timeout(() => {
          side.answer = side.gen(side.prompt);
          side.prompt.style.opacity = 1;
          side.start = performance.now();
          side.dur = durFor();
        }, delay * 1000);
      }

      function flash(side, ok) {
        const p = side.prompt;
        p.classList.remove('flash-ok', 'flash-bad');
        void p.offsetWidth;
        p.classList.add(ok ? 'flash-ok' : 'flash-bad');
      }

      function answer(side, val) {
        if (!running || side.answer === null || !ctx.alive) return;
        if (val === side.answer) {
          score++;
          MS.sfx.step(score % 12);
          MS.haptic(6);
          flash(side, true);
          next(side, 0.12);
        } else {
          fail(side);
        }
        updateInfo();
      }

      function fail(side) {
        lives--;
        MS.sfx.bad();
        MS.haptic(60);
        flash(side, false);
        MS.shake(side.el);
        updateInfo();
        if (lives <= 0) { end(); return; }
        next(side, 0.5);
      }

      function end() {
        running = false;
        sides.forEach((s) => (s.answer = null));
        ctx.timeout(() => ctx.over({ score, text: score >= 30 ? 'Whole-Brain Hero!' : 'Game Over' }), 500);
      }

      function updateInfo() {
        ctx.info(MS.chip('Score', score, 'hl') + MS.chip('Lives', '♥'.repeat(Math.max(0, lives)) + '<span style="opacity:.2">' + '♥'.repeat(3 - Math.max(0, lives)) + '</span>', lives === 1 ? 'warn' : ''));
      }

      ctx.loop((dt, now) => {
        for (const s of sides) {
          if (!running || s.answer === null) { s.bar.style.width = s.answer === null ? '0%' : '100%'; continue; }
          const f = 1 - (now - s.start) / 1000 / s.dur;
          s.bar.style.width = Math.max(0, f * 100) + '%';
          s.bar.style.background = f < 0.3 ? '#ff3b5c' : '';
          if (f <= 0) { s.answer = null; fail(s); }
        }
      });

      const onKey = (e) => {
        const k = e.key.toLowerCase();
        if (k === 'a') answer(left, false);
        else if (k === 's') answer(left, true);
        else if (k === 'k') answer(right, false);
        else if (k === 'l') answer(right, true);
      };
      window.addEventListener('keydown', onKey);

      const ov = MS.h('div', { class: 'overlay-msg' });
      ctx.stage.appendChild(ov);
      ['3', '2', '1', 'GO!'].forEach((s, i) => ctx.timeout(() => {
        ov.textContent = s;
        ov.classList.remove('pop'); void ov.offsetWidth; ov.classList.add('pop');
        if (i < 3) MS.sfx.tick(); else MS.sfx.good();
        if (i === 3) { running = true; next(left); next(right, 0.9); }
      }, 200 + i * 600));

      updateInfo();
      return { destroy() { window.removeEventListener('keydown', onKey); } };
    },
  });
})();
