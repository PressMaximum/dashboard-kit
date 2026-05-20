/**
 * DashboardShell — Tier-1 layout primitive (SPEC §5.13). Composes the
 * header (brand + tabs + version + help slot) + a focus-managed main
 * region + a fixed-position snackbar slot.
 *
 * Resolves the active route internally via `useRoute( routes,
 * initialRoute )` so consumers don't have to thread the matched entry
 * through props. Renders `entry.component` with `{ route, params,
 * entry }` so consumer components can access arbitrary fields the
 * consumer attached to the route entry (e.g. Blocksify's `proFeature`
 * marker — consumer-specific; kit forwards without inspecting).
 *
 * Every visible string lives behind a prop. The shell renders zero
 * translatable text on its own.
 *
 * SPEC §16.2 locked classes used here:
 *   .pmdk-dashboard
 *   .pmdk-dashboard__header
 *   .pmdk-dashboard__brand
 *   .pmdk-dashboard__main
 * Plus non-locked styling hooks:
 *   .pmdk-dashboard__brand-icon, __brand-text, __header-right,
 *   .pmdk-dashboard__version
 */

import { activeTabId, useNavigate, useRoute } from './HashRouter';
import { useFocusOnRouteChange } from './useFocusOnRouteChange';
import TabStrip from './TabStrip';
import HelpPanel from './HelpPanel';
import SnackbarSlot from './SnackbarSlot';

import './DashboardShell.css';

function renderMain( { ActiveComponent, NotFound, route, params, entry, fallback } ) {
	if ( ActiveComponent ) {
		return (
			<ActiveComponent route={ route } params={ params } entry={ entry } />
		);
	}
	if ( NotFound ) {
		return <NotFound route={ route } params={ params } />;
	}
	return fallback || null;
}

export default function DashboardShell( {
	// Brand cluster
	brand,
	// Tabs
	tabs,
	tabsAriaLabel,
	// Routes
	routes,
	initialRoute = '#welcome',
	// Layout — `'narrow'` (default) caps the reading column at 1100px;
	// `'wide'` removes the cap so DataViews-heavy pages can fill the
	// viewport. SPEC §5.1 + §11 hack #3. See DashboardShell.css.
	containerWidth = 'narrow',
	// Optional version anchor
	versionLabel,
	versionHref,
	versionAriaLabel,
	// Optional help cluster
	helpItems,
	helpLabels,
	helpIcon,
	helpItemIcon,
	// Fallbacks when route doesn't resolve a component
	notFoundComponent: NotFound,
	fallback,
	// Optional snackbar override
	snackbar,
} ) {
	const { route, entry, params } = useRoute( routes, initialRoute );
	const onNavigate = useNavigate();
	const mainRef = useFocusOnRouteChange( route );

	const ActiveComponent = entry?.component;
	const activeId = activeTabId( route );

	const brandName = brand?.name;
	const brandIcon = brand?.icon;

	// Per-route override beats the mountDashboard-level prop. Lets a
	// single page (Welcome with a sidebar layout, list pages with
	// DataViews, etc.) opt into the full-viewport `wide` chrome while
	// sibling tabs keep the default `narrow` reading column.
	// Route entry shape: `{ component, type, containerWidth?, ... }`.
	const routeContainerWidth =
		entry?.containerWidth === 'wide' || entry?.containerWidth === 'narrow'
			? entry.containerWidth
			: null;
	const safeContainerWidth =
		routeContainerWidth ||
		( containerWidth === 'wide' ? 'wide' : 'narrow' );

	return (
		<div
			className="pmdk-dashboard"
			data-container-width={ safeContainerWidth }
		>
			<header className="pmdk-dashboard__header">
				<h1 className="pmdk-dashboard__brand">
					{ brandIcon && (
						<span
							className="pmdk-dashboard__brand-icon"
							/* eslint-disable-next-line react/no-danger -- SVG is consumer-controlled boot data, not user input. */
							dangerouslySetInnerHTML={ {
								__html: brandIcon,
							} }
						/>
					) }
					{ brandName && (
						<span className="pmdk-dashboard__brand-text">
							{ brandName }
						</span>
					) }
				</h1>

				<TabStrip
					items={ tabs }
					activeId={ activeId }
					ariaLabel={ tabsAriaLabel }
				/>

				<div className="pmdk-dashboard__header-right">
					{ versionLabel &&
						( versionHref ? (
							<a
								className="pmdk-dashboard__version"
								href={ versionHref }
								aria-label={ versionAriaLabel }
								onClick={ onNavigate( versionHref ) }
							>
								{ versionLabel }
							</a>
						) : (
							<span
								className="pmdk-dashboard__version"
								aria-label={ versionAriaLabel }
							>
								{ versionLabel }
							</span>
						) ) }
					{ Array.isArray( helpItems ) && helpItems.length > 0 && (
						<HelpPanel
							items={ helpItems }
							labels={ helpLabels }
							icon={ helpIcon }
							itemIcon={ helpItemIcon }
						/>
					) }
				</div>
			</header>

			<main
				ref={ mainRef }
				className="pmdk-dashboard__main"
				role="main"
				tabIndex={ -1 }
			>
				{ renderMain( {
					ActiveComponent,
					NotFound,
					route,
					params,
					entry,
					fallback,
				} ) }
			</main>

			{ snackbar !== undefined ? snackbar : <SnackbarSlot /> }
		</div>
	);
}
