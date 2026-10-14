# Spec: Hex Pomodoro

Status: **APPROVED 2026-10-14**; AC-5.9/5.10 added 2026-10-14 after user decisions (shared slider, glass tick, buttons + shortcuts)
Design: https://claude.ai/artifact/Ah4YrFm3E4UKdxqR6Fijav

## Scope check (Phase 0)

This is one capability: a single-user Pomodoro timer on one screen. Timer, settings, notifications and PWA
share one consumer and one state, and none of them ships alone. So this spec is one document, not a
capability map with module specs. Sections 3–8 of the success criteria group the work for planning.

## Assumptions

1. Runs on a MacBook in current Chrome or Safari (Safari 17+ for "Add to Dock"). No IE, no mobile-first work.
2. Single user, single device. No accounts, no sync, no server. All state is in `localStorage`.
3. "Session counter" means focus sessions completed today (local date). No history beyond today.
4. The next session never starts by itself. The user clicks Start after each alert.
5. The chime is synthesized with the Web Audio API. No audio files.
6. The design canvas above is the visual reference. The timer hexagon is pointy-top (cube look).
7. English UI only.

## Objective

Build a simple, modern Pomodoro timer for a MacBook, installable as a PWA.
It alternates focus sessions and breaks, and it tells the user when a session ends with sound,
a macOS notification and an in-app flash. The visual style uses hexagons made of rhombuses
and a "future garage" palette (night blue, sodium amber, cold cyan, violet).

User: one person working at a MacBook who wants a focus timer that keeps time correctly
while the window is hidden and alerts them when it ends.

Success: the user installs the app, runs full focus/break cycles, and gets every alert on time,
also with the window hidden. Every acceptance criterion below has a passing test.

## Tech Stack

| Area | Choice | Version |
|------|--------|---------|
| UI | React | 19.2 |
| Language | TypeScript (strict, `verbatimModuleSyntax`) | 6.0 |
| Build | Vite + `@vitejs/plugin-react` | 8.3 / 6.1 |
| PWA | `vite-plugin-pwa` (Workbox, `autoUpdate`) | 2.0 |
| Tests | Vitest + jsdom + Testing Library (react, user-event, jest-dom) | 5.0 / 29 / 16.3 |
| Lint | oxlint | 1.81 |
| Fonts | `@fontsource-variable/space-grotesk`, `@fontsource/jetbrains-mono` (bundled) | 5.3 |
| Styling | Plain CSS with custom properties (tokens), CSS Modules per component | — |

## Commands

```
Dev:          npm run dev
Test (all):   npm test                       # vitest run
Test (one):   npx vitest run src/timer       # focused run during the TDD loop
Test (watch): npm run test:watch
Lint:         npm run lint
Type check + build: npm run build            # tsc -b && vite build
Preview PWA:  npm run preview
```

## Project Structure

```
SPEC.md                    → this spec (source of truth)
tasks/plan.md, tasks/todo.md → plan and task list (Phase 2–3)
public/                    → favicon.svg, PWA icons (png)
src/main.tsx               → mounts App, registers the service worker
src/App.tsx                → wires hooks to components
src/styles/                → tokens.css (palette, type), global.css (background, flash)
src/settings/              → settings.ts (defaults, limits, load/save) + tests
src/timer/                 → machine.ts (pure reducer), persist.ts, useTimer.ts + tests
src/notify/                → sound.ts (Web Audio chime), notify.ts (notification, badge, title), messages.ts + tests
src/geometry/              → hex.ts (hexagon, cube faces, progress polyline) + tests
src/hooks/                 → useHotkeys.ts + tests
src/components/            → HexTimer, HexCounter, ModeTabs, Controls, AlertBanner, SettingsPanel (+ .module.css, tests)
src/test/setup.ts          → jest-dom matchers, cleanup, localStorage reset
```

Tests sit next to the code as `*.test.ts(x)`.

## Code Style

```ts
// Pure logic: small exported functions, explicit types, no classes, no default exports.
export function durationMs(mode: Mode, settings: Settings): number {
  const minutes = { focus: settings.focusMin, short: settings.shortMin, long: settings.longMin }[mode]
  return minutes * 60_000
}

// Reducer actions are a discriminated union; time always comes in as `now`, never from Date.now() inside.
export type TimerAction =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'reset' }
```

- No semicolons, single quotes, 2-space indent (matches the Vite template).
- `camelCase` functions and variables, `PascalCase` components and types, `SCREAMING_CASE` constants.
- Browser APIs (`localStorage`, `AudioContext`, `Notification`, `navigator`) are wrapped in small functions
  that take the API as a parameter with a default, so tests pass a fake.
- Every browser API call that can throw or be missing is guarded and fails quietly.

## Testing Strategy

- Framework: Vitest with jsdom. Run focused tests in the TDD loop, the full suite before each task is done.
- Each acceptance criterion ID (`AC-x.y`) appears in at least one test name.
- Red → green → refactor for every behaviour. A new test must fail before the code exists.
- Unit tests (most): `settings`, `machine`, `persist`, `messages`, `hex`, time formatting. Pure, no timers.
- Hook and component tests (medium): `useTimer`, `useHotkeys`, components with Testing Library and `vi.useFakeTimers()`.
- Integration: `App.test.tsx` runs a full focus → break flow with fake timers and fake browser APIs.
- Fakes over mocks: a fake `AudioContext`, fake `Notification`, fake service worker registration. Assert on outcomes.
- Runtime check: `npm run dev` in a real browser (Playwright) for layout, console errors and the flash.
- Manual on the MacBook: real notification banner, dock badge, offline start of the installed PWA.

## Boundaries

- **Always:** write the failing test first; run `npm test` and `npm run build` before calling a task done;
  keep `SPEC.md` updated first when behaviour changes; guard browser APIs.
- **Ask first:** adding a dependency not listed in Tech Stack; changing the design or palette;
  anything that uses a network service; git commits (and whether this folder gets its own git repo).
- **Never:** load fonts or scripts from a CDN at runtime; store data outside `localStorage`;
  skip or delete a failing test to get green; auto-start sessions.

## Success Criteria

### 3. Timer behaviour

- **AC-3.1** Initial state: mode `focus`, status `idle`, remaining = focus duration, completed today = 0.
- **AC-3.2** `start` from `idle` or `paused` sets status `running` and `endsAt = now + remaining`.
- **AC-3.3** `start` while `running` changes nothing.
- **AC-3.4** `pause` while `running` sets status `paused` and keeps `remaining = endsAt − now` (never below 0).
- **AC-3.5** `pause` while not `running` changes nothing.
- **AC-3.6** `reset` sets status `idle` and remaining = full duration of the current mode. Mode does not change.
- **AC-3.7** `skip` moves to the next mode (same rule as completion) with status `idle`, but does not count a focus session.
  Skipping a long break resets the cycle count, like completing it.
- **AC-3.8** `complete` after `focus` adds 1 to completed today and to the cycle count.
  The next mode is `long` when the cycle count reaches `longEvery`, else `short`.
- **AC-3.9** `complete` after `short` or `long` moves to `focus`. After `long`, the cycle count goes back to 0.
- **AC-3.10** After `complete`, status is `idle` and remaining = full duration of the next mode.
- **AC-3.11** `complete` records which mode finished, so the UI can show the alert. Any later action except `complete` clears it.
- **AC-3.12** Choosing a mode (tabs) sets that mode, status `idle`, remaining = its full duration.
- **AC-3.13** A settings change while `idle` sets remaining to the new duration of the current mode.
  While `running` or `paused`, the current session keeps its time.
- **AC-3.14** When the local date changes, completed today and the cycle count go back to 0.
- **AC-3.15** Time is measured from the wall clock (`endsAt`), not by counting ticks.
  A session that ended while the window was hidden or the Mac slept completes as soon as the app checks again
  (completion timeout, tick, or `visibilitychange`).
- **AC-3.16** Timer state persists in `localStorage`. A reload restores mode, status, remaining time and counts.
- **AC-3.17** `complete` while not `running` changes nothing.

### 4. Settings

- **AC-4.1** Defaults: focus 25 min, short 5 min, long 15 min, long break after 4 focus sessions,
  chime on, click sounds on, volume 70 %, macOS notification on, dock badge on, flash on.
- **AC-4.2** Limits: focus 1–120, short 1–60, long 1–60, long break after 2–8, volume 0–100 %.
  Values out of range are clamped; minutes are rounded. Values of the wrong type fall back to the default.
- **AC-4.3** Settings persist in `localStorage`. Broken or missing stored data loads the defaults.
- **AC-4.4** The settings panel opens from the header button or the `,` key, and closes with Esc or the close button.
- **AC-4.5** "Save" applies and stores the values. "Defaults" fills the form with the defaults.

### 5. Notifications

- **AC-5.1** On completion the app plays a 3-note chime when the chime setting is on, at the set volume.
  Focus end and break end use different chimes.
- **AC-5.2** The audio context is created or resumed on a user gesture (browser autoplay rule):
  the first Start, and any click sound (AC-5.9).
- **AC-5.3** On the first user Start the app asks for notification permission once, when it is still `default`.
- **AC-5.4** On completion, with the setting on and permission `granted`, the app shows a system notification
  through the service worker registration, or `new Notification` when no registration exists.
- **AC-5.5** Notification text: focus end → "Focus complete" / "Short break next — 5 min."
  (or "Long break next — 15 min." at the end of a cycle); break end → "Break over" / "Back to focus — 25 min."
  Minutes come from the settings.
- **AC-5.6** On completion, with flash on, the screen flashes in the accent color of the finished mode for 3 s.
  With `prefers-reduced-motion`, the flash is a static color change without animation.
- **AC-5.7** While running, the document title is `▶ MM:SS · <Mode>`; otherwise it is `Hex Pomodoro`.
- **AC-5.9** Click sounds: with click sounds on, a soft glass tick (one short high note, about 40 ms) plays at the
  shared Volume when the user triggers Start/Pause/Resume, Reset, Skip, a mode tab, opening or closing Settings,
  Save or Defaults — by mouse or by keyboard shortcut. Checkboxes and number fields stay silent.
  Esc makes no sound when Settings is already closed.
- **AC-5.10** Volume preview: one Volume slider sets the level of both the chime and the clicks.
  Dragging it plays a tick at the slider's level (at most one every 120 ms), before Save.
  The slider is enabled when the chime or click sounds are on.
- **AC-5.8** While running, with dock badge on, the app badge shows the minutes left (rounded up);
  it is cleared when not running. Browsers without the Badging API ignore it without errors.

### 6. User interface

- **AC-6.1** The timer is a hexagon made of 3 rhombuses. A progress line runs clockwise around the hexagon edge,
  from the top vertex, in proportion to elapsed time. Vertex markers light up as progress passes them.
- **AC-6.2** The time shows as `MM:SS`, rounded up to the whole second.
- **AC-6.3** Accent colors: focus `#F2A541`, short `#4FD1D9`, long `#9A8CE0`.
- **AC-6.4** The primary button reads `Start` (idle), `Pause` (running), `Resume` (paused);
  after a completion it reads `Start break` or `Start focus`.
- **AC-6.5** The session counter shows `longEvery × 2` hexagons in groups of `longEvery`;
  done ones are filled cubes. A label reads `N pomodoro(s)`.
- **AC-6.6** Mode tabs show the current mode with `aria-pressed="true"`.
- **AC-6.7** After a completion, a banner shows the completion title and text (AC-5.5) with `role="status"`.
- **AC-6.8** Below 520 px width, the tabs and the shortcut footer are hidden (compact window).

### 7. Keyboard

- **AC-7.1** `Space` start/pause/resume, `R` reset, `S` skip, `,` open settings, `Esc` close settings.
- **AC-7.2** Shortcuts do nothing while focus is in an input, select or textarea, or when ⌘, Ctrl or Alt is held,
  or when the key auto-repeats. `Esc` still closes settings from an input.
  `Space` on a focused button or link keeps its native action (no double toggle).

### 8. PWA

- **AC-8.1** Manifest: name "Hex Pomodoro", `display: standalone`, theme and background `#0B0F1A`,
  icons 192, 512 and maskable 512.
- **AC-8.2** The service worker precaches the build, so the installed app opens offline.
- **AC-8.3** Fonts (Space Grotesk, JetBrains Mono) are bundled, not loaded from a CDN.

### Out of scope

Statistics history, accounts or sync, auto-start of the next session, task lists, a native menubar app.

## Decisions (former open questions)

1. **Git:** `pomodoro/` has its own repo (branch `main`). The user pushes it to their GitHub account
   (https://github.com/ReactorV). Remote and push are done by the user.
2. **App icon:** `@vite-pwa/assets-generator` is approved as a dev dependency; PNG icons come from `public/favicon.svg`.
3. **Skip:** a skipped focus session does not count toward the cycle (AC-3.7). Confirmed.
4. **Compact breakpoint:** 520 px (AC-6.8). Confirmed.

## Work done before the gate

Before the spec-driven workflow was requested, two pieces were built test-first against an earlier draft:
`src/settings/settings.ts` (8 tests passing) and `src/timer/machine.test.ts` (tests written, implementation not started).
Both match this spec and are kept; see `tasks/todo.md`.
