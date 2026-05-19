/**
 * mountDashboard — bootstraps the dashboard SPA inside the consumer's
 * mount node. Called once per page load.
 *
 * Flow:
 *   1. Resolve `rootEl` (selector string OR element).
 *   2. Read the PHP-localized boot payload off `window[ bootGlobal ]`.
 *   3. Mint the consumer's filter channel names + apply the `tabs`,
 *      `routes`, and `version-label` filters so plugin extensions land
 *      before first render.
 *   4. Render `<DashboardShell />` inside a `<BootProvider />`.
 *
 * Returns `{ unmount }` so consumers can tear down the SPA (rarely
 * needed in WP admin; useful for tests).
 *
 * Config shape locked at SPEC §5.1.
 */

import { createRoot } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

import DashboardShell from './DashboardShell';
import { BootProvider, readBoot } from './BootDataLoader';
import { createFilterNamespace } from './createFilterNamespace';
import { NavigationGuardProvider } from './HashRouter';
import { confirmDiscardAny } from '../settings/useDirtyState.js';

/**
 * Normalize a tab entry to the shape `TabStrip` expects. Accepts a
 * string id (treated as `{ id, label: id, hash: '#'+id }`) or a partial
 * object. `hash` is derived from `id` when omitted.
 *
 * @param {string | { id: string, label?: string, hash?: string }} tab Raw tab entry.
 * @return {{ id: string, label: string, hash: string }} Normalized tab.
 */
function toTabShape( tab ) {
	if ( typeof tab === 'string' ) {
		return { id: tab, label: tab, hash: '#' + tab };
	}
	return {
		...tab,
		hash: tab.hash || '#' + tab.id,
	};
}

export function mountDashboard( config ) {
	if ( ! config || typeof config !== 'object' ) {
		throw new TypeError(
			'mountDashboard: config object is required (SPEC §5.1).',
		);
	}

	const {
		rootEl,
		bootGlobal,
		filterNamespace,
		// `__` is intentionally NOT destructured. SPEC §5.1 documents
		// it as "recommended" pre-1.0 — Tier-2 components own their own
		// label-merging via `createI18nBag`, so no kit code needs the
		// callback yet. Consumers may still pass it in for forward
		// compatibility; it sits in `config` unused.
		brand,
		baseTabs,
		baseRoutes,
		tabsAriaLabel,
		helpItems,
		helpLabels,
		helpIcon,
		helpItemIcon,
		versionLabel,
		versionHref,
		versionAriaLabel,
		initialRoute = '#welcome',
		notFoundComponent,
		fallback,
		// `'narrow'` (default) → 1100px reading column.
		// `'wide'`             → full viewport, DataViews-friendly. SPEC §5.1.
		containerWidth = 'narrow',
	} = config;

	if ( ! filterNamespace ) {
		throw new TypeError(
			'mountDashboard: `filterNamespace` is required (SPEC §5.1).',
		);
	}

	const node =
		typeof rootEl === 'string'
			? document.querySelector( rootEl )
			: rootEl;

	if ( ! node ) {
		// eslint-disable-next-line no-console
		console.error(
			'[@pressmaximum/dashboard-kit] mountDashboard: rootEl not found:',
			rootEl,
		);
		return null;
	}

	const boot = readBoot( bootGlobal );
	const FILTERS = createFilterNamespace( filterNamespace );

	const tabs = applyFilters(
		FILTERS.tabs,
		Array.isArray( baseTabs ) ? [ ...baseTabs ] : [],
	).map( toTabShape );

	const routes = applyFilters( FILTERS.routes, { ...( baseRoutes || {} ) } );

	const filteredVersionLabel =
		versionLabel !== undefined
			? applyFilters( FILTERS.versionLabel, versionLabel, boot )
			: undefined;

	const root = createRoot( node );
	root.render(
		<BootProvider boot={ boot }>
			<NavigationGuardProvider guard={ confirmDiscardAny }>
				<DashboardShell
					brand={ brand }
					tabs={ tabs }
					tabsAriaLabel={ tabsAriaLabel }
					routes={ routes }
					initialRoute={ initialRoute }
					containerWidth={ containerWidth }
					versionLabel={ filteredVersionLabel }
					versionHref={ versionHref }
					versionAriaLabel={ versionAriaLabel }
					helpItems={ helpItems }
					helpLabels={ helpLabels }
					helpIcon={ helpIcon }
					helpItemIcon={ helpItemIcon }
					notFoundComponent={ notFoundComponent }
					fallback={ fallback }
				/>
			</NavigationGuardProvider>
		</BootProvider>,
	);

	return {
		unmount: () => root.unmount(),
	};
}

export default mountDashboard;
