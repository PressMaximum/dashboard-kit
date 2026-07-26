/**
 * <SettingsShell> — the K-043 chassis: rail + named content region + the
 * three geometry knobs, plus the `containerWidth: 'flush'` mode it pairs
 * with on `DashboardShell`.
 *
 * What is asserted is the CONTRACT, not the look: the region is named
 * (an unnamed `role="region"` is worse than none), the shell composes
 * arbitrary children unchanged (`<SaveBar>` / `<SchemaForm>` ride in as
 * is), and the knobs land as CSS custom properties a consumer stylesheet
 * can also set.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SettingsShell from '../../src/settings-shell/SettingsShell.jsx';
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
	{ id: 'advanced', label: 'Advanced' },
];

const shell = ( props ) => (
	<SettingsShell
		tree={ TREE }
		activeParent="general"
		activeChild="business"
		{ ...props }
	>
		<p data-testid="panel">panel content</p>
	</SettingsShell>
);

const region = () => host.querySelector( '[role="region"]' );

describe( 'SettingsShell — anatomy', () => {
	it( 'renders the container, the grid, the rail and the content region', () => {
		render( shell() );
		const outer = host.querySelector( '.pmdk-settings-shell' );
		expect( outer ).not.toBeNull();
		// The GRID is a child of the container element: an element cannot
		// answer its own container query (K-033), so the ≤820px collapse
		// needs this separation to have anything to match.
		const grid = outer.querySelector( ':scope > .pmdk-settings-shell__grid' );
		expect( grid ).not.toBeNull();
		expect( grid.querySelector( ':scope > nav.pmdk-settings-nav' ) ).not.toBeNull();
		expect(
			grid.querySelector( ':scope > .pmdk-settings-shell__content' ),
		).not.toBeNull();
	} );

	it( 'composes header and children into the content region, untouched', () => {
		render( shell( { header: <h1 data-testid="head">Settings</h1> } ) );
		expect( region().querySelector( '[data-testid="head"]' ) ).not.toBeNull();
		expect(
			region().querySelector( '[data-testid="panel"]' ).textContent,
		).toBe( 'panel content' );
	} );

	it( 'forwards the rail props', () => {
		const onSelect = vi.fn();
		render( shell( { onSelect } ) );
		expect(
			host.querySelector( '.pmdk-settings-nav__child[aria-current="page"]' )
				.textContent,
		).toBe( 'Business' );
		act( () =>
			host
				.querySelectorAll( '.pmdk-settings-nav__node' )[ 1 ]
				.click(),
		);
		expect( onSelect ).toHaveBeenCalledWith( 'advanced', '' );
	} );

	it( 'accepts an extra className without dropping its own', () => {
		render( shell( { className: 'product-settings' } ) );
		expect( host.querySelector( '.pmdk-settings-shell' ).className ).toBe(
			'pmdk-settings-shell product-settings',
		);
	} );
} );

describe( 'SettingsShell — naming (Tier-2 labels)', () => {
	it( 'ships English defaults so both landmarks are named out of the box', () => {
		render( shell() );
		expect( host.querySelector( 'nav' ).getAttribute( 'aria-label' ) ).toBe(
			'Settings sections',
		);
		expect( region().getAttribute( 'aria-label' ) ).toBe( 'Settings' );
	} );

	it( 'labels overrides replace the defaults', () => {
		render(
			shell( {
				labels: {
					navAriaLabel: 'Sections des réglages',
					regionLabel: 'Réglages',
				},
			} ),
		);
		expect( host.querySelector( 'nav' ).getAttribute( 'aria-label' ) ).toBe(
			'Sections des réglages',
		);
		expect( region().getAttribute( 'aria-label' ) ).toBe( 'Réglages' );
	} );

	it( 'the direct props win over the labels bag (per-section region name)', () => {
		render(
			shell( {
				regionLabel: 'General · Business',
				navAriaLabel: 'Rail',
				labels: { regionLabel: 'ignored', navAriaLabel: 'ignored' },
			} ),
		);
		expect( region().getAttribute( 'aria-label' ) ).toBe(
			'General · Business',
		);
		expect( host.querySelector( 'nav' ).getAttribute( 'aria-label' ) ).toBe(
			'Rail',
		);
	} );
} );

describe( 'SettingsShell — geometry knobs', () => {
	it( 'publishes only the knobs the consumer set', () => {
		render( shell() );
		expect(
			host.querySelector( '.pmdk-settings-shell' ).getAttribute( 'style' ),
		).toBeNull();
	} );

	it( 'maps each prop onto its CSS custom property', () => {
		render(
			shell( {
				chromeOffset: '64px',
				railWidth: '280px',
				contentMaxWidth: '960px',
			} ),
		);
		const { style } = host.querySelector( '.pmdk-settings-shell' );
		expect( style.getPropertyValue( '--pmdk-settings-chrome' ) ).toBe(
			'64px',
		);
		expect( style.getPropertyValue( '--pmdk-settings-rail-width' ) ).toBe(
			'280px',
		);
		expect( style.getPropertyValue( '--pmdk-settings-content-max' ) ).toBe(
			'960px',
		);
	} );
} );

describe( 'DashboardShell — containerWidth flush (K-043)', () => {
	const ROUTES = { '#settings': { component: () => <p>settings</p> } };
	const props = {
		brand: { name: 'Kit' },
		tabs: [ { id: 'settings', label: 'Settings', hash: '#settings' } ],
		routes: ROUTES,
		initialRoute: '#settings',
	};

	it( 'stamps the new mode', () => {
		render( <DashboardShell { ...props } containerWidth="flush" /> );
		expect(
			host
				.querySelector( '.pmdk-dashboard' )
				.getAttribute( 'data-container-width' ),
		).toBe( 'flush' );
	} );

	it( 'leaves narrow / wide / unknown resolving exactly as before', () => {
		render( <DashboardShell { ...props } /> );
		const mode = () =>
			host
				.querySelector( '.pmdk-dashboard' )
				.getAttribute( 'data-container-width' );
		expect( mode() ).toBe( 'narrow' );

		act( () =>
			root.render( <DashboardShell { ...props } containerWidth="wide" /> ),
		);
		expect( mode() ).toBe( 'wide' );

		act( () =>
			root.render( <DashboardShell { ...props } containerWidth="huge" /> ),
		);
		expect( mode() ).toBe( 'narrow' );
	} );
} );
