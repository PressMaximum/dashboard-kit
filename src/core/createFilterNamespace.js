/**
 * Build the per-consumer filter channel-name map.
 *
 * Each consumer (Customify Theme, Blocksify Free, future plugins) calls
 * this once with its own short prefix to mint a `{ tabs, routes,
 * settingsPanels, ... }` map of fully-qualified channel names. The kit
 * itself reaches for the channels via `applyFilters(ns.tabs, ...)` etc.
 * — the kit never hardcodes `'blocksify.dashboard.tabs'`-style strings.
 *
 * Returned shape locked at SPEC §5.2. Adding a key here is a minor
 * version bump pre-1.0; removing one is a major bump.
 *
 * @example
 *   const FILTERS = createFilterNamespace( 'customify' );
 *   FILTERS.tabs       // → 'customify.dashboard.tabs'
 *   FILTERS.routes     // → 'customify.dashboard.routes'
 *
 * @param {string} prefix Consumer namespace prefix, e.g. `customify`.
 *                        Must be non-empty. No trailing dot — kit adds
 *                        `.dashboard` itself.
 * @return {Record<string,string>} Channel-name map.
 */
export function createFilterNamespace( prefix ) {
	if ( ! prefix || typeof prefix !== 'string' ) {
		throw new TypeError(
			'createFilterNamespace: `prefix` is required and must be a non-empty string.',
		);
	}

	const base = `${ prefix }.dashboard`;

	return {
		boot: `${ base }.boot`,
		tabs: `${ base }.tabs`,
		tabsLocked: `${ base }.tabs.locked`,
		routes: `${ base }.routes`,
		welcomeSections: `${ base }.welcome.sections`,
		welcomeChecklist: `${ base }.welcome.checklist`,
		settingsPanels: `${ base }.settings.panels`,
		settingsFieldTypes: `${ base }.settings.field-types`,
		changelogSources: `${ base }.changelog.sources`,
		versionLabel: `${ base }.version-label`,
	};
}

export default createFilterNamespace;
