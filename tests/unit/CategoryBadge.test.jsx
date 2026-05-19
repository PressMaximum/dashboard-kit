/**
 * CategoryBadge — label + tone class resolution per SPEC §5.3b.
 *
 * jsdom-only DOM assertions: render to a detached container, read the
 * resulting innerHTML for className + text.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import CategoryBadge from '../../src/changelog/CategoryBadge.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	root = createRoot( host );
} );

afterEach( () => {
	act( () => root.unmount() );
	host.remove();
} );

function render( node ) {
	act( () => root.render( node ) );
}

describe( 'CategoryBadge', () => {
	it( 'renders the kit default label + tone for a known category', () => {
		render( <CategoryBadge category="added" /> );
		const el = host.querySelector( '.pmdk-category-badge' );
		expect( el ).toBeTruthy();
		expect( el.textContent ).toBe( 'New' );
		expect( el.className ).toContain( 'pmdk-category-badge--new' );
	} );

	it( 'returns null when category is empty', () => {
		render( <CategoryBadge category="" /> );
		expect( host.querySelector( '.pmdk-category-badge' ) ).toBeNull();
		render( <CategoryBadge /> );
		expect( host.querySelector( '.pmdk-category-badge' ) ).toBeNull();
	} );

	it( 'falls back to uppercased key + neutral tone for unknown category', () => {
		render( <CategoryBadge category="weirdthing" /> );
		const el = host.querySelector( '.pmdk-category-badge' );
		expect( el.textContent ).toBe( 'WEIRDTHING' );
		expect( el.className ).toContain( 'pmdk-category-badge--neutral' );
	} );

	it( 'uses the consumer-supplied label override', () => {
		render(
			<CategoryBadge
				category="fixed"
				labels={ { fixed: 'Đã sửa' } }
			/>,
		);
		expect( host.querySelector( '.pmdk-category-badge' ).textContent ).toBe(
			'Đã sửa',
		);
	} );

	it( 'uses the consumer-supplied toneOverride', () => {
		render(
			<CategoryBadge
				category="security"
				toneOverrides={ { security: 'updated' } }
			/>,
		);
		expect(
			host.querySelector( '.pmdk-category-badge' ).className,
		).toContain( 'pmdk-category-badge--updated' );
	} );
} );
