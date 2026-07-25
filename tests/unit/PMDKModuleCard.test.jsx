/**
 * <PMDKModuleCard> — behavior contract (KIT-P3, K-018).
 *
 * Toggle callback, planned-state renders no toggle, every slot renders,
 * a11y contract (accessible toggle name, no whole-card click handler, tier
 * badge distinct from runtime status), gated toggle stays disabled.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PMDKModuleCard } from '../../src/module-card/index.mjs';

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

const BASE = {
	title: 'Notifications',
	meta: 'Communication · Module',
	description: 'Email confirmations for every record.',
};

describe( 'PMDKModuleCard', () => {
	it( 'renders the anatomy slots', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				icon={ <svg data-testid="icon" /> }
				tier={ { label: 'Premium', isPremium: true } }
				badges={ <span className="pmdk-module-phase">P2</span> }
				action={
					<button type="button" data-testid="configure">
						Configure
					</button>
				}
				state="enabled"
			/>,
		);
		expect( host.querySelector( '[data-testid="icon"]' ) ).toBeTruthy();
		expect(
			host.querySelector( '.pmdk-module-meta' ).textContent,
		).toBe( 'Communication · Module' );
		expect( host.querySelector( 'h2' ).textContent ).toBe(
			'Notifications',
		);
		expect(
			host.querySelector( '.pmdk-module-description' ).textContent,
		).toContain( 'Email confirmations' );
		expect(
			host.querySelector( '.pmdk-module-license.is-premium' )
				.textContent,
		).toBe( 'Premium' );
		expect(
			host.querySelector( '.pmdk-module-phase' ).textContent,
		).toBe( 'P2' );
		expect(
			host.querySelector(
				'.pmdk-module-card-action [data-testid="configure"]',
			),
		).toBeTruthy();
	} );

	it( 'stamps the state classes', () => {
		render( <PMDKModuleCard { ...BASE } state="enabled" /> );
		expect(
			host.querySelector( '.pmdk-module-card.is-enabled' ),
		).toBeTruthy();
		act( () =>
			root.render( <PMDKModuleCard { ...BASE } state="disabled" /> ),
		);
		expect(
			host.querySelector( '.pmdk-module-card.is-disabled' ),
		).toBeTruthy();
		act( () =>
			root.render( <PMDKModuleCard { ...BASE } state="planned" /> ),
		);
		expect(
			host.querySelector( '.pmdk-module-card.is-planned' ),
		).toBeTruthy();
	} );

	it( 'toggle reflects state, carries an accessible name, fires onToggle', () => {
		const onToggle = vi.fn();
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="disabled"
				onToggle={ onToggle }
			/>,
		);
		const input = host.querySelector( '.pmdk-module-toggle input' );
		expect( input.checked ).toBe( false );
		expect( input.getAttribute( 'aria-label' ) ).toBe(
			'Enable Notifications',
		);
		act( () => input.click() );
		expect( onToggle ).toHaveBeenCalledWith( true );

		act( () =>
			root.render(
				<PMDKModuleCard
					{ ...BASE }
					state="enabled"
					onToggle={ onToggle }
				/>,
			),
		);
		expect( input.checked ).toBe( true );
		expect( input.getAttribute( 'aria-label' ) ).toBe(
			'Disable Notifications',
		);
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Enabled' );
	} );

	it( 'planned renders NO toggle — only the product-injected static label', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="planned"
				plannedLabel="Planned"
			/>,
		);
		expect( host.querySelector( '.pmdk-module-toggle' ) ).toBeNull();
		expect( host.querySelector( 'input' ) ).toBeNull();
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Planned' );
	} );

	it( 'gated module keeps the toggle disabled', () => {
		const onToggle = vi.fn();
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="disabled"
				toggleDisabled
				tier={ { label: 'Premium', isPremium: true } }
				onToggle={ onToggle }
			/>,
		);
		const input = host.querySelector( '.pmdk-module-toggle input' );
		expect( input.disabled ).toBe( true );
		act( () => input.click() );
		expect( onToggle ).not.toHaveBeenCalled();
	} );

	it( 'integration-state line renders with the connected modifier', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				integrationState="Connected as ops@example.com"
				connected
			/>,
		);
		const line = host.querySelector(
			'.pmdk-module-connection.is-connected',
		);
		expect( line.textContent ).toContain( 'Connected as' );
	} );

	it( 'a11y: no whole-card click handler; tier badge is separate from runtime status', () => {
		const onToggle = vi.fn();
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="disabled"
				tier={ { label: 'Free' } }
				onToggle={ onToggle }
			/>,
		);
		const card = host.querySelector( '.pmdk-module-card' );
		// Clicking the card body must NOT activate anything.
		act( () => card.click() );
		expect( onToggle ).not.toHaveBeenCalled();
		// Entitlement (badge) and runtime status (toggle label) are separate
		// elements — never one signal doing both jobs.
		expect(
			host.querySelector( '.pmdk-module-license' ).textContent,
		).toBe( 'Free' );
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Disabled' );
	} );

	it( 'labels override + headingLevel render alternatives', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="enabled"
				headingLevel={ 3 }
				labels={ {
					toggleOn: 'Bật',
					toggleAria: ( title ) => `Tắt ${ title }`,
				} }
			/>,
		);
		expect( host.querySelector( 'h3' ).textContent ).toBe(
			'Notifications',
		);
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Bật' );
		expect(
			host
				.querySelector( '.pmdk-module-toggle input' )
				.getAttribute( 'aria-label' ),
		).toBe( 'Tắt Notifications' );
	} );
	/* K-023 — a non-toggleable integration (PressListing's `stripe` row). */
	it( 'toggle={false} renders no control, keeping the enabled chrome', () => {
		const onToggle = vi.fn();
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="enabled"
				toggle={ false }
				statusLabel="Connected"
				action={ <button type="button">Configure</button> }
				onToggle={ onToggle }
			/>,
		);
		// No control at all — not a hidden-but-focusable one.
		expect( host.querySelector( '.pmdk-module-toggle' ) ).toBeNull();
		expect( host.querySelector( 'input' ) ).toBeNull();
		// The planned FOOTER shape, without the planned STATE.
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Connected' );
		expect( host.querySelector( '.pmdk-module-card' ).className ).toContain(
			'is-enabled',
		);
		expect(
			host.querySelector( '.pmdk-module-card' ).className,
		).not.toContain( 'is-planned' );
		// The footer action slot still renders.
		expect(
			host.querySelector( '.pmdk-module-card-action' ).textContent,
		).toBe( 'Configure' );
	} );

	it( 'toggle defaults to true — existing consumers are unchanged', () => {
		render( <PMDKModuleCard { ...BASE } state="enabled" /> );
		expect( host.querySelector( '.pmdk-module-toggle input' ) ).not.toBeNull();
	} );

	it( 'toggle={false} on a planned module still uses plannedLabel', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				state="planned"
				toggle={ false }
				plannedLabel="Planned"
				statusLabel="ignored"
			/>,
		);
		expect(
			host.querySelector( '.pmdk-module-toggle-label' ).textContent,
		).toBe( 'Planned' );
	} );

	/* K-024 — a node title must never reach the accessible name. */
	it( 'node title: the accessible name comes from titleText', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				title={
					<>
						Stripe <em>beta</em>
					</>
				}
				titleText="Stripe"
				state="enabled"
				onToggle={ () => {} }
			/>,
		);
		expect(
			host
				.querySelector( '.pmdk-module-toggle input' )
				.getAttribute( 'aria-label' ),
		).toBe( 'Disable Stripe' );
	} );

	it( 'node title without titleText degrades to the bare verb, never [object Object]', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				title={ <span>Stripe</span> }
				state="disabled"
				onToggle={ () => {} }
			/>,
		);
		const name = host
			.querySelector( '.pmdk-module-toggle input' )
			.getAttribute( 'aria-label' );
		expect( name ).not.toContain( '[object Object]' );
		expect( name ).toBe( 'Enable' );
	} );

	it( 'titleText also wins for a string title', () => {
		render(
			<PMDKModuleCard
				{ ...BASE }
				title="Notifications (beta)"
				titleText="Notifications"
				state="enabled"
				onToggle={ () => {} }
			/>,
		);
		expect(
			host
				.querySelector( '.pmdk-module-toggle input' )
				.getAttribute( 'aria-label' ),
		).toBe( 'Disable Notifications' );
	} );

	/* K-025 — the tier badge variant is opt-in, so nobody is restyled. */
	it( 'tier variant: free / premium / unset map to the documented classes', () => {
		const classOf = ( tier ) => {
			render( <PMDKModuleCard { ...BASE } tier={ tier } /> );
			const cls = host.querySelector( '.pmdk-module-license' ).className;
			act( () => root.unmount() );
			root = null;
			return cls;
		};
		expect( classOf( { label: 'Free', variant: 'free' } ) ).toBe(
			'pmdk-module-license is-free',
		);
		expect( classOf( { label: 'Premium', variant: 'premium' } ) ).toBe(
			'pmdk-module-license is-premium',
		);
		expect( classOf( { label: 'Premium', isPremium: true } ) ).toBe(
			'pmdk-module-license is-premium',
		);
		// Unset stays BARE — this is the zero-look-change guarantee for the
		// consumers that shipped `{ label: 'Free' }` against 0.2.1.
		expect( classOf( { label: 'Free' } ) ).toBe( 'pmdk-module-license' );
	} );
} );
