# Adopting the dashboard kit

> Consumer-facing guide: take a plugin from "no kit" to "kit-powered admin SPA"
> without reading another product's source. Written product-agnostically —
> substitute your own slug, handle and text domain throughout.
>
> Companion reading: [`README.md`](../README.md) for the 30-line minimal mount,
> [`docs/SPEC.md`](SPEC.md) for the full API, and
> [`KIT_ISSUES.md`](../KIT_ISSUES.md) for known bugs before you integrate.

Two copy-pasteable templates ship with this guide:

| Template | Purpose |
| --- | --- |
| [`docs/templates/admin-page-sample.php`](templates/admin-page-sample.php) | Menu registration + manifest-driven enqueue + SPA mount markup |
| [`docs/templates/brand-bridge-template.css`](templates/brand-bridge-template.css) | Commented `--pmdk-*` token bridge with placeholder values |

---

## 1. Prerequisites

**A `@wordpress/scripts` build is the zero-friction path.** The kit externalizes
`react`, `react-dom`, `react/jsx-runtime` and every `@wordpress/*` import, so
those must be resolved by the host page rather than bundled. wp-scripts already
does exactly that: its `DependencyExtractionWebpackPlugin` turns each external
into a WordPress script handle and writes them into `*.asset.php`, which your
PHP reads back. `react` and `react-dom` come from WP admin itself, so your bundle
ships neither. Any other bundler works, but you take on the externals mapping
and the dependency manifest yourself.

**Node ≥ 20** (`package.json` `engines`), matching the kit's own CI.

**Install, pinned to a tag:**

```bash
npm install github:PressMaximum/dashboard-kit#v0.2.1
```

Tags are the release channel. **Never depend on a branch** — a branch moves
under you, and the built `build/` artifacts you consume move with it. Bump
deliberately by editing the tag.

The kit also ships a composer package for the PHP-side helpers
(`AssetEnqueue`, `MenuHelpers`, `EditorIntegration`, `SchemaBuilder`,
`SettingsControllerBase`, `PreviewEndpointRegistrar`) — optional, and this guide's PHP template
deliberately uses none of them so you can see the plain WordPress calls:

```bash
composer require pressmaximum/dashboard-kit
```

---

## 2. Import surfaces

Each subpath is its own bundle entry. Importing nothing from a subpath means
your bundler never traverses it.

| Import | Contains | Third-party peers you must install |
| --- | --- | --- |
| `@pressmaximum/dashboard-kit` | **Shell** `mountDashboard`, `DashboardShell`, `TabStrip`, `HelpPanel`, `SnackbarSlot`, `createFilterNamespace`, `createI18nBag`, `useFocusOnRouteChange`<br>**Boot** `readBoot`, `BootProvider`, `BootContext`, `useBoot`<br>**Router** `readHash`, `navigate`, `useHash`, `useRoute`, `useNavigate`, `matchRoute`, `activeTabId`, `NavigationGuardProvider`, `NavigationGuardContext`<br>**Layouts** `PageWrapper`, `ListPageHeader`, `EditorPageHeader`, `EditorViewLayout`, `SubNav`<br>**Settings** `SchemaForm`, `SchemaField`, `panelHeadingId`, `SaveBar`, `createSettingsStore`, `BASE_FIELD_TYPES`, `useDirtyState`, `isAnyDirty`, `confirmDiscardAny`<br>**Welcome** `Hero`, `Checklist`, `ChecklistItem`, `createOnboardingStore`<br>**Marketing** `CompareTable`, `ReleaseBlock`, `CategoryBadge` | none |
| `@pressmaximum/dashboard-kit/primitives` | Headless DOM behaviours, **React-free**: `createCombobox` + `buildComboboxMarkup`, `createMenu`, `createInspectorResizer`, `createTablist` | none |
| `@pressmaximum/dashboard-kit/table` | `PMDKDataTable`, `normalizeColumnOrder`, `defaultRenderIcon`, `useTablePersistence`, `readTablePrefs`, `writeTablePrefs` | **yes — see below** |
| `@pressmaximum/dashboard-kit/module-card` | `PMDKModuleCard` | none |
| `@pressmaximum/dashboard-kit/datasets` | DataViews list pages: `EntityListPage`, `EntityPreviewFrame`, `ViewPersistence`, `filterTrashByDefault`. Legacy tier — kept for existing consumers | `@wordpress/dataviews` (optional peer) |
| `@pressmaximum/dashboard-kit/editor-helpers` | Fullscreen-editor handoff: `rewireBackButton`, `forceFullscreenMode`, `registerSubmenuActive` | none |

Stylesheets are separate subpaths: `.../style.css` (core),
`.../primitives/style.css`, `.../datasets/style.css`, `.../themes/app.css`.

### Optional peers for `./table`

Since 0.2.1 the table entry **imports** TanStack + dnd-kit instead of bundling
private copies (K-019), so a consumer already using them stops shipping two and
owns the version:

```bash
npm install @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

They are `optional` in `peerDependenciesMeta`, so if you never import `./table`
you install nothing and npm stays quiet. No other entry has third-party deps.

The accepted ranges are deliberately wide, because npm raises `ERESOLVE` on an
out-of-range peer even when it is optional — a narrow range would force you into
`overrides`:

| Peer | Kit range | Why |
| --- | --- | --- |
| `@dnd-kit/core` | `>=6 <7` | 6.x is the newest major; the kit only uses `DndContext`, `closestCenter`, `PointerSensor`, `KeyboardSensor`, `useSensor(s)` |
| `@dnd-kit/sortable` | `>=8 <11` | `SortableContext`, `useSortable`, `arrayMove`, `sortableKeyboardCoordinates`, `verticalListSortingStrategy` are unchanged across 8, 9 and 10 |
| `@dnd-kit/utilities` | `>=3 <4` | 3.x is the newest major; only `CSS` is used |
| `@tanstack/react-table` | `>=8 <9` | No v9 exists; the kit uses the v8 core surface (`useReactTable`, `flexRender`, `getCoreRowModel`, `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`) |

Note that `@dnd-kit/sortable` carries its own peer on `@dnd-kit/core` (v10
requires `^6.3.0`), so that pairing constrains you regardless of the kit.

### Never import the barrel in a consumer bundle

Import from the exact subpath you need:

```js
// Good — the bundler only walks the table entry.
import { PMDKDataTable } from '@pressmaximum/dashboard-kit/table';
import { createMenu } from '@pressmaximum/dashboard-kit/primitives';

// Bad — pulls the core entry in for one table symbol, and can drag
// @wordpress/dataviews into a dashboard that has no list pages.
import { PMDKDataTable } from '@pressmaximum/dashboard-kit';
```

The subpaths are not aliases of one barrel: they are independent entries with
independent dependency sets. Mixing them up is the single easiest way to double
your admin bundle.

---

## 3. Enqueue + shell boilerplate

Start from
[`docs/templates/admin-page-sample.php`](templates/admin-page-sample.php) — copy
it into your plugin, rename the class and constants, and delete what you do not
need. It is syntax-checked and covers:

- **One page, hash routes.** A single `add_menu_page()` whose submenu items are
  `admin.php?page=<slug>#<route>` deep-links, so the whole dashboard is one PHP
  page load. The first submenu re-uses the parent slug so the default landing
  renders the app. Keep the route ids identical to your `baseTabs` /
  `baseRoutes` keys, and call `registerSubmenuActive()` client-side to sync the
  highlighted child.
- **Manifest-driven enqueue.** Deps and version come from the `*.asset.php`
  wp-scripts emits. Because the kit externalizes `react/jsx-runtime`, the handle
  **`react-jsx-runtime`** appears in that array automatically — do not
  hand-maintain the dependency list, and do not strip that handle.
- **Style order** (details in §4): the kit's extracted `style-admin.css` chunk
  first, then your own `admin.css`, declared as its dependency.
  `wp_enqueue_style( 'wp-components' )` too — the kit's core components render
  `@wordpress/components` UI and that stylesheet is not enqueued for you.
- **Boot payload** via `wp_add_inline_script( …, 'before' )`, so
  `window[ bootGlobal ]` exists before the bundle runs.
- **Mount markup**: an outer element owning theming state (your token-scope
  class, the optional `.pmdk-theme-app`, the colour-scheme attribute) wrapping
  the inner `.pmdk-dashboard` chassis whose `id` you hand to `rootEl`. Every
  `.pmdk-*` primitive rule is scoped under `.pmdk-dashboard`, so the chassis
  class is not optional.

The JS side is ~30 lines; see the README's minimal mount. `mountDashboard()`
takes `rootEl`, `bootGlobal`, `filterNamespace`, `brand`, `baseTabs`,
`baseRoutes`, `tabsAriaLabel`, `helpItems`, `versionLabel`/`versionHref`,
`initialRoute` (default `'#welcome'`), `containerWidth` (`'narrow'` default /
`'wide'` for DataViews), `notFoundComponent`, `fallback`, and returns
`{ unmount }`. It also applies your `filterNamespace`'s `tabs`, `routes` and
`version-label` filters before first render, which is how a Pro add-on extends a
Free host. Full contract: [SPEC §5.1](SPEC.md#51-mountdashboardconfig).

---

## 4. Branding via bridge

The kit's visual surface is CSS custom properties, not class overrides. It
derives most of the palette: you set a handful of **seeds** and **weights** and
~thirty roles recompute through `color-mix()` at the point of use. Set
`--pmdk-color-text` and every muted-text, subtle-surface and strong-border role
follows.

Copy
[`docs/templates/brand-bridge-template.css`](templates/brand-bridge-template.css)
and replace the `REPLACE:` values. It enumerates the real token names by family
— surface (`--pmdk-color-bg`, `-canvas`, `--pmdk-dashboard-bg`), text
(`--pmdk-color-text`), border (`--pmdk-color-border`, `-subtle`), accent
(`--pmdk-color-accent`, `-rgb`), status
(`--pmdk-color-success|warning|danger|info`), radius (`--pmdk-radius-small`,
`-control`, `-card`, `-pill`), spacing (`--pmdk-spacing-unit`,
`--pmdk-space-0…8`, `--pmdk-content-gutter`, `--pmdk-header-gutter`), type, size
and motion — plus the derivation weights (`--pmdk-tone-*`).

**Load order.** Each layer must come after the one above it:

1. kit base — `@pressmaximum/dashboard-kit/style.css` (+ `primitives/style.css`)
2. kit theme, opt-in — `@pressmaximum/dashboard-kit/themes/app.css`
3. your brand bridge
4. your product chrome

With wp-scripts, importing the kit sheets from your admin entry puts them in the
extracted `style-admin.css` chunk while your own CSS lands in `admin.css` —
which is exactly why the PHP template enqueues the kit chunk first and makes it
a dependency of yours.

**The one cascade trap (K-001).** Most tokens are declared at `:root`, so a
`:root` override wins on source order. But `--pmdk-color-accent` and the
accent-derived roles are declared at `body.wp-admin, .pmdk-dashboard,
.pmdk-theme-app` so they can see WordPress's `--wp-admin-theme-color`. An accent
override at `:root` therefore **loses**. Scope brand accent to your dashboard
scope class instead — the template shows the selector.

**Type scale shortcut.** If you want the packaged 16px/6px-radius "app look"
rather than WP-native defaults, import `themes/app.css` and add
`.pmdk-theme-app` — do not retype the scale in your bridge.

---

## 5. Migration strategy

**One page at a time.** The kit mounts into one admin page; every other screen
in your plugin is untouched. So:

1. Pick the page with the least product logic and the most standard chrome — a
   **Modules** or **Settings** page is ideal. Modules needs only
   `PMDKModuleCard` plus your own grid; Settings needs `SchemaForm` + `SaveBar`.
2. Register it as a new SPA page (§3) with two or three `baseTabs`, and leave
   the old pages registered exactly as they are. Old `add_menu_page()` screens
   and the new SPA coexist with no shared state — different page loads.
3. Once it is live, move the next route in as a new tab. Because submenu items
   are hash deep-links into the same page, adding a route is a `baseTabs` +
   `baseRoutes` entry plus one `add_submenu_page()` line.
4. Retire an old page only when its SPA route reaches parity. There is no
   flag-day.

**What you get on kit upgrades.** The kit runs a 53-shot Storybook visual-
regression gate (`tests/vr-stories/`) plus a real-consumer before/after pass on
every change, and the rule is zero diff pixels unless a change is explicitly a
look change. That is the promise behind bumping a patch tag: fixes land, your
rendering does not move. The 0.2.x line has held it across four issue sweeps.
Corollary: if a bump *does* move your pixels, that is a kit bug — file it in
`KIT_ISSUES.md` rather than working around it locally.

Pre-1.0 caveat: semver still allows breaking **API** changes in a minor version
(0.2 → 0.3). The zero-look-change promise covers rendering on a patch bump, not
the export surface across minors — read `CHANGELOG.md` before a minor.

---

## 6. Gotchas

**Dark scheme is consumer-owned state.** The kit ships exactly one dark preset,
and only inside the opt-in app theme:
`.pmdk-theme-app[ data-pmdk-color-scheme='dark' ]` re-seeds text/bg/border and
lets every derived role recompute. What the kit does **not** ship: a
`prefers-color-scheme` default, persistence, a toggle control, or any JS that
sets the attribute. Deciding *when* dark is on — read a preference, consult
`matchMedia`, write the attribute early enough to avoid a flash — is your job,
typically a tiny inline script printed next to the mount node. Products that
ship dark without the app theme own the whole re-seed; the bridge template has a
worked example.

**Fixed-position menus and CSS containment (K-021).** `createMenu( root, {
position: 'fixed' } )` is safe under ancestors that reparent fixed descendants —
`transform`, `filter`, `contain: layout`, container queries and friends. It
nominates the nearest such ancestor, then probes the engine at three points and
only corrects when the mapping is a pure translation; a scaled, rotated, skewed
or 3D-projected ancestor falls back to uncorrected viewport coordinates rather
than being half-corrected. Practical consequences: you may put `container-type`
or `transform` on a shell wrapper above kit menus, but avoid **scaling or
rotating** an ancestor of a fixed-mode menu. The popover is not moved to the top
layer, so a paint-clipping ancestor (`overflow: hidden` on a containing block)
can still clip it. Details: [SPEC §5.12](SPEC.md).

**Open issue to know about: K-022.** `mountDashboard({ versionAriaLabel })` has
no effect when you pass no `versionHref` — the label lands on a bare `<span>`,
whose `generic` role prohibits naming, so screen readers drop it. Harmless
(nothing is announced *wrongly*) but do not rely on it for accessible naming
until it is resolved; pass `versionHref` if the chip should be a named link.
See [`KIT_ISSUES.md`](../KIT_ISSUES.md).

**Bundle-size ethos.** Every entry has a `size-limit` budget enforced in CI, and
the budgets are treated as a ratchet, not a suggestion — an entry that grows
past its limit fails the build and the fix is usually "move the dependency out",
not "raise the number". That is why `./table`'s deps became peers rather than
staying bundled. Two things follow for you: import subpaths precisely (§2), and
expect the kit to refuse features whose cost lands in every consumer's bundle.

**`screen-reader-text` is borrowed, not shipped.** A couple of kit components
render `<span class="screen-reader-text">`, which is a wp-admin class the kit
does not define. Inside wp-admin it is hidden as intended; if you render kit
components anywhere without wp-admin's stylesheet, define that class yourself or
the text becomes visible.
