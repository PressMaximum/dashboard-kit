/**
 * EntityListPage — Tier-2 page wiring: header, label fallbacks,
 * loading / empty / populated state switching, PageWrapper auto-wrap.
 *
 * DataViews itself is mocked to a stub so the test stays unit-level —
 * we verify the kit's switching logic + prop forwarding, NOT
 * DataViews's grid render behavior (that's the validation story's
 * job in Storybook).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Capture the props DataViews receives so we can assert on them
// without having to render the real (heavy) component in jsdom.
const dataViewsCalls = [];
vi.mock( '@wordpress/dataviews', () => ( {
	DataViews: ( props ) => {
		dataViewsCalls.push( props );
		return (
			<div
				className="dataviews-wrapper"
				data-testid="dataviews-stub"
			>
				stub
			</div>
		);
	},
} ) );

import EntityListPage from '../../src/datasets/EntityListPage.jsx';

let host;
let root;

function render( jsx ) {
	root = createRoot( host );
	act( () => root.render( jsx ) );
}

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	dataViewsCalls.length = 0;
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

const BASE_PROPS = {
	items: [],
	fields: [ { id: 'title', label: 'Title' } ],
	view: { type: 'table', perPage: 10 },
	onChangeView: () => undefined,
	paginationInfo: { totalItems: 0, totalPages: 0 },
	getItemId: ( item ) => String( item.id ),
	title: 'Surfaces',
};

describe( 'EntityListPage — chassis', () => {
	it( 'wraps content in PageWrapper with the locked class', () => {
		render( <EntityListPage { ...BASE_PROPS } items={ [ { id: 1 } ] } /> );
		const wrapper = host.querySelector( '.pmdk-page-wrapper' );
		expect( wrapper ).toBeTruthy();
		expect(
			wrapper.classList.contains( 'pmdk-entity-list-page' ),
		).toBe( true );
	} );

	it( 'renders the ListPageHeader with title + description', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				description="Modals, drawers, banners."
				items={ [ { id: 1 } ] }
			/>,
		);
		const heading = host.querySelector( '.pmdk-list-page-header__title' );
		expect( heading.textContent ).toBe( 'Surfaces' );
		const desc = host.querySelector(
			'.pmdk-list-page-header__description',
		);
		expect( desc.textContent ).toBe( 'Modals, drawers, banners.' );
	} );

	it( 'renders a primary Button when primaryAction is provided', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				primaryAction={ {
					label: 'Add Surface',
					href: 'post-new.php?post_type=surface',
				} }
				items={ [ { id: 1 } ] }
			/>,
		);
		const btn = host.querySelector(
			'.pmdk-list-page-header__actions a',
		);
		expect( btn ).toBeTruthy();
		expect( btn.textContent ).toBe( 'Add Surface' );
		expect( btn.getAttribute( 'href' ) ).toBe(
			'post-new.php?post_type=surface',
		);
	} );

	it( 'appends consumer className without dropping locked classes', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				items={ [ { id: 1 } ] }
				className="custom-page"
			/>,
		);
		const wrapper = host.querySelector( '.pmdk-page-wrapper' );
		expect(
			wrapper.classList.contains( 'pmdk-entity-list-page' ),
		).toBe( true );
		expect( wrapper.classList.contains( 'custom-page' ) ).toBe( true );
	} );
} );

describe( 'EntityListPage — state switching', () => {
	it( 'shows the loading state when isLoading + items empty', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				isLoading
				labels={ { loading: 'Loading templates…' } }
			/>,
		);
		const loading = host.querySelector(
			'.pmdk-entity-list-page__loading',
		);
		expect( loading ).toBeTruthy();
		expect( loading.getAttribute( 'role' ) ).toBe( 'status' );
		expect( loading.getAttribute( 'aria-live' ) ).toBe( 'polite' );
		expect( loading.textContent ).toContain( 'Loading templates…' );
		expect( host.querySelector( '[data-testid="dataviews-stub"]' ) ).toBeNull();
	} );

	it( 'shows the empty state when not loading + items empty', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				labels={ { noResults: 'Nothing here yet.' } }
			/>,
		);
		const empty = host.querySelector( '.pmdk-entity-list-page__empty' );
		expect( empty ).toBeTruthy();
		expect( empty.textContent ).toBe( 'Nothing here yet.' );
		expect( host.querySelector( '[data-testid="dataviews-stub"]' ) ).toBeNull();
	} );

	it( 'falls back to English defaults when labels prop omitted', () => {
		render( <EntityListPage { ...BASE_PROPS } isLoading /> );
		expect(
			host.querySelector( '.pmdk-entity-list-page__loading' )
				.textContent,
		).toContain( 'Loading items…' );

		// Re-render in non-loading + empty state to verify the other fallback.
		act( () => root.unmount() );
		root = createRoot( host );
		act( () =>
			root.render( <EntityListPage { ...BASE_PROPS } /> ),
		);
		expect(
			host.querySelector( '.pmdk-entity-list-page__empty' )
				.textContent,
		).toBe( 'No items match your filters.' );
	} );

	it( 'renders DataViews when items present and not loading', () => {
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				items={ [ { id: 1 }, { id: 2 } ] }
			/>,
		);
		expect(
			host.querySelector( '[data-testid="dataviews-stub"]' ),
		).toBeTruthy();
		expect( host.querySelector( '.pmdk-entity-list-page__loading' ) ).toBeNull();
		expect( host.querySelector( '.pmdk-entity-list-page__empty' ) ).toBeNull();
	} );

	it( 'still renders DataViews when isLoading=true but items already present', () => {
		// Refresh scenario: user has stored view + items from a previous
		// load, isLoading flips back true on a manual refresh — show the
		// stale data, not a loading splash that destroys the layout.
		render(
			<EntityListPage
				{ ...BASE_PROPS }
				isLoading
				items={ [ { id: 1 } ] }
			/>,
		);
		expect(
			host.querySelector( '[data-testid="dataviews-stub"]' ),
		).toBeTruthy();
		expect( host.querySelector( '.pmdk-entity-list-page__loading' ) ).toBeNull();
	} );
} );

describe( 'EntityListPage — DataViews forwarding', () => {
	it( 'forwards data, fields, view, onChangeView, actions, paginationInfo, defaultLayouts, getItemId', () => {
		const fields = [ { id: 'title', label: 'Title' } ];
		const view = { type: 'grid' };
		const onChangeView = vi.fn();
		const actions = [ { id: 'edit', label: 'Edit' } ];
		const paginationInfo = { totalItems: 2, totalPages: 1 };
		const defaultLayouts = { grid: { previewSize: 240 } };
		const getItemId = ( item ) => `id-${ item.id }`;

		render(
			<EntityListPage
				{ ...BASE_PROPS }
				items={ [ { id: 1 }, { id: 2 } ] }
				fields={ fields }
				view={ view }
				onChangeView={ onChangeView }
				actions={ actions }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ getItemId }
			/>,
		);
		expect( dataViewsCalls.length ).toBe( 1 );
		const props = dataViewsCalls[ 0 ];
		expect( props.data ).toEqual( [ { id: 1 }, { id: 2 } ] );
		expect( props.fields ).toBe( fields );
		expect( props.view ).toBe( view );
		expect( props.onChangeView ).toBe( onChangeView );
		expect( props.actions ).toBe( actions );
		expect( props.paginationInfo ).toBe( paginationInfo );
		expect( props.defaultLayouts ).toBe( defaultLayouts );
		expect( props.getItemId ).toBe( getItemId );
	} );
} );
