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
- **P1.5 — SPEC reconcile**:
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
- **P2 — PageWrapper containerWidth fix**:
  - `<PageWrapper>` flex chain hardened to give `@wordpress/dataviews`'s grid layout a measurable container at mount time. The new chain is `flex: 1 1 auto` + `min-width: 0` + `min-height: 0` + `width: 100%` + `height: 100%`, matching the Site Editor's DataViews-page recipe. Closes SPEC §11 hack #3 + #4: the spike's `display: contents` row-flatten + CSS-var grid-template bridge are no longer required.
  - `<DashboardShell>` `.pmdk-dashboard__main` rewritten as a flex column with `min-height: 0` so the chain reaches PageWrapper at full available height. The reading-column cap (max-width 1100px, centred, generous vertical padding) is now gated behind a `[data-container-width="narrow"]` attribute selector instead of being baked in.
  - `mountDashboard({ containerWidth: 'narrow' | 'wide' })` sets `data-container-width` on the outer `.pmdk-dashboard` element. `'narrow'` (default) preserves the existing reading-column look. `'wide'` removes the cap and tightens vertical padding so DataViews-heavy pages can fill the viewport. Unrecognised values fall back to `'narrow'`.
  - `<SnackbarSlot>` made defensive against missing `core/notices` registration so unit tests and consumers without `@wordpress/notices` don't crash at mount.
  - Storybook: new `Validation/PageWrapper × DataViews` story mounts a real `@wordpress/dataviews` instance inside the wide-mode chain to prove the grid renders multi-column (the spike's failure mode was one-card-per-row). The same data in narrow mode is included as a contrast.
  - `@wordpress/dataviews` added as devDependency for the validation story.
  - Tests: 4 new containerWidth tests (defaults to narrow, sets wide, sanitizes unknown values, resolves rootEl via selector string).
  - Rename batch (P2-driven follow-up to P1.5's HashRouter/BootDataLoader rename): every remaining JSX-containing module in `src/core/` + `src/layouts/*` moves from `.js` to `.jsx` so vitest can parse them without per-file loader hints. Webpack's `resolve.extensions` already includes `.jsx`; internal imports are extension-less; `src/index.mjs` switches to extension-less re-exports. No public API surface change.
- **P3 — Settings** ported + i18n-cleaned from Blocksify Free:
  - `createSettingsStore({ storeName, endpoint, fetch, seedSaved? })` —
    `@wordpress/data` store factory with the locked action sequence
    `load → edit → save → reset → clearDirty`. Consumer injects the
    REST `fetch` callable (SPEC §3.3 forbids the kit from importing
    `@wordpress/api-fetch`); `seedSaved` lets the first mount render
    synchronously when boot data carries the settings.
  - `useDirtyState(key, options?)` — registry-backed hook with
    `beforeunload` listener, `confirmDiscard()` for intra-tab checks,
    module-level `isAnyDirty()` + `confirmDiscardAny()` for cross-tab
    nav guard.
  - `mountDashboard` now wires `confirmDiscardAny` as the default
    `NavigationGuardProvider` guard. Consumers using `useDirtyState`
    get tab-strip + version-anchor unsaved-edit prompts for free; no
    explicit guard wiring required.
  - `<SchemaForm>` — single-panel Tier-1 renderer (consumer resolves
    "active panel" externally via SubNav + routing). Pro full-takeover
    via `panel.component` is supported.
  - `<SchemaField>` — dispatches on `field.type` against a
    consumer-supplied `fieldTypes` map. Kit exports `BASE_FIELD_TYPES`
    (boolean / select / radio / text / number); consumer extends with
    their `{ns}.dashboard.settings.field-types` filter and passes the
    resolved map down — keeps the kit unaware of any specific filter
    namespace.
  - `<SaveBar>` — Tier-2 page component with the locked CSS class
    `.pmdk-save-bar`. Status pill mirrors the store lifecycle
    (saving / dirty / saved); right cluster is dirty-gated Save + Reset.
    Every visible string ships via the `labels` prop with English
    fallbacks per SPEC §5.10b.
  - SPEC §5.4 amended against implementation reality: documents
    single-panel `<SchemaForm>`, `labels` object pattern for
    `<SaveBar>`, `fetch` callable instead of `__` for
    `createSettingsStore`, `discardMessage` instead of
    `beforeunloadMessage` for `useDirtyState`. SchemaPanel +
    SchemaField type aliases added.
  - 22 new tests: full store action sequence (load/edit/save/reset/
    clearDirty + error paths), useDirtyState registry semantics +
    cross-tab guard behavior. Total: 47 / 47 passing.
  - Storybook: 4 SaveBar stories (Clean / Dirty / Saving / Custom
    labels) + 2 SchemaForm stories (SchemaDriven covers every
    built-in field type, ProTakeover demonstrates the `component`
    branch).
- **P4 — Welcome + Compare + Changelog** ported + i18n-cleaned from
  Blocksify Free:
  - `<Hero>` — Tier-2 Welcome intro card. `greeting`, optional
    `tagline`, optional `primaryCta`, optional `illustration` slot. 2-col
    flex collapsing to single column under 800px. Locked CSS class
    `.pmdk-hero`.
  - `<Checklist>` + `<ChecklistItem>` — Tier-2 onboarding tasks list.
    Each row runs `item.check()` async with a session-scoped cache so
    repeat visits to Welcome render flash-free. The kit DOES NOT read
    the consumer's onboarding store directly — consumer threads
    `item.manualCompleted` into the item shape, keeping the kit
    unaware of which store name was registered. Internal `#hash`
    CTAs SPA-navigate via the router; external URLs are plain
    anchors. Locked CSS classes per SPEC §16.2.
  - `createOnboardingStore({ storeName, endpoint, fetch })` — full
    action surface (`load`, `complete`, `uncomplete`, `dismiss`).
    Mutators are optimistic with rollback on PATCH failure. GET
    returns `{ completed, dismissed }`; PATCH accepts partials of the
    same shape. Same `fetch`-injected REST pattern as
    `createSettingsStore` (SPEC §3.3 forbids `@wordpress/api-fetch`
    import).
  - `<CompareTable>` — Tier-2 Free vs Pro matrix. CSS-grid (not
    `<table>`) so wp-admin table styles don't fight the layout. Cell
    dispatch on shape: `true` → green check badge; `false`/`null`/
    `undefined` → gray em-dash badge; `string` → literal; `{ value,
    muted }` → muted-variant text. Optional `footer` renders an
    in-card CTA banner. Locked CSS classes per SPEC §16.2.
  - `<ReleaseBlock>` — Tier-2 release card with version header
    (+ optional `Current` pill), date, and items list. Each item
    pairs a `<CategoryBadge>` with text.
  - `<CategoryBadge>` — small uppercase pill, color via CSS modifier
    classes per tone (`pmdk-category-badge--new`, `--fixed`,
    `--security`, etc.). Ships 13 default category → label mappings +
    a category → tone map; consumer extends via `labels` /
    `toneOverrides` props. Unknown categories render with the
    uppercased raw category text and the `neutral` tone — drift-
    tolerant display.
  - SPEC §5.3b amended: CompareTable label keys reconciled with the
    implementation (`headFeature` / `headFree` / `headPro` / `cellYes` /
    `cellNo` instead of the original `headColumn*` / `*Label` shape).
    ReleaseBlock gains `categoryToneOverrides` prop. Cell-dispatch
    behavior documented.
  - SPEC §5.5 amended: ChecklistItem type alias added; `createOnboardingStore`
    documented with the `fetch` callable + full action surface;
    `manualCompleted` integration pattern documented as the consumer's
    bridge to their own onboarding store.
  - 14 new tests: 9 onboarding store action sequence (load,
    complete/uncomplete with rollback, dismiss with rollback) +
    5 CategoryBadge label/tone resolution. Total: 61 / 61 passing.
  - Storybook: 3 Hero stories (WithEverything / GreetingOnly /
    WithoutIllustration) + 3 Checklist stories (Default / AllCompleted /
    Empty) + 3 CompareTable stories (Default / WithFooterCta /
    LocalizedLabels) + 3 ReleaseBlock stories (Current / Prior /
    LocalizedCategoryLabels).
- **P5 — Editor helpers**:
  - New `/editor-helpers` sub-entry (tree-shake pattern like
    `/datasets`) so dashboard-only consumers don't bundle the editor
    surface. Importable via
    `import { ... } from '@pressmaximum/dashboard-kit/editor-helpers'`.
  - `rewireBackButton({ selector?, href })` — capture-phase click
    intercept on the block editor's fullscreen-close button (default
    selector `.edit-post-fullscreen-mode-close`). Redirects to `href`
    via `window.location.href`. Closes SPEC §11 hack #6's JS half
    (the PHP wrapper lands with P7 `Admin\EditorIntegration`).
  - `forceFullscreenMode()` — flips
    `core/edit-post.fullscreenMode` via the `core/preferences` store.
    Subscribes via `wp.data.subscribe` until the store registers, so
    calling the helper at the top of the consumer's editor entry is
    safe even when boot hasn't finished. Idempotent: re-running when
    the flag is already on is a no-op.
  - `registerSubmenuActive({ menuId, hash })` — toggles `.current` on
    the WP submenu item matching `hash` (drives the SPA tab highlight
    that WP's `?page=`-only server-side detection can't see).
    Hashchange-driven; falls back to the first item (parent mirror)
    when route is elsewhere. Closes SPEC §11 hack #5's JS half.
  - All three helpers return an unsubscribe handle (or `null` in
    non-browser contexts) for symmetric teardown. SSR-safe.
  - 18 unit tests: rewireBackButton (6) covering default + custom
    selector, nested-icon `closest()` traversal, unsubscribe, and
    arg validation; forceFullscreenMode (4) covering no-op
    branches, current=true skip, and `wp.data.subscribe` deferral;
    registerSubmenuActive (8) covering DOM-absent / no-match nulls,
    initial mount sync, hashchange propagation, and unsubscribe.
    Total: 87 / 87 passing.
  - SPEC §5.7 amended: replaced the original PHP-wrapper-only example
    with the JS runtime signatures actually shipped + the consumer
    wiring pattern. SSR safety + idempotency noted.
  - SPEC §11 hack #5 + #6 marked "JS helper shipped in P5"; PHP
    wrappers tracked for P7. SPEC §13 P5 row expanded with the
    helper-level scope reality.
  - `webpack.config.js` adds the `editor-helpers/index` entry;
    `package.json` adds the `./editor-helpers` export + a 2 KB
    size-limit budget (actual: 816 B gzipped).
- **P6 — Datasets** (the heaviest JS phase) ported + i18n-cleaned from
  Blocksify Free's Surfaces spike:
  - `<EntityListPage>` — Tier-2 page component for CPT list views built
    on `@wordpress/dataviews`. Auto-wraps itself in `<PageWrapper>` so
    DataViews's `useResizeObserver` sees a real `containerWidth`
    (proves SPEC §11 hack #3 closes end-to-end). Renders header chrome
    via the existing `<ListPageHeader>` (`title` + `description` +
    optional `primaryAction`); switches between loading / empty /
    populated states; forwards `items` + `fields` + `view` +
    `onChangeView` + `actions` + `paginationInfo` + `defaultLayouts` +
    `getItemId` straight to `<DataViews>`. Per SPEC §3.3 the kit does
    NOT import `@wordpress/core-data` / `@wordpress/api-fetch` —
    consumer fetches records and passes `items` + `isLoading` in.
    Labels surface deliberately small (`loading`, `noResults` only);
    all toolbar / pagination / density / sort / bulk strings come from
    `@wordpress/dataviews`'s own i18n via WP's `default` text domain.
    Locked class `.pmdk-entity-list-page`.
  - `<EntityPreviewFrame>` — full-page iframe preview that renders at
    a desktop-realistic viewport (`viewportWidth` × `viewportHeight`,
    defaults 1200 × 900) then CSS-scales the result to fit any card
    container. The scale ratio is computed via container query units
    (`transform: scale(calc(100cqw / var(--pmdk-preview-viewport)))`)
    so the wrapper needs no JS / `ResizeObserver` to be responsive.
    Browser baseline (Chrome 105+, Firefox 110+, Safari 16+) matches
    SPEC §2.2 already. Locked classes `.pmdk-entity-preview`,
    `.pmdk-entity-preview__frame`, `.pmdk-entity-preview.is-empty`.
  - `ViewPersistence.create({ storageKey, defaultView })` — factory
    returning `{ load, save }`. `load()` returns `defaultView` when
    storage is empty / unreadable / corrupt; `save(next)` swallows
    storage quota / private-mode errors. Pure JS — no React dep —
    so consumers can later swap for a REST-backed
    `@wordpress/preferences` adapter without changing call sites.
  - `filterTrashByDefault(items, view)` — pre-filter helper that
    matches `WP_List_Table`'s subsubsub UX: trashed records hidden
    unless the user explicitly opts in via a `status` filter
    (single-value `'trash'` or array containing `'trash'`).
    Pure function.
  - SPEC §11 hack #2 closes by **deletion**: the kit does NOT vendor
    or import `@wordpress/dataviews`'s 74 KB CSS. Consumer's
    `wp-scripts` builds detect the kit's externalized
    `@wordpress/dataviews` JS import + `DependencyExtractionWebpackPlugin`
    auto-adds `wp-dataviews` to the generated `asset.php` deps; WP
    core ≥6.5 then enqueues the matching stylesheet handle. No vendor
    CSS in the kit's tree.
  - SPEC §11 hacks #3 + #4 verified absent from `EntityListPage.css` —
    neither the spike's `display: contents` row-flatten nor the
    `--bsy-surfaces-preview-size` CSS-var bridge are needed once the
    P2 PageWrapper flex chain reaches DataViews.
  - 39 new tests across 4 files: ViewPersistence (13) covers
    argument validation, load merge semantics, corrupt JSON,
    non-object values, SSR localStorage-undefined, getItem-throws,
    save quota errors; filterTrashByDefault (9) covers single vs
    `isAny` status filters, default-hide-trash, missing view, missing
    `filters` array, non-array items, items with no status field;
    EntityPreviewFrame (7) covers iframe render, empty placeholder,
    English fallback, viewport CSS variable + iframe sizing, default
    viewport 1200×900, className merge in both states; EntityListPage
    (10) covers PageWrapper auto-wrap, header rendering, primary
    Button, className append, loading state with `role="status"`,
    empty state, English label fallbacks, populated → DataViews path,
    refresh-with-stale-data path, and full prop forwarding to
    DataViews. Total: 125 / 125 passing.
  - Webpack `MiniCssExtractPlugin` filename now emits per-entry CSS:
    `build/style.css` for the root entry,
    `build/datasets/style.css` for the datasets entry. Theme-only
    consumers never pay DataViews-page CSS bytes (per-entry CSS
    tree-shake is a small win the spike never claimed).
    `package.json` adds `./datasets/style.css` export.
  - Storybook validation: new
    `stories/EntityListPage.dataviews.stories.jsx` mounts a real
    `@wordpress/dataviews` grid inside the kit's wide- and narrow-mode
    dashboard chassis (wide should render multi-column, narrow capped
    at 1100px reading width). Plus loading + empty state stories.
    Imports via `../src/datasets/index.mjs` so the fixture doubles as
    a regression check on the `/datasets` export surface.
  - SPEC §4.1 datasets tree updated (no longer "(planned)"); §5.6
    amended with `viewportHeight` + `className` props; §5.10b
    `<EntityListPage>` `labels` table trimmed from ~22 strings to 2
    with a rationale paragraph (decision deferred from §5.13's audit);
    §5.10b `<EntityPreviewFrame>` `loadingLabel` dropped (iframe
    browser-native loading is enough); §11 hacks #2 / #3 / #4 rows
    updated to reflect actual P6 state; §13 P6 row expanded with the
    shipped scope.
  - Size: datasets entry 2.46 KB gzipped (under 80 KB budget by a
    very wide margin because `@wordpress/dataviews` +
    `@wordpress/components` externalize to `wp.dataviews` /
    `wp.components` globals — the kit ships only its own wrapper +
    component CSS).

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
