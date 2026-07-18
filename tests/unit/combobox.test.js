/**
 * createCombobox — headless behavior contract (KIT-P3 slice 1).
 *
 * Matches the design-system.js relationship-picker source: always-active
 * option while open, wrap-around arrows, Enter-opens-when-closed, pointer
 * hover sync, filter reset on close, outside pointerdown/focusin dismiss.
 * Documented deviations (Escape keeps focus, exact-match commit, Home/End/
 * Tab) are covered too. Pure DOM (no React) — the module's whole point.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	createCombobox,
	buildComboboxMarkup,
} from '../../src/primitives/combobox.js';

const OPTIONS = [ 'Consultation', 'Deep tissue', 'Facial', 'Haircut' ];

let host;
let controller;
let root;
let input;
let popover;
let changes;

const flushTimers = () => new Promise( ( r ) => setTimeout( r, 0 ) );
const key = ( name ) =>
	input.dispatchEvent( new KeyboardEvent( 'keydown', { key: name } ) );
const activeId = () => input.getAttribute( 'aria-activedescendant' );

function mount( markupOverrides = {} ) {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	host.innerHTML = buildComboboxMarkup( {
		name: 'service',
		label: 'Service',
		options: OPTIONS,
		listId: 'service-list',
		...markupOverrides,
	} );
	root = host.querySelector( '.pmdk-combobox' );
	input = root.querySelector( '[data-combobox-input]' );
	popover = root.querySelector( '.pmdk-combobox-popover' );
	changes = [];
	controller = createCombobox( root, {
		onChange: ( value ) => changes.push( value ),
	} );
}

beforeEach( () => mount() );

afterEach( () => {
	controller.destroy();
	host.remove();
} );

describe( 'createCombobox', () => {
	it( 'builds ARIA scaffold via buildComboboxMarkup', () => {
		expect( input.getAttribute( 'role' ) ).toBe( 'combobox' );
		expect( input.getAttribute( 'aria-controls' ) ).toBe( 'service-list' );
		expect( popover.getAttribute( 'role' ) ).toBe( 'listbox' );
		expect(
			popover.querySelectorAll( '[data-combobox-option]' ),
		).toHaveLength( OPTIONS.length );
	} );

	it( 'opens on focus with the first option active; outside pointerdown closes', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		expect( root.classList.contains( 'is-open' ) ).toBe( true );
		expect( popover.hidden ).toBe( false );
		expect( input.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		// auto-active first option (no committed selection yet)
		expect( activeId() ).toBe( 'service-list-0' );
		expect(
			popover.querySelector( '.is-active' ).dataset.comboboxOption,
		).toBe( 'Consultation' );

		document.body.dispatchEvent(
			new Event( 'pointerdown', { bubbles: true } ),
		);
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
		expect( popover.hidden ).toBe( true );
	} );

	it( 'opens with the committed selection active', async () => {
		input.dispatchEvent( new Event( 'focus' ) );
		popover
			.querySelector( '[data-combobox-option="Facial"]' )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
		await flushTimers(); // release the post-selection suppressOpen window
		input.dispatchEvent( new Event( 'focus' ) );
		expect( root.classList.contains( 'is-open' ) ).toBe( true );
		expect( activeId() ).toBe( 'service-list-2' );
	} );

	it( 'outside focusin also dismisses', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		expect( root.classList.contains( 'is-open' ) ).toBe( true );
		const outside = document.createElement( 'button' );
		document.body.appendChild( outside );
		outside.dispatchEvent( new Event( 'focusin', { bubbles: true } ) );
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
		outside.remove();
	} );

	it( 'filters as the user types and keeps an option active', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'fac';
		input.dispatchEvent( new Event( 'input' ) );
		const visible = [
			...popover.querySelectorAll( '[data-combobox-option]' ),
		].filter( ( el ) => ! el.hidden );
		expect( visible.map( ( el ) => el.dataset.comboboxOption ) ).toEqual( [
			'Facial',
		] );
		expect( activeId() ).toBe( 'service-list-2' );
	} );

	it( 'shows the empty note when nothing matches', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'zzz';
		input.dispatchEvent( new Event( 'input' ) );
		expect(
			popover.querySelector( '[data-combobox-empty]' ).hidden,
		).toBe( false );
		expect( activeId() ).toBeNull();
	} );

	it( 'closing resets the filter so the next open shows the full list', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'fac';
		input.dispatchEvent( new Event( 'input' ) );
		key( 'Escape' );
		expect(
			[ ...popover.querySelectorAll( '[data-combobox-option]' ) ].every(
				( el ) => ! el.hidden,
			),
		).toBe( true );
		expect( popover.querySelector( '.is-active' ) ).toBeNull();
	} );

	it( 'selects an option on click, commits + fires change once', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		const option = popover.querySelector(
			'[data-combobox-option="Facial"]',
		);
		option.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
		expect( root.dataset.selectedValue ).toBe( 'Facial' );
		expect( input.value ).toBe( 'Facial' );
		expect( option.getAttribute( 'aria-selected' ) ).toBe( 'true' );
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
		expect( changes ).toEqual( [ 'Facial' ] );
	} );

	it( 'pointer hover syncs the active option', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		const option = popover.querySelector(
			'[data-combobox-option="Haircut"]',
		);
		option.dispatchEvent( new Event( 'pointerover', { bubbles: true } ) );
		expect( activeId() ).toBe( 'service-list-3' );
		expect( option.classList.contains( 'is-active' ) ).toBe( true );
	} );

	it( 'keyboard: ArrowDown/ArrowUp rove and WRAP; Enter selects the active option', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		expect( activeId() ).toBe( 'service-list-0' );
		key( 'ArrowDown' );
		expect( activeId() ).toBe( 'service-list-1' );
		// wrap backwards past the first
		key( 'ArrowUp' );
		key( 'ArrowUp' );
		expect( activeId() ).toBe( 'service-list-3' );
		// wrap forwards past the last
		key( 'ArrowDown' );
		expect( activeId() ).toBe( 'service-list-0' );
		key( 'ArrowDown' );
		key( 'Enter' );
		expect( root.dataset.selectedValue ).toBe( 'Deep tissue' );
		expect( changes ).toEqual( [ 'Deep tissue' ] );
	} );

	it( 'Home/End jump to the first/last visible option', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		key( 'End' );
		expect( activeId() ).toBe( 'service-list-3' );
		key( 'Home' );
		expect( activeId() ).toBe( 'service-list-0' );
	} );

	it( 'ArrowDown on a closed combobox opens it and steps once (source parity)', () => {
		key( 'ArrowDown' );
		expect( root.classList.contains( 'is-open' ) ).toBe( true );
		// open auto-actives the first option, then the arrow itself steps —
		// exactly what design-system.js does (open + move in one keypress).
		expect( activeId() ).toBe( 'service-list-1' );
	} );

	it( 'Enter on a closed combobox opens it without selecting', () => {
		key( 'Enter' );
		expect( root.classList.contains( 'is-open' ) ).toBe( true );
		expect( root.dataset.selectedValue ).toBe( '' );
		expect( changes ).toEqual( [] );
	} );

	it( 'Tab closes and restores the committed value', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'garbage';
		input.dispatchEvent( new Event( 'input' ) );
		key( 'Tab' );
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
		expect( input.value ).toBe( '' );
	} );

	it( 'Escape restores the previous valid selection (focus kept)', () => {
		// commit a value first
		input.dispatchEvent( new Event( 'focus' ) );
		popover
			.querySelector( '[data-combobox-option="Haircut"]' )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
		// type junk then Escape
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'garbage';
		input.dispatchEvent( new Event( 'input' ) );
		key( 'Escape' );
		expect( input.value ).toBe( 'Haircut' );
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
		expect( changes ).toEqual( [ 'Haircut' ] );
	} );

	it( 'commits typed exact match (case-insensitive) on dismiss', () => {
		input.dispatchEvent( new Event( 'focus' ) );
		input.value = 'facial';
		input.dispatchEvent( new Event( 'input' ) );
		document.body.dispatchEvent(
			new Event( 'pointerdown', { bubbles: true } ),
		);
		expect( root.dataset.selectedValue ).toBe( 'Facial' );
		expect( changes ).toEqual( [ 'Facial' ] );
	} );

	it( 'setOptions repopulates and disables when empty', () => {
		controller.setOptions( [ 'Alpha', 'Beta' ], 'Beta' );
		expect(
			[ ...popover.querySelectorAll( '[data-combobox-option]' ) ].map(
				( el ) => el.dataset.comboboxOption,
			),
		).toEqual( [ 'Alpha', 'Beta' ] );
		expect( root.dataset.selectedValue ).toBe( 'Beta' );
		expect( input.value ).toBe( 'Beta' );
		expect( input.disabled ).toBe( false );

		controller.setOptions( [] );
		expect( input.disabled ).toBe( true );
		expect( root.dataset.selectedValue ).toBe( '' );
	} );

	it( 'destroy() removes listeners', () => {
		controller.destroy();
		input.dispatchEvent( new Event( 'focus' ) );
		expect( root.classList.contains( 'is-open' ) ).toBe( false );
	} );
} );
