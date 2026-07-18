# KIT-P4 gate evidence (REVISED C)

Two-sided founder gate for the 0.2.0 tag: the WP-native default must not
move for non-opt-in consumers, and the opt-in `.pmdk-theme-app` look must
match the founder DS. Captured 2026-07-18 on the `ds/p4-theme` branch.

## 1. `blocksify/` — real-consumer zero look-change (default side)

The production Blocksify plugin (WordPress Studio site
`blocksify.wp.local` → 127.0.0.1), kit bumped locally from the installed
`0.1.0` snapshot to this worktree's KIT-P4 build:

- `before/` — 5 dashboard routes (`welcome`, `settings`, `templates`,
  `free-vs-pro`, `changelog`), plugin freshly built against the
  installed kit 0.1.0.
- `after/` — same routes, same toolchain, kit swapped to the KIT-P4
  worktree payload (`node_modules/@pressmaximum/dashboard-kit` replaced,
  `npm run build` re-run; new-kit CSS verified present in the bundle via
  the `--pmdk-hero-border` token, ×2 occurrences).
- Result: **5/5 shots identical — 0 diff pixels** (`compare.mjs`,
  threshold 0.1 / max 0). `diff/` stays empty.
- **Route caveat — `free-vs-pro.png` is a `#welcome` fallback.**
  Blocksify compiles the Free-vs-Pro tab out (`SHOW_FREE_VS_PRO = false`
  in `src/dashboard/index.js`), so navigating `#free-vs-pro` falls back
  to the initial route: `free-vs-pro.png` is byte-identical to
  `welcome.png` (sha1 `9bbd53186c50defe97012f3a6fb5c91794868b28` for
  all four before/after copies — which also shows the full-page shots
  reproduce byte-for-byte across runs). `<CompareTable>` / the K-014 fix
  is therefore NOT exercised by this real-consumer gate; its zero-diff
  coverage is story-level (`compare-comparetable--with-footer-cta` in
  the `tests/vr-stories/` matrix, captured pre-P4 and unchanged).
- **Bundle hashes (sha256) — the two runs were genuinely different
  builds; only the PIXELS are identical:**
  - before (kit 0.1.0): `dashboard.css`
    `0c721f2809f4d9ee3ddeb884a5ad54de262f3346d659ff1bd8dc6cb1c1edd509`,
    `dashboard.js`
    `c97b3a689e13fec6bd9036199b74564374c5df85e83413f95fb4a7c41c21d1f8`
  - after (KIT-P4 0.2.0 worktree): `dashboard.css`
    `4cf6e4a4ad772ad9dd61d9ba910c3541b14700a11e7bbc185b4e81889094cef7`,
    `dashboard.js`
    `e3748747b65f4c2fd10227d620aab2b40eed82e7745537f7622e2e0694824c87`
  The bundles differ by exactly the new kit payload (tokens + K-fix
  rules + version stamp + SaveBar/Checklist changes); the screenshot
  set diffing to zero across that bundle delta is the gate.
- Protocol notes: Blocksify's `node_modules` was missing `swiper` +
  `lightgallery` (pre-existing; webpack aborted emit — the plugin's
  committed `build/` was ~2 weeks stale), so inert stubs were planted
  for the two runs and removed afterwards. The repo was restored
  byte-for-byte to its found state (kit 0.1.0 back, original `build/`
  restored — `dashboard.css` sha1 `f5be0b26…` —, git status +
  working-diff sha equal to the recorded baseline).

## 2. `theme-app/` — the NEW look on the Aponto mockup (opt-in side)

NOT a zero-diff gate — these shots are the founder-approval evidence
that the packaged theme carries the DS look. `capture-theme-app.mjs`
renders the mockup gallery + bookings route THROUGH the kit:
`build/style.css` (token API + engine) + `build/themes/app.css` +
`evidence-bridge.css` (mockup `--ap-*` seeds re-pointed at the kit
`--pmdk-*` values; accent pinned to the reviewed deep `#3366FF` in the
consumer-bridge role), with `.pmdk-theme-app` (+ same-element
`data-pmdk-color-scheme="dark"`) stamped on the mockup's token scope.

- 26 shots: 12 `design-system.html` sections × light/dark @1440×900 +
  `index.html#bookings` with the in-flow inspector open × light/dark.

## 3. Story-level gates (in `tests/vr-stories/`)

- 12 default-scope core-component shots captured from the PRE-P4 tree
  (f5839a8) stayed **zero-diff** through the entire KIT-P4 change set.
- 2 justified re-baselines: `primitives-buttons--theme-app-dark`,
  `primitives-modulecard--theme-app-dark` (50px / 45px) — the
  `--pmdk-accent-fg` 62%→78% extraction-drift fix (v2-final weight,
  `plugin-dashboard.css` line ~104).
- 9 new-look baselines: `core-themeappcore--*` (7) +
  `primitives-feedbackshell--save-bar-unified-component[-dark]` (2).
- Full matrix: **53/53 zero-diff** on double-capture (determinism).

## 4. Mockup default regression (gate A)

`tests/vr/` 50-shot baseline re-captured WITHOUT bridge injection after
KIT-P4: **50 shots · 0 changed · 0 total diff px**.
