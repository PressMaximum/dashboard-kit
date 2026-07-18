/**
 * Public entry `@pressmaximum/dashboard-kit/primitives` — headless behavior
 * modules (KIT-P3).
 *
 * Framework-agnostic controllers that pair with the `primitives/style.css`
 * class contract. No React is required (slice 1 ships the combobox; the
 * tablist / resizer / preferences behaviors land in later slices). React
 * components that build ON these primitives (e.g. <PMDKDataTable>) live in the
 * separate `@pressmaximum/dashboard-kit/table` entry.
 */

export { createCombobox, buildComboboxMarkup } from './combobox.js';
