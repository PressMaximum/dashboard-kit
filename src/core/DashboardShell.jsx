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
 *   .pmdk-dashboard__brand-icon, __brand-text, __brand-link,
 *   __header-right, .pmdk-dashboard__version
 * And two root-level data markers, both emitted by this component:
 *   [data-container-width]  narrow | wide | flush   (§5.1)
 *   [data-utility-tabs]     present only when a tab carries
 *                           `align: 'end'` (K-042)
 */

import { activeTabId, useNavigate, useRoute } from './HashRouter';
import { useFocusOnRouteChange } from './useFocusOnRouteChange';
import TabStrip from './TabStrip';
import HelpPanel from './HelpPanel';
import SnackbarSlot from './SnackbarSlot';

import './DashboardShell.css';

/** Accepted `containerWidth` modes (SPEC §5.1). Anything else ⇒ `narrow`. */
const CONTAINER_WIDTHS = [ 'narrow', 'wide', 'flush' ];

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
	// viewport; `'flush'` also removes the gutter for a full-bleed surface
	// that owns its own padding (K-043). SPEC §5.1 + §11 hack #3. See
	// DashboardShell.css.
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
	const brandHref = brand?.href;
	const brandAriaLabel = brand?.ariaLabel;

	// `flush` (K-043) joins `narrow` / `wide` as a third mode: no cap, no
	// margin and NO PADDING, so a full-bleed surface (the settings shell's
	// rail sitting against the content-area edge) owns its own gutters.
	// Unknown values still fall back to `narrow`, exactly as before.
	const safeContainerWidth = CONTAINER_WIDTHS.includes( containerWidth )
		? containerWidth
		: 'narrow';

	// K-042: the header grid is `1fr auto 1fr` with a CONTENT-SIZED centre
	// track, so an end-aligned tab run cannot be produced by auto margins
	// inside the nav — the track has to widen. The shell publishes the fact
	// that a utility run exists as a root-level marker and
	// DashboardShell.css changes the template behind it, so a consumer
	// passing no `align: 'end'` keeps the original three-track geometry.
	const hasUtilityTabs =
		Array.isArray( tabs ) && tabs.some( ( tab ) => tab?.align === 'end' );

	// Inner content of the `<h1>` brand cluster. Reused twice so the
	// linked + static variants don't duplicate the icon/text markup.
	const brandContent = (
		<>
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
		</>
	);

	return (
		<div
			className="pmdk-dashboard"
			data-container-width={ safeContainerWidth }
			{ ...( hasUtilityTabs ? { 'data-utility-tabs': 'true' } : {} ) }
		>
			<header className="pmdk-dashboard__header">
				<h1 className="pmdk-dashboard__brand">
					{ brandHref ? (
						<a
							className="pmdk-dashboard__brand-link"
							href={ brandHref }
							aria-label={ brandAriaLabel }
							onClick={ onNavigate( brandHref ) }
						>
							{ brandContent }
						</a>
					) : (
						brandContent
					) }
				</h1>

				<TabStrip
					items={ tabs }
					activeId={ activeId }
					activeRoute={ route }
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
