/**
 * Public entry `@pressmaximum/dashboard-kit/table` — the shared data-table
 * (KIT-P3, Q13).
 *
 * Opt-in sub-entry. Since 0.2.1 (K-019) `@tanstack/react-table` and
 * `@dnd-kit/core|sortable|utilities` are OPTIONAL PEER dependencies rather
 * than bundled copies: a consumer importing this path installs them itself
 * and owns the version, and one already using TanStack/dnd-kit no longer gets
 * a second private copy. react/react-dom/`react/jsx-runtime`/@wordpress/* are
 * external as before. Consumers that never import this path pull none of that
 * weight — Blocksify keeps its current bundle untouched. Styles come from
 * `@pressmaximum/dashboard-kit/primitives/style.css` (slice 2 tier).
 */

export {
	PMDKDataTable,
	normalizeColumnOrder,
} from './PMDKDataTable.jsx';
export { defaultRenderIcon } from './icons.jsx';
export {
	useTablePersistence,
	readTablePrefs,
	writeTablePrefs,
} from './useTablePersistence.js';
