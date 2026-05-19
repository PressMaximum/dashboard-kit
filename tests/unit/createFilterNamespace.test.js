/**
 * createFilterNamespace — mint a `{prefix}.dashboard.*` channel-name map.
 *
 * SPEC §5.2: returned shape is locked. Adding a key is a pre-1.0 minor
 * bump; removing one is a major bump.
 */

import { describe, it, expect } from 'vitest';
import { createFilterNamespace } from '../../src/core/createFilterNamespace.js';

describe( 'createFilterNamespace', () => {
	it( 'builds the locked channel-name map for a given prefix', () => {
		const ns = createFilterNamespace( 'customify' );
		expect( ns ).toEqual( {
			boot: 'customify.dashboard.boot',
			tabs: 'customify.dashboard.tabs',
			tabsLocked: 'customify.dashboard.tabs.locked',
			routes: 'customify.dashboard.routes',
			welcomeSections: 'customify.dashboard.welcome.sections',
			welcomeChecklist: 'customify.dashboard.welcome.checklist',
			settingsPanels: 'customify.dashboard.settings.panels',
			settingsFieldTypes: 'customify.dashboard.settings.field-types',
			changelogSources: 'customify.dashboard.changelog.sources',
			versionLabel: 'customify.dashboard.version-label',
		} );
	} );

	it( 'isolates two namespaces by prefix', () => {
		const a = createFilterNamespace( 'blocksify' );
		const b = createFilterNamespace( 'customify' );
		expect( a.tabs ).toBe( 'blocksify.dashboard.tabs' );
		expect( b.tabs ).toBe( 'customify.dashboard.tabs' );
		expect( a.tabs ).not.toBe( b.tabs );
	} );

	it( 'throws on an empty or non-string prefix', () => {
		expect( () => createFilterNamespace( '' ) ).toThrow( TypeError );
		expect( () => createFilterNamespace() ).toThrow( TypeError );
		expect( () => createFilterNamespace( null ) ).toThrow( TypeError );
		expect( () => createFilterNamespace( 42 ) ).toThrow( TypeError );
	} );
} );
