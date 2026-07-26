/**
 * <SettingsNav> — the K-043 grouped/collapsible rail.
 *
 * The cases that matter are the ones the promoted Aponto contract turns
 * on: a parent click SELECTS (its first child) rather than merely
 * expanding, exactly one branch is open, arrows move FOCUS without
 * activating, and the disclosure ARIA never dangles.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SettingsNav from '../../src/settings-shell/SettingsNav.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

function render( jsx ) {
	root = createRoot( host );
	act( () => root.render( jsx ) );
}

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
} );

afterEach( () => {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
	host.remove();
} );

const TREE = [
	{
		id: 'general',
		label: 'General',
		children: [
			{ id: 'business', label: 'Business' },
			{ id: 'localization', label: 'Localization' },
		],
	},
	{
		id: 'booking',
		label: 'Booking',
		children: [ { id: 'policy', label: 'Policy' } ],
	},
	{ id: 'advanced', label: 'Advanced' },
];

const buttons = () => [ ...host.querySelectorAll( 'button' ) ];
const nodes = () =>
	[ ...host.querySelectorAll( '.pmdk-settings-nav__node' ) ];
const children = () =>
	[ ...host.querySelectorAll( '.pmdk-settings-nav__child' ) ];

/* The roving handler is bound to the rail BUTTONS (hanging keyboard
   listeners off the `<nav>` landmark is what jsx-a11y objects to), so a
   keypress is dispatched where a real one would land: the focused node. */
const press = ( key ) =>
	act( () => {
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', { key, bubbles: true } ),
		);
	} );

const view = ( props ) => (
	<SettingsNav
		tree={ TREE }
		activeParent="general"
		activeChild="business"
		ariaLabel="Settings sections"
		{ ...props }
	/>
);

describe( 'SettingsNav — structure', () => {
	it( 'renders a nav landmark with parents, leaves and the open branch only', () => {
		render( view() );
		const nav = host.querySelector( 'nav.pmdk-settings-nav' );
		expect( nav.getAttribute( 'aria-label' ) ).toBe( 'Settings sections' );
		expect( nodes().map( ( node ) => node.textContent ) ).toEqual( [
			'General',
			'Booking',
			'Advanced',
		] );
		// Exactly one branch is open — the active one.
		expect(
			host.querySelectorAll( '.pmdk-settings-nav__children' ),
		).toHaveLength( 1 );
		expect( children().map( ( child ) => child.textContent ) ).toEqual( [
			'Business',
			'Localization',
		] );
	} );

	it( 'renders nothing for an empty tree', () => {
		render( <SettingsNav tree={ [] } /> );
		expect( host.querySelector( 'nav' ) ).toBeNull();
	} );

	it( 'marks the leaf, not the parent, as the current page', () => {
		render( view() );
		expect( nodes()[ 0 ].hasAttribute( 'aria-current' ) ).toBe( false );
		expect( children()[ 0 ].getAttribute( 'aria-current' ) ).toBe( 'page' );
		expect( children()[ 1 ].hasAttribute( 'aria-current' ) ).toBe( false );
	} );

	it( 'a LEAF node carries aria-current itself when active', () => {
		render( view( { activeParent: 'advanced', activeChild: '' } ) );
		const leaf = host.querySelector( '.pmdk-settings-nav__node.is-leaf' );
		expect( leaf.getAttribute( 'aria-current' ) ).toBe( 'page' );
		expect( leaf.className ).toContain( 'is-active' );
		// No branch is open, so no group exists.
		expect(
			host.querySelectorAll( '.pmdk-settings-nav__children' ),
		).toHaveLength( 0 );
	} );

	it( 'points aria-controls at the group ONLY while it exists', () => {
		render( view() );
		const [ general, booking, advanced ] = nodes();
		expect( general.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		const groupId = general.getAttribute( 'aria-controls' );
		expect( host.querySelector( `#${ groupId }` ) ).not.toBeNull();
		expect(
			host.querySelector( `#${ groupId }` ).getAttribute( 'role' ),
		).toBe( 'group' );
		// The group is named by its own parent — no kit-owned string.
		expect(
			host.querySelector( `#${ groupId }` ).getAttribute( 'aria-label' ),
		).toBe( 'General' );

		// Collapsed branch: expanded=false and NO dangling reference.
		expect( booking.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		expect( booking.hasAttribute( 'aria-controls' ) ).toBe( false );
		// A leaf is not a disclosure at all.
		expect( advanced.hasAttribute( 'aria-expanded' ) ).toBe( false );
	} );

	it( 'renders a consumer icon slot without owning the glyph', () => {
		render(
			view( {
				tree: [
					{
						id: 'general',
						label: 'General',
						icon: <svg data-testid="glyph" />,
						children: [ { id: 'business', label: 'Business' } ],
					},
				],
			} ),
		);
		expect(
			host.querySelector( '.pmdk-settings-nav__icon [data-testid="glyph"]' ),
		).not.toBeNull();
	} );

	it( 'emits the icon CELL for every node so labels stay aligned', () => {
		// The cell is a grid track: a node that skipped it would drop its
		// label into the 18px icon column and truncate to one character.
		render(
			view( {
				tree: [
					{
						id: 'general',
						label: 'General',
						icon: <svg data-testid="glyph" />,
						children: [ { id: 'business', label: 'Business' } ],
					},
					{ id: 'advanced', label: 'Advanced' },
				],
			} ),
		);
		expect(
			host.querySelectorAll( '.pmdk-settings-nav__icon' ),
		).toHaveLength( 2 );
		// A mixed tree keeps the track.
		expect( host.querySelector( 'nav' ).className ).not.toContain(
			'is-iconless',
		);
	} );

	it( 'drops the icon track for a tree with no glyphs at all', () => {
		render( view() );
		expect( host.querySelector( 'nav' ).className ).toContain(
			'is-iconless',
		);
	} );
} );

describe( 'SettingsNav — activation', () => {
	it( 'a parent click SELECTS ITS FIRST CHILD (one interaction, not expand-vs-select)', () => {
		const onSelect = vi.fn();
		render( view( { onSelect } ) );
		act( () => nodes()[ 1 ].click() );
		expect( onSelect ).toHaveBeenCalledWith( 'booking', 'policy' );
	} );

	it( 'a leaf click selects itself with an empty child', () => {
		const onSelect = vi.fn();
		render( view( { onSelect } ) );
		act( () => nodes()[ 2 ].click() );
		expect( onSelect ).toHaveBeenCalledWith( 'advanced', '' );
	} );

	it( 'a child click selects the pair', () => {
		const onSelect = vi.fn();
		render( view( { onSelect } ) );
		act( () => children()[ 1 ].click() );
		expect( onSelect ).toHaveBeenCalledWith( 'general', 'localization' );
	} );

	it( 'tolerates a missing onSelect', () => {
		render( view( { onSelect: undefined } ) );
		expect( () => act( () => nodes()[ 1 ].click() ) ).not.toThrow();
	} );
} );

describe( 'SettingsNav — roving FOCUS (not activation)', () => {
	it( 'walks every visible rail button and wraps at both ends', () => {
		const onSelect = vi.fn();
		render( view( { onSelect } ) );
		// Visible order: General, Business, Localization, Booking, Advanced.
		const order = buttons();
		expect( order ).toHaveLength( 5 );

		act( () => order[ 0 ].focus() );
		press( 'ArrowDown' );
		expect( document.activeElement ).toBe( order[ 1 ] );
		press( 'ArrowRight' );
		expect( document.activeElement ).toBe( order[ 2 ] );
		press( 'End' );
		expect( document.activeElement ).toBe( order[ 4 ] );
		press( 'ArrowDown' );
		expect( document.activeElement ).toBe( order[ 0 ] );
		press( 'ArrowUp' );
		expect( document.activeElement ).toBe( order[ 4 ] );
		press( 'Home' );
		expect( document.activeElement ).toBe( order[ 0 ] );

		// The whole point: arrows must not fire the consumer's section
		// switch (and with it a dirty-form confirm) on every keypress.
		expect( onSelect ).not.toHaveBeenCalled();
	} );

	it( 'ignores keys it does not own', () => {
		render( view() );
		act( () => buttons()[ 0 ].focus() );
		press( 'PageDown' );
		expect( document.activeElement ).toBe( buttons()[ 0 ] );
	} );
} );
