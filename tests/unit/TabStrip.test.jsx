/**
 * <TabStrip> — behavior contract, incl. K-042 (split nav + dropdown tabs).
 *
 * The default flat render is asserted FIRST and in DOM terms (no group
 * wrappers, no marker attribute, anchors are direct children of the nav):
 * that is the REVISED-C promise — a consumer passing nothing new gets the
 * markup, and therefore the geometry, it had before.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import TabStrip from '../../src/core/TabStrip.jsx';
import DashboardShell from '../../src/core/DashboardShell.jsx';

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
	window.location.hash = '';
} );

afterEach( () => {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
	host.remove();
	vi.useRealTimers();
} );

const FLAT_TABS = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'settings', label: 'Settings', hash: '#settings' },
];

const SPLIT_TABS = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'bookings', label: 'Bookings', hash: '#bookings' },
	{ id: 'modules', label: 'Modules', hash: '#modules', align: 'end' },
	{ id: 'settings', label: 'Settings', hash: '#settings', align: 'end' },
];

const MENU_CHILDREN = [
	{
		id: 'settings-general',
		label: 'General',
		description: 'Business · Localization',
		href: '#settings/general',
	},
	{
		id: 'settings-advanced',
		label: 'Advanced',
		href: '#settings/advanced',
	},
];

const nav = () => host.querySelector( '.pmdk-dashboard__tabs' );
const tabs = () => [ ...host.querySelectorAll( '.pmdk-dashboard__tab' ) ];
const menuItems = () =>
	[ ...host.querySelectorAll( '[role="menuitem"]' ) ];
const trigger = () => host.querySelector( '.pmdk-dashboard__tab-trigger' );

/* React synthesizes mouseenter/mouseleave from delegated mouseover /
   mouseout, so a hover test has to dispatch those, not the enter/leave
   pair jsdom would otherwise ignore. */
const hoverIn = ( el ) =>
	act( () => {
		el.dispatchEvent(
			new MouseEvent( 'mouseover', {
				bubbles: true,
				relatedTarget: null,
			} ),
		);
	} );

const hoverOut = ( el ) =>
	act( () => {
		el.dispatchEvent(
			new MouseEvent( 'mouseout', {
				bubbles: true,
				relatedTarget: document.body,
			} ),
		);
	} );

const press = ( el, key ) =>
	act( () => {
		el.dispatchEvent(
			new KeyboardEvent( 'keydown', { key, bubbles: true } ),
		);
	} );

describe( 'TabStrip — flat default (unchanged surface)', () => {
	it( 'renders anchors directly in the nav, with no group wrapper or marker', () => {
		render(
			<TabStrip
				items={ FLAT_TABS }
				activeId="welcome"
				ariaLabel="Dashboard sections"
			/>,
		);
		const el = nav();
		expect( el.getAttribute( 'aria-label' ) ).toBe( 'Dashboard sections' );
		expect( el.hasAttribute( 'data-has-end' ) ).toBe( false );
		expect(
			host.querySelectorAll( '.pmdk-dashboard__tab-group' ),
		).toHaveLength( 0 );
		expect( [ ...el.children ].map( ( child ) => child.tagName ) ).toEqual(
			[ 'A', 'A' ],
		);
		expect( tabs().map( ( tab ) => tab.className ) ).toEqual( [
			'pmdk-dashboard__tab is-active',
			'pmdk-dashboard__tab',
		] );
		expect( tabs()[ 0 ].getAttribute( 'aria-current' ) ).toBe( 'page' );
	} );

	it( 'renders nothing for an empty / non-array items prop', () => {
		render( <TabStrip items={ [] } activeId="welcome" /> );
		expect( nav() ).toBeNull();
	} );

	it( 'navigates through the router by default', () => {
		render( <TabStrip items={ FLAT_TABS } activeId="welcome" /> );
		act( () => tabs()[ 1 ].click() );
		expect( window.location.hash ).toBe( '#settings' );
	} );

	it( 'hands activation to onSelect when supplied', () => {
		const onSelect = vi.fn();
		render(
			<TabStrip
				items={ FLAT_TABS }
				activeId="welcome"
				onSelect={ onSelect }
			/>,
		);
		act( () => tabs()[ 1 ].click() );
		expect( onSelect.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			id: 'settings',
			hash: '#settings',
		} );
		expect( window.location.hash ).toBe( '' );
	} );
} );

describe( 'TabStrip — K-042 split nav', () => {
	it( 'partitions items into a start and an end run inside ONE nav', () => {
		render( <TabStrip items={ SPLIT_TABS } activeId="welcome" /> );
		expect( host.querySelectorAll( 'nav' ) ).toHaveLength( 1 );
		const groups = [
			...host.querySelectorAll( '.pmdk-dashboard__tab-group' ),
		];
		expect(
			groups.map( ( group ) => group.dataset.tabGroup ),
		).toEqual( [ 'start', 'end' ] );
		expect(
			[ ...groups[ 0 ].children ].map( ( el ) => el.textContent ),
		).toEqual( [ 'Dashboard', 'Bookings' ] );
		expect(
			[ ...groups[ 1 ].children ].map( ( el ) => el.textContent ),
		).toEqual( [ 'Modules', 'Settings' ] );
	} );

	it( 'emits the data-has-end marker ONLY when an end run exists', () => {
		render( <TabStrip items={ SPLIT_TABS } activeId="welcome" /> );
		expect( nav().getAttribute( 'data-has-end' ) ).toBe( 'true' );

		act( () => root.render( <TabStrip items={ FLAT_TABS } /> ) );
		expect( nav().hasAttribute( 'data-has-end' ) ).toBe( false );

		// An explicit `align: 'start'` is not an end run either.
		act( () =>
			root.render(
				<TabStrip
					items={ FLAT_TABS.map( ( tab ) => ( {
						...tab,
						align: 'start',
					} ) ) }
				/>,
			),
		);
		expect( nav().hasAttribute( 'data-has-end' ) ).toBe( false );
	} );

	it( 'keeps the active tab in the end run', () => {
		render( <TabStrip items={ SPLIT_TABS } activeId="settings" /> );
		const active = host.querySelector( '.pmdk-dashboard__tab.is-active' );
		expect( active.textContent ).toBe( 'Settings' );
		expect(
			active.closest( '.pmdk-dashboard__tab-group' ).dataset.tabGroup,
		).toBe( 'end' );
	} );
} );

describe( 'DashboardShell — utility-tab marker plumbing', () => {
	const ROUTES = { '#welcome': { component: () => <p>welcome</p> } };

	it( 'stamps data-utility-tabs on the root only when a tab is end-aligned', () => {
		render(
			<DashboardShell
				brand={ { name: 'Kit' } }
				tabs={ SPLIT_TABS }
				routes={ ROUTES }
			/>,
		);
		expect(
			host
				.querySelector( '.pmdk-dashboard' )
				.getAttribute( 'data-utility-tabs' ),
		).toBe( 'true' );

		act( () =>
			root.render(
				<DashboardShell
					brand={ { name: 'Kit' } }
					tabs={ FLAT_TABS }
					routes={ ROUTES }
				/>,
			),
		);
		expect(
			host
				.querySelector( '.pmdk-dashboard' )
				.hasAttribute( 'data-utility-tabs' ),
		).toBe( false );
	} );
} );

describe( 'TabStrip — K-042 dropdown tabs', () => {
	const linkTab = {
		id: 'settings',
		label: 'Settings',
		hash: '#settings/general',
		align: 'end',
		children: MENU_CHILDREN,
	};
	const buttonTab = {
		id: 'offerings',
		label: 'Offerings',
		hash: '',
		children: [
			{ id: 'services', label: 'Services', href: '#services' },
			{ id: 'events', label: 'Events', href: '#events' },
		],
	};

	it( 'renders a link trigger for a tab with a hash, a button without', () => {
		render( <TabStrip items={ [ linkTab ] } activeId="welcome" /> );
		expect( trigger().tagName ).toBe( 'A' );
		expect( trigger().getAttribute( 'href' ) ).toBe( '#settings/general' );

		act( () => root.render( <TabStrip items={ [ buttonTab ] } /> ) );
		expect( trigger().tagName ).toBe( 'BUTTON' );
		expect( trigger().hasAttribute( 'href' ) ).toBe( false );
	} );

	it( 'carries the menu-button aria contract, closed and open', () => {
		render( <TabStrip items={ [ buttonTab ] } /> );
		expect( trigger().getAttribute( 'aria-haspopup' ) ).toBe( 'menu' );
		expect( trigger().getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();

		act( () => trigger().click() );
		expect( trigger().getAttribute( 'aria-expanded' ) ).toBe( 'true' );

		const menu = host.querySelector( '[role="menu"]' );
		expect( menu ).not.toBeNull();
		// The menu is named by its own trigger — no kit-owned string.
		expect( menu.getAttribute( 'aria-labelledby' ) ).toBe(
			trigger().getAttribute( 'id' ),
		);
		expect( menuItems().map( ( item ) => item.tagName ) ).toEqual( [
			'A',
			'A',
		] );
		expect( menuItems()[ 0 ].getAttribute( 'href' ) ).toBe( '#services' );
	} );

	it( 'click-toggles the button trigger open and closed', () => {
		render( <TabStrip items={ [ buttonTab ] } /> );
		act( () => trigger().click() );
		expect( host.querySelector( '[role="menu"]' ) ).not.toBeNull();
		act( () => trigger().click() );
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();
	} );

	it( 'discloses the link trigger on hover and on focus, never on click', () => {
		const onSelect = vi.fn();
		render( <TabStrip items={ [ linkTab ] } onSelect={ onSelect } /> );
		const wrap = host.querySelector( '.pmdk-dashboard__tab-menu-wrap' );

		hoverIn( wrap );
		expect( host.querySelector( '[role="menu"]' ) ).not.toBeNull();

		vi.useFakeTimers();
		hoverOut( wrap );
		act( () => vi.advanceTimersByTime( 200 ) );
		vi.useRealTimers();
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();

		act( () => trigger().focus() );
		expect( host.querySelector( '[role="menu"]' ) ).not.toBeNull();

		// The click is navigation, not a toggle: it activates the trigger's
		// own destination and leaves the menu closed.
		act( () => trigger().click() );
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();
		expect( onSelect.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			id: 'settings',
			hash: '#settings/general',
		} );
	} );

	it( 'roves Arrow/Home/End over the menu items', () => {
		render( <TabStrip items={ [ buttonTab ] } /> );
		act( () => trigger().click() );
		const menu = host.querySelector( '[role="menu"]' );
		const items = menuItems();

		act( () => items[ 0 ].focus() );
		press( menu, 'ArrowDown' );
		expect( document.activeElement ).toBe( items[ 1 ] );
		press( menu, 'ArrowDown' );
		expect( document.activeElement ).toBe( items[ 0 ] );
		press( menu, 'End' );
		expect( document.activeElement ).toBe( items[ 1 ] );
		press( menu, 'Home' );
		expect( document.activeElement ).toBe( items[ 0 ] );
		press( menu, 'ArrowUp' );
		expect( document.activeElement ).toBe( items[ 1 ] );
	} );

	it( 'opens from the trigger with ArrowDown and lands on the first item', async () => {
		render( <TabStrip items={ [ buttonTab ] } /> );
		act( () => trigger().focus() );
		press( trigger(), 'ArrowDown' );
		expect( host.querySelector( '[role="menu"]' ) ).not.toBeNull();
		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );
		expect( document.activeElement ).toBe( menuItems()[ 0 ] );
	} );

	it( 'Escape closes and restores focus to the trigger', () => {
		render( <TabStrip items={ [ buttonTab ] } /> );
		act( () => trigger().click() );
		const menu = host.querySelector( '[role="menu"]' );
		act( () => menuItems()[ 1 ].focus() );

		press( menu, 'Escape' );
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();
		expect( document.activeElement ).toBe( trigger() );
		expect( trigger().getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it( 'activating a child navigates and closes the menu', () => {
		const onSelect = vi.fn();
		render( <TabStrip items={ [ buttonTab ] } onSelect={ onSelect } /> );
		act( () => trigger().click() );
		act( () => menuItems()[ 1 ].click() );
		expect( onSelect.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			id: 'events',
			hash: '#events',
			parentId: 'offerings',
		} );
		expect( host.querySelector( '[role="menu"]' ) ).toBeNull();
	} );

	it( 'lights the parent trigger and the child row for a nested route', () => {
		render(
			<TabStrip
				items={ [ linkTab ] }
				activeId="settings"
				activeRoute="#settings/advanced"
			/>,
		);
		expect( trigger().getAttribute( 'aria-current' ) ).toBe( 'page' );
		expect( trigger().className ).toContain( 'is-active' );

		hoverIn( host.querySelector( '.pmdk-dashboard__tab-menu-wrap' ) );
		const current = menuItems().filter(
			( item ) => item.getAttribute( 'aria-current' ) === 'page',
		);
		expect( current ).toHaveLength( 1 );
		expect( current[ 0 ].getAttribute( 'href' ) ).toBe(
			'#settings/advanced',
		);
	} );

	it( 'lights the parent when a CHILD is the active top-level tab', () => {
		render( <TabStrip items={ [ buttonTab ] } activeId="events" /> );
		expect( trigger().getAttribute( 'aria-current' ) ).toBe( 'page' );

		act( () => trigger().click() );
		expect(
			menuItems()[ 1 ].getAttribute( 'aria-current' ),
		).toBe( 'page' );
		expect( menuItems()[ 0 ].hasAttribute( 'aria-current' ) ).toBe( false );
	} );

	it( 'renders the two-line row anatomy, description optional', () => {
		render( <TabStrip items={ [ linkTab ] } /> );
		hoverIn( host.querySelector( '.pmdk-dashboard__tab-menu-wrap' ) );
		const rows = menuItems();
		expect(
			rows[ 0 ].querySelector( '.pmdk-dashboard__tab-menu-label' )
				.textContent,
		).toBe( 'General' );
		expect(
			rows[ 0 ].querySelector( '.pmdk-dashboard__tab-menu-description' )
				.textContent,
		).toBe( 'Business · Localization' );
		expect(
			rows[ 1 ].querySelector( '.pmdk-dashboard__tab-menu-description' ),
		).toBeNull();
	} );
} );
