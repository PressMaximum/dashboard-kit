# Changelog

All notable changes to `@pressmaximum/dashboard-kit` are documented in
this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Pre-1.0 caveat: breaking changes are allowed in minor versions
(see [docs/SPEC.md §12](docs/SPEC.md)). The 1.0 milestone locks the
public API per the deprecation cycle in §12.2.

## [Unreleased]

### Added

- **P0 — Repo bootstrap**: `package.json` + `composer.json` + ESLint (`no-restricted-imports` enforcing the i18n-clean contract per SPEC §6.1) + Vitest + GitHub Actions (lint / test / build / release) + Storybook + test-consumer scaffold + `LICENSE` + `README` + `.editorconfig` + `.gitignore`.
- **P1 — Core extract** ported from Blocksify Free `src/dashboard/`:
  - Core: `mountDashboard`, `DashboardShell`, `TabStrip`, `HelpPanel`, `SnackbarSlot`, `createFilterNamespace`, `createI18nBag`, `BootDataLoader` (+ `readBoot`, `BootProvider`, `useBoot`, `BootContext`).
  - HashRouter surface: `readHash`, `navigate`, `useHash`, `useRoute`, `matchRoute`, `activeTabId`, `useNavigate`, plus the new `NavigationGuardProvider` / `NavigationGuardContext` hook-in point for P3's `useDirtyState`.
  - A11y: `useFocusOnRouteChange` for SPA landmark focus management.
  - Layouts (Tier-1 primitives, locked CSS surface per SPEC §16.2): `PageWrapper`, `ListPageHeader`, `EditorPageHeader`, `EditorViewLayout`, `SubNav`.
  - CSS rename: every `bsy-dashboard-*` class becomes `pmdk-*`. `tokens.css` drives the palette via `--pmdk-color-*` / `--pmdk-radius-*` / `--pmdk-spacing-*` custom properties.
  - Storybook stories for the seven shipped Tier-1 + Tier-2 surfaces.
- **P1.5 — SPEC reconcile** (this entry):
  - SPEC §5.1 amended with the six optional `MountConfig` props the implementation already accepts (`tabsAriaLabel`, `helpLabels`, `helpIcon`, `helpItemIcon`, `versionAriaLabel`, `fallback`). `__` relaxed from required to recommended (becomes required at P3).
  - SPEC §5.2 amended to include `boot` and `tabsLocked` keys actually returned by `createFilterNamespace` (Blocksify Free uses `tabsLocked` for the Pro-promo tab flow).
  - SPEC §5.2b added: enumerates the flat HashRouter public API.
  - SPEC §5.10b HelpPanel default labels corrected (`triggerLabel: 'Open help panel'`, added `heading: 'Help'`).
  - SPEC §5.13 Tier-1 a11y carve-out added for `EditorPageHeader.backLabel`.
  - SPEC §9.1 amended to include the `{ns}.dashboard.tabs.locked` filter.
  - SPEC §13 phase plan updated: P1 absorbed the Tier-1 layouts that were originally scoped to P2; new P1.5 row + P2 reduced to the PageWrapper `containerWidth` fix.
  - SPEC §2.3 install command + peerDependencies example updated to include `react` / `react-dom`.
  - Smoke tests added for the pure-function surface (`matchRoute`, `activeTabId`, `createFilterNamespace`, `createI18nBag`, `readBoot`).
  - Test consumer wired to a real `mountDashboard()` call (was a `console.log` stub).

### Fixed

- Broken `./styles/tokens.css` package export removed. `tokens.css` is imported by `src/index.mjs` so it already lands in `build/style.css`; consumers reach it via `import '@pressmaximum/dashboard-kit/style.css'`.
- `size-limit` budgets tightened from 25 KB / 60 KB to the SPEC §17.10 targets of 15 KB / 80 KB. Current root entry is ~5 KB.

### Notes for maintainers

- npm publish workflow requires the `NPM_TOKEN` repository secret. Add
  it under **Settings → Secrets and variables → Actions** when ready to
  publish 0.1.0.
- Packagist sync is automatic via Packagist's GitHub webhook. Configure
  the webhook once via Packagist's package page → **Settings → API
  integration** so future tags auto-sync.
