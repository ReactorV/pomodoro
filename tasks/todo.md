# Tasks: Hex Pomodoro

Spec: `../SPEC.md` · Plan: `plan.md` · Phase 3: Tasks — **approved 2026-10-14**, one commit per task
Every task is red → green → refactor: failing test first, then minimal code, then cleanup.

## Phase 1 — Foundation logic

- [x] 1. Settings: defaults, limits, load/save
  - Acceptance: AC-4.1, AC-4.2, AC-4.3
  - Verify: `npx vitest run src/settings` (8 tests green)
  - Files: `src/settings/settings.ts`, `src/settings/settings.test.ts`

- [x] 2. Timer machine (pure reducer)
  - Acceptance: AC-3.1 – AC-3.15 (reducer parts), AC-3.17
  - Verify: `npx vitest run src/timer/machine` red first (tests already written), then green
  - Files: `src/timer/machine.ts`, `src/timer/machine.test.ts`

- [x] 3. Timer persistence
  - Acceptance: AC-3.16 (serialize, restore, broken data → initial state, settings re-applied)
  - Verify: `npx vitest run src/timer/persist`
  - Files: `src/timer/persist.ts`, `src/timer/persist.test.ts`

- [x] 4. Formatting and alert messages
  - Acceptance: AC-6.2 (`MM:SS`, round up), AC-5.7 (title text), AC-5.5 (notification title/body with minutes from settings)
  - Verify: `npx vitest run src/notify/format src/notify/messages`
  - Files: `src/notify/format.ts`, `src/notify/format.test.ts`, `src/notify/messages.ts`, `src/notify/messages.test.ts`

- [x] 5. Hexagon geometry
  - Acceptance: AC-6.1 math — hexagon vertices clockwise from top, cube faces, progress polyline length ∝ progress, lit vertex markers
  - Verify: `npx vitest run src/geometry`
  - Files: `src/geometry/hex.ts`, `src/geometry/hex.test.ts`

## Phase 2 — Timer hook

- [x] 6. `useTimer` hook
  - Acceptance: AC-3.15 (completion timeout, tick, `visibilitychange`), AC-3.14 (date change), AC-3.16 (saves on change),
    calls `onComplete(finished, next)` once per completion
  - Verify: `npx vitest run src/timer/useTimer` with `vi.useFakeTimers()` and a fake clock
  - Files: `src/timer/useTimer.ts`, `src/timer/useTimer.test.ts`

- [x] 7. **Checkpoint A** — `npm test` green, `npm run build` passes

## Phase 3 — Browser adapters

- [x] 8. Chime
  - Acceptance: AC-5.1 (3 notes, volume, different focus/break chimes, silent when off), AC-5.2 (context created/resumed by `unlockAudio()`)
  - Verify: `npx vitest run src/notify/sound` with a fake `AudioContext`
  - Files: `src/notify/sound.ts`, `src/notify/sound.test.ts`

- [x] 9. System notification, dock badge, document title
  - Acceptance: AC-5.3, AC-5.4, AC-5.7, AC-5.8 (missing APIs → no error)
  - Verify: `npx vitest run src/notify/notify` with fake `Notification`, registration, `navigator.setAppBadge`
  - Files: `src/notify/notify.ts`, `src/notify/notify.test.ts`

- [x] 10. Keyboard shortcuts
  - Acceptance: AC-7.1, AC-7.2
  - Verify: `npx vitest run src/hooks/useHotkeys`
  - Files: `src/hooks/useHotkeys.ts`, `src/hooks/useHotkeys.test.ts`

## Phase 4 — UI

- [x] 11. Design tokens, global styles, bundled fonts
  - Acceptance: AC-6.3 (accent tokens), AC-8.3 (fonts from `@fontsource`), tumbling-block background, grain, reduced-motion rule
  - Verify: `npm run build`; no `fonts.googleapis.com` in `dist/`
  - Files: `src/styles/tokens.css`, `src/styles/global.css`, `src/main.tsx`, `index.html`

- [x] 12. `HexTimer` component
  - Acceptance: AC-6.1 (3 rhombus faces, progress line, lit markers), AC-6.2 (time text), accessible label
  - Verify: `npx vitest run src/components/HexTimer`
  - Files: `src/components/HexTimer.tsx`, `HexTimer.module.css`, `HexTimer.test.tsx`

- [x] 13. `ModeTabs` and `Controls`
  - Acceptance: AC-6.6 (`aria-pressed`), AC-6.4 (button labels), clicks call handlers
  - Verify: `npx vitest run src/components/ModeTabs src/components/Controls`
  - Files: `ModeTabs.tsx`, `Controls.tsx`, `controls.module.css`, `ModeTabs.test.tsx`, `Controls.test.tsx`

- [x] 14. `HexCounter` and `AlertBanner`
  - Acceptance: AC-6.5 (`longEvery × 2` cells, filled count, label), AC-6.7 (`role="status"`, message text)
  - Verify: `npx vitest run src/components/HexCounter src/components/AlertBanner`
  - Files: `HexCounter.tsx`, `AlertBanner.tsx`, `feedback.module.css`, `HexCounter.test.tsx`, `AlertBanner.test.tsx`

- [x] 15. `SettingsPanel`
  - Acceptance: AC-4.5 (Save applies sanitized values, Defaults fills form), close button, Esc inside panel
  - Verify: `npx vitest run src/components/SettingsPanel`
  - Files: `SettingsPanel.tsx`, `SettingsPanel.module.css`, `SettingsPanel.test.tsx`

- [x] 16. `App` wiring
  - Acceptance: AC-4.4 (open via button and `,`), AC-5.2/5.3 on first Start, AC-5.1/5.4/5.6 on completion, AC-5.7/5.8 while running,
    AC-6.8 (compact below 520 px), full flow focus → short break → focus
  - Verify: `npx vitest run src/App`; **Checkpoint C**: `npm test`, `npm run lint`, `npm run build`, Playwright run of `npm run dev` with screenshots
  - Files: `src/App.tsx`, `src/App.module.css`, `src/App.test.tsx`

## Phase 5 — PWA and finish

- [x] 17. Icons, manifest, service worker
  - Acceptance: AC-8.1, AC-8.2
  - Verify: `npm run build`; check `dist/manifest.webmanifest` fields and `dist/sw.js` precache list; `npm run preview` offline reload
  - Files: `public/favicon.svg`, `pwa-assets.config.ts`, `package.json` (generator script), `vite.config.ts`, `src/main.tsx`

- [x] 18. **Checkpoint D** — README (install on Mac, commands), full suite, lint, build, manual MacBook checklist
  - Files: `README.md`
