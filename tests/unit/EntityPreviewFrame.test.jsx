/**
 * EntityPreviewFrame — empty state + iframe render + viewport sizing.
 *
 * Renders the component into the document and asserts on the resulting
 * DOM. No DataViews dependency — this component is independent of the
 * grid surface.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import EntityPreviewFrame from '../../src/datasets/EntityPreviewFrame.jsx';

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
	if ( host && host.parentNode ) {
		host.parentNode.removeChild( host );
	}
} );

describe( 'EntityPreviewFrame', () => {
	it( 'renders the iframe with src + title when src is provided', () => {
		render(
			<EntityPreviewFrame
				src="https://example.test/preview/42"
				title="Surface preview"
			/>,
		);
		const frame = host.querySelector( '.pmdk-entity-preview__frame' );
		expect( frame ).toBeTruthy();
		expect( frame.tagName ).toBe( 'IFRAME' );
		expect( frame.getAttribute( 'src' ) ).toBe(
			'https://example.test/preview/42',
		);
		expect( frame.getAttribute( 'title' ) ).toBe( 'Surface preview' );
		expect( frame.getAttribute( 'loading' ) ).toBe( 'lazy' );
		expect( frame.getAttribute( 'tabindex' ) ).toBe( '-1' );
	} );

	it( 'renders the empty placeholder when src is empty', () => {
		render( <EntityPreviewFrame emptyLabel="Nothing yet" /> );
		const wrapper = host.querySelector( '.pmdk-entity-preview' );
		expect( wrapper.classList.contains( 'is-empty' ) ).toBe( true );
		expect( host.querySelector( '.pmdk-entity-preview__frame' ) ).toBeNull();
		expect( wrapper.textContent ).toBe( 'Nothing yet' );
	} );

	it( 'falls back to the English default empty label', () => {
		render( <EntityPreviewFrame /> );
		expect(
			host.querySelector( '.pmdk-entity-preview' ).textContent,
		).toBe( 'No preview' );
	} );

	it( 'sets viewport CSS variable + iframe width/height from viewportWidth/Height props', () => {
		render(
			<EntityPreviewFrame
				src="https://example.test/x"
				title="x"
				viewportWidth={ 1440 }
				viewportHeight={ 1080 }
			/>,
		);
		const wrapper = host.querySelector( '.pmdk-entity-preview' );
		expect( wrapper.style.getPropertyValue( '--pmdk-preview-viewport' ) ).toBe(
			'1440px',
		);
		const frame = host.querySelector( '.pmdk-entity-preview__frame' );
		expect( frame.style.width ).toBe( '1440px' );
		expect( frame.style.height ).toBe( '1080px' );
	} );

	it( 'defaults viewport to 1200x900 when no viewport props supplied', () => {
		render(
			<EntityPreviewFrame src="https://example.test/x" title="x" />,
		);
		const wrapper = host.querySelector( '.pmdk-entity-preview' );
		expect( wrapper.style.getPropertyValue( '--pmdk-preview-viewport' ) ).toBe(
			'1200px',
		);
		const frame = host.querySelector( '.pmdk-entity-preview__frame' );
		expect( frame.style.width ).toBe( '1200px' );
		expect( frame.style.height ).toBe( '900px' );
	} );

	it( 'appends consumer className without dropping locked classes', () => {
		render(
			<EntityPreviewFrame
				src="https://example.test/x"
				title="x"
				className="custom-thumb"
			/>,
		);
		const wrapper = host.querySelector( '.pmdk-entity-preview' );
		expect( wrapper.classList.contains( 'pmdk-entity-preview' ) ).toBe(
			true,
		);
		expect( wrapper.classList.contains( 'custom-thumb' ) ).toBe( true );
	} );

	it( 'appends consumer className when empty too', () => {
		render( <EntityPreviewFrame className="custom-thumb" /> );
		const wrapper = host.querySelector( '.pmdk-entity-preview' );
		expect( wrapper.classList.contains( 'is-empty' ) ).toBe( true );
		expect( wrapper.classList.contains( 'custom-thumb' ) ).toBe( true );
	} );
} );
