/**
 * registerSubmenuActive — `.current` class sync on the WP submenu DOM
 * driven by `hashchange`.
 *
 * Builds a minimal `#toplevel_page_*` DOM mirroring the WP admin
 * structure, then asserts that the matching submenu item picks up
 * `.current` on initial mount + hashchange events.
 */

import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
} from 'vitest';

import { registerSubmenuActive } from '../../src/editor-helpers/registerSubmenuActive.js';

let cleanup;

beforeEach( () => {
	document.body.innerHTML = `
		<ul id="toplevel_page_blocksify">
			<ul class="wp-submenu">
				<li><a class="wp-first-item" href="admin.php?page=blocksify">Welcome</a></li>
				<li><a href="admin.php?page=blocksify#templates">Templates</a></li>
				<li><a href="admin.php?page=blocksify#settings">Settings</a></li>
			</ul>
		</ul>
	`;
	window.location.hash = '';
	cleanup = null;
} );

afterEach( () => {
	if ( cleanup ) {
		cleanup();
	}
	window.location.hash = '';
	document.body.innerHTML = '';
} );

function currentItem() {
	return document.body.querySelector( '.wp-submenu .current' );
}

describe( 'registerSubmenuActive — argument validation', () => {
	it( 'throws when menuId is missing', () => {
		expect( () =>
			registerSubmenuActive( { hash: '#x' } ),
		).toThrow( /menuId/ );
	} );

	it( 'throws when hash is missing', () => {
		expect( () =>
			registerSubmenuActive( { menuId: 'toplevel_page_blocksify' } ),
		).toThrow( /hash/ );
	} );

	it( 'returns null when the submenu DOM is absent', () => {
		document.body.innerHTML = '';
		const result = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#templates',
		} );
		expect( result ).toBeNull();
	} );

	it( 'returns null when no submenu item matches the target hash', () => {
		const result = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#does-not-exist',
		} );
		expect( result ).toBeNull();
	} );
} );

describe( 'registerSubmenuActive — sync behavior', () => {
	it( 'highlights the target on mount when hash matches', () => {
		window.location.hash = '#templates';
		cleanup = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#templates',
		} );
		const a = currentItem().querySelector( 'a' );
		expect( a.textContent ).toBe( 'Templates' );
	} );

	it( 'falls back to the first item when hash does not match', () => {
		window.location.hash = '#elsewhere';
		cleanup = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#templates',
		} );
		const a = currentItem().querySelector( 'a' );
		expect( a.textContent ).toBe( 'Welcome' );
	} );

	it( 'updates on hashchange events', () => {
		window.location.hash = '';
		cleanup = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#templates',
		} );
		expect( currentItem().querySelector( 'a' ).textContent ).toBe(
			'Welcome',
		);
		window.location.hash = '#templates';
		window.dispatchEvent( new Event( 'hashchange' ) );
		expect( currentItem().querySelector( 'a' ).textContent ).toBe(
			'Templates',
		);
	} );

	it( 'unsubscribe removes the hashchange listener', () => {
		window.location.hash = '';
		cleanup = registerSubmenuActive( {
			menuId: 'toplevel_page_blocksify',
			hash: '#templates',
		} );
		cleanup();
		cleanup = null;
		// After unsubscribe, navigating shouldn't re-run sync.
		window.location.hash = '#templates';
		window.dispatchEvent( new Event( 'hashchange' ) );
		expect( currentItem().querySelector( 'a' ).textContent ).toBe(
			'Welcome',
		);
	} );
} );
