/**
 * rewireBackButton — click-capture interception of the block editor's
 * fullscreen-close button.
 *
 * jsdom doesn't expose a writable `window.location.href`, so we
 * intercept the navigation by spying on `Object.defineProperty`-set
 * accessors. Simpler: mock `window.location` with a plain object that
 * tracks assignment.
 */

import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	vi,
} from 'vitest';

import { rewireBackButton } from '../../src/editor-helpers/rewireBackButton.js';

let navigatedTo;
let originalLocation;
let cleanup;

beforeEach( () => {
	navigatedTo = null;
	originalLocation = window.location;
	// Replace location with a writable spy. jsdom's default location
	// object throws on direct href assignment in some versions.
	Object.defineProperty( window, 'location', {
		configurable: true,
		writable: true,
		value: {
			...originalLocation,
			set href( v ) {
				navigatedTo = v;
			},
			get href() {
				return navigatedTo || '';
			},
		},
	} );
	cleanup = null;
} );

afterEach( () => {
	if ( cleanup ) {
		cleanup();
	}
	Object.defineProperty( window, 'location', {
		configurable: true,
		writable: true,
		value: originalLocation,
	} );
	document.body.innerHTML = '';
} );

describe( 'rewireBackButton', () => {
	it( 'throws when href is missing', () => {
		expect( () => rewireBackButton() ).toThrow( /href/ );
		expect( () => rewireBackButton( {} ) ).toThrow( /href/ );
	} );

	it( 'intercepts a click on the default selector', () => {
		cleanup = rewireBackButton( {
			href: 'admin.php?page=customify#templates',
		} );
		const btn = document.createElement( 'button' );
		btn.className = 'edit-post-fullscreen-mode-close';
		document.body.appendChild( btn );
		btn.click();
		expect( navigatedTo ).toBe(
			'admin.php?page=customify#templates',
		);
	} );

	it( 'matches via element.closest so nested icons inside the button click', () => {
		cleanup = rewireBackButton( {
			href: 'admin.php?page=x',
		} );
		const btn = document.createElement( 'button' );
		btn.className = 'edit-post-fullscreen-mode-close';
		const icon = document.createElement( 'span' );
		btn.appendChild( icon );
		document.body.appendChild( btn );
		icon.click();
		expect( navigatedTo ).toBe( 'admin.php?page=x' );
	} );

	it( 'ignores clicks outside the selector', () => {
		cleanup = rewireBackButton( {
			href: 'admin.php?page=x',
		} );
		const other = document.createElement( 'button' );
		other.className = 'unrelated';
		document.body.appendChild( other );
		other.click();
		expect( navigatedTo ).toBeNull();
	} );

	it( 'honors a consumer-supplied selector', () => {
		cleanup = rewireBackButton( {
			selector: '.my-close',
			href: 'admin.php?page=x',
		} );
		const btn = document.createElement( 'button' );
		btn.className = 'my-close';
		document.body.appendChild( btn );
		btn.click();
		expect( navigatedTo ).toBe( 'admin.php?page=x' );
	} );

	it( 'returns an unsubscribe that removes the listener', () => {
		cleanup = rewireBackButton( {
			href: 'admin.php?page=x',
		} );
		cleanup();
		cleanup = null;
		const btn = document.createElement( 'button' );
		btn.className = 'edit-post-fullscreen-mode-close';
		document.body.appendChild( btn );
		btn.click();
		expect( navigatedTo ).toBeNull();
	} );
} );
