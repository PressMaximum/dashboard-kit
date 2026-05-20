/**
 * Public exports for the dashboard-kit npm package.
 *
 * Tree-shake surface per SPEC §7.1. Datasets-heavy exports live behind
 * the `/datasets` sub-entry so consumers that skip them never traverse
 * `@wordpress/dataviews`.
 *
 * Import path: `import { mountDashboard } from '@pressmaximum/dashboard-kit'`
 */

// Always-on token styles — components import their own per-component
// CSS, but the tokens layer must land first so the cascading defaults
// resolve before component rules apply.
import './styles/tokens.css';

/* ------------------------------------------------------------------------
 * Core — entry, shell, router, boot, filter namespace, helpers.
 * ------------------------------------------------------------------------ */
export { default as mountDashboard } from './core/mountDashboard';
export { default as DashboardShell } from './core/DashboardShell';
export { default as TabStrip } from './core/TabStrip';
export { default as HelpPanel } from './core/HelpPanel';
export { default as SnackbarSlot } from './core/SnackbarSlot';

export { createFilterNamespace } from './core/createFilterNamespace';

export {
	readBoot,
	BootProvider,
	BootContext,
	useBoot,
} from './core/BootDataLoader';

export {
	readHash,
	navigate,
	useHash,
	useRoute,
	matchRoute,
	activeTabId,
	useNavigate,
	NavigationGuardProvider,
	NavigationGuardContext,
} from './core/HashRouter';

export { useFocusOnRouteChange } from './core/useFocusOnRouteChange';
export { createI18nBag } from './core/createI18nBag';

/* ------------------------------------------------------------------------
 * Layouts — Tier-1 layout primitives. Zero translatable strings; text
 * arrives via props or slot children (SPEC §5.3 + §5.13).
 * ------------------------------------------------------------------------ */
export { default as PageWrapper } from './layouts/PageWrapper';
export { default as ListPageHeader } from './layouts/ListPageHeader';
export { default as EditorPageHeader } from './layouts/EditorPageHeader';
export { default as EditorViewLayout } from './layouts/EditorViewLayout';
export { default as SidebarPageLayout } from './layouts/SidebarPageLayout';
export { default as SubNav } from './layouts/SubNav';

/* ------------------------------------------------------------------------
 * Settings — schema-driven form + REST-backed @wordpress/data store
 * (SPEC §5.4). All Tier-1 / Tier-2 components accept text via props +
 * labels; no kit-side translatable strings.
 * ------------------------------------------------------------------------ */
export { createSettingsStore } from './settings/createSettingsStore.js';
export {
	useDirtyState,
	isAnyDirty,
	confirmDiscardAny,
} from './settings/useDirtyState.js';
export { default as SchemaForm, panelHeadingId } from './settings/SchemaForm.jsx';
export { default as SchemaField } from './settings/SchemaField.jsx';
export { default as SaveBar } from './settings/SaveBar.jsx';
export { BASE_FIELD_TYPES } from './settings/fieldTypes.jsx';

/* ------------------------------------------------------------------------
 * Welcome — hero card, onboarding checklist, user-meta-backed store.
 * SPEC §5.5. Tier-2 page components: every string ships via props /
 * labels with English fallbacks.
 * ------------------------------------------------------------------------ */
export { default as Hero } from './welcome/Hero.jsx';
export { default as Checklist } from './welcome/Checklist.jsx';
export { default as ChecklistItem } from './welcome/ChecklistItem.jsx';
export { createOnboardingStore } from './welcome/createOnboardingStore.js';

/* ------------------------------------------------------------------------
 * Compare — Free vs Pro matrix display. SPEC §5.3b.
 * ------------------------------------------------------------------------ */
export { default as CompareTable } from './compare/CompareTable.jsx';

/* ------------------------------------------------------------------------
 * Changelog — per-release card + category badge. SPEC §5.3b.
 * ------------------------------------------------------------------------ */
export { default as ReleaseBlock } from './changelog/ReleaseBlock.jsx';
export { default as CategoryBadge } from './changelog/CategoryBadge.jsx';

/* ------------------------------------------------------------------------
 * Version stamp — flipped via release tooling once 0.1.0 ships.
 * ------------------------------------------------------------------------ */
export const __KIT_VERSION__ = '0.0.0';
