/**
 * Public entry `@pressmaximum/dashboard-kit/primitives` — headless behavior
 * modules (KIT-P3).
 *
 * Framework-agnostic controllers that pair with the `primitives/style.css`
 * class contract. No React is required. Slice 1 ships the combobox; slice 3
 * the menu/popover (G4) + inspector resizer; slice 4 the tablist. React
 * components that build ON these primitives (e.g. <PMDKDataTable>) live in the
 * separate `@pressmaximum/dashboard-kit/table` entry.
 */

export { createCombobox, buildComboboxMarkup } from './combobox.js';
export { createMenu } from './menu.js';
export { createInspectorResizer } from './resizer.js';
export { createTablist } from './tablist.js';
