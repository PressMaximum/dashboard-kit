/**
 * Public entry `@pressmaximum/dashboard-kit/settings-shell` — the
 * grouped-rail settings layout (K-043).
 *
 * Own sub-entry (mirrors `./module-card`) so the `./primitives` entry
 * stays React-free per its contract: this chunk imports React (external),
 * the headless primitives chunk must not. Zero third-party deps. Chrome
 * from `@pressmaximum/dashboard-kit/primitives/style.css`
 * (settings-shell.css) — the same opt-in tier that already carries the DS
 * save-bar chrome this shell composes with.
 *
 * Kept OUT of the core `index.mjs` for the same reason `./module-card` is:
 * consumers that never render a settings screen (Customify's lightweight
 * dashboard) should not traverse it.
 */

export { default as SettingsShell } from './SettingsShell.jsx';
export { default as SettingsNav } from './SettingsNav.jsx';
export { createSettingsTree } from './createSettingsTree.js';
