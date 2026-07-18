/**
 * createInspectorResizer — behavior contract (KIT-P3 slice 3).
 *
 * Keyboard steps + Home/End, pointer drag, ARIA values, localStorage
 * persistence under `dashboard-kit.inspector-width.v1`, viewport clamping
 * that never overwrites the stored preference, storage-failure safety.
 * jsdom has no layout, so element rects are stubbed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createInspectorResizer } from '../../src/primitives/resizer.js';

const KEY = 'dashboard-kit.inspector-width.v1';

let host;
let workspace;
let handle;
let pane;
let controller;

/** Current rendered width = what the controller last wrote to the CSS var. */
function renderedWidth() {
	return Number.parseInt(
		workspace.style.getPropertyValue( '--pmdk-inflow-inspector-width' ),
		10,
	);
}

function stubRects( { workspaceWidth = 1200 } = {} ) {
	workspace.getBoundingClientRect = () => ( {
		width: workspaceWidth,
		left: 0,
		right: workspaceWidth,
	} );
	handle.getBoundingClientRect = () => ( { width: 10 } );
	// The pane rect follows whatever the controller rendered.
	pane.getBoundingClientRect = () => ( { width: renderedWidth() || 360 } );
}

function mount( options = {} ) {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	host.innerHTML = `
		<div class="pmdk-inflow-workspace">
			<div class="pmdk-inflow-main"></div>
			<div class="pmdk-inflow-resizer" role="separator" tabindex="0" aria-label="Resize panel"><span data-resizer-value></span></div>
			<aside class="pmdk-inflow-inspector"></aside>
		</div>`;
	workspace = host.querySelector( '.pmdk-inflow-workspace' );
	handle = host.querySelector( '.pmdk-inflow-resizer' );
	pane = host.querySelector( '.pmdk-inflow-inspector' );
	stubRects();
	controller = createInspectorResizer( workspace, options );
}

const key = ( name ) =>
	handle.dispatchEvent(
		new KeyboardEvent( 'keydown', { key: name, bubbles: true } ),
	);

beforeEach( () => {
	window.localStorage.clear();
} );

afterEach( () => {
	controller?.destroy();
	host?.remove();
} );

describe( 'createInspectorResizer', () => {
	it( 'renders the default width + ARIA values on init', () => {
		mount();
		expect( renderedWidth() ).toBe( 360 );
		expect( handle.getAttribute( 'aria-valuenow' ) ).toBe( '360' );
		expect( handle.getAttribute( 'aria-valuemin' ) ).toBe( '320' );
		expect( handle.getAttribute( 'aria-valuemax' ) ).toBe( '520' );
		expect( handle.getAttribute( 'aria-orientation' ) ).toBe(
			'vertical',
		);
		expect(
			handle.querySelector( '[data-resizer-value]' ).textContent,
		).toBe( '360px' );
	} );

	it( 'restores a stored preference on init (clamped to hard bounds)', () => {
		window.localStorage.setItem( KEY, '9999' );
		mount();
		expect( renderedWidth() ).toBe( 520 );
	} );

	it( 'ArrowLeft widens by 16, ArrowRight narrows by 16 — both persist', () => {
		mount();
		key( 'ArrowLeft' );
		expect( renderedWidth() ).toBe( 376 );
		expect( window.localStorage.getItem( KEY ) ).toBe( '376' );
		key( 'ArrowRight' );
		key( 'ArrowRight' );
		expect( renderedWidth() ).toBe( 344 );
		expect( window.localStorage.getItem( KEY ) ).toBe( '344' );
	} );

	it( 'Home resets to the default width; End jumps to the max', () => {
		mount();
		key( 'ArrowLeft' );
		key( 'Home' );
		expect( renderedWidth() ).toBe( 360 );
		key( 'End' );
		expect( renderedWidth() ).toBe( 520 );
		expect( window.localStorage.getItem( KEY ) ).toBe( '520' );
	} );

	it( 'pointer drag resizes and persists on release', () => {
		mount();
		handle.dispatchEvent(
			new MouseEvent( 'pointerdown', {
				button: 0,
				clientX: 800,
				bubbles: true,
			} ),
		);
		expect( workspace.classList.contains( 'is-resizing' ) ).toBe(
			true,
		);
		// drag 40px toward the inspector's edge -> 40px wider (360 + 40)
		window.dispatchEvent(
			new MouseEvent( 'pointermove', { clientX: 760 } ),
		);
		expect( renderedWidth() ).toBe( 400 );
		expect( window.localStorage.getItem( KEY ) ).toBeNull();
		window.dispatchEvent( new MouseEvent( 'pointerup', {} ) );
		expect( workspace.classList.contains( 'is-resizing' ) ).toBe(
			false,
		);
		expect( window.localStorage.getItem( KEY ) ).toBe( '400' );
	} );

	it( 'a narrow viewport clamps the RENDER but never the stored pref', () => {
		window.localStorage.setItem( KEY, '500' );
		mount();
		expect( renderedWidth() ).toBe( 500 );
		// viewport shrinks: available = 700 - 360(main) - 10(handle) = 330
		stubRects( { workspaceWidth: 700 } );
		window.dispatchEvent( new Event( 'resize' ) );
		expect( renderedWidth() ).toBe( 330 );
		expect( window.localStorage.getItem( KEY ) ).toBe( '500' );
		// viewport grows back: preference returns
		stubRects( { workspaceWidth: 1200 } );
		window.dispatchEvent( new Event( 'resize' ) );
		expect( renderedWidth() ).toBe( 500 );
	} );

	it( 'storage failure never blocks resizing', () => {
		const spy = vi
			.spyOn( Storage.prototype, 'setItem' )
			.mockImplementation( () => {
				throw new Error( 'quota' );
			} );
		mount();
		expect( () => key( 'ArrowLeft' ) ).not.toThrow();
		expect( renderedWidth() ).toBe( 376 );
		spy.mockRestore();
	} );

	it( "storageKey:'' disables persistence entirely", () => {
		mount( { storageKey: '' } );
		key( 'ArrowLeft' );
		expect( renderedWidth() ).toBe( 376 );
		expect( window.localStorage.length ).toBe( 0 );
	} );

	it( 'onWidthChange observes every rendered width', () => {
		const onWidthChange = vi.fn();
		controller.destroy();
		host.remove();
		mount( { onWidthChange } );
		key( 'ArrowLeft' );
		expect( onWidthChange ).toHaveBeenLastCalledWith( 376 );
	} );

	it( 'destroy removes listeners', () => {
		mount();
		controller.destroy();
		key( 'ArrowLeft' );
		expect( renderedWidth() ).toBe( 360 );
	} );
} );
