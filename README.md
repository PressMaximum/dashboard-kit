# @pressmaximum/dashboard-kit

> Reusable WordPress admin dashboard SPA infrastructure — hash router, tab strip, settings form, welcome onboarding, list views, fullscreen-editor handoff. Distilled from the Blocksify Free dashboard.

**Status**: 0.0.0 — P0–P6 landed (core + layouts + settings + welcome + compare + changelog + editor helpers + datasets). P7 (PHP composer package), P8 (Blocksify Free Surfaces migration), P9 (documentation + 0.1.0 release) still to go. See [docs/SPEC.md](docs/SPEC.md) §13 for the full phase plan, [CHANGELOG.md](CHANGELOG.md) for what's shipped.

## Reading map for new consumers

The kit's full SPEC is long (2000+ lines) — most consumers only need three or four sections. Pick the row that matches your shape and read in this order:

| Your consumer | Read first | Then |
|---|---|---|
| **Lightweight theme** (Welcome + Settings only, no DataViews) | [§10.1 Customify Theme recipe](docs/SPEC.md#101-customify-theme-lightweight-no-dataviews) — ~30 lines of the consumer JS + ~30 of PHP | [§8 Bootstrap pattern](docs/SPEC.md#8-bootstrap-pattern), [§5.1 `mountDashboard` config](docs/SPEC.md#51-mountdashboardconfig) |
| **Full plugin** (Welcome + Settings + Changelog + DataViews lists) | [§10.2 Blocksify Free recipe](docs/SPEC.md#102-blocksify-free-full-plugin-dashboard) | [§8 Bootstrap pattern](docs/SPEC.md#8-bootstrap-pattern), [§5 full API](docs/SPEC.md#5-public-api) |
| **Pro extending a Free host** (e.g. Blocksify Pro on Blocksify Free, Customify Pro on Customify Theme) | [§10.3 Pro extends Free recipe](docs/SPEC.md#103-blocksify-pro-extends-blocksify-free) — pattern is host-agnostic; swap the namespace prefix to match your Free host (`'blocksify'` / `'customify'` / etc.) | [§9 Filter hook contracts](docs/SPEC.md#9-filter-hook-contracts), [§5.2 `createFilterNamespace`](docs/SPEC.md#52-createfilternamespaceprefix) |
| **Standalone dashboard** (own admin page, no host consumer) | [§10.4 Future plugin recipe](docs/SPEC.md#104-future-plugin-standalone-dashboard-full-features) | Same as the matching shape above (lightweight or full) |

Before you integrate: skim [KIT_ISSUES.md](KIT_ISSUES.md). It tracks known bugs in the kit's public surface plus the workarounds existing consumers ship. The list is short, but catching a current bug there saves debugging time.

After integration: [§16 Theming guide](docs/SPEC.md#16-theming-guide-consumer-reference) for the CSS-token + locked-class surface you can target.

---

## What this is

A small npm + composer package that any WordPress theme or plugin can drop in to get a Blocksify-style admin SPA: tabs, hash routing, settings save bar, welcome checklist, list views with live preview iframes, etc. The kit is **infrastructure**, not a finished dashboard — every visible string and every data source comes from the consuming plugin.

## What this is NOT

- Not a WordPress plugin (no plugin header, no auto-install). Consumers bundle the kit into their own plugin or theme.
- Not a UI primitive library — defers to `@wordpress/components` for buttons, modals, etc.
- Not opinionated about data sources — consumers fetch via `@wordpress/core-data`, `@wordpress/api-fetch`, vanilla fetch, anything.

## Install (once 0.1.0 ships)

```bash
npm install @pressmaximum/dashboard-kit
composer require pressmaximum/dashboard-kit
```

Most consumers also use `@wordpress/scripts`, which already provides the kit's `@wordpress/*` peer deps transitively. If your build pipeline doesn't include `wp-scripts`:

```bash
npm install @wordpress/components @wordpress/data @wordpress/element \
  @wordpress/hooks @wordpress/html-entities @wordpress/icons @wordpress/url
```

## Minimal mount

```js
// my-plugin/src/dashboard/index.js
import { mountDashboard } from '@pressmaximum/dashboard-kit';
import { __ } from '@wordpress/i18n';

import WelcomePage from './tabs/Welcome';
import SettingsPage from './tabs/Settings';

mountDashboard( {
	rootEl: '#my-dashboard',
	bootGlobal: 'myDashboard',
	filterNamespace: 'my-plugin',
	__: ( text ) => __( text, 'my-plugin' ),
	brand: { name: 'My Plugin' },
	baseTabs: [
		{ id: 'welcome', label: __( 'Welcome', 'my-plugin' ) },
		{ id: 'settings', label: __( 'Settings', 'my-plugin' ) },
	],
	baseRoutes: {
		'#welcome': { component: WelcomePage, type: 'page' },
		'#settings': { component: SettingsPage, type: 'page' },
	},
} );
```

That's the entire integration. ~30 lines of consumer JS + ~30 lines of PHP for asset enqueue + boot data. See [docs/SPEC.md §8](docs/SPEC.md) for the full bootstrap pattern.

## Two import surfaces

- `@pressmaximum/dashboard-kit` — core (router, shell, layouts, settings, welcome, helpers). ~10-15 KB gzip.
- `@pressmaximum/dashboard-kit/datasets` — DataViews-heavy list pages (opt-in; pulls `@wordpress/dataviews`). ~50 KB gzip extra.

Importing nothing from `/datasets` means webpack never traverses it. See [docs/SPEC.md §7](docs/SPEC.md).

## Theming

CSS custom properties on `:root` — override at any scope. See [docs/SPEC.md §16.1](docs/SPEC.md) for the full token table.

```css
.my-dashboard-root {
	--pmdk-color-accent: #ff6b35;
	--pmdk-radius-small: 6px;
}
```

## Compatibility matrix

> Filled in as the kit lands real components. Placeholder per [SPEC §12.5](docs/SPEC.md).

| Kit version | WordPress | `@wordpress/components` | `@wordpress/dataviews` (optional) | Notes |
| ----------- | --------- | ----------------------- | --------------------------------- | ----- |
| 0.x         | ≥ 6.5     | ≥ 29                    | ≥ 14                              | Pre-1.0 — breaking changes allowed in minor versions. |

## Development

```bash
npm install         # devDeps
npm run build       # webpack + tsc emit (build/)
npm run dev         # webpack watch
npm run lint        # ESLint — enforces i18n-clean rule (SPEC §6.1)
npm run test        # vitest
npm run storybook   # local component catalogue
npm run size        # bundle-size check
```

`packages/test-consumer/` is a throwaway WordPress plugin used to smoke-test the kit inside a real WP admin. See its [README](packages/test-consumer/README.md).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
