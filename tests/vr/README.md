# VR + token gates (KIT-P2)

Two bounded checks around the `--ap-* → --pmdk-*` bridge. Named precisely — do
not oversell them:

- **GATE A (pixel · local only)** — deterministic Playwright screenshots of the
  Aponto DS gallery, baseline vs. bridge-injected. Zero-diff proves the bridge
  is **non-destructive** when added to a real page. It cannot prove more at P2:
  the mockup does not consume `--pmdk-*` yet, so the injected sheet is expected
  to be visually inert. Consumer-pixel equivalence is a **KIT-P3/P5** gate,
  when `.pd-*` surfaces actually read kit tokens.
- **GATE B (token · CI + local)** — `verify-tokens.mjs` proves (1) every bridge
  declaration matches a **frozen intended-mapping table** hard-coded in the
  script (re-pointing a token at a different-but-defined source fails), and
  (2) every declared token — color and non-color — **resolves** in a real
  Chromium `.ap-admin` cascade (a var() to a nonexistent source token fails by
  name). Editing the bridge intentionally requires updating the table in the
  same change.

## Prereqs

- `playwright` + `pixelmatch` + `pngjs` (kit devDeps; `npm install`). Chromium
  is the Playwright-managed build.
- Gate A only: the Aponto mockup served over **HTTP** (never `file://`):

  ```sh
  cd <aponto>/.claude/worktrees/wt-kit-p2-bridge/docs/mockups
  python3 -m http.server 8788 --bind 127.0.0.1
  ```

  Point the harness elsewhere with `VR_BASE=http://127.0.0.1:<port>`.

Gate B needs **no server and no aponto checkout** — it runs against the
committed fixtures in `fixtures/` (synthetic DOM via `page.setContent`, styles
injected inline).

## The matrix (Gate A)

`config.mjs` — 48 gallery shots (2 viewports × 2 themes × 12 sections at
primary preset "deep") + up to 4 `index.html#bookings` inspector-open app shots
(desktop only; 360px bookings has no in-flow inspector). Baseline lives in
`baseline/` (captured on the founder's machine — see CI note below).

## Run

```sh
# GATE B — token mapping + resolution (fixture default; CI runs exactly this)
node tests/vr/verify-tokens.mjs
# …or against the live aponto bridge:
node tests/vr/verify-tokens.mjs <aponto>/.../assets/css/aponto-admin-bridge.css

# Fixture sync reminder (skips cleanly when the aponto worktree is absent)
node tests/vr/check-bridge-sync.mjs

# GATE A — pixel non-destructiveness (needs the HTTP server above)
node tests/vr/capture.mjs tests/vr/baseline        # baseline (before changes)
VR_INJECT_CSS=<bridge.css> node tests/vr/capture.mjs tests/vr/current
node tests/vr/compare.mjs tests/vr/baseline tests/vr/current tests/vr/diff
```

`compare.mjs` writes highlighted diffs to `diff/` and exits non-zero on any
change. Determinism: animations/transitions/caret frozen, fonts + network idle
awaited, deviceScaleFactor 1, preset pinned via localStorage.

## Fixtures (`fixtures/`)

Committed copies of the two aponto-side sheets so Gate B is CI-independent:
`aponto-admin-bridge.css` + `aponto-tokens.css`. They are **copies, not the
source of truth** — the live files live in the aponto repo. On edit: re-copy
(commands printed by `check-bridge-sync.mjs`) and, if the mapping changed,
update the intended-mapping table in `verify-tokens.mjs`.

## CI

`ci.yml` runs **Gate B only** (platform-independent: DOM + computed values, no
screenshots). **Gate A is deliberately NOT in CI** — the baseline PNGs are
rendered on the founder's macOS machine and font/AA rasterization differs per
platform, so a Linux runner would diff every shot. Re-run Gate A locally when
touching token/bridge/theme CSS.
