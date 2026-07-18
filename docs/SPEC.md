# Dashboard Kit — SPEC

> **Status**: pre-implementation. Distillation of the Surfaces spike (commit `e1e7be9`) + the architecture conversation that followed. The spike lives in Blocksify Free as a `BLOCKSIFY_DEV`-gated proof; this SPEC defines the standalone `@pressmaximum/dashboard-kit` package the spike will dissolve into.
>
> **Read first** (~20 min):
> 1. `CLAUDE.md` (worktree root) — session rituals + LLM behavioral guidelines
> 2. `docs/FOUNDATION.md` §1, §8.0, §8.5, §13 — Blocksify principles, Free/Pro positioning, versioning lock, language conventions
> 3. `docs/SPEC-dashboard.md` — Blocksify Free dashboard v2 (the kit's first internal consumer)
> 4. `docs/handoffs/HANDOFF-dashboard-v2-brainstorm.md` §6 — Pro CPT Pattern A / B
> 5. The Surfaces spike at `includes/dashboard/class-blocksify-dashboard-surfaces-spike.php` + `src/dashboard/tabs/Surfaces/` — search `SPIKE:` markers for hack inventory
>
> **First consumer**: Blocksify Free dashboard. **Future consumers** (known up-front, per the abstraction rule in FOUNDATION §1 Blocksify overrides): Blocksify Pro (Surfaces / Conditions / Query Builder tabs), Customify Theme (lightweight settings dashboard), Customify Pro Plugin (CPT dashboards that hook into the Theme dashboard).
>
> **Repository**: separate from Blocksify Free — standalone npm + composer package at `https://github.com/pressmaximum/dashboard-kit` (proposed slug). This SPEC lives in Blocksify Free until the package repo is bootstrapped, then moves into the kit repo.

---

## Decision log

Status legend: ✓ confirmed · ⚠️ proposed (sign-off pending) · ❌ withdrawn · 🔍 open

### Locked during the spike + architecture conversation (this SPEC implements)

| # | Topic | Decision | Status |
|---|---|---|---|
| 1 | Distribution shape | Standalone npm package `@pressmaximum/dashboard-kit` + parallel composer package `pressmaximum/dashboard-kit` for PHP utilities | ✓ |
| 2 | Consumer model | Each consumer (theme / plugin) `npm install` + `composer require`, bundles kit code into own bundle. No shared runtime; independent release cadence | ✓ |
| 3 | Text domain rule | Kit forbids `import { __ } from '@wordpress/i18n'`. All visible labels arrive as React props / config strings from the consumer. ESLint enforces | ✓ |
| 4 | i18n distribution | Consumer's `wp i18n make-pot` extracts kit strings from consumer's own code (the call sites where strings are passed as props). Kit ships English fallbacks for internal-utility labels via documented prop defaults. Result: one `.pot` per consumer, single text domain — WordPress.org theme review pass | ✓ |
| 5 | DataViews module boundary | DataViews-dependent modules under `src/datasets/` are tree-shakeable. Consumers that don't import `datasets/*` don't bundle DataViews (~50KB gzip saved for lightweight theme dashboards) | ✓ |
| 6 | Filter hook namespacing | Each consumer hosts its own filter namespace (`blocksify.dashboard.*`, `customify.dashboard.*`). Kit provides a `createFilterNamespace(prefix)` helper; kit itself doesn't claim a namespace | ✓ |
| 7 | Consumer ↔ Pro extension model | Pro plugins consume the Theme/Free plugin's filter namespace, not the kit's. Pattern mirrors Blocksify Free ↔ Blocksify Pro per SPEC-dashboard §11 | ✓ |
| 8 | Versioning | Semver. Locked once shipped per FOUNDATION §8.5 — minor adds non-breaking exports, major requires deprecation cycle | ✓ |
| 9 | Brand/CSS prefix | `pmdk-` for DOM/CSS classes (PressMaximum Dashboard Kit). Neutral, not tied to any specific consumer brand | ✓ |
| 10 | PHP namespace | `PressMaximum\DashboardKit\*` (PSR-4 autoload via composer) | ✓ |
| 11 | Kit scope | Full dashboard infrastructure (mount + router + tabs + layouts + settings + welcome + compare + changelog + editor helpers + datasets), tree-shakeable per module | ✓ |
| 12 | Customize pattern | Three tiers: (a) use defaults as-is, (b) override via config props, (c) replace via filter slot. Consumer can also build entirely outside kit and just register routes | ✓ |
| 13 | Theme review compliance | Themes that consume the kit must pass WordPress.org review — one text domain, no PHP class loaded outside of theme's `functions.php`, no required external plugin | ✓ |
| 14 | Spike disposition | Stays in Blocksify Free `BLOCKSIFY_DEV`-gated as reference until kit repo bootstrapped + Blocksify Free migrated to consume kit, then deleted | ✓ |

### Proposed for sign-off

| # | Topic | Proposal | Status |
|---|---|---|---|
| 15 | Package version v0.1.0 vs v1.0.0 | Start at v0.1.0 — semver pre-1.0 explicitly allows breaking changes in minor releases. Hit v1.0.0 when API has settled across all three real consumers (Blocksify Free, Customify Theme, Customify Pro) | ⚠️ |
| 16 | Repository name | `pressmaximum/dashboard-kit` for both GitHub repo and npm/packagist | ⚠️ |
| 17 | License | GPL-2.0-or-later (matches WordPress ecosystem) | ⚠️ |
| 18 | TypeScript | JS source, JSDoc-typed for IDE help; ship `.d.ts` generated from JSDoc. No TS rewrite required | ⚠️ |
| 19 | CSS strategy | Vanilla CSS, mirror Blocksify's no-SCSS rule (FOUNDATION §5). Per-component `editor.css` files imported alongside `index.js` | ⚠️ |

---

## 1. Identity

| Field | Value |
|---|---|
| npm package | `@pressmaximum/dashboard-kit` |
| Composer package | `pressmaximum/dashboard-kit` |
| GitHub | `https://github.com/pressmaximum/dashboard-kit` |
| License | GPL-2.0-or-later |
| Distribution | npm (JS), Packagist (PHP). Optional plugin/theme zip not provided — kit always bundled into consumer |
| Versioning | Semver. Pre-1.0 = breaking changes allowed in minor. 1.0+ = FOUNDATION §8.5 lock applies |
| PHP namespace | `PressMaximum\DashboardKit` (PSR-4) |
| JS export root | `@pressmaximum/dashboard-kit` |
| JS DataViews sub-entry | `@pressmaximum/dashboard-kit/datasets` |
| DOM/CSS prefix | `pmdk-` |
| Filter helper namespace | Configured per consumer; kit itself uses no filter prefix |
| Internal text domain | **None.** Kit forbids `@wordpress/i18n` import |

### 1.1 What the kit is

Reusable dashboard infrastructure for any WordPress theme or plugin that wants a Blocksify-style admin SPA: tab strip, hash router, settings form, welcome onboarding, list views with live preview iframes, fullscreen-editor handoff, sub-menu integration. Distilled from the Blocksify Free dashboard (`src/dashboard/`) + Surfaces spike.

### 1.2 What the kit is NOT

- Not a WordPress plugin (no plugin header, no auto-install). Consumer bundles kit into own plugin/theme.
- Not a full Gutenberg replacement — does not ship `<BlockPreview>` or `<BlockEditorProvider>`. Block editor remains the post.php experience consumers can hand off to via the fullscreen helpers.
- Not a UI primitive library — defers to `@wordpress/components` for buttons, modals, etc. Kit composes WP components, doesn't reinvent.
- Not opinionated about data sources — consumers fetch via `@wordpress/core-data`, `@wordpress/api-fetch`, vanilla fetch, GraphQL, anything.
- Not opinionated about state management beyond what's needed for own internal state (dirty buffer, view persistence). Consumers register own data stores.

---

## 2. Goals + non-goals

### 2.1 Goals

- **Single source of truth** for the dashboard SPA pattern that Blocksify Free, Customify Theme, Customify Pro share.
- **Tree-shake-friendly**: a lightweight consumer (e.g., Customify Theme) bundles ~10-15KB gzip; a full consumer with DataViews bundles ~80-90KB.
- **i18n-clean**: no kit-injected text domain. Consumers retain full control of `.pot` extraction.
- **Filter-extension model** identical to WordPress's own (`addFilter` / `applyFilters`) so plugins extending a theme's dashboard work the same way Blocksify Pro extends Blocksify Free.
- **Independent release cadence**: each consumer pulls a kit version, releases at own pace. No coordinated multi-plugin release required.
- **Hack-fix pipeline**: every workaround from the Surfaces spike has a documented fix path that ships as a kit minor release; consumers update kit to inherit the fix.

### 2.2 Non-goals

- **No theme.json controls**, no Global Styles UI. Out of scope.
- **No block editor integration beyond fullscreen handoff** (no rendering blocks inside dashboard tabs, no editor canvas).
- **No analytics, telemetry**, no user-account integration. Pure UI infrastructure.
- **No multisite-specific features**. Consumer handles multisite if needed.
- **No back-compat for WordPress < 6.5**. DataViews v14 + `<dialog>` + container queries + `:has()` all assume 6.5+ baseline.
- **No back-compat for browsers below**: Chrome 105+, Firefox 110+, Safari 16+ (CSS container queries + `:has()` baseline). Older browsers see broken layout — kit doesn't ship polyfills.

### 2.3 Dependency model (clarification)

Kit declares `@wordpress/*` packages it imports as `peerDependencies` in `package.json` (for npm warning + IDE help + documentation). At **build time**, consumer's `wp-scripts` webpack config auto-externalizes them via `DependencyExtractionWebpackPlugin` — the imports become `wp.element`, `wp.components`, etc. references at runtime. **No double bundling**: WordPress already serves these globally as `window.wp.*`.

```json
// Kit's package.json:
{
  "peerDependencies": {
    "@wordpress/components": ">=29.0.0",
    "@wordpress/data": ">=10.0.0",
    "@wordpress/dataviews": ">=14.0.0",
    "@wordpress/element": ">=6.0.0",
    "@wordpress/hooks": ">=4.0.0",
    "@wordpress/html-entities": ">=4.0.0",
    "@wordpress/icons": ">=10.0.0",
    "@wordpress/url": ">=4.0.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "@wordpress/dataviews": { "optional": true }
  }
}
```

`@wordpress/dataviews` is peer **only when** `datasets` sub-entry is consumed. Webpack tree-shake handles this naturally — if consumer doesn't import `datasets/*`, the dataviews dependency is never traversed.

**Install command** for consumer setting up the kit:

```bash
npm install @pressmaximum/dashboard-kit \
  @wordpress/components @wordpress/data @wordpress/element \
  @wordpress/hooks @wordpress/url @wordpress/html-entities @wordpress/icons \
  react react-dom
```

`react` + `react-dom` are listed as peers because the kit's webpack build externalizes them as ESM modules (consumer-side bundling resolves them to whatever React WP ships on `window.wp.element` — currently React 18). They're listed explicitly so npm warns when a consumer's install tree has none at all.

**Caveat**: most WP plugins/themes use `@wordpress/scripts` as build tool, which already includes all `@wordpress/*` packages + react + react-dom as transitive devDependencies. In that case `npm install @pressmaximum/dashboard-kit` alone is sufficient — peers resolve via `wp-scripts`'s tree. The explicit install above is only needed if consumer build pipeline lacks `wp-scripts`.

**Kit repo's `packages/test-consumer/`** (test scaffold per §13.2) ships these as devDependencies so IDE typecheck + ESLint behave correctly during kit development.

### 2.4 Bundle duplication trade-off (explicit decision)

When multiple kit consumers are active on the same WP install, **each consumer bundles its own copy of kit code**. There is no shared runtime — by design, to preserve independent release cadence.

Worst-case math (user with Blocksify Free + Customify Theme + Blocksify Pro + Customify Pro all active):

| Bundled per consumer | Free / Theme | Pro plugins |
|---|---|---|
| Kit core (mountDashboard, router, tabs, layouts) | ~10KB gzip | ~10KB gzip |
| Settings + Welcome + Compare + Changelog | ~15KB gzip | ~15KB gzip |
| Datasets (DataViews + EntityListPage + EntityPreviewFrame) | 0 (not imported) | ~50KB gzip |
| **Subtotal per consumer** | **~25KB gzip** | **~75KB gzip** |
| **× consumer count** | × 2 = 50KB | × 2 = 150KB |
| **Total wasted bytes** | | **~175-200KB gzip per admin page load** |

Context: a typical WP admin page already loads 1-2 MB of JavaScript (WP core + Gutenberg + plugins). 175-200 KB extra = roughly 10-15% overhead.

**Alternatives considered + rejected**:

| Approach | Rejected because |
|---|---|
| Single shared `wp_register_script` handle for the kit, loaded once by a "loader plugin" or shipped with one of the consumers | Forces atomic cross-plugin release coordination. Kit major bump → all consumers must update simultaneously OR site breaks. Loader-plugin = yet another required install. Pattern goes against the independent-release principle that motivates extracting the kit in the first place |
| WP Script Modules (WP 6.5+) with browser-level dedup | Experimental in WP 6.5, more stable in 6.6+. Still requires consumer-side registration coordination. Re-evaluate in 1+ year when WP Script Modules mature |
| Webpack Module Federation runtime sharing | Adds runtime complexity for marginal admin-page benefit. Not a fit for WP plugin ecosystem |

**Decision**: accept ~200KB duplication as cost of independence. Optionally re-evaluate post-1.0 if (a) WP Core ships a usable shared-module mechanism OR (b) real users complain about admin page weight.

If future demand warrants, kit MAY add an opt-in "external mode" minor release: consumer flags `external: true` in webpack config → kit imports resolve to `window.pmdk` instead of bundled code, AND one consumer (or a tiny "loader plugin") ships the actual kit code as a registered script handle. Opt-in, never default.

---

## 3. Architecture overview

### 3.1 Distribution

```
@pressmaximum/dashboard-kit (npm)
  ↓ consumed via npm install
  ↓
+----------------------------+----------------------------+----------------------------+
|                            |                            |                            |
| Customify Theme (free)     | Blocksify Free             | Customify Pro Plugin       |
|                            |                            | (hooks into Customify      |
|   imports: core, layouts,  |   imports: ALL incl.       |  Theme dashboard via       |
|   settings, welcome        |   datasets                 |  filter namespace)         |
|                            |                            |                            |
|   bundles ~10-15KB gzip    |   bundles ~80-90KB gzip    |   imports: ALL             |
|                            |                            |   bundles ~80-90KB gzip    |
|   mounts own dashboard SPA |   mounts own dashboard SPA |   does NOT mount; adds     |
|                            |                            |   tabs/routes to existing  |
+----------------------------+----------------------------+----------------------------+
              ↑                                                          ↑
              |                                                          |
              +— Blocksify Pro Plugin hooks here (Surfaces/Conditions/QB)
                 imports ALL, does NOT mount, adds tabs via filter
```

pressmaximum/dashboard-kit (composer / Packagist)
  ↓ consumed via composer require
  ↓
Same consumers above — PHP utilities (REST helpers, admin-menu helpers, etc.)

### 3.2 Per-consumer build

Webpack tree-shake at the consumer level. Kit's `package.json` declares precise exports so unused modules are eliminated:

```json
{
  "name": "@pressmaximum/dashboard-kit",
  "version": "0.1.0",
  "sideEffects": [
    "**/*.css"
  ],
  "exports": {
    ".": {
      "import": "./build/index.mjs",
      "types": "./build/index.d.mts"
    },
    "./datasets": {
      "import": "./build/datasets/index.mjs",
      "types": "./build/datasets/index.d.mts"
    }
  }
}
```

A consumer that only imports from the root entry doesn't bundle `datasets/`.

### 3.3 Dependency injection vs hardcoded imports

The kit imports only from `@wordpress/element`, `@wordpress/components`, `@wordpress/data`, `@wordpress/hooks`, `@wordpress/url`, `@wordpress/html-entities`, `@wordpress/icons`. **Forbidden imports** at the kit level:

- `@wordpress/i18n` — kit must never call `__()` directly. Use injected `__` prop / config callback. ESLint rule blocks this.
- `@wordpress/core-data` — kit doesn't fetch entities directly; consumers supply data hooks. Datasets module exports adapter components that take `useRecords` / `useDispatch` callables as props.
- `@wordpress/api-fetch` — consumers handle their own REST.

### 3.4 The two faces of the kit

**JS face** (npm): React components + hooks + utility functions.
**PHP face** (composer): REST helpers, admin-menu helpers, asset-handle conventions, JSON schema definition helpers. Used by consumers' `includes/dashboard/` PHP.

Both faces version-locked together — `0.1.0` JS pairs with `0.1.0` PHP.

### 3.5 Data flow — Settings save sequence

```
USER ACTION              CONSUMER             KIT                  WP CORE / REST
─────────────────────────────────────────────────────────────────────────────────

Type in field              │                   │                       │
   ────────────────────────►  SchemaForm      │                       │
                              field.onChange   │                       │
                              ──────────────►  │  store.actions        │
                                                  .edit(path, value)   │
                                                  ─ dirty buffer ─     │
                                                                       │
                                                  useDirtyState        │
                                                  setDirty(true)       │
                                               ─────────────────       │
                                               SaveBar enables         │
                                                                       │
Click "Save"                │                   │                       │
   ────────────────────────►  SaveBar          │                       │
                              onClick={onSave}  │                       │
                              ──────────────►  │  store.actions        │
                                                  .save()              │
                                                  ──────────────►       │
                                                                        POST consumer's
                                                                        /wp/v2/{cpt}/{id}
                                                                        or /custom/v1/settings
                                                                       │
                                                  ◄──────────────       │
                                                  response → set saved │
                                                  dirty buffer cleared │
                                                                       │
                                                  createNotice('success',│
                                                  consumer-translated  │
                                                  string)              │
                                                                       │
                                                  useDirtyState        │
                                                  setDirty(false)      │
                                               ─────────────────       │
                                               SaveBar disables        │
                                                                       │
                                                  SnackbarSlot         │
                                                  renders notice       │
                              ◄──────────────                          │
   ◄────────────────────────                                            │
   Sees "Saved." snackbar                                              │
```

Identical pattern for `Welcome onboarding completion`, `Reset to defaults`, and any consumer-side CRUD wired through `createSettingsStore`.

---

## 4. Package structure

### 4.1 JS (npm)

> File-extension convention: JSX-containing modules ship as `.jsx`;
> pure-JS utilities (stores, hooks without JSX, pure functions) ship as
> `.js`. wp-scripts / Blocksify also allow JSX inside `.js`, but Vite
> (Storybook + Vitest) needs an explicit hint when both extensions are
> in play — the convention keeps the kit's tooling matrix unambiguous.
> Internal imports between kit modules omit the extension; webpack's
> `resolve.extensions` (and the consumer's wp-scripts equivalent)
> resolve them.

```
src/
├── index.mjs                          // public exports (everything except datasets)
├── core/
│   ├── mountDashboard.jsx             // entry: renders SPA into a node
│   ├── DashboardShell.jsx             // top-level layout (header + tabs + main + snackbar)
│   ├── TabStrip.jsx
│   ├── HashRouter.jsx                 // readHash / navigate / useRoute / useNavigate /
│   │                                  //   matchRoute / activeTabId + NavigationGuardProvider
│   ├── BootDataLoader.jsx             // window.{name}Dashboard reader + BootProvider / useBoot
│   ├── HelpPanel.jsx                  // header help-dropdown component
│   ├── SnackbarSlot.jsx               // notices slot bound to core/notices store
│   ├── createFilterNamespace.js       // returns { tabs, routes, settingsPanels, ... } strings
│   ├── createI18nBag.js               // merge English defaults with consumer overrides
│   └── useFocusOnRouteChange.js       // SPA focus management on route change
├── layouts/                           // all five Tier-1 layout primitives (P1)
│   ├── ListPageHeader/
│   │   ├── index.jsx
│   │   └── editor.css
│   ├── EditorPageHeader/
│   ├── EditorViewLayout/              // 3-col SubNav + Main + Rail
│   ├── PageWrapper/                   // flex chain that gives DataViews proper containerWidth
│   └── SubNav/                        // vertical nav rail (Settings panels, Changelog sources)
├── settings/                          // P3
│   ├── SchemaForm.jsx                 // single-panel renderer (consumer resolves active panel)
│   ├── SchemaField.jsx                // dispatches field.type → registry component
│   ├── SaveBar.jsx                    // sticky-bottom Save + Reset
│   ├── fieldTypes.jsx                 // BASE_FIELD_TYPES (boolean / select / radio / text / number)
│   ├── createSettingsStore.js         // @wordpress/data store factory: dirty buffer + save/reset
│   └── useDirtyState.js               // hook + module-level registry + confirmDiscardAny
├── welcome/                           // P4
│   ├── Hero.jsx                       // greeting + tagline + primary CTA + illustration slot
│   ├── Checklist.jsx
│   ├── ChecklistItem.jsx              // auto-detect via item.check() + manualCompleted contract
│   └── createOnboardingStore.js       // @wordpress/data store: completed[] + dismissed
├── compare/                           // P4
│   └── CompareTable.jsx               // Free vs Pro matrix (CSS grid, cell-shape dispatch)
├── changelog/                         // P4
│   ├── ReleaseBlock.jsx
│   └── CategoryBadge.jsx              // tone-coded pill, exportable standalone
├── editor-helpers/                    // P5 — JS runtime helpers, /editor-helpers sub-entry
│   ├── index.mjs                      // barrel re-exports for the sub-entry
│   ├── forceFullscreenMode.js         // flips core/edit-post.fullscreenMode via wp.data
│   ├── rewireBackButton.js            // capture-phase click intercept on the close button
│   └── registerSubmenuActive.js       // submenu `.current` sync on hashchange
├── datasets/                          // P6 — TREE-SHAKEABLE — heavy DataViews deps
│   ├── index.mjs                      // re-exports for the `./datasets` sub-entry
│   ├── EntityListPage.jsx             // Tier-2 page: PageWrapper + ListPageHeader + DataViews
│   ├── EntityListPage.css
│   ├── EntityPreviewFrame.jsx         // CSS-scaled iframe preview (container queries)
│   ├── EntityPreviewFrame.css
│   ├── ViewPersistence.js             // localStorage adapter (factory)
│   └── filterTrashByDefault.js        // (items, view) → items minus trash unless opted-in
└── styles/
    └── tokens.css                     // CSS custom properties shared across components

build/                                  // generated, npm-published
├── index.mjs
├── index.d.mts                        // tsc emits .d.mts for .mjs sources
├── datasets/
│   ├── index.mjs
│   └── index.d.mts
├── core/                              // internal types — `.d.ts` because the
│   └── *.d.ts                         //   sources are .jsx, not in package.json exports
├── …                                  // (settings/, welcome/, etc. mirror src/)
└── style.css                          // concatenated component CSS

package.json
README.md
LICENSE
.eslintrc.cjs                           // no-restricted-imports: [@wordpress/i18n, @wordpress/core-data, @wordpress/api-fetch]
```

`utils/` is NOT shipped — pre-P0 planning sketched a `classNames / debounce / escapeAttribute` directory, but the kit ended up either using inline expressions or pulling utilities from `@wordpress/*` packages directly. The directory will be added back if a third kit module needs the same helper.

### 4.2 PHP (composer)

```
includes/
├── Boot.php                            // PressMaximum\DashboardKit\Boot::register($args)
├── REST/
│   ├── PreviewEndpointRegistrar.php    // template_redirect interceptor factory
│   └── SettingsControllerBase.php      // abstract REST controller for schema-driven settings
├── Admin/
│   ├── MenuHelpers.php                 // add_dashboard_page, hash-link submenu helpers
│   ├── AssetEnqueue.php                // PressMaximum\DashboardKit\Admin\AssetEnqueue::enqueueOn($hook, $config)
│   └── EditorIntegration.php           // forceFullscreenMode, rewireBackButton PHP entry
├── Schema/
│   └── SchemaBuilder.php               // fluent API for building Settings schema JSON
└── Bootstrap.php                       // composer autoload entry — registers nothing on its own

composer.json
README.md
LICENSE
```

---

## 5. Public API

> Stable as of v0.1.0 spec draft. Subject to refinement during initial implementation; lock at v1.0 per FOUNDATION §8.5.

### 5.1 `mountDashboard(config)`

Bootstraps the dashboard SPA. Called once per consumer page load.

```ts
type MountConfig = {
  // Required ──────────────────────────────────────────────────────────
  rootEl: string | HTMLElement;        // selector or node
  bootGlobal: string;                  // window key, e.g. 'customifyDashboard'
  filterNamespace: string;             // e.g. 'customify' → emits 'customify.dashboard.*'
  brand: {
    name: string;
    icon?: string;                     // SVG markup, optional
    href?: string;                     // optional link wrap around brand
  };

  // Tabs ──────────────────────────────────────────────────────────────
  baseTabs: TabDefinition[];           // initial tab list; can be extended via filter
  baseRoutes: Record<HashRoute, RouteEntry>;

  // Optional ──────────────────────────────────────────────────────────
  __?: (text: string) => string;       // consumer's text-domain-bound translator.
                                       // Recommended; becomes required at P3 when Tier-2
                                       // default-label flow consumes it. P1 ignores.
  tabsAriaLabel?: string;              // aria-label for the <nav> wrapping TabStrip
  helpItems?: HelpItem[];              // links in the header help dropdown
  helpLabels?: {                       // English fallbacks shipped — see §5.10b
    triggerLabel?: string;
    heading?: string;
  };
  helpIcon?: unknown;                  // @wordpress/icons asset for the trigger button
  helpItemIcon?: unknown;              // default per-item icon when item.icon omitted
  versionLabel?: string;               // e.g. 'v1.2.0 — Free'
  versionHref?: string;                // anchor for versionLabel (typically #changelog)
  versionAriaLabel?: string;           // aria-label for the version anchor
  initialRoute?: HashRoute;            // default when hash is empty; defaults to '#welcome'
  notFoundComponent?: ComponentType;   // when route doesn't match
  fallback?: ReactNode;                // rendered inside <main> when no route matches AND
                                       // notFoundComponent is unset (loading splash etc.)
  containerWidth?: 'narrow' | 'wide';  // 'narrow' (default) = 1100px max reading column.
                                       // 'wide' = full viewport, DataViews-friendly.
                                       // Sets `data-container-width` on `.pmdk-dashboard`;
                                       // unrecognised values fall back to 'narrow'.
};

type TabDefinition = {
  id: string;                          // route key without '#'
  label: string;                       // already-translated
  proFeature?: string;                 // when set, render as locked Pro tab with promo
};

type RouteEntry = {
  component: ComponentType<{ params?: Record<string, string> }>;
  type: 'page' | 'list' | 'editor';
  label?: string;                      // already-translated
  parent?: HashRoute;                  // optional breadcrumb parent
};
```

The kit applies `applyFilters('{filterNamespace}.dashboard.tabs', baseTabs)` and `applyFilters('{filterNamespace}.dashboard.routes', baseRoutes)` at mount time, so Pro plugins (or any consumer of the consumer) extend by `addFilter` before mount.

### 5.2 `createFilterNamespace(prefix)`

```ts
function createFilterNamespace(prefix: string): {
  boot: string;                  // 'prefix.dashboard.boot'              — see §9.1
  tabs: string;                  // 'prefix.dashboard.tabs'
  tabsLocked: string;            // 'prefix.dashboard.tabs.locked'       — Pro-promo tab list
                                 //   (Blocksify Free uses this to render locked tabs
                                 //   alongside real tabs when `!boot.proActive`)
  routes: string;                // 'prefix.dashboard.routes'
  welcomeSections: string;       // 'prefix.dashboard.welcome.sections'
  welcomeChecklist: string;      // 'prefix.dashboard.welcome.checklist'
  settingsPanels: string;        // 'prefix.dashboard.settings.panels'
  settingsFieldTypes: string;    // 'prefix.dashboard.settings.field-types'
  changelogSources: string;      // 'prefix.dashboard.changelog.sources'
  versionLabel: string;          // 'prefix.dashboard.version-label'
};
```

Consumers use this for both their own `applyFilters` calls (when extending themselves) and to document the filter names Pro plugins should hook into.

### 5.2b HashRouter public API

The router is exposed as a flat set of named exports rather than a single `HashRouter` namespace — matches the Blocksify Free `dashboard/router.js` shape that consumers (Pro plugins + tab pages) already import from. All exports are stable: locked at 1.0, deprecation cycle for changes.

```ts
// Location primitives
function readHash(fallback?: string): string;          // '#welcome' if hash empty
function navigate(hash: string): void;                 // sets window.location.hash

// Hooks
function useHash(initialRoute?: string): string;       // subscribes to `hashchange`
function useRoute(routes, initialRoute?): {            // resolved entry + params
  route: string;
  entry: unknown;
  params: Record<string, string>;
};
function useNavigate(): (hash: string) => (event: MouseEvent) => void;
//   Curried for the onClick={ onNav('#welcome') } call-site shape.
//   Calls preventDefault() + honors NavigationGuardContext.

// Pure helpers
function matchRoute(hash, routes): {                   // null when no match
  route: string;
  entry: unknown;
  params: Record<string, string>;
} | null;
function activeTabId(route: string): string;           // first path segment

// Navigation guard (P3 dirty-state hook-in point — kit invention)
const NavigationGuardContext: React.Context<() => boolean>;
function NavigationGuardProvider({ guard, children }): JSX.Element;
//   Wrap dashboard tree with a `guard()` predicate. `useNavigate()`
//   consults it; returning `false` cancels the nav. P3's useDirtyState
//   wires the dirty-buffer confirm dialog through this hook without
//   the router needing to know about settings state.

// A11y SPA focus management
function useFocusOnRouteChange(route: string): React.RefObject<HTMLElement>;
//   Attach the ref to `<main tabIndex={-1}>` so screen readers get a
//   landmark announcement on route transitions. No-op on initial mount.

// Boot accessor
function readBoot(bootGlobal: string): Record<string, unknown>;
function BootProvider({ boot, children }): JSX.Element;
function useBoot(): Record<string, unknown>;
const BootContext: React.Context<Record<string, unknown>>;
```

Route-pattern syntax: `'#tab'` for static, `'#tab/:id'` for one param, multi-segment params allowed (`'#editor/:cpt/:id'`). Static segments win over params when both match.

### 5.3 Layout components

```jsx
<ListPageHeader title={string} description={string?} actions={ReactNode?} />
<EditorPageHeader backHref={string} title={string} status={ReactNode?} actions={ReactNode?} />
<EditorViewLayout subNav={ReactNode} main={ReactNode} rail={ReactNode?} />
<PageWrapper>{children}</PageWrapper>

<SubNav
  items={Array<{ id: string, label: string, hash: string }>}
  activeId={string}
  ariaLabel={string}
  onSelect={({ id, hash }) => void?}   // optional — defaults to navigate(hash)
/>
```

All layout components require text via props. None translate internally.

**`<SubNav>` background**: extracted from Blocksify Free's Settings P7.5 + Changelog P6 (both used the same DOM/CSS via shared class `bsy-dashboard-settings__subnav` before kit extraction). Kit renames to neutral `pmdk-subnav-*` classes. Two known consumer patterns:
- **Settings-style** (intra-tab panel switch): consumer passes panel IDs as items, `onSelect` calls `navigate('#settings/:panelId')`. SubNav clicks bypass `confirmDiscardAny()` per the intra-tab nav rule.
- **Multi-source style** (changelog with Pro plugin sources): consumer passes source IDs as items, `onSelect` calls `navigate('#changelog/:sourceId')`. Default rendering rule: hide `<SubNav>` when `items.length < 2` — let single-source layouts degrade to plain content with no rail.

### 5.3b Display components (tab-content building blocks)

Small Tier-2 components consumers compose into custom tab pages. Extracted from Blocksify Free's Compare + Changelog tabs.

```jsx
<CompareTable
  sections={Array<CompareSection>}
  footer={{ title, description, ctaLabel, ctaHref }?}
  labels={{
    headFeature?: string,   // English fallback 'Feature'
    headFree?: string,      // English fallback 'Free'
    headPro?: string,       // English fallback 'Pro'
    cellYes?: string,       // aria-label, English fallback 'Included'
    cellNo?: string,        // aria-label, English fallback 'Not included'
  }}
/>

<ReleaseBlock
  release={{ version, date?, current?, items: [{ category?, text }] }}
  labels={{ currentBadge?: string }}            // English fallback 'Current'
  categoryLabels={Record<string, string>?}      // category → label (overrides
                                                //  kit's English fallback table)
  categoryToneOverrides={Record<string,         // category → tone modifier
    'new' | 'improved' | 'fixed' | 'updated'
    | 'removed' | 'security' | 'deprecated'
    | 'neutral'>?}
/>

<CategoryBadge
  category={string}
  labels={Record<string, string>?}              // category → label override
  toneOverrides={Record<string,
    'new' | 'improved' | 'fixed' | 'updated'
    | 'removed' | 'security' | 'deprecated'
    | 'neutral'>?}
/>
```

`<CategoryBadge>` ships a default category → tone mapping (`added/new → 'new'`, `fixed/fix → 'fixed'`, `security → 'security'`, `removed → 'removed'`, etc.). CSS owns the palette via the tone modifier classes (`pmdk-category-badge--new`, `--fixed`, etc. — note the BEM modifier syntax, not chained `.tone-*` classes). Consumer overrides individual mappings via `toneOverrides` for custom categories.

`<CompareTable>` cell dispatch on `row.free` / `row.pro` shape: `true` → green check badge; `false` / `null` / `undefined` → gray em-dash badge; `string` → literal text; `{ value, muted? }` → muted-variant text. Mixed-content rows (e.g. `free: true` + `pro: 'Up to 50/site'`) work without consumer cell rendering.

### 5.3c Composition pattern — multi-source / multi-panel dispatch

A pattern that emerged twice in Blocksify Free P6 + P7.5 (Changelog sources + Settings panels). When a tab's content has 2+ peer "sections" each addressed by a sub-route (`#tab/:id`), the recipe is:

```js
// 1. Pull peer list from a filter so Pro / other consumers can register more
const sources = useMemo(
  () => applyFilters( filterNamespace.changelogSources, BASE_SOURCES ),
  []
);

// 2. Resolve active section from route param, redirect bare hash to first
const activeId = params?.id ?? sources[0]?.id;
useEffect(() => {
  if (!params?.id && sources.length) navigate(`#${tabSlug}/${sources[0].id}`);
}, [params, sources, tabSlug]);

// 3. Dispatch on count: single → plain content; multi → SubNav + active content
if (sources.length < 2) {
  return <ActiveContent source={sources[0]} />;
}
return (
  <div className="pmdk-multi-source-layout">
    <SubNav
      items={sources.map(s => ({ id: s.id, label: s.label, hash: `#${tabSlug}/${s.id}` }))}
      activeId={activeId}
      ariaLabel={ariaLabel}
    />
    <Card><ActiveContent source={sources.find(s => s.id === activeId)} /></Card>
  </div>
);
```

Not a kit component — too consumer-specific in shape. Documented here as a **recipe** consumers copy into their own tab pages when they need filter-extensible panels.

### 5.4 Settings building blocks

```jsx
<SchemaForm
  panel={SchemaPanel}                       // single active panel; consumer
                                            //  resolves "active" via routing
  values={Record<string, unknown>}          // store.getSettings() — merged
  onFieldChange={(panelId, fieldId, value) => void}
  fieldTypes={Record<string, ComponentType>} // BASE_FIELD_TYPES + consumer's
                                            //  applyFilters extensions
/>

<SchemaField
  field={SchemaField}
  value={unknown}
  onChange={(next: unknown) => void}
  fieldTypes={Record<string, ComponentType>}
/>

<SaveBar
  isDirty={boolean}
  isSaving={boolean}
  onSave={() => Promise<void>}
  onReset={() => Promise<void>}
  labels={{                                 // SPEC §5.10b — English fallbacks
    regionLabel?: string,                   //  shipped, consumer overrides
    saveLabel?: string,
    savingLabel?: string,
    resetLabel?: string,
    statusSaved?: string,
    statusDirty?: string,
    statusSaving?: string,
  }}
/>
// Chrome tiers (KIT-P4 unification): this is the kit's ONE save bar. The
// markup carries the locked `.pmdk-save-bar`/`__status` classes (WP-native
// default chrome from core style.css) AND the primitives chrome class
// `.pmdk-save-actions` on the action cluster. Consumers importing
// `@pressmaximum/dashboard-kit/primitives/style.css` get the DS sticky
// chrome applied to this same component — no second save bar, no fork.
// See §16.5 "Save bar".

createSettingsStore({
  storeName: string,                        // e.g. 'customify/settings'
  endpoint: string,                         // REST path, e.g. '/customify/v1/settings'
  fetch: ({ path, method?, data? }) => Promise<unknown>,
                                            //  consumer-owned REST client
                                            //  (SPEC §3.3 forbids kit from
                                            //  importing @wordpress/api-fetch)
  seedSaved?: Record<string, unknown>,      // optional initial 'saved' value
                                            //  so first-mount renders synchronous
                                            //  when boot.settings is populated
}): { STORE_NAME: string, store: wpDataStoreDescriptor }

useDirtyState(key: string, options?: {
  onDiscard?: () => void,                   // typically wired to store.clearDirty
  discardMessage?: string,                  // consumer-translated; English fallback
}): { isDirty, setDirty, confirmDiscard }

// Module-level helpers for the cross-tab navigation guard.
// `mountDashboard` wires `confirmDiscardAny` as the default
// NavigationGuard so tab-strip clicks honor unsaved edits without
// consumer wiring.
function isAnyDirty(): boolean;
function confirmDiscardAny(): boolean;

// Kit's built-in field-type registry. Consumer applies their own
// {ns}.dashboard.settings.field-types filter on top before passing to
// <SchemaForm fieldTypes={...}> — keeps the kit unaware of any
// specific filter namespace.
export const BASE_FIELD_TYPES: Record<'boolean'|'select'|'radio'|'text'|'number', ComponentType>;
```

Schema-panel shape:

```ts
type SchemaPanel = {
  id: string;
  label: string;                 // already translated
  description?: string;          // already translated
  fields?: SchemaField[];        // mutually exclusive with `component`
  component?: ComponentType<{    // Pro full-panel takeover
    panel: SchemaPanel;
    values: Record<string, unknown>;
    onFieldChange: (panelId: string, fieldId: string, value: unknown) => void;
  }>;
};

type SchemaField = {
  id: string;
  label: string;                 // already translated
  description?: string;          // already translated
  type: 'boolean' | 'select' | 'radio' | 'text' | 'number' | string;
  options?: { value: string; label: string }[];
  min?: number; max?: number; step?: number;
  pattern?: string; maxLength?: number;
};
```

### 5.5 Welcome building blocks

```jsx
<Hero
  greeting={string}              // already-translated, e.g. 'Welcome, Jack'
  tagline={string?}
  primaryCta={{ label: string, href: string }?}
  illustration={ReactNode?}      // brand SVG / image
/>

<Checklist
  items={ChecklistItem[]}
  ariaLabel={string?}                          // already-translated
  itemLabels={{                                // forwarded to each ChecklistItem
    checking?: string,                         // English fallback 'Checking…'
    completed?: string,                        // English fallback 'Completed' (sr-only)
    pending?: string,                          // English fallback 'Pending'   (sr-only)
  }?}
/>

<ChecklistItem item={ChecklistItem} labels={...same as Checklist.itemLabels} />

createOnboardingStore({
  storeName: string,                           // wp.data store key
  endpoint: string,                            // REST path. GET returns
                                               //  { completed: string[], dismissed: bool };
                                               //  PATCH accepts a partial body of the same shape.
  fetch: ({ path, method?, data? }) => Promise<unknown>,
                                               //  consumer-owned REST client
                                               //  (SPEC §3.3 forbids kit from
                                               //  importing @wordpress/api-fetch)
}): { STORE_NAME: string, store: wpDataStoreDescriptor }
```

ChecklistItem shape:

```ts
type ChecklistItem = {
  id: string;
  label: string;                                // already-translated
  description?: string;                         // already-translated
  check?: () => boolean | Promise<boolean>;     // auto-detect (e.g. has-pages)
  manualCompleted?: boolean;                    // from consumer's onboarding store
  ctaLabel?: string;                            // already-translated
  ctaHref?: string;                             // '#tab' (SPA-navigates) or
                                                //  external URL (plain anchor)
  icon?: ComponentType;
};
```

The `manualCompleted` prop is the kit's hook into the consumer's
onboarding store — keeps the kit unaware of which store name the
consumer registered. **Completion resolution (contract, honored since
KIT-P4): an item renders complete when `manualCompleted` is true OR the
auto-detect `check()` passes.** The session cache holds only the
`check()` answer, so store flips reflect instantly in both directions,
and a completed item shows the check mark (not the spinner) while a
background re-check runs. Typical wiring:

```js
const completedIds = useSelect((s) => s(ONBOARDING_STORE).getCompleted());
const items = baseItems.map((i) => ({
    ...i,
    manualCompleted: completedIds.includes(i.id),
}));
<Checklist items={items} ariaLabel={...} />
```

`createOnboardingStore` action surface: `load()`, `complete(taskId)`,
`uncomplete(taskId)`, `dismiss(flag)`. Selectors: `isCompleted(id)`,
`isDismissed()`, `getCompleted()`, `isLoading()`, `isLoaded()`,
`getError()`. All mutators are optimistic — UI updates before the PATCH
resolves; failures roll back to the prior value.

### 5.6 Datasets (`@pressmaximum/dashboard-kit/datasets`)

```jsx
<EntityListPage
  // Data ──────────────────────────────────────────────────────────────
  items={Array<Record<string, unknown>>}   // already-loaded records
  isLoading={boolean}
  fields={FieldDefinition[]}                // DataViews field config
  paginationInfo={PaginationInfo}           // from filterSortAndPaginate

  // View ──────────────────────────────────────────────────────────────
  view={ViewConfig}
  onChangeView={(next: ViewConfig) => void}
  defaultLayouts={{ grid?: object, table?: object, list?: object }}

  // Actions ───────────────────────────────────────────────────────────
  actions={ActionDefinition[]}
  getItemId={(item) => string}

  // Header ────────────────────────────────────────────────────────────
  title={string}
  description={string?}
  primaryAction={{ label, href }?}

  // i18n strings ──────────────────────────────────────────────────────
  labels={{
    loading: string,
    noResults: string,
    // ... full list documented; English fallbacks shipped
  }}
/>

<EntityPreviewFrame
  src={string}                              // full URL the iframe loads.
                                            //   When empty AND `previewDoc` is
                                            //   empty, the empty placeholder
                                            //   renders instead.
  previewDoc?={string}                      // full HTML doc string. When set,
                                            //   the iframe loads a `blob:` URL
                                            //   built from this doc. Wins over
                                            //   `src` when both are provided.
                                            //   Revoked on prop change + unmount.
  title={string}                            // iframe accessible title
  viewportWidth?={number}                   // desktop viewport, default 1200
  viewportHeight?={number}                  // iframe height in px, default 900.
                                            //   Ignored when aspectMode='content'
                                            //   (measurement drives height).
  aspectMode?={'fixed' | 'content'}         // 'fixed' (default): wrapper holds
                                            //   4:3 + uses `viewportHeight`.
                                            //   'content': measure same-origin
                                            //   doc + size the iframe to it.
  itemId?={string | number}                 // forwarded as the first arg of
                                            //   `onContentHeight`. Required when
                                            //   the parent does state-lift on
                                            //   several frames at once.
  onContentHeight?={(itemId, heightPx) => void}
                                            // fires on every successful measure
                                            //   in content mode (initial load +
                                            //   each ResizeObserver tick). Not
                                            //   deduped — parent skips identical
                                            //   values itself.
  emptyLabel?={string}                      // shown when src + previewDoc empty;
                                            //   English fallback `'No preview'`
  className?={string}
/>

ViewPersistence.create({
  storageKey: string,                       // localStorage key
  defaultView: ViewConfig,
}): {
  load(): ViewConfig,
  save(view: ViewConfig): void,
}

filterTrashByDefault(items, view): Array
```

`<EntityListPage>` always wraps its content in `<PageWrapper>` so DataViews's `useResizeObserver` sees a real `containerWidth` (SPEC §11 hack #3 — proper fix shipped in P2, validated end-to-end in P6).

`<EntityListPage>` does NOT import `@wordpress/dataviews`'s CSS. The kit relies on the consumer's `wp-scripts` build pipeline to detect the externalized `@wordpress/dataviews` JS import + auto-register the `wp-dataviews` script-and-style handle via `DependencyExtractionWebpackPlugin`. WordPress core ≥6.5 enqueues the matching stylesheet automatically. The spike's `dataviews-vendor.css` (74 KB) is therefore NOT ported — this is how SPEC §11 hack #2 actually closes.

The `className` prop on both components is appended to the locked-class wrapper, never replaces it.

`<EntityPreviewFrame>`'s `previewDoc` prop (added 0.0.1-dev) is the blob-URL path: pass the full HTML and the kit builds the `blob:` URL client-side. Preferred over `src` when the consumer already has the doc in memory (avoids an HTTP round-trip + works inside admin-only contexts where the preview URL would need its own REST authentication). Cleaned up on prop change and on unmount via `URL.revokeObjectURL`. Precedence: when both `src` and `previewDoc` are set, `previewDoc` wins. The string is rendered as-is — any inline styles or CSS vars the preview needs (e.g. `--wp--style--global--content-size` for constrained-layout-aware previews) must be embedded by the consumer before passing the doc in.

`<EntityPreviewFrame>`'s `aspectMode` prop (added 0.0.1-dev) selects between the default uniform 4:3 cell sizing (`'fixed'`) and content-aware sizing (`'content'`). Content mode measures `body.firstElementChild.getBoundingClientRect()` plus body `padding-top`/`padding-bottom` from `getComputedStyle`, applies the result as an inline `height` on the iframe element, and fires `onContentHeight(itemId, heightPx)`. A `ResizeObserver` re-measures whenever the first child resizes (fonts loading late, images decoding). Requires same-origin content (a blob URL or a same-origin `src`) so the kit can read `contentDocument`.

**Pitfall — never read `body.scrollHeight` for iframe content measurement (drift finding 6.5).** Once the iframe element has an explicit `style.height`, the body inherits the viewport via html's `height: 100%` chain, and `body.scrollHeight` returns the iframe element's own height instead of the real content height. Always measure `body.firstElementChild.getBoundingClientRect()` (plus body padding) for the true content size. The kit's content-mode measurement uses this path; consumers extending or copying the pattern should follow it.

### 5.7 Editor helpers

JS-side helpers ship behind the `/editor-helpers` sub-entry (the same
tree-shake pattern as `/datasets`) so dashboard-only consumers never
bundle them. Each helper is an idempotent runtime function — call it
once from the consumer's editor-script entry; it returns an
unsubscribe function for symmetric teardown.

```ts
import {
  rewireBackButton,
  forceFullscreenMode,
  registerSubmenuActive,
} from '@pressmaximum/dashboard-kit/editor-helpers';

// Intercept clicks on the fullscreen-close button + redirect to a
// dashboard tab. Capture-phase + preventDefault — React keeps the
// `href` attribute pinned across renders so attribute rewires lose
// the race.
function rewireBackButton(config: {
  selector?: string;          // default '.edit-post-fullscreen-mode-close'
  href: string;               // destination URL (required)
}): (() => void) | null;

// Flip the editor into fullscreen via core/preferences. Defers via
// wp.data.subscribe until the store registers, so calling at the top
// of the consumer's editor entry is safe.
function forceFullscreenMode(): (() => void) | null;

// Toggle WP submenu `.current` based on the dashboard's hash route.
// Returns null when the DOM is absent or no item matches `hash`.
function registerSubmenuActive(config: {
  menuId: string;             // e.g. 'toplevel_page_customify'
  hash: string;               // e.g. '#templates'
}): (() => void) | null;
```

Typical consumer wiring (Pattern A CPT editor flow):

```js
// consumer-plugin/src/editor.js — enqueued via enqueue_block_editor_assets
import {
  rewireBackButton,
  forceFullscreenMode,
} from '@pressmaximum/dashboard-kit/editor-helpers';

forceFullscreenMode();
rewireBackButton( {
  href: window.customifyEditorBoot.backUrl, // PHP-localized
} );
```

```php
// PHP wrapper (lands in P7 — Admin\EditorIntegration class). Until
// then consumers wire their own enqueue_block_editor_assets handler
// that bundles the JS above.
use PressMaximum\DashboardKit\Admin\EditorIntegration;

EditorIntegration::forceFullscreenMode([
    'post_type' => 'customify_template',
]);

EditorIntegration::rewireBackButton([
    'post_type' => 'customify_template',
    'back_url'  => admin_url('admin.php?page=customify#templates'),
]);
```

SSR safety: all three helpers short-circuit when `typeof document === 'undefined'` (or `typeof window === 'undefined'` for `forceFullscreenMode`) so the kit can be imported in non-browser contexts without crashing.

### 5.8 PHP — preview endpoint registrar

```php
use PressMaximum\DashboardKit\REST\PreviewEndpointRegistrar;

PreviewEndpointRegistrar::register([
    'post_type'   => 'blocksify_surface',
    'query_var'   => 'blocksify_surface_preview',     // ?{query_var}={id}
    'capability'  => 'edit_posts',
    'shell_css'   => 'body { padding: 24px; }',       // optional extra inline styles
    'body_class'  => 'blocksify-surface-preview',     // optional extra body class
    'hide_admin_bar'   => true,
    'noindex'    => true,
]);
```

Wraps the `template_redirect` interceptor pattern from the spike into a reusable helper. Every plugin's `wp_head()` enqueue chain still fires inside the iframe — kit just provides the URL contract + shell HTML scaffold.

### 5.9 PHP — submenu helpers

```php
use PressMaximum\DashboardKit\Admin\MenuHelpers;

MenuHelpers::addHashSubmenu([
    'parent_slug' => 'customify',
    'label'       => __('Templates', 'customify'),
    'menu_label'  => __('Templates', 'customify'),
    'capability'  => 'manage_options',
    'hash'        => '#templates',
]);

MenuHelpers::relabelParentMirror([
    'parent_slug'  => 'customify',
    'replacement'  => __('Welcome', 'customify'),
]);

MenuHelpers::printSubmenuActiveSync([
    'menu_id' => 'toplevel_page_customify',
]);  // prints the inline <script> that toggles .current on hashchange
```

### 5.10b Complete i18n string reference

> Every translatable string the kit exposes — consumer must provide via props/labels for full localization. English fallbacks shipped as component defaults so consumers can ship without all translations and incrementally fill in.

**`mountDashboard` config**

| Path | Purpose | English fallback |
|---|---|---|
| `__` (required) | Translator function bound to consumer text domain | none |
| (consumer-provided baseTabs labels) | Tab strip labels | — |

**`<SaveBar>` props**

| Prop | English fallback |
|---|---|
| `saveLabel` | `Save changes` |
| `resetLabel` | `Reset to defaults` |
| `discardLabel` | `You have unsaved changes. Discard them?` |
| `savingLabel` | `Saving…` |
| `savedLabel` | `Saved.` |
| `saveErrorLabel` | `Could not save settings.` |
| `resetConfirmLabel` | `Reset all settings to defaults? This cannot be undone.` |

**`<SchemaForm>` props**

| Prop | English fallback |
|---|---|
| `loadingLabel` | `Loading…` |
| `errorLabel` | `Could not load settings.` |
| (panel/field labels) | consumer-provided via schema |

**`<EntityListPage>` `labels` object**

The kit only owns the two strings that decorate the page-level loading / empty states. All toolbar / pagination / density / sort / bulk-action strings come from `@wordpress/dataviews` itself (which handles its own i18n via WP's text domain `default`); the kit does NOT proxy them. This decision (made during P6 implementation per §5.13's slot-pattern audit) keeps the labels surface at 2 instead of ~22 — the rest never had to be threaded through.

| Key | English fallback |
|---|---|
| `loading` | `Loading items…` |
| `noResults` | `No items match your filters.` |

Consumers wanting to override DataViews's own strings should configure their own `@wordpress/i18n` text-domain `default` translation per the WP convention.

**`<EntityPreviewFrame>` props**

| Prop | English fallback |
|---|---|
| `emptyLabel` | `No preview` |

**`<Hero>` props** — all required from consumer, no defaults

**`<Checklist>` / `<ChecklistItem>` props**

| Prop | English fallback |
|---|---|
| `ariaLabel` (Checklist) | `Onboarding checklist` |
| `statusCompletedLabel` (ChecklistItem) | `Completed` |
| `statusPendingLabel` (ChecklistItem) | `Pending` |
| (item label / description / ctaLabel) | consumer-provided per item |

**`<CompareTable>` props**

| Prop | English fallback |
|---|---|
| `headColumnFree` | `Free` |
| `headColumnPro` | `Pro` |
| `cellYesLabel` (sr-only) | `Included` |
| `cellNoLabel` (sr-only) | `Not included` |

**`<ReleaseBlock>` props**

| Prop | English fallback |
|---|---|
| `currentBadge` | `Current` |
| `dateFormat` (Intl options) | `{ dateStyle: 'medium' }` |

**`<HelpPanel>` `labels` props**

| Key | English fallback |
|---|---|
| `triggerLabel` (aria) | `Open help panel` |
| `heading` | `Help` |
| (item labels) | consumer-provided per item |

**Total**: ~50 strings across the full kit. Lightweight consumers using only `mountDashboard` + `<Hero>` + `<SchemaForm>` + `<SaveBar>` need to translate ~12 strings.

Documentation ships a copy-paste template:

```js
// _kit-strings.js (consumer maintains)
import { __ } from '@wordpress/i18n';

export const KIT_LABELS = {
  saveBar: {
    saveLabel: __('Save changes', 'customify'),
    resetLabel: __('Reset to defaults', 'customify'),
    // ... full list
  },
  entityList: { /* ... */ },
  // etc.
};
```

Spread into components:

```jsx
<SaveBar {...KIT_LABELS.saveBar} isDirty={...} onSave={...} />
```

### 5.10 PHP — settings controller base

```php
use PressMaximum\DashboardKit\REST\SettingsControllerBase;

class Customify_Settings_Controller extends SettingsControllerBase {
    protected function namespace(): string { return 'customify/v1'; }
    protected function rest_base(): string { return 'settings'; }
    protected function capability(): string { return 'manage_options'; }
    protected function schema_provider(): callable { return [Customify_Settings_Schema::class, 'shape']; }
    protected function defaults_provider(): callable { return [Customify_Settings_Schema::class, 'defaults']; }
    protected function option_name(): string { return 'customify_settings'; }
}

add_action('rest_api_init', fn() => (new Customify_Settings_Controller())->register_routes());
```

Kit class handles: GET (merge saved over defaults), POST (sanitize against schema + save + return final), `{}` POST (reset to defaults). Consumer provides schema + option name + capability.

**Partial-body semantics (fixed KIT-P4):** a NON-empty POST body is deep-merged
over the currently-persisted shape before sanitizing, so fields the request
doesn't mention keep their saved values — a partial POST (WP-CLI script, a Pro
panel saving only its own section) no longer silently resets sibling fields to
defaults. The empty-body (`{}`) reset contract is unchanged. For direct
callers, `SchemaBuilder::sanitize( $incoming, $current = null )` accepts the
optional currently-saved shape as the absent-key fallback (before defaults);
omitting `$current` keeps the legacy absent-means-default behavior that the
explicit reset path relies on.

**Request/response shapes** (kit's contract — consumer's overrides must match):

```
GET /{namespace}/{rest_base}
  → 200 { /* merged saved-over-defaults shape */ }
  → 401 { code, message, data: { status: 401 } } if user lacks capability

POST /{namespace}/{rest_base}
  body: full or partial settings object
  → 200 { /* final sanitized shape, server-authoritative */ }
  → 400 { code, message, data: { status: 400, field?: 'group.key' } } on validation fail
  → 401 capability fail

POST /{namespace}/{rest_base} with body {}
  → 200 { /* defaults shape, all fields reset */ }
```

Error envelope follows WordPress's standard `WP_Error` → REST auto-serialization. Codes prefixed `{namespace}_` (e.g. `customify_invalid_field`).

### 5.11 Error handling contract

Kit emits errors at well-defined boundaries; consumers decide how to surface.

| Source | Error shape | Where surfaced |
|---|---|---|
| `createSettingsStore.save()` | Promise reject with `WP_Error`-shaped object: `{ code, message, data: { status, field? } }` | Consumer catches in `onSave` callback, dispatches `createNotice('error', err.message)` |
| `createSettingsStore.load()` | Stored in store's `error` selector | Consumer reads via `select(store).getError()`, shows via Notice OR `<Notice status="error">` |
| `createSettingsStore.reset()` | Same as save() | Same as save() |
| `createOnboardingStore.*` | Same pattern | Same — error stored in store, consumer reads |
| `EntityListPage` action callbacks | Async callback may reject; kit logs `console.error` and re-throws | Consumer wraps in try/catch within action callback |
| `EntityPreviewFrame` iframe load fail | Native iframe `onerror` event (rare) | Consumer optionally passes `onError` prop |
| `mountDashboard` invalid config | Throws synchronously at mount time | Caught by host page error boundary OR uncaught — visible in console |
| Filter callback exception | `@wordpress/hooks` swallows + logs; kit doesn't intercept | WP convention; consumer's filter callback should not throw |

**Kit NEVER**:
- Calls `createNotice` directly. Consumer owns notice display (their text domain).
- Renders error UI inline (no built-in `<ErrorBoundary>`). Consumer wraps with own boundary if desired.
- Logs to telemetry. Consumer instruments if needed.

**Kit ALWAYS**:
- Surfaces async errors as Promise rejects so consumer can `try/await`.
- Uses `console.error` for unexpected internal errors (developer-facing only — English OK).
- Provides `error` selector on stores so consumer can render last-error state.

Example consumer error handling:

```jsx
async function handleSave() {
  try {
    await save();
    createNotice('success', __('Settings saved.', 'customify'), { type: 'snackbar' });
  } catch (err) {
    createNotice(
      'error',
      err.message || __('Could not save settings.', 'customify'),
      { type: 'snackbar' }
    );
  }
}
```

### 5.12 Primitives + data table (added 0.2, KIT-P3 slices 1–2)

Two new opt-in sub-entries carry the DS component layer extracted from the
Aponto plugin-dashboard mockup. Both are separate from core — consumers that
never import them (Blocksify, Customify) ship zero extra bytes and see zero
look-change.

```js
import { createCombobox, buildComboboxMarkup } from '@pressmaximum/dashboard-kit/primitives';
import { PMDKDataTable, defaultRenderIcon, normalizeColumnOrder,
         useTablePersistence, readTablePrefs, writeTablePrefs } from '@pressmaximum/dashboard-kit/table';
import '@pressmaximum/dashboard-kit/primitives/style.css'; // chrome for both
```

- `primitives` — framework-agnostic headless behaviors (no React). Slice 1
  ships the combobox; tablist / resizer / preferences land in later slices.
- `table` — React. Bundles `@tanstack/react-table` + `@dnd-kit/*` (≈37 kB gzip
  total entry); `react`, `react-dom`, `@wordpress/*` stay external. Q13
  decision: shipping the wiring once beats copy-per-product.
- `primitives/style.css` — the `.pmdk-*` chrome for slices 1–2, scoped under
  `.pmdk-dashboard` (§16.5). Requires the §16.1 browser floor
  (`color-mix()`, `:has()`, container queries).

#### `createCombobox( root, options? )` → controller

Attaches searchable-relationship-picker behavior (ARIA 1.2 combobox) to
existing `.pmdk-combobox` markup. `options.onChange(value, optionEl)` fires on
committed changes; `options.filter(optionEl, query)` overrides matching.
Controller: `open()`, `close(restoreSelection=true)`, `setOptions(values,
selected)` (dependent-field repopulate), `getValue()`, `refresh()`,
`destroy()`. Behavior contract (DESIGN-SYSTEM "Fields"): opens on
focus/click/typing, roving `aria-activedescendant` (ArrowUp/Down/Home/End),
Enter selects, Escape/outside-click dismisses and restores the last valid
selection, typed exact match (case-insensitive) commits on dismiss.

`buildComboboxMarkup({ name, label, options, selected?, listId?, idleIcon?,
activeIcon? })` returns the escaped ARIA scaffold string so consumers don't
hand-write it.

#### `createMenu( root, options? )` → controller (slice 3, G4)

The shared menu/popover behavior the BookingsTable patterns implement
per-component, shipped once: trigger toggle + `aria-expanded`, keyboard-open
(detail 0) focuses the first enabled item, ArrowUp/Down/Home/End roving over
`[role=menuitem]`/`[role=menuitemradio]`, Escape closes with focus returned to
the trigger, outside-pointerdown dismisses, item activation calls
`options.onSelect(item, event)` then closes (keyboard activation returns
focus). DOM contract: root contains `[data-menu-trigger]` + a `[role="menu"]`
(or `[data-menu-popover]`) element. `options.position`: `'anchored'` (default)
toggles `.opens-up` on the root when space below is short; `'fixed'` ports the
floating row-action mode (viewport-clamped `left/top`, `.is-floating`,
scroll/resize tracking, RTL-aware). Controller: `open() / close({returnFocus})
/ toggle() / isOpen() / destroy()`.

#### `createInspectorResizer( workspace, options? )` → controller (slice 3)

The in-flow inspector separator: pointer drag; ArrowLeft/ArrowRight in 16px
steps; Home = default width; End = max; `aria-valuemin/-valuemax/-valuenow`;
`is-resizing` on the workspace while dragging. Width renders to
`--pmdk-inflow-inspector-width` on the workspace and persists under
`dashboard-kit.inspector-width.v1` (options: `storageKey` — `''` disables,
`cssVar`, `minWidth` 320 / `maxWidth` 520 / `mainMinWidth` 360 /
`defaultWidth` 360 / `step` 16, `onWidthChange`). A narrow viewport clamps
only the RENDERED width — the stored preference survives (DESIGN-SYSTEM).
Controller: `setWidth(value, persist?) / getWidth() / refresh() / destroy()`.

#### `createTablist( root, options? )` → controller (slice 4)

Source-parity tablist for `.pmdk-section-tabs`: click activates;
ArrowLeft/ArrowRight rove with wrap-around; Home/End jump; activation follows
focus; `aria-selected` synced; `options.onChange(tab, index)`. Panel swapping
stays consumer-side (headless). Controller: `activate(tab, moveFocus?) /
getActive() / destroy()`.

#### `<PMDKModuleCard>` (K-018 — `@pressmaximum/dashboard-kit/module-card`)

The shared module/integration card, promoted on PressListing's request (the
second product instantiating the Aponto anatomy). Own React sub-entry so
`./primitives` stays React-free; zero third-party deps; chrome from
`primitives/style.css` (module-card.css). The PMDKDataTable split applies:
kit ships behavior + chrome + slots, product keeps data + copy.

| Prop | Type / default | Contract |
|---|---|---|
| `title` | `node` (required) | Card title (`headingLevel` = `2` picks h2/h3/h4) |
| `icon` | `node` | Icon slot (product glyph, 30px box) |
| `meta` | `node` | Meta line — product copy, e.g. `"{Category} · {Module\|Integration}"` |
| `description` | `node` | One-sentence description |
| `tier` | `{ label: node, isPremium?: bool }` | TIER badge — kit chrome (`.pmdk-module-license`), product label. Entitlement signal, visually distinct from runtime status |
| `badges` | `node` | Extra badge slot (phase etc. — compose `.pmdk-module-phase`) |
| `state` | `'enabled'│'disabled'│'planned'` = `'disabled'` | Stamped `is-enabled` / `is-disabled` / `is-planned` |
| `integrationState` / `connected` | `node` / `bool` | Optional integration-state line (`.pmdk-module-connection`, `is-connected` tint) |
| `action` | `node` | Footer action slot (Configure / deep link / View roadmap) |
| `plannedLabel` | `node` | Static footer label for `planned` — which renders NO toggle |
| `onToggle` | `(next: bool) => void` | The toggle is the canonical activation control; controlled by `state` |
| `toggleDisabled` | `bool` = `false` | Gated module: toggle stays disabled (pair with an upgrade `action`) |
| `labels` | `{ toggleOn, toggleOff, toggleAria(title, enabled) }` | i18n overrides (English defaults per §5.13 Tier-2 rules) |
| `className` | `string` | Extra classes on the `<article>` |

A11y: the kit renders no card-level click handler (never make the whole card
clickable); every toggle carries an accessible name.

**Recipe — the Modules page around the card (product-side).** The grid,
category tabs and counts strip are deliberately NOT part of the component:

```jsx
<div className="pmdk-mini-stats">…counts…</div>            // counts strip
<div className="pmdk-section-tabs" ref={ tabsEl }>…</div>  // + createTablist
<div className="pmdk-module-grid">
  { modules.map( ( m ) => <PMDKModuleCard key={ m.id } … /> ) }
</div>
```

The `ModuleCard/ModulesPage` story is the working reference (registry data,
category filtering via `createTablist`, lock/planned/integration states).

#### `<PMDKDataTable>` props

The Q13 split: **kit ships** sorting, search + filter wiring, pagination
(client/server), selection + bulk-bar shell, column visibility + drag order,
toolbar slots, five states, query callbacks, view persistence. **Product
keeps** column defs, cell renderers, data layer, row actions, facet data,
bulk-action buttons/confirm.

| Prop | Type / default | Contract |
|---|---|---|
| `columns` | `ColumnDef[]` (required) | TanStack v8 defs — product-owned, cell renderers included. `meta.label` names the column manager row; `meta.numeric` right-aligns (`.pmdk-amount`); `meta.filterOnly` hides from manager; `enableHiding:false` ⇒ "Required"; id `action` (or `meta.sticky:'end'`) pins last + sticky |
| `data` | `Object[]` (required) | Current rows (server mode: just the page) |
| `getRowId` | `(row) => string` | Stable row ids for selection |
| `status` | `'ready'│'loading'│'empty'│'error'│'permission'` = `'ready'` | Five production states. Loading keeps toolbar + skeletons; empty/permission hide the toolbar; error keeps it (safe query context). Ready with zero rows renders the inline no-results block |
| `states` | `{ empty?, error?, permission? }` | Per-state `{ icon?, title?, description?, action? }` — product copy/CTAs |
| `enableRowSelection` | `bool` = `true` | Kit injects the `select` checkbox column |
| `bulkActions` | `({ selectedRows, clearSelection }) => node` | Product renders its own buttons + confirm inside the kit bulk bar (alternate thead row with count + clear) |
| `getRowSelectionLabel` | `(row) => string` | a11y label per row checkbox |
| `enableSearch` | `bool` = `true` | Global-filter search input |
| `globalFilterFn` / `getColumnCanGlobalFilter` | TanStack fns | Product search semantics |
| `toolbarControls` | `node │ ({ table }) => node` | Slot next to search (date control etc.) |
| `filterBuilder` | `({ table, close }) => node` | Collapsible builder region; kit owns the toggle button, aria wiring + Escape |
| `activeFilters` | `node │ ({ table }) => node` | Chips row shown when builder is closed |
| `filterCount` | `number │ ({ table }) => number` = `0` | Badge on the filter toggle |
| `initialColumnFilters` | `ColumnFiltersState` = `[]` | Initial column filters (uncontrolled mode) |
| `columnFilters` / `onColumnFiltersChange` | `ColumnFiltersState` / `(next) => void` | CONTROLLED filtering: pass both and the product state is the source of truth — external entry points ("show pending" from a dashboard card) just set that state. Omit `columnFilters` for the uncontrolled fallback |
| `filtersOpen` / `onFiltersOpenChange` | `bool` / `(next) => void` | Controlled filter-builder visibility (same pattern; omit `filtersOpen` for uncontrolled) |
| `onRowSelectionChange` | `(rowSelection) => void` | Reports every selection change — user checks AND kit-side clears (the bulk-bar ✕) — so transient product UI (confirm steps) can reset |
| `primaryAction` | `node` | Toolbar-end slot (e.g. "New record") |
| `menuItems` | `{ id, label, icon?, hint?, onSelect }[]` | Product rows in the overflow menu, below the built-in Columns manager |
| `enableColumnManager` | `bool` = `true` | Columns submenu: visibility toggles + dnd-kit drag order + Reset |
| `defaultSorting` / `defaultColumnVisibility` / `defaultColumnOrder` | TanStack shapes | View defaults (order auto-pins `select` first, end column last) |
| `pageSizeOptions` | `number[]` = `[25,50,100]` | Rows-per-page choices |
| `defaultPageSize` | `number` = `25` | Initial page size |
| `serverMode` | `bool` = `false` | `true` ⇒ manual sort/filter/pagination; product fetches |
| `totalCount` | `number` | Server total (footer + next-page gating) |
| `pageIndex` | `number` = `0` | Controlled page (server mode) |
| `onQueryChange` | `({ sorting, columnFilters, globalFilter, pageIndex, pageSize }) => void` | Server-mode callback: fires once on mount with the (possibly persisted) view, on every query change (non-page changes report `pageIndex: 0`), and on page requests |
| `persistenceKey` | `string` = `''` | localStorage key (product namespaces + versions it, e.g. `aponto.bookings.table.v1`). Persists sorting, column visibility/order, page size — never selection, filters or page |
| `initialPreferences` / `onPreferencesChange` | `object` / `({ sorting, columnVisibility, columnOrder, pageSize }) => void` | Pluggable preference store alongside/instead of `persistenceKey` (e.g. WP user-meta). Seed order: defaults < localStorage < `initialPreferences`; the callback fires on every preference change (and once on mount with the seeded view) |
| `onRowActivate` | `(row, tanstackRow) => void` | Row click / Enter / Space (ignores clicks on controls) |
| `getRowAriaLabel` | `(row) => string` | Per-row `aria-label` (e.g. "Open booking #212 for Ava") |
| `renderIcon` | `(name) => node` = `defaultRenderIcon` | Chrome glyphs only (search/sliders/list/check/close/plus/chevrons/moreVertical/csv/import); domain glyphs live in product cell renderers |
| `renderMobileItem` | `(row) => node` | Narrow-container card list (`.pmdk-mobile-list`, container query ≤620px) |
| `itemsLabel` | `string` = `'items'` | Footer noun |
| `labels` | `object` | i18n overrides for every built-in string (see `DEFAULT_LABELS` in source — kit ships English defaults per Tier-2 rules, §5.13 audit) |
| `className` | `string` | Extra classes on the `.pmdk-data-table` root |

Helpers: `useTablePersistence(key, defaults)` (+ `readTablePrefs` /
`writeTablePrefs`, storage-failure-safe), `normalizeColumnOrder(preferred,
allIds, endId)`, `defaultRenderIcon(name)`.

Extraction provenance notes (review round, 2026-07-18):

- `table.css` keeps a few inert copies from the mockup source on purpose —
  the `.pmdk-table { min-width: 1324px }` literal and the Aponto column-width
  rules for generic ids (`select`/`action`/`status`/`total`/`id`/`time`/
  `date`). Under `<PMDKDataTable>` they are overridden by the inline
  `minWidth` (TanStack `getTotalSize()`) and the `<colgroup>`, so they only
  matter to manual-markup consumers; kept to stay diffable against the source.
- `--pmdk-accent-fg` intentionally breaks the `--pmdk-color-*` naming rule —
  it is the 1:1 promotion of the mockup's `--pd-color-accent-fg` established
  in the KIT-P2 bridge; renaming it would desync the bridge. Its weight is
  **78%** accent since KIT-P4 — the v2/founder-final declaration
  (`[data-ap-visual=v2] .ap-admin`); the 62% first shipped in KIT-P3 was the
  dead base-tier value the v2 flatten should have replaced (corrected before
  the 0.2.0 tag; no shipped consumer imported the primitives tier).
- The mockup's dark-preset per-status pill tuning was NOT ported: the kit's
  dark preset re-derives the status tints through the tone engine
  (`--pmdk-color-{tone}-subtle/-border/on-*` recompute against dark seeds).

Legacy note: `EntityListPage` / DataViews (§5.6) stay unchanged for existing
consumers — `PMDKDataTable` is the DS-tier alternative, not a replacement.
Backlog (slice 3): a shared headless menu/popover primitive (G4) — chrome
ships now, open/close/roving behavior stays per-component until the
inspector/drawer slice needs it too.

---

## 5.13 String-surface discipline (locked rule)

To prevent the consumer's i18n burden from ballooning, kit components are split into two tiers, and the rule is enforced in code review:

### Tier 1 — Layout primitives (zero translatable strings)

These components are pure containers. They render no text directly; consumers compose own UI inside.

`PageWrapper`, `EditorViewLayout`, `ListPageHeader` (text comes from props), `EditorPageHeader` (text from props except `backLabel` — see carve-out below), `SchemaField`, `FieldRow`, `Stack`, `Grid` — all zero strings.

**A11y carve-out**: a Tier-1 component MAY ship a hardcoded English default for *visible navigational text* (back-link, "More", etc.) when omitting the text would leak an unlabelled control to screen readers. Currently the only sanctioned exception is `<EditorPageHeader backLabel="Back">` — the back-link arrow without text would be a bare `←` glyph in the accessibility tree. Consumers SHOULD pass a translated `backLabel` in production; the English default is a safety net, not the intended path. Adding a new carve-out requires SPEC sign-off.

### Tier 2 — Page components (strings via labels prop)

These components ARE complete page sections rendering their own toolbars / status / empty states. They accept a `labels` object with default English fallbacks.

`EntityListPage`, `SaveBar`, `Hero`, `Checklist`, `ChecklistItem`, `CompareTable`, `ReleaseBlock`, `HelpPanel`, `EntityPreviewFrame`.

### Rule

> **No new translatable string lands in kit source unless the reviewer can justify "this component renders text directly and consumer has no slot alternative".**

Where possible, the kit's preferred pattern is **slot/children-based** so consumer's own React renders the text:

```jsx
// ❌ Avoid:
<EntityListPage labels={{ filtersTitle: '...', exportLabel: '...', ...30 more }} />

// ✅ Prefer (when slot makes sense):
<EntityListPage
  toolbar={<MyToolbar />}      // consumer's own JSX with own text
  emptyState={<MyEmptyState />}
/>
```

`labels` prop only used when slotting would over-complicate the call site (most toolbar text falls in this bucket).

### Per-component string template

Kit's build pipeline generates `templates/strings/{Component}.template.js` for every Tier 2 component:

```js
// templates/strings/EntityListPage.template.js (kit-generated)
import { __ } from '@wordpress/i18n';

export const entityListPageLabels = (textDomain) => ({
  loading: __('Loading items…', textDomain),
  noResults: __('No items match your filters.', textDomain),
  // ... full list with kit's English defaults
});
```

Consumer copies template ONCE into own `_kit-strings.js`:

```js
// customify-theme/src/dashboard/_kit-strings.js
import { entityListPageLabels } from '@pressmaximum/dashboard-kit/templates/strings/EntityListPage.template';

export const KIT = {
  entityList: entityListPageLabels('customify'),
};
```

Then spread into components:

```jsx
<EntityListPage {...KIT.entityList} items={...} />
```

When kit adds a string in 0.X.Y, CHANGELOG entry says:

> "Added 2 strings to EntityListPage: `bulkRestoreLabel`, `sortByAuthorLabel`. Update `_kit-strings.js`."

Consumer diffs template, adds 2 new lines, ships translation update.

### Audit of current SPEC

Re-audit of §5.10b (current state) per the discipline rule:

- `EntityListPage` ~20 strings → review: can we reduce to ~10 by moving more to slot/children pattern? Decision in P6 implementation.
- `SaveBar` 7 strings → core save flow text, all justified.
- `Hero` 0 strings (already props-only) ✓
- `Checklist` 2 strings (aria + status sr-only) + per-item from consumer ✓
- `CompareTable` 4 strings ✓
- `ReleaseBlock` 2 strings (Current badge + date format) ✓
- `HelpPanel` 1 string (trigger aria) ✓
- `EntityPreviewFrame` 2 strings (empty + loading) — could move to slot pattern? Decision in P6.

Total realistic v0.1.0 if discipline applied: ~30-35 strings (not 50). Re-confirm during implementation; SPEC §5.10b list updates accordingly.

---

## 6. Text domain rules (locked)

### 6.1 Kit rule

**No string passed to `__()` from inside kit source code.** ESLint rule blocks imports:

```js
// .eslintrc.js inside the kit repo:
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: '@wordpress/i18n', message: 'Kit must not call __ directly. Accept text via props/config.' },
        { name: '@wordpress/core-data', message: 'Kit must not fetch entities. Consumer supplies data via props.' },
        { name: '@wordpress/api-fetch', message: 'Kit must not call REST. Consumer wires fetches.' },
      ],
    }],
  },
};
```

CI fails if a contributor adds an import. Pre-commit hook runs ESLint.

### 6.2 What kit ships for strings

Every component that needs visible text accepts the text as a **prop**. Components that need multiple strings (e.g., `<EntityListPage>` with built-in toolbar labels) accept a `labels` object:

```jsx
<EntityListPage
  labels={{
    loading: __('Loading items…', 'customify'),
    noResults: __('No items match your filters.', 'customify'),
    bulkActions: __('Bulk actions', 'customify'),
    // ... ~15-20 strings total, fully documented
  }}
  // ...
/>
```

Kit provides English fallbacks as default prop values so consumers can incrementally translate:

```jsx
// Kit's component default:
const DEFAULT_LABELS = {
  loading: 'Loading items…',
  noResults: 'No items match your filters.',
  // ...
};

function EntityListPage({ labels = {}, ...props }) {
  const L = { ...DEFAULT_LABELS, ...labels };
  // use L.loading, L.noResults, etc.
}
```

### 6.3 Consumer extraction

Consumer runs `wp i18n make-pot path/to/consumer-plugin consumer-plugin/languages/consumer-plugin.pot`. The tool scans consumer's source code (where `__('Loading items…', 'customify')` is written) and extracts the string into consumer's `.pot`. Kit's source code never appears in the extraction because it has no `__()` calls.

Result: one consumer = one `.pot` = one text domain. WordPress.org theme review compliant.

### 6.4 Edge cases

- **Accessibility ARIA labels** kit components own (e.g., focus trap announcements) — provided as props with English defaults. Documented in component README.
- **Browser-native `confirm()` dialogs** — kit accepts message as prop. Consumer translates.
- **Date / number formatting** — kit defers to `Intl.DateTimeFormat` / `Intl.NumberFormat` with `undefined` locale (browser default). Consumer can pass `locale` prop to override.

---

## 7. Tree-shake boundaries

### 7.1 Three import surfaces

**Root entry** (`@pressmaximum/dashboard-kit`) — the dashboard SPA surface, always bundled by the consumer's dashboard script:

```js
import {
  mountDashboard, DashboardShell, TabStrip, HelpPanel, SnackbarSlot,
  createFilterNamespace, createI18nBag,
  // HashRouter flat exports: readHash, navigate, useHash, useRoute,
  //   matchRoute, activeTabId, useNavigate,
  //   NavigationGuardProvider, NavigationGuardContext,
  //   useFocusOnRouteChange,
  // BootDataLoader flat exports: readBoot, BootProvider, useBoot, BootContext.
  ListPageHeader, EditorPageHeader, EditorViewLayout, PageWrapper, SubNav,
  SchemaForm, SchemaField, SaveBar, BASE_FIELD_TYPES, panelHeadingId,
  createSettingsStore, useDirtyState, isAnyDirty, confirmDiscardAny,
  Hero, Checklist, ChecklistItem, createOnboardingStore,
  CompareTable,
  ReleaseBlock, CategoryBadge,
} from '@pressmaximum/dashboard-kit';
```

Total bundle delta for the lightest consumer (uses only `mountDashboard` + `Hero` + `SchemaForm`): **~10-15KB gzip** (after webpack drops the unused tree-shakeable parts within the root entry).

**Datasets sub-entry** (`@pressmaximum/dashboard-kit/datasets`) — heavy, opt-in. Lands in P6:

```js
import {
  EntityListPage, EntityPreviewFrame, ViewPersistence, filterTrashByDefault,
} from '@pressmaximum/dashboard-kit/datasets';
```

Importing anything from `datasets/` brings in `@wordpress/dataviews` (~50KB gzip) + its `date-fns` sub-dependency (~10KB gzip).

**Editor-helpers sub-entry** (`@pressmaximum/dashboard-kit/editor-helpers`) — tiny, opt-in. Bundled by the consumer's *editor* script (the one enqueued via `enqueue_block_editor_assets`), NOT the dashboard script:

```js
import {
  forceFullscreenMode, rewireBackButton, registerSubmenuActive,
} from '@pressmaximum/dashboard-kit/editor-helpers';
```

The split is deliberate: most consumers (Customify Theme, plain plugin dashboards) load the dashboard script on their admin page and never touch the block editor. Splitting keeps the dashboard bundle clean of editor-only DOM glue. Consumers with a Pattern-A CPT editor flow load both scripts on their respective screens.

### 7.2 `sideEffects` declaration

`package.json` declares CSS imports have side effects so they survive tree-shake (the Surfaces spike hit a bug where DataViews's `"sideEffects": false` caused webpack to strip the CSS imports — that bug becomes the kit's problem to avoid):

```json
{
  "sideEffects": [
    "**/*.css",
    "**/style.css"
  ]
}
```

### 7.3 Consumer's webpack config

Standard `wp-scripts` config works. No special overrides required. Consumer's `import { Hero } from '@pressmaximum/dashboard-kit'` triggers webpack to bundle only what's reachable from that export.

If a consumer ALSO imports from `/datasets`, both bundles ship side-by-side in the same chunk.

---

## 8. Bootstrap pattern

### 8.1 Consumer's PHP

```php
// customify-theme/inc/dashboard.php
use PressMaximum\DashboardKit\Admin\AssetEnqueue;

add_action('admin_menu', function () {
    add_menu_page(
        __('Customify', 'customify'),
        __('Customify', 'customify'),
        'manage_options',
        'customify',
        'customify_render_dashboard_page',
        'dashicons-admin-customizer',
        59
    );
});

function customify_render_dashboard_page() {
    echo '<div id="customify-dashboard" class="customify-dashboard-root"></div>';
}

add_action('admin_enqueue_scripts', function ($hook) {
    if ('toplevel_page_customify' !== $hook) return;

    AssetEnqueue::enqueueOn($hook, [
        'handle'      => 'customify-dashboard',
        'src_js'      => get_theme_file_uri('build/dashboard.js'),
        'src_css'     => get_theme_file_uri('build/dashboard.css'),
        'asset_php'   => get_theme_file_path('build/dashboard.asset.php'),
        'boot_global' => 'customifyDashboard',
        'boot_data'   => customify_dashboard_boot_data(),
        'text_domain' => 'customify',
    ]);
});

function customify_dashboard_boot_data(): array {
    $user = wp_get_current_user();
    return [
        'name'         => 'Customify',
        'brandIcon'    => customify_brand_svg(28),
        'themeVersion' => wp_get_theme()->get('Version'),
        'wpVersion'    => get_bloginfo('version'),
        'user'         => [
            'id'          => (int) $user->ID,
            'displayName' => (string) $user->display_name,
        ],
        'urls' => [
            'newPage'    => admin_url('post-new.php?post_type=page'),
            'siteEditor' => admin_url('site-editor.php'),
        ],
        // Consumer-specific fields below — kit doesn't care
        'starterTemplatesEndpoint' => 'https://api.customify.com/v1/templates',
    ];
});
```

### 8.2 Consumer's JS entry

```js
// customify-theme/src/dashboard/index.js
import { mountDashboard } from '@pressmaximum/dashboard-kit';
import { __ } from '@wordpress/i18n';

import WelcomePage from './tabs/Welcome';
import SettingsPage from './tabs/Settings';
import StarterTemplatesPage from './tabs/StarterTemplates';

mountDashboard({
  rootEl: '#customify-dashboard',
  bootGlobal: 'customifyDashboard',
  filterNamespace: 'customify',
  __: (text) => __(text, 'customify'),
  brand: {
    name: 'Customify',
  },
  baseTabs: [
    { id: 'welcome',   label: __('Welcome', 'customify') },
    { id: 'settings',  label: __('Settings', 'customify') },
    { id: 'templates', label: __('Starter Templates', 'customify') },
  ],
  baseRoutes: {
    '#welcome':   { component: WelcomePage,            type: 'page' },
    '#settings':  { component: SettingsPage,           type: 'page' },
    '#templates': { component: StarterTemplatesPage,   type: 'page' },
  },
});
```

That's the entire integration. ~30 lines of consumer JS + ~30 lines of PHP.

### 8.3 Pro plugin hooks in

```js
// customify-pro-plugin/src/dashboard/index.js
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createFilterNamespace } from '@pressmaximum/dashboard-kit';
import { EntityListPage } from '@pressmaximum/dashboard-kit/datasets';

import HeaderBuilderPage from './tabs/HeaderBuilder';
import GlobalCssPage from './tabs/GlobalCss';

const FILTERS = createFilterNamespace('customify');

addFilter(FILTERS.tabs, 'customify-pro/tabs', (tabs) => [
  ...tabs,
  { id: 'header-builder', label: __('Header Builder', 'customify-pro') },
  { id: 'global-css',     label: __('Global CSS', 'customify-pro') },
]);

addFilter(FILTERS.routes, 'customify-pro/routes', (routes) => ({
  ...routes,
  '#header-builder': { component: HeaderBuilderPage, type: 'page' },
  '#global-css':     { component: GlobalCssPage, type: 'page' },
}));
```

Customify Theme's `mountDashboard` applies these filters → tabs + routes extended → Pro tabs visible. Pro plugin uses its OWN text domain (`customify-pro`) — separate `.pot`, separate translation lifecycle.

---

## 9. Filter hook contracts

> Each consumer hosts its own namespace via `createFilterNamespace(prefix)`. The kit does not own any filter prefix. The contracts below describe the **payload shapes**; the kit guarantees those shapes regardless of namespace.

### 9.1 JS filters

| Filter (replace `{ns}` with consumer prefix) | Signature | Purpose |
|---|---|---|
| `{ns}.dashboard.tabs` | `(tabs: TabDefinition[]) => TabDefinition[]` | Add / remove / reorder top-level tabs |
| `{ns}.dashboard.tabs.locked` | `(promoTabs: LockedTab[]) => LockedTab[]` | Locked / Pro-promo tab list shown alongside real tabs when Pro is inactive (Blocksify Free uses this for the Pro upsell tabs) |
| `{ns}.dashboard.routes` | `(routes: Record<HashRoute, RouteEntry>) => same` | Register nested routes for new tabs |
| `{ns}.dashboard.welcome.sections` | `(sections: WelcomeSection[]) => same` | Append sections below the welcome checklist |
| `{ns}.dashboard.welcome.checklist` | `(items: ChecklistItem[]) => same` | Add / reorder / remove onboarding tasks |
| `{ns}.dashboard.settings.panels` | `(panels: SettingsPanel[]) => same` | Add Settings groups |
| `{ns}.dashboard.settings.field-types` | `(map: Record<string, ComponentType>) => same` | Register custom field type renderers |
| `{ns}.dashboard.changelog.sources` | `(sources: ChangelogSource[]) => same` | Add changelog streams |
| `{ns}.dashboard.version-label` | `(label: string, boot: BootData) => string` | Swap the header version label |
| `{ns}.dashboard.boot` | `(boot: BootData) => BootData` | Mutate boot payload before stores read it |

### 9.2 PHP filters

| Filter (replace `{ns}` with consumer prefix) | Signature | Purpose |
|---|---|---|
| `{ns}_dashboard_capability` | `(string $cap) => string` | Override capability gate |
| `{ns}_dashboard_localize` | `(array $boot, string $context) => array` | Append fields to `wp_localize_script` payload |
| `{ns}_dashboard_settings_schema` | `(array $schema) => array` | Mutate settings schema before serving |
| `{ns}_dashboard_settings_sanitized` | `(array $out, array $incoming) => array` | Final-pass policy/normalization before save |

### 9.3 Type definitions

```ts
type BootData = {
  name: string;
  brandIcon?: string;
  wpVersion?: string;
  user: { id: number; displayName: string };
  urls: Record<string, string>;
  [consumerSpecific: string]: unknown;
};

type WelcomeSection = {
  id: string;
  render: (props: { boot: BootData }) => ReactNode;
  order?: number;
};

type ChecklistItem = {
  id: string;
  label: string;                              // already translated
  description?: string;                       // already translated
  check: () => boolean | Promise<boolean>;
  ctaHref: string;
  ctaLabel?: string;                          // already translated
  icon?: ComponentType;
};

type SettingsPanel = {
  id: string;
  label: string;
  description?: string;
  fields?: SettingsField[];
  component?: ComponentType;                  // mutually exclusive with `fields`
  order?: number;
};

type SettingsField = {
  id: string;
  label: string;
  description?: string;
  type: 'boolean' | 'select' | 'text' | 'number' | 'radio' | string;
  options?: { value: string; label: string }[];
  default: unknown;
  min?: number; max?: number; step?: number;
};

type ChangelogSource = {
  id: string;
  label: string;
  fetch: () => Promise<Release[]>;
};

type ActionDefinition = {
  id: string;
  label: string;
  isPrimary?: boolean;
  isDestructive?: boolean;
  supportsBulk?: boolean;
  isEligible?: (item) => boolean;
  callback: (selected: unknown[]) => void | Promise<void>;
};

type ViewConfig = {
  type: 'grid' | 'table' | 'list';
  search?: string;
  page?: number;
  perPage?: number;
  titleField?: string;
  mediaField?: string;
  fields?: string[];
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  layout?: { previewSize?: number; density?: 'compact' | 'balanced' | 'comfortable'; badgeFields?: string[] };
};
```

---

## 10. Consumer recipes

### 10.1 Customify Theme (lightweight, no DataViews)

See §8.1 + §8.2 above. Recap of imports:

```js
import { mountDashboard } from '@pressmaximum/dashboard-kit';      // ~5KB
import { Hero, Checklist } from '@pressmaximum/dashboard-kit';     // ~2KB
import { SchemaForm, SaveBar } from '@pressmaximum/dashboard-kit'; // ~5KB
import { ListPageHeader } from '@pressmaximum/dashboard-kit';      // ~1KB
// NO import from '/datasets' → DataViews not bundled
```

Tab content for "Starter Templates" can be entirely custom React + `fetch()` — kit not involved beyond the route registration.

### 10.2 Blocksify Free (full plugin dashboard)

```js
import { mountDashboard } from '@pressmaximum/dashboard-kit';
import { /* all the things */ } from '@pressmaximum/dashboard-kit';
import { EntityListPage } from '@pressmaximum/dashboard-kit/datasets';
```

Same `mountDashboard` shape as Customify Theme; just more tabs and uses `EntityListPage` for any CPT lists Blocksify Free might add later (currently none — the only CPT lists are Pro-side).

**Card-wrapped Checklist — flush heading override (K-013).** The blessed
Welcome composition wraps the kit's `<Checklist>` in `@wordpress/components`
`<Card><CardHeader/>…</Card>` (K-002). `@wordpress/components` paints Emotion
`:first-of-type`/`:last-of-type` border-radius on ALL FOUR corners of
`CardHeader` — the heading detaches from the checklist rows as a rounded chip,
and a naive `.consumer-scope .components-card-header` override (0,2,0) loses to
Emotion's (0,2,1). Ship this chained-class override in the consumer stylesheet
(specificity (0,3,0) wins):

```css
.your-scope .components-card-header.components-card__header {
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
}
```

A pre-composed `<ChecklistCard>` wrapper was considered and rejected — it
contradicts K-002's "kit owns no chrome" stance; this snippet is the canonical
recipe.

### 10.3 Blocksify Pro extends Blocksify Free

```js
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createFilterNamespace } from '@pressmaximum/dashboard-kit';
import { EntityListPage } from '@pressmaximum/dashboard-kit/datasets';

import SurfacesListPage from './tabs/SurfacesList';
import ConditionsEditor from './tabs/ConditionsEditor';
import QueryBuilderList from './tabs/QueryBuilderList';

const FILTERS = createFilterNamespace('blocksify');

addFilter(FILTERS.tabs, 'blocksify-pro/tabs', (tabs) => tabs.concat([
  { id: 'surfaces',      label: __('Surfaces', 'blocksify-pro') },
  { id: 'conditions',    label: __('Conditions', 'blocksify-pro') },
  { id: 'query-builder', label: __('Query Builder', 'blocksify-pro') },
]));

addFilter(FILTERS.routes, 'blocksify-pro/routes', (routes) => ({
  ...routes,
  '#surfaces':           { component: SurfacesListPage,   type: 'list' },
  '#conditions':         { component: ConditionsEditor,   type: 'list' },
  '#conditions/:id':     { component: ConditionsEditor,   type: 'editor' },
  '#query-builder':      { component: QueryBuilderList,   type: 'list' },
});
```

Blocksify Pro's `SurfacesListPage` internally uses `<EntityListPage>` from the datasets entry — paying the DataViews bundle cost since Pro needs that machinery for all three CPTs.

### 10.4 Future plugin (standalone dashboard, full features)

Same shape as Customify Theme §8.1-8.2 but with `/datasets` import added. Mounts own dashboard at own admin menu page. Future plugin's text domain stays its own.

---

## 11. Hack → fix migration roadmap

The Surfaces spike accumulated six documented hacks. Each maps to a kit version that lands the proper fix; consumers update kit to inherit the fix.

| Hack | Spike location | Proper fix | Kit version |
|---|---|---|---|
| CSS rename script overwrites root-entry editor chunk | `scripts/rename-css.js` in Blocksify Free | Kit ships own build pipeline (rollup or webpack) that doesn't have this bug. Blocksify Free's rename script also patched independently to merge instead of overwrite | **0.1.0** (kit doesn't inherit the bug) |
| Vendored DataViews CSS (74KB) | `src/dashboard/tabs/Surfaces/dataviews-vendor.css` | Kit does NOT import or vendor `@wordpress/dataviews`'s CSS at all. WordPress core ≥6.5 registers a `wp-dataviews` script-and-style handle pair; the consumer's `wp-scripts` build (via `DependencyExtractionWebpackPlugin`) detects the kit's externalized `@wordpress/dataviews` JS import and adds `wp-dataviews` to the generated `asset.php` deps, after which WP auto-enqueues the matching stylesheet | **0.1.0** — **shipped in P6** (by deletion: spike's `dataviews-vendor.css` simply never ported) |
| DataViews `containerWidth: 0` → 1-card-per-row | `display: contents` row flatten in Surfaces editor.css | Kit's `<PageWrapper>` provides the flex chain DataViews's `useResizeObserver` requires (`flex-grow: 1` + `min-height: 0` + `min-width: 0` + `height: 100%` chain). `<EntityListPage>` always wraps itself in `<PageWrapper>` | **0.1.0** — infrastructure **shipped in P2**; `<EntityListPage>` lands P6 + always wraps itself. Validated by `stories/PageWrapper.dataviews.stories.jsx` + `stories/EntityListPage.dataviews.stories.jsx` |
| `view.layout.previewSize` → CSS var bridge for grid template | `style={{ '--bsy-surfaces-preview-size': ... }}` in `SurfacesListPage` | Once `<PageWrapper>` fixes containerWidth, DataViews's native `previewSize` computation works, no CSS var bridge needed | **0.1.0** — shipped in P2 + verified absent from P6's `EntityListPage.css` |
| Submenu `hashchange` JS active-state toggle | `sync_submenu_active()` PHP method emitting `<script>` | JS helper `registerSubmenuActive({ menuId, hash })` ships the same reusable behavior; kit version 1.0 keeps this hack since WP doesn't expose a server-side hash-detection API. P7 `MenuHelpers::printSubmenuActiveSync()` will wrap it as the inline-script convenience | **0.1.0** — JS helper **shipped in P5**; PHP wrapper lands P7. Tracked upstream for v2.x WP API change |
| Fullscreen close button click delegation hijack | `force_fullscreen_mode()` inline JS | JS helper `rewireBackButton({ selector, href })` ships the capture-phase intercept as a runtime function. Track Gutenberg PR for `editor.PostBackButton` slot; when upstream lands, the kit replaces the hijack with a proper slot fill but keeps the hack as fallback | **0.1.0** — JS helper **shipped in P5** (paired with `forceFullscreenMode()`). Slot-fill replacement deferred to a 0.x.y minor once WP min-version bumps |
| **DataViews bundle duplication** across Pro consumers (Blocksify Pro + Customify Pro each ship ~50KB) | Architectural consequence of §2.4 independent-release decision | Track Gutenberg issue #56680 + related discussions for `wp-dataviews` standalone script handle. When WP Core exposes the handle, consumer's `wp-scripts` auto-externalizes — kit code unchanged, consumers re-build and shed the duplication. Kit only bumps the `peerDependencies` WordPress minimum version | **Upstream-dependent** — likely WP 7.x |
| **`@wordpress/components` `<Spinner>` margin** — legacy `margin: 5px 11px 0 0` pushes the spinner off-centre inside flex-centred containers (visible in Blocksify Free's Welcome checklist status circle, fixed via CSS override in commit `7e6b7ba`) | `@wordpress/components` legacy CSS (decade-old back-when-spinners-sat-next-to-Save-buttons assumption) | Kit's `<Spinner>` wrapper exports `<PMDKSpinner>` with `margin: 0` baked in. Consumers use this wrapper instead of importing `@wordpress/components` `<Spinner>` directly. Documented in kit README + ESLint warning suggesting the swap | **0.1.0** (kit wrapper) — upstream WP fix would deprecate the wrapper |
| **CSS pipeline force-enqueue during preview generation (6.3)** | Surfaces spike PHP `render_preview_bundle()` flips a `blocksify.css.force_enqueue` filter before assembling the preview HTML, so admin / REST contexts (which normally skip frontend stylesheet emission) still receive the CSS the preview needs | Kit doesn't ship its own CSS pipeline, so the fix is a consumer recipe rather than kit code. Documented in §5.6 (EntityPreviewFrame note) + commit-side cookbook: consumer declares a `<ns>.css.force_enqueue` filter in their stylesheet enqueue path, flips it `true` for the duration of preview-doc assembly, then restores. Kit's `previewDoc` prop is the receiving end of this pattern | **0.0.1-dev** — documentation only |
| **DataViews v14.3 mount-normalize guard (6.4)** | DataViews occasionally fires `onChangeView` ~50ms post-mount that silently demotes `type: 'grid'` → `'table'` even when the persisted view said `'grid'`. Surfaces spike's `setView` swallows this fire when `< 1500ms since mount AND no user pointer/keydown event AND prev?.type === 'grid' AND next?.type === 'table'` | Kit doesn't auto-apply the guard (would mask legitimate config changes in non-Surfaces contexts). Documented as a recipe in `ViewPersistence.js` JSDoc; optional `mountNormalizeGuard()` helper deferred until a second consumer needs the same workaround | **0.0.1-dev** — documentation only |
| **`body.scrollHeight` on iframe content (6.5)** | Surfaces spike originally measured `body.scrollHeight` for content-aware iframe sizing. With the iframe element's `style.height` set, body inherits the viewport via html's `height: 100%` chain → `body.scrollHeight` returns the iframe's own height instead of the real content. Fixed by measuring `body.firstElementChild.getBoundingClientRect()` + body `padding-top`/`padding-bottom` | `<EntityPreviewFrame>`'s `aspectMode='content'` measurement uses the firstElementChild approach. Inline comment in `EntityPreviewFrame.jsx` warns against `body.scrollHeight` for any consumer extending the path; §5.6 pitfall paragraph repeats the warning at spec level | **0.0.1-dev** — shipped in the 6.2 / `aspectMode='content'` implementation |

Kit's first release (0.1.0) ships with proper fixes for 4 of 6 spike hacks. Two remaining (submenu hash detection, fullscreen close button) are limited by WordPress core's API surface and stay as documented helpers until upstream changes. The DataViews-duplication tracking item is architectural, not a spike workaround — listed here for completeness so the upstream dependency stays visible. The three drift findings (6.3 / 6.4 / 6.5) extracted from the Surfaces blob+iframe preview spike are documentation-only or already-shipped patches; they're listed for traceability so the same pitfalls don't get rediscovered.

---

## 12. Versioning rule

Kit follows **strict semver**:

- **Patch** (0.1.x) — bug fixes only. No new exports. Consumers auto-pull via `^0.1.0`.
- **Minor** (0.x.0) — pre-1.0 only: breaking changes allowed (explicit semver pre-1.0 contract). Once at 1.0, minor = additive only.
- **Major** (x.0.0) — post-1.0 breaking changes. Deprecation cycle: prop / function marked deprecated in 1.X.0 with `console.warn`, removed in 2.0.0.

### 12.1 1.0 milestone criteria

Hit 1.0 when:
- Three real consumers shipped a release using the kit (Blocksify Free, Customify Theme, Customify Pro)
- API surface unchanged for 60 days across all three
- All six spike hacks have proper fixes OR documented permanent workarounds
- README, CHANGELOG, migration guide reviewed
- Compatibility matrix (§12.5) populated

**Target timeline**: hit 1.0 within 3-4 months of 0.1.0 ship to limit pre-1.0 breaking-change chaos (concern raised in initial SPEC review).

Before 1.0: anything can change. Consumers pin exact version (`"@pressmaximum/dashboard-kit": "0.1.5"`) instead of `^0.1.0` if they want stability.

### 12.2 Deprecation cycle (post-1.0)

```js
// Kit 1.5 — deprecate but keep working:
export function HelpPanel(props) {
  if (props.legacyMode) {
    console.warn('[dashboard-kit] HelpPanel.legacyMode is deprecated, use HelpPanelLegacy instead. Removed in 2.0.');
  }
  return <HelpPanelInternal {...props} />;
}

// Kit 2.0 — actually remove legacyMode prop. Migration guide documents the swap.
```

CHANGELOG.md entry per release lists every deprecation + removal with consumer migration steps.

### 12.3 Pinning recommendation

```json
// pre-1.0: pin EXACT
"@pressmaximum/dashboard-kit": "0.3.5"

// post-1.0: caret range OK
"@pressmaximum/dashboard-kit": "^1.0.0"
```

Kit README's "Installation" section repeats this rule prominently.

### 12.4 Migration codemod scripts (1.0+)

Major version bumps ship a companion codemod published as `@pressmaximum/dashboard-kit-migrate`:

```bash
npx @pressmaximum/dashboard-kit-migrate v1-to-v2 ./src/dashboard/
```

Auto-replaces deprecated API call sites in consumer's source (using `jscodeshift` AST transforms). Reduces migration friction for breaking releases. Pre-1.0 breaking changes don't ship codemod (too volatile to maintain) — consumers do manual edits with CHANGELOG as guide.

### 12.5 Compatibility matrix

Kit's README publishes + maintains a compatibility matrix so consumers know which kit version pairs with which consumer version. Updated each kit release.

| Kit version | Blocksify Free | Customify Theme | Customify Pro | Blocksify Pro | Notes |
|---|---|---|---|---|---|
| 0.1.x | 2.0+ | (not yet) | (not yet) | (not yet) | Initial release — Blocksify Free is first consumer |
| 0.2.x | 2.1+ | 3.0+ | (not yet) | (not yet) | Customify Theme onboarded |
| 0.3.x | 2.2+ | 3.1+ | 4.0+ | 1.0+ | All four consumers shipping |
| 1.0.0 | 2.5+ | 3.4+ | 4.2+ | 1.3+ | API stable, breaking changes require deprecation |

Each consumer's README links to the matrix and states its minimum kit version. Compatibility tested in CI via the test-consumer plugin (§13.2) running real-world integration tests.

Mitigates the "versioning chaos" concern: if a user is debugging an issue, the matrix tells them which kit version each plugin pulls, and whether the combination is officially supported. Bundle independence means no runtime conflict, but stale CHANGELOGs are a real DX risk — matrix is the single source of truth.

---

## 13. Implementation phases

Each phase below includes implementation + tests + review buffer. Estimates are realistic, not optimistic — buffer absorbs unexpected discoveries, API revisions after first consumer migration, CI tweaks.

| Phase | Scope | Impl | Tests + review | Total |
|---|---|---|---|---|
| **P0 — Repo bootstrap** | Create `pressmaximum/dashboard-kit` repo. package.json + composer.json + ESLint config + Jest/Vitest config + CI workflow (lint + test + build) + README skeleton + LICENSE + `.editorconfig` + Storybook scaffold (§13.2) + test consumer scaffold (§13.2) | 1.5 | 0.5 | 2 d |
| **P1 — Core extract** | `mountDashboard`, `DashboardShell`, `TabStrip`, `HashRouter` (+ `NavigationGuardProvider` + `useFocusOnRouteChange`), `BootDataLoader`, `SnackbarSlot`, `HelpPanel`, `createFilterNamespace`, `createI18nBag`. **Absorbed from P2:** all Tier-1 layout primitives (`PageWrapper`, `ListPageHeader`, `EditorPageHeader`, `EditorViewLayout`, `SubNav`) since their CSS surface ships in the same locked §16.2 class table. Storybook stories for each shipped component. Unit tests for the pure-function surface (`matchRoute`, `activeTabId`, `createFilterNamespace`, `createI18nBag`, `readBoot`). Blocksify Free migration deferred to P8 (single cutover after Settings + Welcome + Datasets land) | 5 | 2 | 7 d |
| **P1.5 — SPEC reconcile** | Amend §5.1, §5.2, §5.10b, §5.13, §9.1 against P1 implementation reality. Fix broken `./styles/tokens.css` export. Tighten `size-limit` to SPEC §17.10 budgets. Wire test consumer to `mountDashboard`. Seed CHANGELOG `[Unreleased]` | 0.5 | 0.5 | 1 d |
| **P2 — PageWrapper containerWidth fix** | Harden `PageWrapper` flex chain to give DataViews's `useResizeObserver` a stable `containerWidth` (spike hack #3). Implement `mountDashboard.containerWidth` config (`'narrow' \| 'wide'`). Validate by mounting a DataViews-using test fixture | 1 | 1 | 2 d |
| **P3 — Settings** | `SchemaForm` (single-panel), `SchemaField` (consumer-injected `fieldTypes` map), `SaveBar` (Tier-2 `labels` prop), `createSettingsStore({ storeName, endpoint, fetch, seedSaved? })`, `useDirtyState` (+ module-level `isAnyDirty` / `confirmDiscardAny`). `mountDashboard` wires `confirmDiscardAny` as the default `NavigationGuardProvider` guard. Tests cover the full store action sequence (load → edit → save → reset → clearDirty + error paths). Blocksify Free Settings tab migration deferred to P8 with the other consumer cutovers | 3 | 2 | 5 d |
| **P4 — Welcome + Compare + Changelog** | `Hero`, `Checklist`, `ChecklistItem`, `createOnboardingStore` (full action surface with optimistic updates + rollback), `CompareTable` (mixed-content cell dispatch), `ReleaseBlock` + `CategoryBadge` (with `toneOverrides`). Tests cover the onboarding store action sequence + CategoryBadge label / tone resolution. Blocksify Free Welcome / Free-vs-Pro / Changelog migration deferred to P8 with the other consumer cutovers | 3 | 1.5 | 4.5 d |
| **P5 — Editor helpers** | JS runtime helpers behind the `/editor-helpers` sub-entry: `forceFullscreenMode`, `rewireBackButton`, `registerSubmenuActive`. Each returns an unsubscribe handle for symmetric teardown; all short-circuit in SSR / non-browser contexts. Tests: 18 unit cases covering arg validation, idempotency, click-capture interception, hashchange sync, and `wp.data.subscribe` deferral. PHP wrappers (`Admin\EditorIntegration`, `MenuHelpers::printSubmenuActiveSync`) lands with P7's composer package | 2 | 1 | 3 d |
| **P6 — Datasets** | `<EntityListPage>` (Tier-2: auto-wraps in `<PageWrapper>`, header chrome via `<ListPageHeader>`, switches between loading / empty / populated states, forwards everything else to `<DataViews>`). `<EntityPreviewFrame>` (CSS container-query scaling, configurable viewport via `--pmdk-preview-viewport`). `ViewPersistence.create({ storageKey, defaultView })` (factory; localStorage adapter with forgiving error handling). `filterTrashByDefault(items, view)` (pure pre-filter). Kit deliberately does NOT vendor DataViews CSS — relies on `wp-scripts`'s asset chain to enqueue `wp-dataviews` style handle (closes hack #2 by deletion). Spike hacks #3 + #4 verified absent from `EntityListPage.css`. 20 new tests (ViewPersistence 13 / filterTrashByDefault 9 / EntityPreviewFrame 7 / EntityListPage 10 — actions/fields/view are consumer-supplied, kit just forwards). Validation story (`stories/EntityListPage.dataviews.stories.jsx`) exercises the full chain end-to-end. Webpack `MiniCssExtractPlugin` filename function now emits per-entry CSS (`build/datasets/style.css` ships separately from `build/style.css`) so theme-only consumers don't pay DataViews-page CSS bytes. Blocksify Free Surfaces migration deferred to P8 with the other consumer cutovers | 4 | 2 | 6 d |
| **P7 — PHP composer package** | `Bootstrap` (version marker + autoload anchor). `Boot::register($args)` (one-call chassis wiring — `add_menu_page` + asset enqueue + body class). `Admin\AssetEnqueue::enqueueOn($hook, $config)` (script + style + boot-payload localize boilerplate, reads `*.asset.php` for deps + version). `Admin\MenuHelpers` (`addHashSubmenu`, `relabelParentMirror`, `printSubmenuActiveSync` — PHP wrapper around P5 `registerSubmenuActive` JS). `Admin\EditorIntegration::forceFullscreenMode` + `rewireBackButton` (PHP wrapper around P5 editor-helpers via `wp_add_inline_script`). `REST\PreviewEndpointRegistrar::register($config)` (template_redirect interceptor factory ported from Surfaces spike). `REST\SettingsControllerBase` (abstract GET/POST controller with deep-merge + sanitize hook). `Schema\SchemaBuilder::create()` (fluent declaration → `buildDefaults` / `buildSchema` / `sanitize` triplet, ports spike's `Blocksify_Dashboard_Schema` coerce semantics). PHPUnit scaffold with 6 test files / minimal WP function stubs in `tests/php/bootstrap.php` covering SchemaBuilder pure logic, hook-registration wiring, inline-script content. End-to-end `wp_die` + `WP_Query` + REST cycle tests deferred to a post-1.0 wp-env integration scaffold | 3 | 2 | 5 d |
| **P8 — Surfaces spike → kit consumer** | Refactor `src/dashboard/tabs/Surfaces/` + `class-blocksify-dashboard-surfaces-spike.php` to import from kit. Delete spike-specific hacks. Verify Surfaces still works end-to-end | 2 | 1 | 3 d |
| **P9 — Documentation + 0.1.0 release** | README, API reference (JSDoc → `.d.ts` + typedoc HTML), 4 cookbook examples (Theme / Free plugin / Pro plugin / standalone), CHANGELOG seeded, Storybook published, npm publish 0.1.0, packagist publish 0.1.0, semver tags | 2 | 1 | 3 d |

**Sequential total**: ~41.5 days = ~8-9 weeks calendar (including PR reviews + iteration).
**With P7 parallelised**: ~36.5 days = ~7-8 weeks calendar.

### 13.1 Order rationale

P1 first because everything else mounts inside the dashboard shell. P2 must precede P6 because PageWrapper's flex chain unlocks DataViews's `useResizeObserver` (kills spike hacks #3 + #4). P6 (datasets) heavy + last in JS sequence. P7 PHP composer can run parallel with P3-P6 since no shared code. P8 (spike migration) validates the entire kit against a real Pro-shaped consumer before P9 publishes.

### 13.2 Development workflow

**Repo structure**:

```
pressmaximum/dashboard-kit/
├── src/                       (Source: §4.1)
├── packages/
│   └── test-consumer/         Minimal WP plugin scaffold that loads the kit
│                              from local file:// path. Used for manual smoke-testing
│                              + Storybook-equivalent context (real WP admin chrome)
├── .storybook/                Storybook config — visual catalogue of components
├── stories/                   *.stories.jsx per component
├── tests/
│   ├── unit/                  Jest/Vitest tests for pure functions, hooks
│   ├── integration/           React Testing Library — component interactions
│   └── php/                   PHPUnit — composer package
├── build/                     Generated, npm-published
└── docs/                      API ref + cookbook
```

**Test consumer plugin** lives at `packages/test-consumer/`. Has:
- Plugin header
- Symlinks `node_modules/@pressmaximum/dashboard-kit` → `../..`
- Mounts dashboard with mock boot data
- Used during dev: `cd packages/test-consumer && npm link ../../`
- Loaded into a local WP install (Studio, wp-env, or manual) for end-to-end manual testing

**Storybook** decision (§16 question #6 resolved): **YES, ship Storybook**. Hosted on GitHub Pages from the kit repo. Each component has stories showing: default state, all prop variants, error states, empty states. Visual regression via Chromatic optional (defer to 0.2).

**CI workflow** (`.github/workflows/ci.yml`):
- On push / PR: lint (ESLint + stylelint) → unit tests → integration tests → build → bundle size check (`size-limit`)
- On tag `v*`: build → npm publish (with provenance) → packagist auto-update → GitHub release with auto-generated changelog
- Branch protection: main requires PR + 1 review + green CI

**Release flow**:
1. PR merged to main
2. Conventional Commit message determines next version (`feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` footer → major bump pre-1.0 OK, post-1.0 needs explicit major label)
3. `npm version <patch|minor|major>` → bumps both package.json + composer.json (one script reads JSON and writes both)
4. `git push --follow-tags` triggers release workflow
5. npm + packagist update; consumers `npm update` to pull

---

## 14. Anti-patterns

Non-exhaustive. Search `pmdk-anti` in code comments for tagged examples.

- **Never** `import { __ } from '@wordpress/i18n'` inside kit source. Use injected `__` or accept text as prop. ESLint blocks.
- **Never** `import` from `@wordpress/core-data` or `@wordpress/api-fetch` inside kit. Consumer provides data hooks / stores.
- **Never** hardcode a filter prefix string (`'blocksify.dashboard.tabs'`). Use `createFilterNamespace(prefix)` so the consumer's namespace is honored.
- **Never** introduce CSS that targets an unprefixed class (`.button`, `.list-item`). Always `.pmdk-*` to avoid collision with consumer CSS.
- **Never** assume `wp.data` is available at module-eval time. Hooks resolve inside React render, never at module top level.
- **Never** mutate a passed prop (view, items, etc.). Always return a new value through the callback.
- **Never** ship breaking changes in a minor release post-1.0. Deprecation cycle required (see §12.2).
- **Never** add a dependency to `@wordpress/blocks` or `@wordpress/block-editor` to the kit. Datasets needs only `@wordpress/dataviews`, `@wordpress/components`, `@wordpress/data`. Anything heavier belongs in the consumer.
- **Never** call `do_action` or `apply_filters` inside kit PHP without consumer-supplied prefix. Hooks PHP-side also follow `{ns}_dashboard_*` convention.
- **Never** read `$_GET` / `$_POST` directly inside kit PHP without sanitizing. Use WP helpers (`sanitize_text_field`, `absint`).

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Kit** | `@pressmaximum/dashboard-kit` package, both JS and PHP halves |
| **Consumer** | Any theme or plugin that `npm install` + `composer require` the kit |
| **Filter namespace** | Consumer-owned prefix for `addFilter` / `apply_filters` calls (`blocksify`, `customify`, etc.) |
| **Boot data** | Object on `window.{name}Dashboard` set by consumer's PHP via `wp_localize_script` and read by the kit's `BootDataLoader` |
| **`__` injection** | Pattern where the consumer passes its text-domain-bound `__` function into the kit at mount time so the kit can call it for any internal text without owning a text domain |
| **Datasets entry** | The `@pressmaximum/dashboard-kit/datasets` sub-export. Heavy (`@wordpress/dataviews`), tree-shakeable, optional |
| **Page Wrapper** | Kit's flex chain container that gives DataViews's `useResizeObserver` proper width measurement |
| **Locked Pro tab** | Tab visible in Free but rendering a promo when Pro is inactive. Pattern documented but consumer-implemented |
| **Hack** | Documented workaround for a platform limitation with a known proper-fix path |

---

## 16. Theming guide (consumer reference)

> How consumers customize the visual appearance of kit components without forking. All theming via CSS custom properties + class targeting.

### 16.1 CSS custom properties

Kit ships these on `:root` (via the consumer's bundled `style.css` import) — override at any scope:

| Variable | Default | Purpose |
|---|---|---|
| `--pmdk-color-accent` | `var(--wp-admin-theme-color, #3858e9)` | Primary brand color (tab active border, primary button bg) |
| `--pmdk-color-accent-rgb` | `56, 88, 233` | RGB triplet for translucent variants |
| `--pmdk-color-text` | `#1e1e1e` | Body text |
| `--pmdk-color-text-muted` | `#50575e` | Secondary text |
| `--pmdk-color-bg` | `#ffffff` | Surface background |
| `--pmdk-color-bg-subtle` | `#f6f7f7` | Subtle background (sidebar / hover) |
| `--pmdk-color-border` | `#e0e0e0` | Default borders |
| `--pmdk-color-border-subtle` | `#f0f0f1` | Subtle dividers |
| `--pmdk-color-success` | `#00a32a` | Success state |
| `--pmdk-color-danger` | `#b91c1c` | Danger state (canonical; renamed from `error` in 0.2) |
| `--pmdk-color-error` | `var(--pmdk-color-danger)` | **Deprecated alias** of `--pmdk-color-danger`; kept permanently for back-compat |
| `--pmdk-radius-small` | `4px` | Default border-radius |
| `--pmdk-radius-pill` | `9999px` | Pill / badge radius |
| `--pmdk-font-size-base` | `14px` | Body font size |
| `--pmdk-line-height-base` | `1.5` | Body line height |
| `--pmdk-spacing-unit` | `8px` | Base spacing unit |
| `--pmdk-header-gutter` | `24px` | Edge padding for dashboard header + main content |
| `--pmdk-tab-padding-y` | `16px` | Tab strip vertical padding |
| `--pmdk-tab-padding-x` | `18px` | Tab strip horizontal padding |

Consumer override:

```css
/* customify-theme/src/dashboard/style.css */
.customify-dashboard-root {
  --pmdk-color-accent: #ff6b35;
  --pmdk-color-accent-rgb: 255, 107, 53;
  --pmdk-radius-small: 6px;
}
```

**DS token API (added 0.2, KIT-P2).** Beyond the base tokens above, the kit ships a
larger `--pmdk-*` surface distilled from the Aponto plugin-dashboard DS, so kit
primitives and the opt-in app theme share one API. All defaults stay WP-native —
adding these tokens changes nothing for existing consumers. Authoritative list:
[`src/styles/tokens.css`](../src/styles/tokens.css). Families:

- **Tone-derivation engine** — 10 `--pmdk-tone-*` weights (`-text-muted`,
  `-text-soft`, `-surface-subtle`, `-surface-muted`, `-avatar-surface`, `-border`,
  `-border-strong`, `-accent-subtle`, `-accent-soft`, `-accent-border`) drive ~30
  derived roles via `color-mix()`: `--pmdk-color-{heading,surface,surface-subtle,
  surface-muted,avatar-surface,text-soft,border-strong,row-hover,accent-subtle,
  accent-soft,accent-border}` and the semantic families
  `--pmdk-color-{danger,success,warning,info}-{subtle,border}` +
  `--pmdk-color-on-{danger,success,warning,info}`. Move a few seeds/weights and the
  whole surface retones. **These derived roles are declared at both `:root` and
  `.pmdk-theme-app`** so a theme scope can retone them (CSS resolves a custom
  property's `var()`s against the element carrying the declaration).
- **Type roles** — `--pmdk-font-size-{badge,micro,caption,meta,control,body,item,
  subheading,heading,field-label,field-value}`, `--pmdk-font-weight-{regular,medium,
  semibold}`, `--pmdk-line-height-{body,compact,title,label}`,
  `--pmdk-letter-spacing-title`. Default body = `--pmdk-font-size-base` (14px).
- **Space** — `--pmdk-space-0..8` (4px foundation: 0/4/8/12/16/20/24/32).
- **Geometry** — `--pmdk-radius-control`, `--pmdk-size-control-{sm,md,lg}` (34/40/44),
  `--pmdk-size-field-{compact,relationship,compact-notes}`, `--pmdk-size-hit-target`,
  `--pmdk-size-icon-{sm,md,lg}`.
- **Motion** — `--pmdk-motion-standard`, `--pmdk-motion-duration-fast`,
  `--pmdk-motion-ease-standard`.
- **Component-tier** — `--pmdk-accent-fg`, `--pmdk-control-border-{default,hover,
  active}`, `--pmdk-data-border-{strong,medium,soft}`, `--pmdk-content-gutter`,
  `--pmdk-inspector-width`. Component-level tokens from the K-007 tier also
  include `--pmdk-hero-border` (default `0`; added in KIT-P4 for K-012 so a
  consumer matches the Hero to surrounding bordered cards with one token
  instead of a class override).

`--pmdk-color-error` is now a permanent alias of the canonical `--pmdk-color-danger`
(non-breaking rename). Each product binds its brand to this API through a thin
bridge (`--pmdk-*: var(--brand-*)`) scoped to its dashboard wrapper — see the
Aponto `.ap-admin` bridge.

**Browser floor:** `color-mix()`, `:has()` and container queries are required by
the P3 primitives and the opt-in app theme (tone engine, compact-field kit,
in-flow inspector) — not by the 0.1-era core components/tokens, so consumers that
don't adopt the new surfaces are unaffected. Fine for wp-admin in 2026; recorded
in the README.

### 16.1a App theme (opt-in, `.pmdk-theme-app`)

The kit ships one packaged, versioned "app look" (16px readable type, 6px card
radius, DS neutral tones) as an **opt-in** sheet — it is NOT the kit default, so
Blocksify / Customify keep their WP-native look on a version bump (REVISED C,
2026-07-18). Aponto + PressListing share this one theme.

```js
import '@pressmaximum/dashboard-kit/themes/app.css';
```

```html
<div class="pmdk-dashboard pmdk-theme-app">…</div>
<!-- dark: same element carries the switch -->
<div class="pmdk-dashboard pmdk-theme-app" data-pmdk-color-scheme="dark">…</div>
```

The theme moves seeds + tone weights + type + radius — every derived role
recomputes through the engine — **and (since 0.2.0 / KIT-P4) carries the
component-level rules that put the CORE components in the founder look**:

- **DashboardShell** — canvas content plane (`--pmdk-dashboard-bg` re-seeded
  to the canvas token), 64px surface header, DS base voice (16px/1.45 text
  color on the chassis — required for the dark preset), 28px gutter
  (`--pmdk-header-gutter` follows `--pmdk-content-gutter`), wide-mode main
  padding `24px gutter 40px`. Dark lifts `.pmdk-dashboard__brand-icon` to the
  text seed.
- **TabStrip** — the mockup nav-button language: 15px medium muted labels,
  hover to full text color, active = accent + semibold + 2px underline inset
  10px (`::after`, overlapping the header divider).
- **HelpPanel** — 44px square icon-button trigger (row-hover wash), popover at
  the 6px card radius, caption-soft heading, 15px menu rows with the neutral
  row-hover (accent stays a selected-state voice).
- **ListPageHeader** — 24px medium −0.02em title, caption description;
  `.page-title-action` renders as the DS **primary filled** button at the 40px
  page tier (route-wide create action per the DS button table).
- **EditorPageHeader** — 20px medium title, caption back link, pill status chip
  on `surface-muted`.
- **SubNav** — flat settings rail (no card chrome): 40px items at the control
  radius, row-hover, active = `accent-subtle` wash + `--pmdk-accent-fg` text,
  weight stays medium (DS marks selection with color, not boldness).
- **SchemaForm** — `space-5` stack; `components-base-control` labels/help lift
  to the field-label / caption roles.
- **SaveBar** — status line at the 15px meta role. The full DS sticky chrome
  is NOT theme-gated — it ships with `primitives/style.css` (see §16.5;
  importing that sheet is the chrome opt-in, the theme class only retones).

Every rule is scoped under `.pmdk-theme-app` and out-specifies the core sheets
by one class — non-opt-in consumers keep the WP-native default byte-for-byte.
Apply `.pmdk-theme-app` on (or above) the dashboard
root, and set `data-pmdk-color-scheme="dark"` on that same element for the dark
preset. Brand accent is deliberately not set by the theme — it stays with the
consumer bridge / WP admin scheme, so one theme serves multiple brands.

> **Constraint:** the accent seed (`--pmdk-color-accent`) is declared only on
> `body.wp-admin` / `.pmdk-dashboard`. If you put `.pmdk-theme-app` on an element
> outside those (e.g. `<html>`) with no dashboard root beneath it, accent-derived
> roles (`accent-subtle/-soft/-border`, `accent-fg`, `control-border-active`) have
> no seed and will not resolve there — always keep a `body.wp-admin` or
> `.pmdk-dashboard` element in the themed subtree.

Values finalized in KIT-P4 (0.2.0). Founder-gate evidence:
`tests/vr/gate-p4/` (Blocksify default zero-diff + the Aponto mockup rendered
through the theme) and the `Core/ThemeAppCore` stories.

### 16.2 Class targeting (stable, semver-locked)

| Class | Element |
|---|---|
| `.pmdk-dashboard` | Top-level wrapper |
| `.pmdk-dashboard__header` | Header bar |
| `.pmdk-dashboard__brand` | Brand mark + name |
| `.pmdk-dashboard__tabs` | Tab strip container |
| `.pmdk-dashboard__tab` | Single tab link |
| `.pmdk-dashboard__tab.is-active` | Active tab |
| `.pmdk-dashboard__main` | Main content area |
| `.pmdk-dashboard__snackbar` | Snackbar slot |
| `.pmdk-list-page-header` | List page header (title + actions) |
| `.pmdk-list-page-header__title` | Page title |
| `.pmdk-list-page-header__actions` | Right-aligned actions |
| `.pmdk-editor-page-header` | Editor page header (back + title + status) |
| `.pmdk-editor-view-layout` | 3-col layout (subNav + main + rail) |
| `.pmdk-page-wrapper` | Generic flex-chain wrapper |
| `.pmdk-save-bar` | Sticky-bottom Save + Reset bar |
| `.pmdk-schema-form` | Settings form container (consumer wraps fields; the kit emits this wrapper but does NOT wrap each individual `<SchemaField>` — see §5.4) |
| `.pmdk-subnav` | Vertical nav rail (SubNav) |
| `.pmdk-subnav__list` | SubNav list element |
| `.pmdk-subnav__item` | SubNav row |
| `.pmdk-subnav__item.is-active` | Active SubNav row |
| `.pmdk-hero` | Welcome hero card |
| `.pmdk-hero__title` / `__tagline` / `__cta` | Hero subparts |
| `.pmdk-checklist` | Onboarding checklist container |
| `.pmdk-checklist__item` | Checklist row |
| `.pmdk-checklist__item.is-complete` | Completed row |
| `.pmdk-checklist__status` | Status indicator (circle) |
| `.pmdk-checklist__cta` | Row CTA button |
| `.pmdk-compare` | Compare table container |
| `.pmdk-compare__row` | Compare row |
| `.pmdk-compare__check-yes` / `__check-no` | Compare cells |
| `.pmdk-release-block` | Changelog release card |
| `.pmdk-category-badge` | Changelog category pill (also usable standalone) |
| `.pmdk-category-badge--{tone}` | Tone modifier — one of `new` / `improved` / `fixed` / `updated` / `removed` / `security` / `deprecated` / `neutral` |
| `.pmdk-help-panel` | Header help dropdown wrapper |
| `.pmdk-entity-list-page` | List view page wrapper |
| `.pmdk-entity-preview` | Preview iframe container |
| `.pmdk-entity-preview__frame` | Iframe element |
| `.pmdk-entity-preview.is-empty` | Empty preview placeholder |

**Lock scope rule (locked at 1.0):**

Only the classes enumerated in the table above carry the semver lock. Any other `.pmdk-{block}__{element}` BEM subpart shipped by the kit (e.g. `.pmdk-dashboard__brand-icon`, `.pmdk-editor-page-header__back`, `.pmdk-hero__content`, `.pmdk-release-block__item-text`) is consumer-targetable but **NOT** locked — kit may rename or drop these subparts in any release without a major-version bump. Consumers that depend on a subpart for styling should either (a) request its addition to the locked table via a PR before relying on it, or (b) accept that their selector may break.

Modifier states (`.is-active`, `.is-complete`, etc.) that decorate a locked class are themselves locked when explicitly listed (e.g. `.pmdk-dashboard__tab.is-active`); otherwise they follow the same non-locked rule.

DOM ids generated by exported helpers like `panelHeadingId(id)` are part of the **function's** public API (SPEC §5.4) — consumers consume the id by calling the function, not by hardcoding the string format. The format may change without breaking that contract.

Deprecation cycle for changes to locked classes: announce in 1.X CHANGELOG with `@deprecated` JSDoc on related exports → keep emitting the old class alongside the new for one minor → drop in 2.0.

### 16.3 Consumer brand-color binding

Recommended: bind kit accent to consumer's WP admin theme color so dashboards inherit user's WP color scheme automatically.

```css
.customify-dashboard-root,
.blocksify-dashboard-root {
  /* WP admin colors come from --wp-admin-theme-color (set per user) */
  --pmdk-color-accent: var(--wp-admin-theme-color, #3858e9);
}
```

Kit's defaults already do this; consumer only needs to override if branding diverges from WP scheme.

> **Composition pitfall (K-013):** when kit components are wrapped in
> `@wordpress/components` `<Card>`/`<CardHeader>`, Emotion's
> `:first-/:last-of-type` radius rules can visually detach the header chip;
> defeat them with the chained-class override documented in §10.2 — a plain
> single-class override loses on specificity.

### 16.4 Dark mode

Kit **core** stays light-only (WP admin has no native dark mode yet). The opt-in
**app theme** (§16.1a) ships a dark preset: set `data-pmdk-color-scheme="dark"` on
the same element that carries `.pmdk-theme-app`. Because the tone engine derives
every role from a few seeds + weights, the dark preset only re-declares those and
the rest recomputes. Consumers not on the app theme are unaffected.

### 16.5 Primitives stylesheet (added 0.2, KIT-P3 slices 1–2)

`@pressmaximum/dashboard-kit/primitives/style.css` is the DS component chrome
extracted from the Aponto plugin-dashboard mockup and neutralised onto the
`--pmdk-*` token API (`.pd-*`→`.pmdk-*`, `.ap-admin`→`.pmdk-dashboard`, the
`[data-ap-visual=v2]` tier flattened to default). Opt-in and separate from core
`style.css` — importing core alone is untouched. All selectors are scoped under
`.pmdk-dashboard`; the DS look comes from the app theme (§16.1a), the sheet
itself renders on WP-native defaults too. Requires the §16.1 browser floor.

Class families (source of truth: `src/primitives/*.css`; behavior contract:
the mockup `DESIGN-SYSTEM.md`):

| Family | Key classes | Notes |
|---|---|---|
| Buttons | `.pmdk-button` (+ `primary` / `text` / `danger` / `sm` / `icon-only`), `.pmdk-icon-button` | One filled primary per cluster; never combine two width-owning classes |
| Compact field kit | `.pmdk-compact-field` (+ `is-filled` / `is-picker`), `.pmdk-compact-label`, `.pmdk-compact-select`, `.pmdk-compact-notes`, `.pmdk-field-grid`, `.pmdk-field-end-icon`, `.pmdk-value-summary`, `.pmdk-editor-section` | Floating label float via `:focus-within` / `:has(:not(:placeholder-shown))`; notes stay top-anchored |
| Combobox | `.pmdk-combobox` (+ `is-open` / `is-entity` / `opens-up`), `.pmdk-combobox-field`, `.pmdk-combobox-popover`, `.pmdk-combobox-idle-icon` / `-active-icon` | Behavior via `createCombobox` (§5.12) |
| Money / colour fields | `.pmdk-money-field`, `.pmdk-color-picker-field` | LTR-isolated digits; native `input[type=color]` is the swatch |
| Table tier | `.pmdk-data-table` (component root, container-query context), `.pmdk-data-list`, `.pmdk-table-wrap`, `.pmdk-table`, `.pmdk-col-select` / `.pmdk-col-action` (sticky), `.pmdk-sort-button`, `.pmdk-cell-value` / `-muted` / `-strong` / `-numeric` / `-id`, `.pmdk-table-checkbox`, `.pmdk-mobile-list`, `.pmdk-table-scroll`, `.pmdk-timezone-label`, `.pmdk-time-cell` | Column widths come from the component's `<colgroup>`; product cells use the helper classes |
| Toolbar | `.pmdk-toolbar` / `-main` / `-query` / `-actions` / `-filter-controls`, `.pmdk-search`, `.pmdk-toolbar-control` / `-control-group` / `-popover-wrap` / `-popover` / `-export`, `.pmdk-toolbar-filter-button`, `.pmdk-filter-count`, `.pmdk-date-popover` | One 34px control baseline |
| Filters | `.pmdk-filter-builder` / `-facets`, `.pmdk-filter-facet` (+ `-trigger`), `.pmdk-facet-popover`, `.pmdk-filter-option` (+ `-search` / `-list`), `.pmdk-filter-checkbox`, `.pmdk-filter-chip`, `.pmdk-active-filters`, `.pmdk-clear-filters`, `.pmdk-filter-no-results` | Facet data is product-side |
| Popovers + column manager | `.pmdk-popover` (+ `-label` / `-separator`), `.pmdk-table-actions-popover` / `-separator`, `.pmdk-table-options-trigger`, `.pmdk-column-manager` / `-trigger` / `-popover` / `-back` / `-list` / `-option` (+ `is-dragging` / `is-required`) / `-drag-handle` / `-option-label` | Shared floating-surface treatment (`pdPopoverIn`) |
| Bulk bar | `.pmdk-bulk-row`, `.pmdk-bulk-bar-cell`, `.pmdk-bulk-bar`, `.pmdk-bulk-actions`, `.pmdk-bulk-clear` | Alternate thead row at header height; action buttons are product-side |
| Pagination | `.pmdk-pagination` (+ `-tools` / `-size`), `.pmdk-page-controls` | `Showing x–y of z` + 25/50/100 + 34px prev/next |
| Status + row actions | `.pmdk-status` (+ status modifier classes), `.pmdk-status-picker` / `-trigger` / `-menu` / `-option`, `.pmdk-row-actions` (+ `is-open` / `opens-up`), `.pmdk-row-action`, `.pmdk-row-action-icon`, `.pmdk-row-action-menu` (+ `is-floating`), `.pmdk-row-action-separator` | Kebabs transparent at rest, neutral fill on hover; status pills quiet tints |
| Five states | `.pmdk-state-panel`, `.pmdk-state-icon` (+ `is-error`), `.pmdk-state-loading`, `.pmdk-state-skeleton-head` / `-grid`, `.pmdk-skeleton`, `.pmdk-empty`, `.pmdk-inline-empty` | Ready / Loading / Empty / Error / Permission |
| In-flow inspector (slice 3) | `.pmdk-inflow-workspace` (+ `is-inspecting` / `is-resizing` / `is-closing`), `.pmdk-inflow-main`, `.pmdk-inflow-resizer`, `.pmdk-inflow-inspector` (+ `-head`) | Workspace plane: open pushes main narrower, no backdrop. Width via `--pmdk-inflow-inspector-width` (defaults to the token `--pmdk-inspector-width`); behavior via `createInspectorResizer`. Aponto `data-panel-kind` domain variants were NOT extracted |
| Drawer + panel content (slice 3) | `.pmdk-drawer` (+ `open`, `[data-panel-kind=detail]` mode), `.pmdk-drawer-head` / `-body` / `-foot` / `-hero` (+ `-hero-copy`) / `-title-group` / `-title-copy` / `-title-leading` / `-primary-actions` / `-confirm` / `-confirm-foot` / `-confirm-actions`, `.pmdk-panel-section` / `-hero` / `-footer` / `-drawer-foot`, `.pmdk-mini-stats` | Overlay-plane drawer + shared panel content conventions; `.pmdk-mini-stats` is the compact metric strip |
| Module card (slice 4 + K-018) | `.pmdk-module-grid` (+ `is-revealing`), `.pmdk-module-card` (+ `is-enabled` / `is-disabled` / `is-planned`), `.pmdk-module-card-head` / `-foot`, `.pmdk-module-icon`, `.pmdk-module-copy` / `-meta` / `-description` / `-badges` / `-card-action` / `-connection-line` (K-018 anatomy), `.pmdk-module-license` (+ `is-premium` — the TIER badge; source name kept), `.pmdk-module-phase`, `.pmdk-module-connection` (+ `is-connected`), `.pmdk-module-toggle` (+ `-label`), `.pmdk-toggle-track` | DESIGN-SYSTEM anatomy: icon, tier badge, title, description, status, toggle. Component: `<PMDKModuleCard>` (§5.12) |
| Avatar (slice 4) | `.pmdk-avatar` (+ `is-large`) | One uppercase letter, one shared quiet tint — no per-record colour cycling |
| Tabs (slice 4) | `.pmdk-section-tabs` | Peer views within a route; underline active, optional count badge span; behavior via `createTablist` |
| Toast (slice 4) | `.pmdk-toast` (+ `show`) | Transient confirmation anchored to the workspace corner |
| Save bar (slice 4, unified KIT-P4) | `.pmdk-save-bar`, `.pmdk-save-actions` | DS chrome for the SAME markup the core `<SaveBar>` component emits — since KIT-P4 the component carries `.pmdk-save-actions` on its action cluster and this sheet targets both markup dialects (`p` + `.pmdk-save-bar__status`; mockup `.pmdk-button` + the component's `.components-flex`/`.components-button` in the ≤620px stacked query). ONE component, two opt-in tiers: core-only consumers get the WP-native chrome from `src/settings/SaveBar.css`; importing `primitives/style.css` re-skins the same component with the DS sticky chrome |
| Foundations | `.pmdk-react-icon` (icon slot), `--pmdk-checkbox-check-image` (check glyph token; override when `--pmdk-color-on-accent` is dark) | `base.css` |

These classes follow the §16.2 lock-scope rule: the FAMILY names above are the
supported surface for product composition; unlisted subparts may change without
a major bump.

Phase-1 inventory cross-check (ds-contract-phase1, ~15 families): everything
route-neutral now ships across slices 1–4. Already covered by earlier slices
(no re-extraction in 3–4): five states, status pill, pagination, popover
chrome. NOT in P3 by design: page headers / TabStrip / SchemaForm chrome
(KIT-P4 REPLACES work), the primary-color preset engine
(`dashboard-kit-preferences.js` — theming tooling, later phase), Aponto-domain
composition (~45% of the mockup sheet).

---

## 17. Open questions for implementation

1. **Repo location** — `github.com/pressmaximum/dashboard-kit` confirmed? Need to create the repo before P0 starts.
2. **npm scope** — `@pressmaximum/*` reserved on npm? If taken, fallback `@pressmaximum-dashboard/*` or `@pressmaximum-io/*`.
3. **Composer Packagist** — same name space verification needed.
4. **CSS strategy** — single `style.css` shipped or per-component CSS that consumer's webpack concats? Spike experience suggests per-component imports + consumer's `wp-scripts` config handles the rest. Decide before P0; both options work, just pick one.
5. **TypeScript declarations** ✓ **RESOLVED**: JSDoc-typed JS source. `tsc --declaration --emitDeclarationOnly --allowJs` generates `.d.ts` files into `build/`. No hand-written `.d.ts`, no TS rewrite.
6. **Storybook** ✓ **RESOLVED**: Yes, ship Storybook from 0.1.0 (see §13.2). Hosted on GitHub Pages. Visual regression via Chromatic deferred to 0.2.
7. **Translation of `console.warn` strings** ✓ **RESOLVED**: Developer-facing — English only. Kit's deprecation warnings + internal error messages don't need localization.
8. **Migration helper for Blocksify Free** — should kit ship a one-shot codemod that swaps Blocksify Free's existing `src/dashboard/` imports for kit imports? Decision: skip for 0.1.0 — P8 is small enough to do manually + once. Re-evaluate if Customify Pro migration is significantly bigger.
9. **a11y commitment level** — kit commits to WCAG 2.1 AA conformance for all shipped components. Audit in P9 before 0.1.0 publish. Issues filed with `a11y` label.
10. **Bundle size budget** — `size-limit` thresholds (enforced in CI):
   - Root entry: ≤15KB gzip
   - `/datasets` entry: ≤80KB gzip
   - `/editor-helpers` entry: ≤2KB gzip
   - PR fails if exceeds; bumps require justification + sign-off.

---

## 18. References

### Required reading (must read before P0)

- **[../docs/SPEC-dashboard.md](./SPEC-dashboard.md)** — Blocksify Free dashboard v2, the first internal consumer. Implementation patterns extracted to the kit
- **[../docs/handoffs/HANDOFF-dashboard-v2-brainstorm.md](./handoffs/HANDOFF-dashboard-v2-brainstorm.md)** §6 — Pro CPT Pattern A / B
- **[../docs/FOUNDATION.md](./FOUNDATION.md)** §1, §8.0, §8.5, §13 — Blocksify principles, Free/Pro positioning, versioning lock, language conventions
- **Spike code** at `includes/dashboard/class-blocksify-dashboard-surfaces-spike.php` + `src/dashboard/tabs/Surfaces/` (commit `e1e7be9`) — search `SPIKE:` markers

### External references

- [WordPress.org Theme Review — Text Domain](https://developer.wordpress.org/themes/getting-started/internationalization/) — theme single text domain rule
- [Semver](https://semver.org/) — versioning contract
- [Gutenberg DataViews Reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/) — datasets module's underlying API
- [WordPress REST API](https://developer.wordpress.org/rest-api/) — consumer-side REST patterns
- [Webpack tree-shaking](https://webpack.js.org/guides/tree-shaking/) — sideEffects configuration

---

## 19. Changelog

- **2026-05-19** — Initial SPEC draft from Surfaces spike + architecture conversation. Distillation of locked decisions for the `@pressmaximum/dashboard-kit` package.
- **2026-05-19 (rev 2)** — SPEC review pass: §2.3 dependency model clarification (peerDeps vs externals), §3.5 Settings save sequence diagram added, §5.10b complete i18n strings reference (~50 strings enumerated), §5.10 SettingsControllerBase request/response shapes, §5.11 Error handling contract, §13 estimates rebased to include test+review time (~36-41 days), §13.2 Development workflow + test consumer + Storybook decision, §16 Theming guide added (CSS variables + class enumeration), §17 open questions resolved for TypeScript / Storybook / i18n of warnings. Awaits sign-off on §1-§17 before P0 starts.
- **2026-05-19 (rev 3)** — Counterargument pass on 5 architectural concerns: §2.3 expanded with install-command + caveat; §2.4 explicit bundle-duplication trade-off (175-200KB accepted as cost of independent release cadence, alternatives evaluated + rejected with rationale); §5.13 String-surface discipline rule (Tier 1 layout primitives = 0 strings, Tier 2 page components = labels prop with per-component templates, target ~30-35 strings not 50); §11 added DataViews bundle duplication as upstream-tracked item; §12 versioning expanded with pinning recommendation (§12.3), migration codemod plan for 1.0+ (§12.4), compatibility matrix concept (§12.5) so consumers know which kit version pairs with which consumer release. Aggressive 1.0 timeline (3-4 months) added to §12.1 to limit pre-1.0 chaos. SPEC ready for sign-off + P0 bootstrap.
- **2026-05-19 (rev 4)** — Capture P6 Changelog implementation patterns from Blocksify Free branch `claude/ecstatic-galileo-369bd3` (commits `0164d2f` → `4e4ad91`). §5.3 adds `<SubNav>` Tier-1 component (proof: Settings P7.5 + Changelog P6 both shipped with shared class). §5.3b new "Display components" section catalogues `<CompareTable>`, `<ReleaseBlock>`, `<CategoryBadge>` with tone-mapped category palette. §5.3c documents multi-source / multi-panel dispatch pattern as a copy-paste recipe (not a kit component — too consumer-specific in shape). §11 hack table adds the `@wordpress/components <Spinner>` margin override (kit ships `<PMDKSpinner>` wrapper). SPEC stays sign-off-ready for P0 bootstrap.
