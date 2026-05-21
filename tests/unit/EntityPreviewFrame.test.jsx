/**
 * EntityPreviewFrame — empty state + iframe render + viewport sizing.
 *
 * Renders the component into the document and asserts on the resulting
 * DOM. No DataViews dependency — this component is independent of the
 * grid surface.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

	// ------------------------------------------------------------------
	// 6.1 — previewDoc (blob URL) prop
	// ------------------------------------------------------------------

	describe( 'previewDoc prop (drift finding 6.1)', () => {
		// jsdom in this vitest version doesn't ship URL.createObjectURL,
		// so install fakes directly + restore on teardown.
		let originalCreate;
		let originalRevoke;
		let createSpy;
		let revokeSpy;
		let urlCounter;

		beforeEach( () => {
			urlCounter = 0;
			originalCreate = URL.createObjectURL;
			originalRevoke = URL.revokeObjectURL;
			createSpy = vi.fn( () => `blob:fake-${ ++urlCounter }` );
			revokeSpy = vi.fn();
			URL.createObjectURL = createSpy;
			URL.revokeObjectURL = revokeSpy;
		} );

		afterEach( () => {
			// Vitest runs nested afterEach hooks before outer ones, so
			// React's unmount-time effect cleanup would hit a restored
			// (undefined) URL.revokeObjectURL. Unmount here first so the
			// effect cleanup still sees the spies.
			if ( root ) {
				act( () => root.unmount() );
				root = null;
			}
			URL.createObjectURL = originalCreate;
			URL.revokeObjectURL = originalRevoke;
		} );

		it( 'renders an iframe whose src is a blob: URL when previewDoc is set', () => {
			render(
				<EntityPreviewFrame
					previewDoc="<!doctype html><html><body><div>hi</div></body></html>"
					title="x"
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			expect( frame ).toBeTruthy();
			expect( createSpy ).toHaveBeenCalledTimes( 1 );
			expect( frame.getAttribute( 'src' ) ).toBe( 'blob:fake-1' );
		} );

		it( 'revokes the old blob URL and creates a new one on previewDoc change', () => {
			render(
				<EntityPreviewFrame previewDoc="<html>a</html>" title="x" />,
			);
			expect( createSpy ).toHaveBeenCalledTimes( 1 );
			act( () =>
				root.render(
					<EntityPreviewFrame
						previewDoc="<html>b</html>"
						title="x"
					/>,
				),
			);
			expect( createSpy ).toHaveBeenCalledTimes( 2 );
			expect( revokeSpy ).toHaveBeenCalledWith( 'blob:fake-1' );
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			expect( frame.getAttribute( 'src' ) ).toBe( 'blob:fake-2' );
		} );

		it( 'revokes the blob URL on unmount', () => {
			render(
				<EntityPreviewFrame previewDoc="<html>a</html>" title="x" />,
			);
			act( () => root.unmount() );
			root = null;
			expect( revokeSpy ).toHaveBeenCalledWith( 'blob:fake-1' );
		} );

		it( 'falls back to the empty placeholder when both src and previewDoc are absent', () => {
			render( <EntityPreviewFrame /> );
			const wrapper = host.querySelector( '.pmdk-entity-preview' );
			expect( wrapper.classList.contains( 'is-empty' ) ).toBe( true );
			expect( createSpy ).not.toHaveBeenCalled();
		} );

		it( 'previewDoc wins when both src and previewDoc are provided', () => {
			render(
				<EntityPreviewFrame
					src="https://example.test/preview/42"
					previewDoc="<html>x</html>"
					title="x"
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			expect( frame.getAttribute( 'src' ) ).toBe( 'blob:fake-1' );
		} );

		it( 'falls back to src when previewDoc clears', () => {
			render(
				<EntityPreviewFrame
					src="https://example.test/preview/42"
					previewDoc="<html>x</html>"
					title="x"
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			expect( frame.getAttribute( 'src' ) ).toBe( 'blob:fake-1' );
			act( () =>
				root.render(
					<EntityPreviewFrame
						src="https://example.test/preview/42"
						title="x"
					/>,
				),
			);
			expect( revokeSpy ).toHaveBeenCalledWith( 'blob:fake-1' );
			expect( frame.getAttribute( 'src' ) ).toBe(
				'https://example.test/preview/42',
			);
		} );
	} );

	// ------------------------------------------------------------------
	// 6.2 / 6.5 — aspectMode + onContentHeight + body.scrollHeight trap
	// ------------------------------------------------------------------

	describe( 'aspectMode + onContentHeight (drift findings 6.2 + 6.5)', () => {
		// jsdom doesn't give meaningful getBoundingClientRect on iframe
		// content, so we hand-build a fake contentDocument whose
		// firstElementChild returns a stubbed rect.
		function stubIframeContent(
			frame,
			{ height, padTop = 0, padBot = 0 },
		) {
			const first = {
				getBoundingClientRect: () => ( { height } ),
			};
			const body = {
				firstElementChild: first,
				get scrollHeight() {
					throw new Error(
						'measurement must not read body.scrollHeight (finding 6.5)',
					);
				},
			};
			const fakeDoc = {
				body,
				defaultView: {
					getComputedStyle: () => ( {
						paddingTop: `${ padTop }px`,
						paddingBottom: `${ padBot }px`,
					} ),
				},
			};
			Object.defineProperty( frame, 'contentDocument', {
				configurable: true,
				get: () => fakeDoc,
			} );
		}

		it( 'defaults to aspectMode="fixed" and renders the height inline', () => {
			render(
				<EntityPreviewFrame src="https://example.test/x" title="x" />,
			);
			const wrapper = host.querySelector( '.pmdk-entity-preview' );
			expect( wrapper.getAttribute( 'data-aspect-mode' ) ).toBe(
				'fixed',
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			expect( frame.style.height ).toBe( '900px' );
		} );

		it( 'aspectMode="content" emits the data attribute and omits inline height', () => {
			render(
				<EntityPreviewFrame
					src="https://example.test/x"
					title="x"
					aspectMode="content"
				/>,
			);
			const wrapper = host.querySelector( '.pmdk-entity-preview' );
			expect( wrapper.getAttribute( 'data-aspect-mode' ) ).toBe(
				'content',
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			// Initial style.height empty — measurement may not run in
			// jsdom without a stubbed contentDocument; what matters is
			// the JSX didn't bake in viewportHeight.
			expect( frame.style.height ).toBe( '' );
		} );

		it( 'fires onContentHeight with (itemId, measured height) on iframe load', () => {
			const onContentHeight = vi.fn();
			render(
				<EntityPreviewFrame
					src="about:blank"
					title="x"
					aspectMode="content"
					itemId="surface-42"
					onContentHeight={ onContentHeight }
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			stubIframeContent( frame, {
				height: 380,
				padTop: 10,
				padBot: 30,
			} );
			act( () => {
				frame.dispatchEvent( new Event( 'load' ) );
			} );
			expect( onContentHeight ).toHaveBeenCalledWith(
				'surface-42',
				420,
			);
			expect( frame.style.height ).toBe( '420px' );
		} );

		it( 'measurement reads body.firstElementChild rect, NOT body.scrollHeight (finding 6.5)', () => {
			// stubIframeContent above defines a `scrollHeight` getter
			// that throws — this test asserts the measure function
			// never touches it.
			const onContentHeight = vi.fn();
			render(
				<EntityPreviewFrame
					src="about:blank"
					title="x"
					aspectMode="content"
					itemId={ 7 }
					onContentHeight={ onContentHeight }
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			stubIframeContent( frame, { height: 200 } );
			expect( () => {
				act( () => {
					frame.dispatchEvent( new Event( 'load' ) );
				} );
			} ).not.toThrow();
			expect( onContentHeight ).toHaveBeenCalledWith( 7, 200 );
		} );

		it( 'skips the onContentHeight call when measurement returns 0', () => {
			const onContentHeight = vi.fn();
			render(
				<EntityPreviewFrame
					src="about:blank"
					title="x"
					aspectMode="content"
					itemId="x"
					onContentHeight={ onContentHeight }
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			stubIframeContent( frame, { height: 0 } );
			act( () => {
				frame.dispatchEvent( new Event( 'load' ) );
			} );
			expect( onContentHeight ).not.toHaveBeenCalled();
		} );

		it( 'does not attach measurement when aspectMode="fixed"', () => {
			const onContentHeight = vi.fn();
			render(
				<EntityPreviewFrame
					src="about:blank"
					title="x"
					aspectMode="fixed"
					itemId="x"
					onContentHeight={ onContentHeight }
				/>,
			);
			const frame = host.querySelector( '.pmdk-entity-preview__frame' );
			stubIframeContent( frame, { height: 500 } );
			act( () => {
				frame.dispatchEvent( new Event( 'load' ) );
			} );
			expect( onContentHeight ).not.toHaveBeenCalled();
			expect( frame.style.height ).toBe( '900px' );
		} );
	} );
} );
