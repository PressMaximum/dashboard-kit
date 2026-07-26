/**
 * createSettingsTree — the pure routing brain of the K-043 settings shell.
 *
 * Case set ported from Aponto's `tests/js/settings-ia.test.js` (the source
 * these helpers were promoted from), re-pointed at a GENERIC fixture tree:
 * the kit owns no sections and no legacy aliases, so what carries over is
 * the contract those tests pinned — which section every hash shape lands
 * on, and that a menu row always derives back to its own parent.
 */

import { describe, it, expect } from 'vitest';
import { createSettingsTree } from '../../src/settings-shell/createSettingsTree.js';

/* Two branches + three leaves — the shape Aponto's tree has, without its
   copy. `panels` stands in for "arbitrary consumer field on the node". */
const TREE = [
	{
		id: 'general',
		label: 'General',
		children: [
			{ id: 'business', label: 'Business', panels: [ 'business' ] },
			{
				id: 'localization',
				label: 'Localization',
				panels: [ 'localization' ],
			},
		],
	},
	{
		id: 'booking',
		label: 'Booking',
		children: [
			{ id: 'policy', label: 'Policy', panels: [ 'policy' ] },
			{ id: 'form', label: 'Form presentation', panels: [] },
		],
	},
	{
		id: 'notifications',
		label: 'Notifications',
		description: 'Templates, sender and send log',
		component: 'notifications',
	},
	{
		id: 'privacy',
		label: 'Privacy',
		description: 'Retention, export and erasure',
		panels: [ 'collection', 'consent', 'retention' ],
	},
	{
		id: 'advanced',
		label: 'Advanced',
		description: 'Diagnostics, logs and uninstall',
		panels: [ 'diagnostics', 'data' ],
	},
];

const ia = createSettingsTree( TREE );

describe( 'tree lookups', () => {
	it( 'keeps the consumer order and reports the default parent', () => {
		expect( ia.tree.map( ( node ) => node.id ) ).toEqual( [
			'general',
			'booking',
			'notifications',
			'privacy',
			'advanced',
		] );
		expect( ia.defaultParent ).toBe( 'general' );
	} );

	it( 'returns null for an unknown node', () => {
		expect( ia.node( 'appearance' ) ).toBeNull();
	} );

	it( 'separates branches from leaves', () => {
		expect( ia.children( 'general' ).map( ( c ) => c.id ) ).toEqual( [
			'business',
			'localization',
		] );
		expect( ia.children( 'booking' ).map( ( c ) => c.id ) ).toEqual( [
			'policy',
			'form',
		] );
		expect( ia.children( 'notifications' ) ).toEqual( [] );
		expect( ia.children( 'privacy' ) ).toEqual( [] );
		expect( ia.children( 'nope' ) ).toEqual( [] );
	} );

	it( 'sublines a parent with its children and a leaf with its description', () => {
		expect( ia.subline( ia.node( 'general' ) ) ).toBe(
			'Business · Localization',
		);
		expect( ia.subline( ia.node( 'advanced' ) ) ).toBe(
			'Diagnostics, logs and uninstall',
		);
		expect( ia.subline( undefined ) ).toBe( '' );
	} );

	it( 'defaultChild is the first child, and empty for a leaf', () => {
		expect( ia.defaultChild( 'general' ) ).toBe( 'business' );
		expect( ia.defaultChild( 'privacy' ) ).toBe( '' );
		expect( ia.defaultChild( 'unknown' ) ).toBe( '' );
	} );
} );

describe( 'path', () => {
	it( 'deepens to the child, and stops at the parent for a leaf', () => {
		expect( ia.path( 'general', 'business' ) ).toBe(
			'settings/general/business',
		);
		expect( ia.path( 'advanced' ) ).toBe( 'settings/advanced' );
	} );
} );

describe( 'resolve — every shape lands on a real section', () => {
	const cases = [
		[ [ 'settings' ], 'settings/general/business' ],
		[ [ 'settings', 'general' ], 'settings/general/business' ],
		[ [ 'settings', 'general', 'business' ], 'settings/general/business' ],
		[
			[ 'settings', 'general', 'localization' ],
			'settings/general/localization',
		],
		[ [ 'settings', 'booking' ], 'settings/booking/policy' ],
		[ [ 'settings', 'booking', 'form' ], 'settings/booking/form' ],
		[ [ 'settings', 'notifications' ], 'settings/notifications' ],
		[ [ 'settings', 'privacy' ], 'settings/privacy' ],
		[ [ 'settings', 'advanced' ], 'settings/advanced' ],
		// A retired section or a typo falls back rather than rendering an
		// empty screen — the property that keeps old bookmarks alive.
		[ [ 'settings', 'appearance' ], 'settings/general/business' ],
		[ [ 'settings', 'nope' ], 'settings/general/business' ],
		[ [ 'settings', 'general', 'nope' ], 'settings/general/business' ],
		// A leaf ignores a stale third segment instead of 404-ing.
		[ [ 'settings', 'advanced', 'diagnostics' ], 'settings/advanced' ],
	];

	it.each( cases )( '%j → %s', ( segments, expected ) => {
		const { parent, child } = ia.resolve( segments );
		expect( ia.path( parent, child ) ).toBe( expected );
	} );

	it( 'tolerates a missing / garbage segment list', () => {
		expect( ia.resolve( undefined ) ).toEqual( {
			parent: 'general',
			child: 'business',
		} );
		expect( ia.resolve( [] ) ).toEqual( {
			parent: 'general',
			child: 'business',
		} );
	} );

	it( 'accepts segments without the route prefix (menu / dropdown calls)', () => {
		expect( ia.resolve( [ 'booking', 'form' ] ) ).toEqual( {
			parent: 'booking',
			child: 'form',
		} );
	} );
} );

describe( 'resolveHash — the current parent a header menu marks', () => {
	it.each( [
		[ '#settings', 'general' ],
		[ '#settings/general/business', 'general' ],
		[ '#settings/general/localization', 'general' ],
		[ '#settings/booking/policy', 'booking' ],
		[ '#settings/booking/form', 'booking' ],
		[ '#settings/notifications', 'notifications' ],
		[ '#settings/privacy', 'privacy' ],
		[ '#settings/advanced', 'advanced' ],
		// An aliased or unknown URL still marks a REAL parent, never none.
		[ '#settings/appearance', 'general' ],
		[ '#settings/nope/nope', 'general' ],
	] )( '%s marks %s', ( hash, expected ) => {
		expect( ia.resolveHash( hash ).parent ).toBe( expected );
	} );

	it( 'every menu row navigates to a hash that derives back to its own parent', () => {
		TREE.forEach( ( node ) => {
			const target = ia.path( node.id, ia.defaultChild( node.id ) );
			expect( ia.resolveHash( `#${ target }` ).parent ).toBe( node.id );
		} );
	} );

	it( 'tolerates an empty / missing hash', () => {
		expect( ia.resolveHash( '' ) ).toEqual( {
			parent: 'general',
			child: 'business',
		} );
		expect( ia.resolveHash( undefined ).parent ).toBe( 'general' );
	} );
} );

describe( 'section', () => {
	it( 'names a child section and hands back the child as the source', () => {
		const section = ia.section( 'general', 'business' );
		expect( section.label ).toBe( 'General · Business' );
		expect( section.parent.id ).toBe( 'general' );
		expect( section.child.id ).toBe( 'business' );
		// Consumer fields ride on `source` — the kit never names them.
		expect( section.source.panels ).toEqual( [ 'business' ] );
	} );

	it( 'a leaf is its own source, with no child', () => {
		const section = ia.section( 'notifications', '' );
		expect( section.label ).toBe( 'Notifications' );
		expect( section.child ).toBeNull();
		expect( section.source.component ).toBe( 'notifications' );
	} );

	it( 'an unknown parent degrades to the first node', () => {
		expect( ia.section( 'nope' ).parent.id ).toBe( 'general' );
	} );

	it( 'an unknown child degrades to the parent, not to a broken label', () => {
		const section = ia.section( 'general', 'nope' );
		expect( section.child ).toBeNull();
		expect( section.label ).toBe( 'General' );
	} );
} );

describe( 'options + degenerate input', () => {
	it( 'honours a custom route root and separator', () => {
		const custom = createSettingsTree( TREE, {
			route: 'options',
			separator: ' / ',
		} );
		expect( custom.path( 'general', 'business' ) ).toBe(
			'options/general/business',
		);
		expect( custom.resolveHash( '#options/booking/form' ) ).toEqual( {
			parent: 'booking',
			child: 'form',
		} );
		expect( custom.section( 'general', 'business' ).label ).toBe(
			'General / Business',
		);
		expect( custom.subline( custom.node( 'general' ) ) ).toBe(
			'Business / Localization',
		);
	} );

	it( 'survives an empty or non-array tree', () => {
		const empty = createSettingsTree( undefined );
		expect( empty.tree ).toEqual( [] );
		expect( empty.defaultParent ).toBe( '' );
		expect( empty.resolve( [ 'settings', 'x' ] ) ).toEqual( {
			parent: '',
			child: '',
		} );
		expect( empty.section( 'x' ) ).toEqual( {
			parent: null,
			child: null,
			source: null,
			label: '',
		} );
	} );
} );
