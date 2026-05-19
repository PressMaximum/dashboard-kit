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
| `K-001` color-cascade-pin | Active tab text, SubNav active item, version anchor hover, Changelog "CURRENT" pill, SaveBar dirty-status all paint with the `:root`-level `--wp-admin-theme-color` (legacy `#007cba` on default fresh) instead of the user's actual scheme (`body.wp-admin` writes `#3858e9` in modern WP fresh). Visible mismatch when the user changes admin colour scheme — the dashboard chrome drifts from the rest of `wp-admin`. | [`src/styles/tokens.css`](src/styles/tokens.css) declares `:root { --pmdk-color-accent: var(--wp-admin-theme-color, #3858e9); }`. CSS custom-property evaluation freezes at the cascade level where it's declared — so `--pmdk-color-accent` resolves once at `:root` (where `--wp-admin-theme-color` still has its legacy value). Components downstream (`pmdk-dashboard__tab.is-active`, `pmdk-subnav__item.is-active`, `pmdk-release-block__current`, `pmdk-save-bar__status.is-dirty`, `pmdk-dashboard__tab:hover`, `pmdk-dashboard__version:hover`) read `--pmdk-color-accent` and inherit the frozen legacy value, ignoring the body-level scheme. | Blocksify (`blocksify@P8 follow-up`, commits [`c04b6b6`](https://github.com/pressmaximum/blocksify/commit/c04b6b6), [`e944d92`](https://github.com/pressmaximum/blocksify/commit/e944d92)) ships overrides in `src/dashboard/style.css` re-resolving directly off `var(--wp-admin-theme-color, ...)` on five surfaces: `.pmdk-dashboard__tab.is-active` + `:hover` + `:focus-visible`, `.pmdk-dashboard__tab.is-active` border-bottom, `.pmdk-dashboard__version:hover` + `:focus-visible`, `.pmdk-subnav__item.is-active`, `.pmdk-release-block__current`, `.pmdk-save-bar__status.is-dirty`. | Move the token declaration off `:root` so it resolves at a level that sees the body-level `--wp-admin-theme-color`: `body.wp-admin, .pmdk-dashboard { --pmdk-color-accent: var(--wp-admin-theme-color, #3858e9); }`. Storybook + standalone test pages (no `body.wp-admin`) fall back via `.pmdk-dashboard`. Theming consumers that override `--pmdk-color-accent` at `:root` keep working — their override wins on specificity. | `0.1.0` | Blocksify Free, 2026-05-20 |

## Closed issues

(none yet)
