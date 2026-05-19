/**
 * PMDK Test Consumer — dashboard entry.
 *
 * Minimal real-consumer wiring of `mountDashboard` for end-to-end smoke
 * testing the kit in a live WordPress admin. Three trivial tabs each
 * rendering inline copy — enough to exercise the tab strip, hash router,
 * help panel, version anchor, and snackbar slot without dragging in the
 * Settings / Welcome / Datasets surfaces (those land in P3+).
 *
 * Dev loop:
 *   1. From repo root:  npm link
 *   2. From this dir:   npm link @pressmaximum/dashboard-kit
 *   3. Symlink this plugin into a local WP install's wp-content/plugins/
 *      and activate. The menu lives under "PMDK Test".
 *   4. Edit kit src/ → npm run build → reload WP admin.
 */

import { mountDashboard } from '@pressmaximum/dashboard-kit';
import { __ } from '@wordpress/i18n';

function WelcomePage() {
	return (
		<div style={ { padding: 24 } }>
			<h2>{ __( 'Welcome', 'pmdk-test-consumer' ) }</h2>
			<p>
				{ __(
					'Kit mount smoke test. Switch tabs to verify the hash router + focus management; open the help dropdown to verify HelpPanel; trigger a snackbar via the browser console with:',
					'pmdk-test-consumer',
				) }
			</p>
			<pre>
				{
					"wp.data.dispatch('core/notices').createSuccessNotice('Hi', { type: 'snackbar' });"
				}
			</pre>
		</div>
	);
}

function DocsPage() {
	return (
		<div style={ { padding: 24 } }>
			<h2>{ __( 'Docs', 'pmdk-test-consumer' ) }</h2>
			<p>
				{ __(
					'Placeholder route. Verifies that param-less routes resolve through `matchRoute`.',
					'pmdk-test-consumer',
				) }
			</p>
		</div>
	);
}

function ChangelogPage( { params } ) {
	return (
		<div style={ { padding: 24 } }>
			<h2>{ __( 'Changelog', 'pmdk-test-consumer' ) }</h2>
			<p>
				{ __( 'Active source id (route param):', 'pmdk-test-consumer' ) }{ ' ' }
				<code>{ params?.id ?? '(none)' }</code>
			</p>
			<p>
				{ __(
					'Try visiting #changelog/v0 or #changelog/v1 to verify :id parameter extraction.',
					'pmdk-test-consumer',
				) }
			</p>
		</div>
	);
}

// Flip this to `'wide'` to exercise the P2 DataViews-friendly chain in
// a real WP admin (full viewport, 24px vertical padding). Default is
// `'narrow'` (1100px reading column) so the smoke run also covers the
// path that Welcome / Settings / Changelog tabs use in production.
// Real DataViews validation lands with P6 EntityListPage.
const CONTAINER_WIDTH = 'narrow';

mountDashboard( {
	rootEl: '#pmdk-test-dashboard',
	bootGlobal: 'pmdkTestDashboard',
	filterNamespace: 'pmdk-test',
	containerWidth: CONTAINER_WIDTH,
	// SPEC §5.1: `__` is recommended; becomes required at P3 when Tier-2
	// default labels consume it. P1 ignores it, so the test-consumer
	// omits the wrapper for now.
	brand: {
		name: __( 'PMDK Test', 'pmdk-test-consumer' ),
	},
	tabsAriaLabel: __( 'Test dashboard sections', 'pmdk-test-consumer' ),
	baseTabs: [
		{ id: 'welcome', label: __( 'Welcome', 'pmdk-test-consumer' ) },
		{ id: 'docs', label: __( 'Docs', 'pmdk-test-consumer' ) },
		{ id: 'changelog', label: __( 'Changelog', 'pmdk-test-consumer' ) },
	],
	baseRoutes: {
		'#welcome': { component: WelcomePage, type: 'page' },
		'#docs': { component: DocsPage, type: 'page' },
		'#changelog': { component: ChangelogPage, type: 'page' },
		'#changelog/:id': { component: ChangelogPage, type: 'page' },
	},
	helpItems: [
		{
			id: 'spec',
			label: __( 'SPEC', 'pmdk-test-consumer' ),
			href: 'https://github.com/pressmaximum/dashboard-kit/blob/main/docs/SPEC.md',
		},
		{
			id: 'changelog-link',
			label: __( 'Changelog tab', 'pmdk-test-consumer' ),
			href: '#changelog',
		},
	],
	versionLabel: 'v0.0.0',
	versionHref: '#changelog',
} );
