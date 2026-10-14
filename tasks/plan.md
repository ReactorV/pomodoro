# Plan: Hex Pomodoro

Spec: `../SPEC.md` (approved 2026-10-14) · Phase 2: Plan — **approved 2026-10-14**

## Components and dependencies

```
settings ──┐
           ├──► timer/machine ──► timer/persist ──► timer/useTimer ──┐
geometry/hex ───────────────────────────────────────────────────────┤
notify/format + notify/messages ────────────────────────────────────┤
notify/sound ───────────────────────────────────────────────────────┼──► App (wiring, flash, compact, side effects)
notify/notify (notification, badge, title) ─────────────────────────┤
hooks/useHotkeys ───────────────────────────────────────────────────┤
styles (tokens, fonts) ──► components (HexTimer, HexCounter, ModeTabs,
                            Controls, AlertBanner, SettingsPanel) ───┘
PWA (manifest, service worker, icons) — independent, last
```

Arrows point one way. Pure logic at the bottom has no browser dependency.
Everything that touches a browser API takes the API as a parameter, so tests pass a fake.

## Build order (vertical: logic → hooks → UI → PWA)

1. **Foundation logic** — settings (done), machine, persist, format/messages, hex geometry.
   All pure functions, small fast tests. Covers AC-3.x, AC-4.1–4.3, AC-5.5, AC-6.1 math, AC-6.2.
2. **Timer hook** — `useTimer` joins machine + persist + wall clock. Covers AC-3.14–3.16.
3. **Browser adapters** — sound, notify (notification, badge, title), hotkeys. Covers AC-5.1–5.4, 5.7, 5.8, 7.x.
4. **UI** — tokens and fonts, then components from the design canvas, then `App` wiring.
   Covers AC-4.4, 4.5, 5.6, 6.x, 8.3.
5. **PWA** — icons, manifest, service worker, offline check. Covers AC-8.1, 8.2.

## Parallel vs sequential

- Sequential: machine → persist → useTimer → App.
- Parallel after the machine: persist, format/messages, hex geometry.
- Parallel after checkpoint A: sound, notify, hotkeys, styles.
- I build one task at a time (single agent); the parallel note only shows what doesn't block what.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Chrome throttles timers in hidden tabs; the Mac sleeps | Wall-clock `endsAt`; one non-chained `setTimeout` for completion; re-check on `visibilitychange` and every tick (AC-3.15). Tested with fake timers + fake `now`. |
| Browsers block audio before a user gesture | Create or resume the `AudioContext` inside the Start click handler (AC-5.2). |
| Notification permission must be asked from a gesture; Safari PWA rules | Ask once in the Start click, only when permission is `default`; prefer `registration.showNotification`. |
| jsdom has no `AudioContext`, `Notification`, Badging API, or SVG layout | Hand-written fakes in tests; geometry tested as numbers, not pixels. |
| React StrictMode runs effects twice in dev | Effects are idempotent: timeouts cleared in cleanup, completion guarded by the reducer (AC-3.17). |
| `vite-plugin-pwa` 2.0 on Vite 8 is new | Checkpoint D builds and inspects `dist/manifest.webmanifest` and `dist/sw.js` early in that phase; fall back to a hand-written manifest + Workbox if it breaks. |
| Design drift from the canvas | Port SVG geometry from the canvas `Screen.dc.html` into `geometry/hex.ts`; screenshot compare at checkpoint C. |
| Fonts from a CDN fail offline | Bundle with `@fontsource` (AC-8.3); the service worker precaches `woff2`. |

## Verification checkpoints

- **A — after logic + hook (tasks 1–7):** `npm test` green, `npm run build` passes (type check).
- **B — after adapters (tasks 8–10):** `npm test` green; every AC in sections 3, 4.1–4.3, 5 (except 5.6), 7 has a named test.
- **C — after UI (tasks 11–16):** `npm test` green, `npm run lint` clean, `npm run build` passes;
  `npm run dev` driven with Playwright: no console errors, full focus → break flow with 0.1-min durations, screenshots vs canvas.
- **D — after PWA (tasks 17–18):** `npm run build && npm run preview`; manifest + SW present; installed app opens offline.
  Manual MacBook checklist: chime, macOS banner with the window hidden, dock badge, flash.
