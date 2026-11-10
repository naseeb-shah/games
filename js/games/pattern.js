/* PATTERN — watch the sequence of glowing tiles, then repeat it */
(function () {
  'use strict';
  const TILE_COLORS = ['#00e5ff', '#ff2e88', '#ffe600', '#39ff14', '#b026ff', '#ff8a00', '#3d6bff', '#00ffb3', '#ff9ef5'];

  MS.register({
    id: 'pattern',
    name: 'Pattern',
    tagline: 'Watch. Remember. Repeat.',
    color: '#ff8a00',
    type: 'score',
    starGoals: [4, 8, 12],
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><rect x="5" y="5" width="10" height="10" rx="3"/><rect x="19" y="5" width="10" height="10" rx="3" fill="currentColor"/><rect x="33" y="5" width="10" height="10" rx="3"/><rect x="5" y="19" width="10" height="10" rx="3"/><rect x="19" y="19" width="10" height="10" rx="3"/><rect x="33" y="19" width="10" height="10" rx="3" fill="currentColor"/><rect x="5" y="33" width="10" height="10" rx="3" fill="currentColor"/><rect x="19" y="33" width="10" height="10" rx="3"/><rect x="33" y="33" width="10" height="10" rx="3"/></svg>',
    howTo: [
      'Tiles light up one after another — watch closely.',
      'When it says YOUR TURN, tap the same tiles in the same order.',
      'Each round adds a step and the grid grows. 3 lives.',
    ],

    start(ctx) {
      const r = Math.random;
      let round = 1, lives = 3, seq = [], input = 0, phase = 'watch', size = 0;
      const status = MS.h('div', { class: 'pt-status' });
      const grid = MS.h('div', { class: 'pt-grid' });
      ctx.stage.append(status, grid);
      let tiles = [];

      const gridSize = () => (round <= 3 ? 3 : round <= 9 ? 4 : 5);

      function build() {
        size = gridSize();
        grid.innerHTML = '';
        tiles = [];
        for (let i = 0; i < size * size; i++) {
          const t = MS.h('button', { class: 'pt-tile', '--c': TILE_COLORS[i % TILE_COLORS.length] });
          t.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); });
          tiles.push(t);
          grid.appendChild(t);
        }
        layout();
      }
      function layout() {
        const W = ctx.stage.clientWidth, H = ctx.stage.clientHeight - 44;
        const s = Math.min(W, H, 520);
        grid.style.width = grid.style.height = s + 'px';
        grid.style.left = (W - s) / 2 + 'px';
        grid.style.top = 44 + (H - s) / 2 + 'px';
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid.style.gap = Math.max(6, 16 - size * 2) + 'px';
      }

      function updateInfo() {
        ctx.info(MS.chip('Round', round) + MS.chip('Lives', '♥'.repeat(lives) + '<span style="opacity:.2">' + '♥'.repeat(3 - lives) + '</span>', lives === 1 ? 'warn' : '') + MS.chip('Score', round - 1));
      }
      function setStatus(txt, color) {
        status.textContent = txt;
        status.style.color = color || 'var(--text)';
        status.style.textShadow = color ? `0 0 14px ${color}` : 'none';
      }

      function newRound() {
        if (gridSize() !== size) build();
        const len = round + 2;
        seq = [];
        for (let i = 0; i < len; i++) {
          let v;
          do v = Math.floor(r() * size * size); while (seq.length && v === seq[seq.length - 1]);
          seq.push(v);
        }
        updateInfo();
        play();
      }

      function flash(i, ms) {
        const t = tiles[i];
        t.classList.add('lit');
        MS.sfx.note(i);
        ctx.timeout(() => t.classList.remove('lit'), ms);
      }

      function play() {
        phase = 'watch';
        input = 0;
        setStatus('WATCH…', '#ff8a00');
        const on = Math.max(230, 560 - round * 22);
        const gap = on * 0.5;
        seq.forEach((v, i) => ctx.timeout(() => flash(v, on), 700 + i * (on + gap)));
        ctx.timeout(() => { phase = 'input'; setStatus('YOUR TURN', '#00e5ff'); }, 700 + seq.length * (on + gap));
      }

      function press(i) {
        if (phase !== 'input' || !ctx.alive) return;
        MS.haptic(8);
        if (i === seq[input]) {
          flash(i, 180);
          input++;
          if (input === seq.length) {
            phase = 'wait';
            setStatus('PERFECT!', '#39ff14');
            ctx.timeout(() => MS.sfx.good(), 200);
            round++;
            ctx.timeout(newRound, 900);
          }
        } else {
          phase = 'wait';
          tiles[i].classList.add('bad');
          MS.sfx.bad();
          MS.haptic(60);
          MS.shake(grid);
          ctx.timeout(() => tiles[i].classList.remove('bad'), 400);
          lives--;
          updateInfo();
          if (lives <= 0) {
            setStatus('GAME OVER', '#ff3b5c');
            ctx.timeout(() => ctx.over({ score: round - 1, text: round - 1 >= 8 ? 'Memory Master!' : 'Game Over' }), 700);
          } else {
            setStatus('OOPS — WATCH AGAIN', '#ff3b5c');
            ctx.timeout(play, 900);
          }
        }
      }

      ctx.onResize(layout);
      build();
      updateInfo();
      setStatus('GET READY', '#ffe600');
      ctx.timeout(newRound, 500);
      return {};
    },
  });
})();
