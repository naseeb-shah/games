---
name: mindspark-dev
description: How to work on MindSpark, the plain HTML/JS neon brain-games web app built by ShahNlabs. Use when adding a new mini-game, changing an existing game, tuning difficulty or stars, editing tutorials, or fixing layout/mobile issues in this project.
---

# MindSpark development skill

MindSpark is a **no-build** web app: plain HTML + CSS + vanilla JS loaded with classic `<script>` tags, so it also works when opened straight from `file://`. **Never** switch to ES modules, `import`/`export`, npm dependencies or a bundler. Opening `index.html` directly must keep working.

## Project map

| File | Purpose |
|---|---|
| `index.html` | Page skeleton (Home, Detail and Play screens; modal; toast; background and confetti canvases) and the script load order |
| `css/style.css` | All styles. Color tokens live on `:root`. Per-game sections are marked with comments. Responsive rules are at the bottom |
| `js/core.js` | The `MS` global: game registry, seeded random numbers, `MS.store` (localStorage), `MS.sfx` (Web Audio), `MS.haptic`, DOM helper `MS.h`, `MS.fitCanvas`, `MS.chip` |
| `js/games/*.js` | One self-contained game per file. Each calls `MS.register({...})` |
| `js/tutorials.js` | `MS.TUT[gameId]` = `{ goal, demo (animated SVG string), steps[], tips[], timed? }` |
| `js/app.js` | Shell: screens, level select, `launch()`, the `ctx` runtime API, result and tutorial modals, settings, starfield, confetti |
| `PRD.md` | Product requirements. Update it when features change |

Script order matters: `core.js` → `games/*.js` → `tutorials.js` → `app.js`.

## Adding a new game

1. Create `js/games/<id>.js`:

```js
(function () {
  'use strict';
  MS.register({
    id: 'mygame',                // unique; also the storage key
    name: 'My Game',
    tagline: 'Short hook line.',
    color: '#00e5ff',            // neon accent used for the card, buttons and glow
    type: 'levels',              // 'levels' (100 levels + stars) or 'score' (high score)
    maxLevel: 100,               // levels only
    starGoals: [10, 20, 30],     // score only: thresholds for 1/2/3 stars
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor">…</svg>',
    howTo: ['Fallback step 1', 'Step 2'],
    start(ctx) {
      // build UI inside ctx.stage, then call ctx.win({stars, text}) or ctx.over({score, text})
      return { destroy() { /* remove window listeners */ } };
    },
  });
})();
```

2. Add `<script src="js/games/<id>.js"></script>` to `index.html`, **before** `tutorials.js`.
3. Add a tutorial entry `MS.TUT.<id>` in `js/tutorials.js`. Give it an animated SVG demo (SMIL `<animate>` / `animateMotion` and the `finger()` helper). Add `timed: true` if a clock is running.
4. Add game-specific CSS under its own comment block in `style.css`.
5. Update the games table in `PRD.md`.

## The `ctx` runtime API (from `launch()` in app.js)

| Member | Use |
|---|---|
| `ctx.stage` | The element to render into. Read its `clientWidth`/`clientHeight` for layout |
| `ctx.level` | Current level (1-based); always `1` for score games |
| `ctx.rng()` | Random numbers seeded from game id + level. **Use it for level generation** so level N is always the same puzzle |
| `ctx.info(html)` | Set the info chips (use `MS.chip(label, value, 'hl'\|'warn')`) |
| `ctx.actions([{icon, label, onClick, count}])` | Header buttons. `icon` is a key of `MS.ICON` (`hint`, `undo`, `plus`…) or raw SVG. Returns the button elements. `?` and Restart are added automatically |
| `ctx.timeout / ctx.interval / ctx.loop(fn(dt, now))` | **Always** use these instead of the raw browser timers; they're cleaned up automatically when the game ends or the player leaves. Return `false` from a `loop` callback to stop it |
| `ctx.onResize(fn)` | Re-layout when the window size changes |
| `ctx.alive` | `false` after win, game over or leaving; check it in event handlers |
| `ctx.toast(msg)` | Short message at the bottom of the screen |
| `ctx.win({stars 1-3, text})` | Level cleared → saves stars, unlocks the next level, shows the result |
| `ctx.over({score, text})` | Score game ended → saves best score and stars, shows the result |

## Rules and conventions

- **Every generated level must be solvable.** Generate from a known solution (path, tree, walk) or check it with a solver. Add a stress test for levels 1–100 (see Testing).
- **Hints: at most 1 per level.** Use the existing pattern: `count: 1` badge, then disable the button after use. A used hint costs a star.
- **Input:** use pointer events (`pointerdown/move/up`) with `setPointerCapture` for drags. Call `e.preventDefault()` on tap targets. `#stage` already has `touch-action: none`.
- **Feedback on every action:** `MS.sfx.*` (`tap, select, pop, good, bad, connect, pour, rotate, step(i), note(i), tick, win, lose`), `MS.haptic(ms)`, and `MS.shake(el)` for errors.
- **Canvas:** size it with `MS.fitCanvas(canvas, w, h)` so it's sharp on high-density screens. Redraw in `onResize`.
- **No emoji in the UI.** Many Linux and Android systems have no emoji font. Use inline SVG or text instead.
- **Colors:** use `MS.COLORS` (12 neon colors) or the CSS tokens `--cyan --pink --purple --yellow --green --red`.
- **Responsive:** layouts must work at 320×568, 360×640, 390×844, 740×360 (phone landscape → the play header becomes a left sidebar) and desktop. Size game boards from the stage dimensions, never fixed pixels.
- **Branding:** keep the "by ShahNlabs" credit (logo, home footer, settings) linking to `https://www.shahnlabs.com` with `target="_blank" rel="noopener"`.

## Testing

1. Syntax: `for f in js/*.js js/games/*.js; do node --check "$f"; done`
2. Generator stress test: load `core.js` and the game files in a Node `vm` context with a stubbed `window`/`localStorage`, then call the game's exported `_gen` for levels 1–100 and check the result is valid.
3. Browser: drive `index.html` with Playwright (Chromium, `--headless=new`). Open each game, check there are no `pageerror`s, solve level 1 programmatically (regenerate the solution with `MS.rng(MS.hash(id) + level * 7919)`), and confirm the result modal appears.
4. Screenshot the sizes listed above and look for overflow and clipped controls.

## SEO rules

- `index.html` contains the title, meta description, Open Graph/Twitter tags, the JSON-LD `@graph` (Organization + VideoGame/WebApplication + FAQPage) and the visible `.seo` section on Home. **When you add a game, update all four**, plus `manifest.webmanifest`, the `ASSETS` list in `sw.js`, and the og-image if needed.
- Target regions (India: Delhi, Delhi NCR, Noida, Bengaluru, Hyderabad, Haryana, Yamuna Nagar; Canada: Alberta; UK) belong in visible text and in JSON-LD `areaServed`. Never add hidden or repeated location keywords.
- Keep exactly one `<h1>`. The canonical and `og:url` tags are added at runtime from `location`.
- When you change any cached file, bump `CACHE` in `sw.js` so returning players get the update.

## Storage

`localStorage["mindspark.v1"]` → `{ sound, vibrate, streak:{count,last}, games:{ [id]: { unlocked, stars:{[level]:n}, best, bestStars, plays, tutSeen } } }`. If you change this shape, bump the key or add a migration in `core.js`.
