# Hex Pomodoro

A Pomodoro timer for the Mac, installable as a PWA. The timer is a hexagon built from three rhombuses
(an isometric cube); progress glows around its edge. Colors follow a "future garage" palette:
night blue, sodium amber for focus, cold cyan for short breaks, violet for long breaks.

- Focus / short break / long break, with a long break after every 4 focus sessions (configurable)
- Alerts when a session ends: 3-note chime, macOS notification, screen flash, banner
- Countdown in the window title and on the Dock badge
- Keeps correct time while the window is hidden or the Mac sleeps (wall-clock based)
- Survives reloads; counts reset at midnight
- Keyboard: `Space` start/pause · `R` reset · `S` skip · `,` settings · `Esc` close
- Works offline once installed

Spec: [`SPEC.md`](SPEC.md) · Plan: [`tasks/plan.md`](tasks/plan.md) · Tasks: [`tasks/todo.md`](tasks/todo.md) ·
Design canvas: https://claude.ai/artifact/Ah4YrFm3E4UKdxqR6Fijav

## Commands

```bash
npm install
npm run dev                  # dev server
npm test                     # full test suite (Vitest)
npx vitest run src/timer     # one area
npm run lint                 # oxlint
npm run build                # type check + production build with service worker
npm run preview              # serve the production build
npm run generate-pwa-assets  # regenerate PNG icons from public/favicon.svg
```

## Install on a Mac

1. `npm run build && npm run preview`, then open the printed URL. Or deploy `dist/` to any static host (HTTPS is required outside `localhost`).
2. **Chrome:** click the install icon in the address bar. **Safari 17+:** File → Add to Dock.
3. Click **Start** once and allow notifications when asked. The first click also unlocks sound.

macOS needs notifications allowed for the browser (or the installed app) in
System Settings → Notifications, or the banner won't show.

## How it works

```
src/settings/   defaults, limits, localStorage
src/timer/      machine.ts (pure reducer) · persist.ts · useTimer.ts (wall clock, completion)
src/notify/     sound.ts (Web Audio chime) · notify.ts (notification, badge) · messages.ts · format.ts
src/geometry/   hex.ts — hexagon, cube faces, progress path (shared by timer, counter, icons, backdrop)
src/components/ HexTimer, HexCounter, ModeTabs, Controls, AlertBanner, SettingsPanel
src/pwa/        manifest and precache list
```

Time is never counted in ticks. A session stores its end time; one timeout fires at that time,
and the app re-checks on every tick and on `visibilitychange`, so throttled or sleeping timers can't drift.

## Development approach

Built spec-first and test-first: every acceptance criterion in `SPEC.md` (`AC-x.y`) appears in at least one
test name, and every task started with a failing test. Browser APIs (audio, notifications, badge, storage)
are passed in as parameters, so tests use small fakes.

## Manual check on the MacBook

Automated tests can't confirm the real OS integration. After installing:

- [ ] A session ending with the window hidden plays the chime and shows a macOS banner
- [ ] The Dock badge shows minutes left while running and clears on pause
- [ ] The screen flashes in the mode color (static tint with Reduce Motion on)
- [ ] With Wi-Fi off, the installed app still opens
