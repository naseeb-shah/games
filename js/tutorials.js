/* Tutorials: animated demo + goal + steps + tips for every game */
(function () {
  'use strict';
  // finger cursor used in demos
  const finger = (path, dur, extra = '') =>
    `<g ${extra}><circle r="9" fill="#fff" fill-opacity=".85"/><circle r="15" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"><animate attributeName="r" values="9;17;9" dur="1s" repeatCount="indefinite"/></circle><animateMotion path="${path}" dur="${dur}" repeatCount="indefinite"/></g>`;
  const label = (x, y, t, c = '#8e8bbd') => `<text x="${x}" y="${y}" fill="${c}" font-size="11" font-family="Orbitron,sans-serif" text-anchor="middle" font-weight="700">${t}</text>`;

  MS.TUT = {
    dot: {
      goal: 'Join each pair of same-colored dots with a line — and cover EVERY square of the board.',
      demo: `<svg viewBox="0 0 200 140">
        <g stroke="rgba(255,255,255,.08)">${[0, 1, 2, 3].map((i) => `<line x1="${40 + i * 40}" y1="10" x2="${40 + i * 40}" y2="130"/>`).join('')}${[0, 1, 2, 3].map((i) => `<line x1="40" y1="${10 + i * 40}" x2="160" y2="${10 + i * 40}"/>`).join('')}</g>
        <path d="M60 30H140V70" stroke="#ff2e88" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="130" stroke-dashoffset="130"><animate attributeName="stroke-dashoffset" values="130;0;0;130" keyTimes="0;.45;.85;1" dur="3s" repeatCount="indefinite"/></path>
        <path d="M60 70V110H140" stroke="#00e5ff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".9"/>
        <circle cx="60" cy="30" r="13" fill="#ff2e88"/><circle cx="140" cy="70" r="13" fill="#ff2e88"/>
        <circle cx="60" cy="70" r="13" fill="#00e5ff"/><circle cx="140" cy="110" r="13" fill="#00e5ff"/>
        ${finger('M60 30H140V70V70V70', '3s')}
      </svg>`,
      steps: [
        'Press on any colored dot and hold.',
        'Drag through the squares to the OTHER dot of the same color, then let go.',
        'Do this for every color. Lines can’t cross each other.',
        'You win when all pairs are joined AND no empty square is left.',
      ],
      tips: [
        'Start with dots near edges and corners — they have fewest options.',
        'Drawing over another line cuts it. Drag backwards on your own line to undo part of it.',
        'If all are linked but you don’t win, some square is still empty — reroute a line through it.',
        'Stuck? The bulb (Hint) button reveals one correct line — only 1 hint per level.',
      ],
    },
    water: {
      goal: 'Sort the liquids so each tube holds only ONE color (4 layers).',
      demo: `<svg viewBox="0 0 200 140">
        <g fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3"><path d="M50 30v80a14 14 0 0 0 28 0V30"/><path d="M122 30v80a14 14 0 0 0 28 0V30"/></g>
        <rect x="53" y="98" width="22" height="22" rx="8" fill="#00e5ff"/><rect x="53" y="80" width="22" height="20" fill="#00e5ff"/>
        <rect x="125" y="98" width="22" height="22" rx="8" fill="#ff2e88"/>
        <rect x="53" y="60" width="22" height="20" fill="#ff2e88"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.35;.4;.95;1" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="125" y="80" width="22" height="18" fill="#ff2e88" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.4;.5;.95;1" dur="3s" repeatCount="indefinite"/></rect>
        ${finger('M64 20 L64 20 L136 20 L136 20 L64 20', '3s')}
        ${label(64, 136, '1 · TAP')}${label(136, 136, '2 · TAP')}
      </svg>`,
      steps: [
        'Tap a tube to pick it up (it lifts).',
        'Tap another tube to pour the TOP color into it.',
        'You can only pour onto the SAME color, or into an EMPTY tube, and only if there is room.',
        'Keep going until every tube is one solid color.',
      ],
      tips: [
        'Use the empty tubes as temporary storage — don’t fill them too early.',
        'Try to finish one color at a time.',
        '↶ Undo takes back a pour (5 per level). ＋ adds an extra empty tube once (costs 1 star).',
        'Fewer moves = more stars.',
      ],
    },
    plumber: {
      goal: 'Rotate the pipe pieces so water from the pink pump reaches EVERY pipe — no leaks.',
      demo: `<svg viewBox="0 0 200 140">
        <rect x="20" y="40" width="56" height="56" rx="8" fill="rgba(255,46,136,.15)" stroke="rgba(255,46,136,.5)"/>
        <rect x="80" y="40" width="56" height="56" rx="8" fill="rgba(255,255,255,.05)"/>
        <rect x="140" y="40" width="56" height="56" rx="8" fill="rgba(255,255,255,.05)"/>
        <line x1="48" y1="68" x2="80" y2="68" stroke="#00e5ff" stroke-width="12" stroke-linecap="round"/>
        <circle cx="48" cy="68" r="12" fill="#ff2e88"/>
        <g><path d="M108 40V68H136" stroke="#3a3570" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="stroke" values="#3a3570;#3a3570;#00e5ff;#00e5ff" keyTimes="0;.5;.55;1" dur="3s" repeatCount="indefinite"/></path>
          <animateTransform attributeName="transform" type="rotate" values="0 108 68;0 108 68;-90 108 68;-90 108 68" keyTimes="0;.35;.5;1" dur="3s" repeatCount="indefinite"/></g>
        <path d="M140 68H168" stroke="#3a3570" stroke-width="12" stroke-linecap="round"><animate attributeName="stroke" values="#3a3570;#3a3570;#00e5ff;#00e5ff" keyTimes="0;.6;.65;1" dur="3s" repeatCount="indefinite"/></path>
        <circle cx="168" cy="68" r="10" fill="#3a3570"><animate attributeName="fill" values="#3a3570;#3a3570;#00e5ff;#00e5ff" keyTimes="0;.6;.65;1" dur="3s" repeatCount="indefinite"/></circle>
        ${finger('M108 68 L108 68', '3s')}
        ${label(108, 124, 'TAP TO ROTATE')}
      </svg>`,
      steps: [
        'Water starts at the PINK pump.',
        'Tap any tile to rotate it 90° clockwise (right-click = counter-clockwise).',
        'Connected pipes glow blue — that means water is flowing through them.',
        'Win when ALL pipes glow and no pipe end points at nothing.',
      ],
      tips: [
        'Edge and corner tiles can only face inward — fix those first.',
        'Round “end caps” are dead-ends: they connect on one side only.',
        'Work outward from the pump, following the blue water.',
        'The bulb (Hint) button fixes one tile in the correct position (yellow border) — only 1 hint per level.',
      ],
    },
    connect: {
      goal: 'Link all planets into one network. Each planet’s number = how many links it needs.',
      demo: `<svg viewBox="0 0 200 140">
        <line x1="45" y1="40" x2="155" y2="40" stroke="#7af3ff" stroke-width="4" stroke-dasharray="110" stroke-dashoffset="110"><animate attributeName="stroke-dashoffset" values="110;0;0" keyTimes="0;.35;1" dur="4s" repeatCount="indefinite"/></line>
        <g opacity="0"><line x1="41" y1="46" x2="41" y2="106" stroke="#7af3ff" stroke-width="4"/><line x1="49" y1="46" x2="49" y2="106" stroke="#7af3ff" stroke-width="4"/><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.6;.7;1" dur="4s" repeatCount="indefinite"/></g>
        <circle cx="45" cy="40" r="17" fill="#b026ff"/><text x="45" y="45" fill="#fff" font-size="15" font-weight="900" text-anchor="middle" font-family="Orbitron">3</text>
        <circle cx="155" cy="40" r="17" fill="#00e5ff"/><text x="155" y="45" fill="#fff" font-size="15" font-weight="900" text-anchor="middle" font-family="Orbitron">1</text>
        <circle cx="45" cy="110" r="17" fill="#ff2e88"/><text x="45" y="115" fill="#fff" font-size="15" font-weight="900" text-anchor="middle" font-family="Orbitron">2</text>
        ${finger('M45 40H155M45 40V110', '4s')}
        ${label(130, 112, '3 = 1 + 2 ✓', '#39ff14')}
      </svg>`,
      steps: [
        'Drag from a planet toward another planet in a straight line (up, down, left or right).',
        'Release to make a link. Drag the same way again for a DOUBLE link. A third time removes it.',
        'Each planet needs exactly its number of links — its ring turns GREEN when correct (RED = too many).',
        'Links can’t cross, and every planet must be connected into one big group.',
      ],
      tips: [
        'A “1” planet with only one neighbor must link to it.',
        'A planet whose number is double its neighbors (e.g. 4 with 2 neighbors) needs double links to all of them.',
        'You can also tap a planet, then tap its neighbor. Tap a link to change it.',
        'Faster solve = more stars. The bulb (Hint) button adds one correct link — only 1 hint per level.',
      ],
    },
    onestroke: {
      goal: 'Draw over EVERY line exactly once — without lifting your finger.',
      demo: `<svg viewBox="0 0 200 140">
        <path d="M60 120V60L100 25L140 60V120H60L140 60M60 60H140" stroke="rgba(255,255,255,.16)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M60 120V60L100 25L140 60V120H60L140 60H60" stroke="#ffe600" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="560" stroke-dashoffset="560"><animate attributeName="stroke-dashoffset" values="560;0;0" keyTimes="0;.8;1" dur="5s" repeatCount="indefinite"/></path>
        ${[[60, 120], [60, 60], [100, 25], [140, 60], [140, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff"/>`).join('')}
        <circle cx="60" cy="120" r="11" fill="none" stroke="#39ff14" stroke-width="2"/>
        ${finger('M60 120V60L100 25L140 60V120H60L140 60H60', '5s', '')}
        ${label(32, 124, 'START', '#39ff14')}
      </svg>`,
      steps: [
        'Press on a dot to start.',
        'Drag from dot to dot along the gray lines — each line you cross turns yellow.',
        'You can’t go over the same line twice.',
        'Finish when every line is yellow.',
      ],
      tips: [
        'Count the lines at each dot. If a dot has an ODD number of lines, START (or end) there.',
        'Hit a dead end? It resets automatically — try a different start dot.',
        'Release your finger any time and continue from the glowing dot.',
        'The bulb (Hint) button shows the correct start and draws the first part — only 1 hint per level.',
      ],
    },
    pattern: {
      goal: 'Remember the order the tiles light up, then tap them in the same order.',
      demo: `<svg viewBox="0 0 200 140">
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const x = 52 + (i % 3) * 34, y = 18 + Math.floor(i / 3) * 34;
          const order = { 0: 0, 4: 1, 5: 2 }[i];
          const anim = order == null ? '' : `<animate attributeName="fill" values="rgba(255,255,255,.05);#ff8a00;rgba(255,255,255,.05)" dur=".5s" begin="${order * 0.6}s;${order * 0.6 + 4}s;${order * 0.6 + 8}s" fill="freeze"/><animate attributeName="fill" values="rgba(255,255,255,.05);#00e5ff;rgba(255,255,255,.05)" dur=".4s" begin="${2.2 + order * 0.5}s;${6.2 + order * 0.5}s;${10.2 + order * 0.5}s"/>`;
          return `<rect x="${x}" y="${y}" width="30" height="30" rx="6" fill="rgba(255,255,255,.05)" stroke="rgba(255,138,0,.4)">${anim}</rect>`;
        }).join('')}
        <text x="100" y="130" fill="#ff8a00" font-size="11" font-family="Orbitron" text-anchor="middle" font-weight="700">WATCH 1-2-3 → TAP 1-2-3</text>
      </svg>`,
      steps: [
        'When it says WATCH…, look carefully — tiles light up one by one.',
        'When it says YOUR TURN, tap the same tiles in the same order.',
        'Each round the sequence gets 1 step longer, and the grid grows.',
        'A wrong tap costs a life (you have 3) and the sequence replays.',
      ],
      tips: [
        'Every tile has its own sound — listen as well as watch.',
        'Group the steps in chunks of 3, like a phone number.',
        'Imagine drawing a shape that connects the tiles.',
        'Stars: round 4, 8 and 12.',
      ],
      timed: true,
    },
    quicksearch: {
      goal: 'Find and tap the floating bubbles in the right order, as fast as you can.',
      demo: `<svg viewBox="0 0 200 140">
        ${[[50, 40, 1, '#00e5ff'], [150, 50, 2, '#ff2e88'], [90, 100, 3, '#b026ff'], [160, 110, 4, '#39ff14']].map(([x, y, n, c], i) => `<g><circle cx="${x}" cy="${y}" r="20" fill="${c}" fill-opacity=".3" stroke="${c}" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Orbitron" font-weight="700" font-size="17" fill="#fff">${n}</text><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${(0.15 + i * 0.2).toFixed(2)};${(0.2 + i * 0.2).toFixed(2)};.97;1" dur="4s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 6 : -6} 4;0 0" dur="2s" repeatCount="indefinite"/></g>`).join('')}
        ${finger('M50 40L150 50L90 100L160 110L160 110', '4s')}
      </svg>`,
      steps: [
        'Wait for 3-2-1-GO.',
        'Look at “Next” at the top — tap that number’s bubble.',
        'Keep tapping in order until all bubbles are popped.',
        'Beat the target time for 3 stars.',
      ],
      tips: [
        'Check the mode at the top: Count ↑ (1,2,3…), Count ↓ (10,9,8…) or Low → High (random numbers, smallest first).',
        'While tapping one, your eyes should already be searching for the next.',
        'Wrong tap = +2 seconds, so don’t guess.',
      ],
      timed: true,
    },
    leftright: {
      goal: 'Answer two different questions at the same time — one on each side — before their timers run out.',
      demo: `<svg viewBox="0 0 200 140">
        <rect x="6" y="6" width="90" height="128" rx="12" fill="rgba(0,229,255,.08)" stroke="rgba(0,229,255,.4)"/>
        <rect x="104" y="6" width="90" height="128" rx="12" fill="rgba(255,46,136,.08)" stroke="rgba(255,46,136,.4)"/>
        ${label(51, 22, 'LOGIC', '#00e5ff')}${label(149, 22, 'COLOR', '#ff2e88')}
        <text x="51" y="66" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="16" fill="#fff">2+3=5</text>
        <text x="149" y="66" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="18" fill="#3d8bff">RED</text>
        <rect x="14" y="100" width="36" height="24" rx="6" fill="rgba(255,59,92,.25)"/><rect x="54" y="100" width="36" height="24" rx="6" fill="rgba(57,255,20,.25)"><animate attributeName="fill" values="rgba(57,255,20,.25);#39ff14;rgba(57,255,20,.25)" dur="3s" begin="0s" repeatCount="indefinite" keyTimes="0;.2;.4"/></rect>
        <rect x="112" y="100" width="36" height="24" rx="6" fill="rgba(255,59,92,.25)"><animate attributeName="fill" values="rgba(255,59,92,.25);rgba(255,59,92,.25);#ff3b5c;rgba(255,59,92,.25)" dur="3s" repeatCount="indefinite" keyTimes="0;.5;.7;.9"/></rect><rect x="152" y="100" width="36" height="24" rx="6" fill="rgba(57,255,20,.25)"/>
        ${label(32, 116, 'F')}${label(72, 116, 'T', '#fff')}${label(130, 116, 'NO', '#fff')}${label(170, 116, 'YES')}
        ${label(51, 88, 'TRUE ✓', '#39ff14')}${label(149, 88, 'blue ≠ red', '#ff3b5c')}
      </svg>`,
      steps: [
        'LEFT side (blue): is the math equation correct? Tap TRUE or FALSE.',
        'RIGHT side (pink): is the INK COLOR the same as the WORD? Tap YES or NO.',
        'Both sides have their own timer bar — answer before it empties.',
        'Wrong answer or timeout = lose a life. 3 lives total.',
      ],
      tips: [
        'Right side trick: ignore what the word SAYS — look only at its color. “RED” written in blue = NO.',
        'Keyboard: A = False, S = True (left) · K = No, L = Yes (right).',
        'Use two thumbs on a phone — one per side.',
        'It gets faster as your score rises. Stars: 15, 30, 50.',
      ],
      timed: true,
    },
    focus: {
      goal: 'Score as many points as you can in 60 seconds by solving quick, changing challenges.',
      demo: `<svg viewBox="0 0 200 140">
        <g><animate attributeName="opacity" values="1;1;0;0;0;0;1" keyTimes="0;.3;.33;.5;.66;.97;1" dur="6s" repeatCount="indefinite"/>
          ${label(100, 18, 'QUICK MATH')}<text x="100" y="66" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="30" fill="#00e5ff">7 + 5</text>
          <rect x="30" y="92" width="40" height="30" rx="8" fill="rgba(255,255,255,.08)"/><rect x="80" y="92" width="40" height="30" rx="8" fill="#39ff14" fill-opacity=".5"/><rect x="130" y="92" width="40" height="30" rx="8" fill="rgba(255,255,255,.08)"/>
          ${label(50, 112, '11', '#fff')}${label(100, 112, '12', '#fff')}${label(150, 112, '13', '#fff')}</g>
        <g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.33;.36;.63;.66;1" dur="6s" repeatCount="indefinite"/>
          ${label(100, 18, 'FOCUS · ODD ONE OUT')}
          ${[0, 1, 2, 3, 4, 5].map((i) => `<path transform="translate(${46 + (i % 3) * 40} ${32 + Math.floor(i / 3) * 44})${i === 4 ? ' rotate(180 15 15)' : ''}" d="M15 2 28 28H2Z" fill="#ffe600"/>`).join('')}
          <circle cx="101" cy="91" r="22" fill="none" stroke="#39ff14" stroke-width="3"/></g>
        <g opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.66;.69;1" dur="6s" repeatCount="indefinite"/>
          ${label(100, 18, 'FLASH COUNT')}
          ${[[60, 50], [100, 40], [140, 60], [80, 85], [125, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#ff2e88"/>`).join('')}
          ${label(100, 130, 'HOW MANY? → 5', '#39ff14')}</g>
      </svg>`,
      steps: [
        'Challenges change every few seconds — read the label at the top.',
        'QUICK MATH: pick the right answer. FLASH COUNT: count the dots before they vanish.',
        'VISUAL MEMORY: remember the shape, then say if the next one is the SAME. FOCUS: tap the one that looks different.',
        'Right answers build a combo (×2… ×5). Wrong answers cost 3 seconds.',
      ],
      tips: [
        'Odd one out is usually upside-down or slightly faded.',
        'In memory, check BOTH the shape and the color.',
        'Keep your combo alive — accuracy beats speed.',
        'Stars: 150, 300, 500 points.',
      ],
      timed: true,
    },
  };
})();
