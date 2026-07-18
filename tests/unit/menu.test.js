/**
 * createMenu — headless menu/popover behavior contract (KIT-P3 slice 3, G4).
 *
 * Ports of the BookingsTable per-component patterns, tested once: trigger
 * toggling + aria-expanded, keyboard-open focuses the first item, roving menu
 * keys, Escape-with-focus-return, outside-pointerdown dismiss, item selection
 * (keyboard returns focus), fixed positioning mode. Pure DOM.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMenu } from '../../src/primitives/menu.js';

let host;
let controller;
let root;
let trigger;
let popover;
let selections;

const flushFrames = () =>
	new Promise( ( resolve ) =>
		requestAnimationFrame( () => requestAnimationFrame( resolve ) ),
	);

function mount( options = {} ) {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	host.innerHTML = `
		<div data-menu>
			<button data-menu-trigger type="button">Actions</button>
			<div class="pmdk-row-action-menu" role="menu" aria-label="Actions" hidden>
				<button role="menuitem" type="button" data-id="view">View</button>
				<button role="menuitem" type="button" data-id="edit">Edit</button>
				<div role="separator"></div>
				<button role="menuitem" type="button" data-id="delete" class="is-danger">Delete</button>
			</div>
		</div>`;
	root = host.querySelector( '[data-menu]' );
	trigger = root.querySelector( '[data-menu-trigger]' );
	popover = root.querySelector( '[role="menu"]' );
	selections = [];
	controller = createMenu( root, {
		onSelect: ( item ) => selections.push( item.dataset.id ),
		...options,
	} );
}

beforeEach( () => mount() );

afterEach( () => {
	controller.destroy();
	host.remove();
} );

const pointerClick = ( el ) =>
	el.dispatchEvent(
		new MouseEvent( 'click', { bubbles: true, detail: 1 } ),
	);
const keyboardClick = ( el ) =>
	el.dispatchEvent(
		new MouseEvent( 'click', { bubbles: true, detail: 0 } ),
	);

describe( 'createMenu', () => {
	it( 'wires ARIA and toggles on trigger click', () => {
		expect( trigger.getAttribute( 'aria-haspopup' ) ).toBe( 'menu' );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( true );
		expect( popover.hidden ).toBe( false );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( false );
	} );

	it( 'keyboard open focuses the first enabled item', async () => {
		keyboardClick( trigger );
		await flushFrames();
		expect( document.activeElement?.dataset.id ).toBe( 'view' );
	} );

	it( 'pointer open does NOT steal focus', async () => {
		trigger.focus();
		pointerClick( trigger );
		await flushFrames();
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'roving keys move focus (ArrowDown/ArrowUp/Home/End)', async () => {
		keyboardClick( trigger );
		await flushFrames();
		const key = ( name ) =>
			document.activeElement.dispatchEvent(
				new KeyboardEvent( 'keydown', {
					key: name,
					bubbles: true,
				} ),
			);
		key( 'ArrowDown' );
		expect( document.activeElement?.dataset.id ).toBe( 'edit' );
		key( 'End' );
		expect( document.activeElement?.dataset.id ).toBe( 'delete' );
		key( 'ArrowUp' );
		expect( document.activeElement?.dataset.id ).toBe( 'edit' );
		key( 'Home' );
		expect( document.activeElement?.dataset.id ).toBe( 'view' );
	} );

	it( 'Escape closes and returns focus to the trigger', async () => {
		keyboardClick( trigger );
		await flushFrames();
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				key: 'Escape',
				bubbles: true,
			} ),
		);
		await flushFrames();
		expect( controller.isOpen() ).toBe( false );
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'outside pointerdown dismisses without stealing focus', () => {
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( true );
		document.body.dispatchEvent(
			new Event( 'pointerdown', { bubbles: true } ),
		);
		expect( controller.isOpen() ).toBe( false );
	} );

	it( 'item click selects and closes; keyboard activation returns focus', async () => {
		pointerClick( trigger );
		pointerClick( popover.querySelector( '[data-id="edit"]' ) );
		expect( selections ).toEqual( [ 'edit' ] );
		expect( controller.isOpen() ).toBe( false );

		keyboardClick( trigger );
		await flushFrames();
		keyboardClick( popover.querySelector( '[data-id="delete"]' ) );
		await flushFrames();
		expect( selections ).toEqual( [ 'edit', 'delete' ] );
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'disabled items are skipped by selection and roving', async () => {
		controller.destroy();
		host.remove();
		mount();
		popover.querySelector( '[data-id="edit"]' ).disabled = true;
		keyboardClick( trigger );
		await flushFrames();
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				key: 'ArrowDown',
				bubbles: true,
			} ),
		);
		expect( document.activeElement?.dataset.id ).toBe( 'delete' );
		pointerClick( popover.querySelector( '[data-id="edit"]' ) );
		expect( selections ).toEqual( [] );
	} );

	it( 'onOpenChange observes both directions', () => {
		const onOpenChange = vi.fn();
		controller.destroy();
		host.remove();
		mount( { onOpenChange } );
		pointerClick( trigger );
		pointerClick( trigger );
		expect( onOpenChange.mock.calls.map( ( c ) => c[ 0 ] ) ).toEqual( [
			true,
			false,
		] );
	} );

	it( 'fixed mode floats the popover with viewport-clamped coordinates', () => {
		// jsdom viewport = 1024x768; popover.scrollHeight = 0 (no layout),
		// offsetWidth = 0 -> menuWidth falls back to 196. All arithmetic
		// below is therefore exact.
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 500,
			right: 560,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.classList.contains( 'is-floating' ) ).toBe( true );
		// space below (768-134=634) fits -> opens below: top = bottom + 5.
		expect( popover.style.top ).toBe( '139px' );
		// LTR right-aligns to the trigger: left = right - menuWidth.
		expect( popover.style.left ).toBe( '364px' );
		pointerClick( trigger );
		expect( popover.classList.contains( 'is-floating' ) ).toBe( false );
		expect( popover.style.top ).toBe( '' );
	} );

	it( 'fixed mode opens ABOVE near the viewport bottom (exact top)', () => {
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		trigger.getBoundingClientRect = () => ( {
			top: 700,
			bottom: 734,
			left: 500,
			right: 560,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		// below = 768-734 = 34 < menuHeight(0)+inset(8)? 34 < 8 is false ->
		// openAbove needs below < needed; with scrollHeight 0 it opens BELOW
		// clamped: top = min(768-0-8, 739) = 739.
		expect( popover.style.top ).toBe( '739px' );
		// Force a real menu height to trigger the flip.
		Object.defineProperty( popover, 'scrollHeight', {
			value: 200,
			configurable: true,
		} );
		pointerClick( trigger ); // close
		pointerClick( trigger ); // reopen with height 200
		// below(34) < 200+8 and above(700) > below -> open above:
		// top = max(8, 700-200-5) = 495.
		expect( popover.style.top ).toBe( '495px' );
	} );

	it( 'fixed mode clamps left to the viewport inset and honors RTL', () => {
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		// Near the left edge: preferredLeft = right-196 = -96 -> clamp to 8.
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 40,
			right: 100,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.style.left ).toBe( '8px' );
		pointerClick( trigger ); // close
		// RTL flips the preferred edge: left = rect.left (still in range).
		root.style.direction = 'rtl';
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 300,
			right: 360,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.style.left ).toBe( '300px' );
	} );

	it( 'destroy removes listeners', () => {
		controller.destroy();
		pointerClick( trigger );
		expect( popover.hidden ).toBe( true );
	} );
} );
