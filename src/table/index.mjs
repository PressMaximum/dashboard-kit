/**
 * Public entry `@pressmaximum/dashboard-kit/table` — the shared data-table
 * (KIT-P3, Q13).
 *
 * Opt-in sub-entry: bundles @tanstack/react-table + @dnd-kit (react/react-dom
 * and @wordpress/* stay external). Consumers that never import this path pull
 * none of that weight — Blocksify keeps its current bundle untouched. Styles
 * come from `@pressmaximum/dashboard-kit/primitives/style.css` (slice 2 tier).
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
