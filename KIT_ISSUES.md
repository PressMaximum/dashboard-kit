# Kit issues

Living list of bugs / rough edges in `@pressmaximum/dashboard-kit` surfaced from
consumer integration. Different from [`docs/SPEC.md` §11](docs/SPEC.md) (the
"spike-hacks → kit fixes" roadmap) — this file tracks the **kit's own** defects
discovered when real consumers wire the public API.

Goal: catch issues once at the kit level + fix them in a single kit patch
release, instead of every consumer pasting the same workaround locally.

## How to use this file

When you find a kit bug while integrating, append a row to the table below:

- **Symptom** — what the user sees / what breaks. Concrete and reproducible.
- **Root cause** — where in the kit (file + line / class / API) the bug lives.
- **Consumer workaround** — the override the consumer is currently shipping
  to mask the bug. Cite the commit / file path so the workaround can be
  reverted once the kit fix lands.
- **Proper kit fix** — the change to land in the kit. Sketch the approach.
- **Target version** — kit version where the fix is expected to ship.
- **Discovered by** — consumer name + date so we can ping if the workaround
  pattern needs to evolve.

Keep entries short — link out to a kit PR / discussion thread for long
discussions. Each row gets a stable anchor (the **Issue** column key) so
consumer commit messages + workaround code comments can reference it.

## Open issues

| Issue | Symptom | Root cause | Consumer workaround | Proper kit fix | Target | Discovered |
|---|---|---|---|---|---|---|

(none open)

## Closed issues

| Issue | Symptom | Fix | Shipped in | Consumer revert |
|---|---|---|---|---|
| `K-001` color-cascade-pin | Tab/SubNav/version/CURRENT-pill/SaveBar-dirty all paint with `:root`-level `--wp-admin-theme-color` (legacy `#007cba`) instead of body-level scheme (`#3858e9` on modern fresh). | [`src/styles/tokens.css`](src/styles/tokens.css) moves the `--pmdk-color-accent` declaration off `:root` to `body.wp-admin, .pmdk-dashboard` so it resolves at a cascade level that sees the body-level `--wp-admin-theme-color`. Other tokens (`text`, `bg`, `border`, etc.) stay at `:root`. | `0.1.0` | Drop the K-001 override block in `src/dashboard/style.css` (Blocksify commits [`c04b6b6`](https://github.com/pressmaximum/blocksify/commit/c04b6b6), [`e944d92`](https://github.com/pressmaximum/blocksify/commit/e944d92)). |
| `K-002` checklist-double-chrome | Kit's `<Checklist>` ships `border + background + border-radius` on `.pmdk-checklist`, conflicting with the component's own docstring ("consumer wraps in Card"). Consumers that compose `<Card><Checklist/></Card>` get visible double-card nesting. | [`src/welcome/Checklist.css`](src/welcome/Checklist.css) drops `background`, `border`, `border-radius` from `.pmdk-checklist`. Kit keeps semantic `<section>` + a11y label; chrome belongs to the consumer's surrounding `<Card>` (or any other wrapper they choose). | `0.1.0` | No revert needed — Blocksify's `<Card>` wrap is now the single chrome. |
| `K-003` hero-defaults-bare | Kit's `.pmdk-hero` used a generic white + 1px border + 4px radius + 24px title look, losing the WP `about.php`-distilled feel the kit was originally designed to ship. Welcome surfaces read as a thin form instead of a hero band. | [`src/welcome/Hero.css`](src/welcome/Hero.css) restores: `padding: 48px`, `background: #ececec` (matches WP's `about.__header`), `border: 0`, `border-radius: 8px`, `.pmdk-hero__title { font-size: 28px }`, `.pmdk-hero__tagline { margin: 8px 0 24px; font-size: 15px; max-width: 56ch }`. Layout primitives (flex direction, mobile breakpoint) unchanged. | `0.1.0` | Blocksify's `.bsy-dashboard-welcome-hero*` rules were dropped during the P2 migration; the kit now ships the same look natively. No re-add needed. |
| `K-004` compare-thin-look | `.pmdk-compare__head-cell` + `__section-title` + `__row` styles diverged from the Blocksify-distilled rich look. Section titles rendered as bare text (no tinted band), rows had per-cell padding instead of per-row inset, head row used 12px/0.04em letterspacing instead of 11px/0.08em uppercase. | [`src/compare/CompareTable.css`](src/compare/CompareTable.css) re-aligns head/section-title/row + CTA banner. Per-row `padding: 14px 24px` on `__head + __row` (replacing per-cell padding). Section title gets `background: var(--pmdk-color-bg-subtle)`, `font-size: 11px`, `letter-spacing: 0.08em`, `text-transform: uppercase`. CTA banner gets the cream `#fffbf0` + yellow `#f0d57c` hairline border. New `.pmdk-compare__rows` wrapper class for flex row stack. | `0.1.0` | Blocksify's `.bsy-dashboard-compare*` rules were dropped during P4 migration; kit now ships the rich look natively. |
| `K-005` schema-form-no-spacing | `<SchemaForm>` rendered fields back-to-back with only their `@wordpress/components` margins between them. No spacing rule on `.pmdk-schema-form` meant consumers re-added their own `.consumer-settings__fields { gap: 20px }` wrapper. | New [`src/settings/SchemaForm.css`](src/settings/SchemaForm.css) imports from `SchemaForm.jsx`. Adds `.pmdk-schema-form { display: flex; flex-direction: column; gap: 20px }` so the kit ships the visual baseline by default. Locked-class status documented inline (public surface from 1.0). | `0.1.0` | Blocksify dropped `.bsy-dashboard-settings__fields { gap: 20px }` during P3 migration; the kit's pmdk-schema-form rule replaces it. |
| `K-006` category-badge-left-align | `.pmdk-category-badge` is `display: inline-flex` with `min-width: 72px` but no horizontal centering. Short labels (`NEW`, `FIX`, `NEW`) hug the left edge of the pill, looking off-balance next to the variable-width pill chrome. | [`src/changelog/CategoryBadge.css`](src/changelog/CategoryBadge.css) adds `justify-content: center` to `.pmdk-category-badge`. The min-width still makes the pill visually consistent; the label now sits at the optical centre regardless of length. | `0.1.0` | No consumer change needed — kit fix only. |
