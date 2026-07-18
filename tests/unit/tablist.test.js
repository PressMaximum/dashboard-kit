/**
 * createTablist — behavior contract (KIT-P3 slice 4).
 *
 * Source-parity with the design-system tablist: click activation,
 * ArrowLeft/ArrowRight with wrap-around, Home/End, activation follows focus,
 * aria-selected sync. Panels stay consumer-side (headless).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTablist } from '../../src/primitives/tablist.js';

let host;
let root;
let tabs;
let controller;
let changes;

function mount() {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	host.innerHTML = `
		<div class="pmdk-section-tabs">
			<button role="tab" aria-selected="true" type="button">Upcoming</button>
			<button role="tab" aria-selected="false" type="button">Past</button>
			<button role="tab" aria-selected="false" type="button">Cancelled</button>
		</div>`;
	root = host.querySelector( '.pmdk-section-tabs' );
	tabs = [ ...root.querySelectorAll( '[role="tab"]' ) ];
	changes = [];
	controller = createTablist( root, {
		onChange: ( tab, index ) => changes.push( index ),
	} );
}

const key = ( tab, name ) =>
	tab.dispatchEvent(
		new KeyboardEvent( 'keydown', { key: name, bubbles: true } ),
	);
const selectedIndex = () =>
	tabs.findIndex(
		( tab ) => tab.getAttribute( 'aria-selected' ) === 'true',
	);

beforeEach( () => mount() );

afterEach( () => {
	controller.destroy();
	host.remove();
} );

describe( 'createTablist', () => {
	it( 'assigns role=tablist and reports the active tab', () => {
		expect( root.getAttribute( 'role' ) ).toBe( 'tablist' );
		expect( controller.getActive() ).toBe( tabs[ 0 ] );
	} );

	it( 'click activates and syncs aria-selected', () => {
		tabs[ 1 ].click();
		expect( selectedIndex() ).toBe( 1 );
		expect( changes ).toEqual( [ 1 ] );
	} );

	it( 'ArrowRight moves with wrap-around and moves focus', () => {
		key( tabs[ 0 ], 'ArrowRight' );
		expect( selectedIndex() ).toBe( 1 );
		expect( document.activeElement ).toBe( tabs[ 1 ] );
		key( tabs[ 2 ], 'ArrowRight' );
		expect( selectedIndex() ).toBe( 0 );
	} );

	it( 'ArrowLeft wraps backwards', () => {
		key( tabs[ 0 ], 'ArrowLeft' );
		expect( selectedIndex() ).toBe( 2 );
	} );

	it( 'Home/End jump to the ends', () => {
		key( tabs[ 1 ], 'End' );
		expect( selectedIndex() ).toBe( 2 );
		key( tabs[ 2 ], 'Home' );
		expect( selectedIndex() ).toBe( 0 );
	} );

	it( 'activate() API selects programmatically', () => {
		controller.activate( tabs[ 2 ] );
		expect( selectedIndex() ).toBe( 2 );
		expect( changes ).toEqual( [ 2 ] );
	} );

	it( 'other keys are ignored', () => {
		key( tabs[ 0 ], 'ArrowDown' );
		expect( selectedIndex() ).toBe( 0 );
		expect( changes ).toEqual( [] );
	} );

	it( 'destroy removes listeners', () => {
		controller.destroy();
		tabs[ 1 ].click();
		expect( selectedIndex() ).toBe( 0 );
	} );
} );
