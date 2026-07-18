/**
 * <PMDKDataTable> — behavior contract (KIT-P3 slice 2, Q13).
 *
 * Covers the kit-owned behaviors: sorting, row selection + bulk bar,
 * localStorage persistence (restore on remount), server-mode query callbacks,
 * five states, column-order normalisation, pagination arithmetic. Product-side
 * pieces (cell renderers, facets, row actions) enter only as props — exactly
 * how a consumer wires them.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
	PMDKDataTable,
	normalizeColumnOrder,
} from '../../src/table/index.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

function render( jsx ) {
	root = createRoot( host );
	act( () => root.render( jsx ) );
}

function unmount() {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
}

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	window.localStorage.clear();
} );

afterEach( () => {
	unmount();
	host.remove();
} );

const DATA = [
	{ id: 1, title: 'Charlie', amount: 30 },
	{ id: 2, title: 'Alpha', amount: 10 },
	{ id: 3, title: 'Bravo', amount: 20 },
];

const COLUMNS = [
	{
		accessorKey: 'title',
		id: 'title',
		header: 'Title',
		meta: { label: 'Title' },
		cell: ( info ) => info.getValue(),
	},
	{
		accessorKey: 'amount',
		id: 'amount',
		header: 'Amount',
		meta: { label: 'Amount', numeric: true },
		cell: ( info ) => String( info.getValue() ),
	},
];

const BASE = {
	columns: COLUMNS,
	data: DATA,
	getRowId: ( row ) => String( row.id ),
	itemsLabel: 'records',
};

const firstColumnTexts = () =>
	[ ...host.querySelectorAll( 'tbody td[data-column="title"]' ) ].map(
		( td ) => td.textContent,
	);

describe( 'normalizeColumnOrder', () => {
	const IDS = [ 'select', 'a', 'b', 'action' ];
	it( 'pins select first and the end column last', () => {
		expect( normalizeColumnOrder( [ 'b', 'a' ], IDS, 'action' ) ).toEqual(
			[ 'select', 'b', 'a', 'action' ],
		);
	} );
	it( 'drops unknown ids and appends new ones', () => {
		expect(
			normalizeColumnOrder( [ 'ghost', 'b' ], IDS, 'action' ),
		).toEqual( [ 'select', 'b', 'a', 'action' ] );
	} );
	it( 'handles missing select/end columns', () => {
		expect( normalizeColumnOrder( [ 'b' ], [ 'a', 'b' ], '' ) ).toEqual( [
			'b',
			'a',
		] );
	} );
} );

describe( 'PMDKDataTable — render + sort', () => {
	it( 'renders rows with data-column cells and the select column', () => {
		render( <PMDKDataTable { ...BASE } /> );
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 3 );
		expect(
			host.querySelectorAll( 'thead .pmdk-table-checkbox' ),
		).toHaveLength( 1 );
		expect( firstColumnTexts() ).toEqual( [
			'Charlie',
			'Alpha',
			'Bravo',
		] );
		// numeric meta gets the amount class
		expect(
			host.querySelector( 'td[data-column="amount"]' ).className,
		).toBe( 'pmdk-amount' );
	} );

	it( 'sort button toggles order + aria-sort', () => {
		render( <PMDKDataTable { ...BASE } /> );
		const sortButton = host.querySelector(
			'th[data-column="title"] .pmdk-sort-button',
		);
		act( () => sortButton.click() );
		expect( firstColumnTexts() ).toEqual( [
			'Alpha',
			'Bravo',
			'Charlie',
		] );
		expect(
			host
				.querySelector( 'th[data-column="title"]' )
				.getAttribute( 'aria-sort' ),
		).toBe( 'ascending' );
		act( () => sortButton.click() );
		expect( firstColumnTexts() ).toEqual( [
			'Charlie',
			'Bravo',
			'Alpha',
		] );
	} );

	it( 'row activation fires on row click but not on controls', () => {
		const onRowActivate = vi.fn();
		render(
			<PMDKDataTable { ...BASE } onRowActivate={ onRowActivate } />,
		);
		const row = host.querySelector( 'tbody tr' );
		act( () => row.click() );
		expect( onRowActivate ).toHaveBeenCalledTimes( 1 );
		expect( onRowActivate.mock.calls[ 0 ][ 0 ].id ).toBe( 1 );
		const checkbox = host.querySelector(
			'tbody .pmdk-table-checkbox',
		);
		act( () => checkbox.click() );
		expect( onRowActivate ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'PMDKDataTable — selection + bulk bar', () => {
	it( 'selection swaps thead for the bulk bar with count + product slot', () => {
		const bulkActions = vi.fn( ( { selectedRows } ) => (
			<button type="button" data-testid="bulk-delete">
				Delete { selectedRows.length }
			</button>
		) );
		render( <PMDKDataTable { ...BASE } bulkActions={ bulkActions } /> );
		expect( host.querySelector( '.pmdk-bulk-row' ) ).toBeNull();

		const checkbox = host.querySelector(
			'tbody .pmdk-table-checkbox',
		);
		act( () => checkbox.click() );

		const bulkRow = host.querySelector( '.pmdk-bulk-row' );
		expect( bulkRow ).toBeTruthy();
		expect( bulkRow.textContent ).toContain( '1 selected' );
		expect(
			host.querySelector( '[data-testid="bulk-delete"]' ),
		).toBeTruthy();

		// clear returns to the normal header
		act( () => host.querySelector( '.pmdk-bulk-clear' ).click() );
		expect( host.querySelector( '.pmdk-bulk-row' ) ).toBeNull();
	} );

	it( 'clearSelection passed to the slot empties the selection', () => {
		let clear;
		render(
			<PMDKDataTable
				{ ...BASE }
				bulkActions={ ( api ) => {
					clear = api.clearSelection;
					return null;
				} }
			/>,
		);
		act( () =>
			host.querySelector( 'tbody .pmdk-table-checkbox' ).click(),
		);
		expect( host.querySelector( '.pmdk-bulk-row' ) ).toBeTruthy();
		act( () => clear() );
		expect( host.querySelector( '.pmdk-bulk-row' ) ).toBeNull();
	} );
} );

describe( 'PMDKDataTable — persistence', () => {
	const KEY = 'test.pmdk.table.v1';

	it( 'persists sorting and restores it on remount', () => {
		render( <PMDKDataTable { ...BASE } persistenceKey={ KEY } /> );
		act( () =>
			host
				.querySelector(
					'th[data-column="title"] .pmdk-sort-button',
				)
				.click(),
		);
		const stored = JSON.parse( window.localStorage.getItem( KEY ) );
		expect( stored.sorting ).toEqual( [ { id: 'title', desc: false } ] );
		// Transient state is NOT persisted.
		expect( stored.rowSelection ).toBeUndefined();
		expect( stored.globalFilter ).toBeUndefined();

		unmount();
		host.remove();
		host = document.createElement( 'div' );
		document.body.appendChild( host );

		render( <PMDKDataTable { ...BASE } persistenceKey={ KEY } /> );
		expect( firstColumnTexts() ).toEqual( [
			'Alpha',
			'Bravo',
			'Charlie',
		] );
		expect(
			host
				.querySelector( 'th[data-column="title"]' )
				.getAttribute( 'aria-sort' ),
		).toBe( 'ascending' );
	} );

	it( 'persists page size', () => {
		render( <PMDKDataTable { ...BASE } persistenceKey={ KEY } /> );
		const select = host.querySelector( '.pmdk-pagination-size select' );
		act( () => {
			select.value = '50';
			select.dispatchEvent(
				new Event( 'change', { bubbles: true } ),
			);
		} );
		expect(
			JSON.parse( window.localStorage.getItem( KEY ) ).pageSize,
		).toBe( 50 );
	} );

	it( 'no key -> nothing stored', () => {
		render( <PMDKDataTable { ...BASE } /> );
		act( () =>
			host
				.querySelector(
					'th[data-column="title"] .pmdk-sort-button',
				)
				.click(),
		);
		expect( window.localStorage.length ).toBe( 0 );
	} );
} );

describe( 'PMDKDataTable — server mode', () => {
	const bigPage = Array.from( { length: 25 }, ( _, index ) => ( {
		id: index + 1,
		title: `Row ${ index + 1 }`,
		amount: index,
	} ) );

	it( 'reports the initial view once on mount', () => {
		const onQueryChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				serverMode
				totalCount={ 60 }
				pageIndex={ 0 }
				onQueryChange={ onQueryChange }
			/>,
		);
		expect( onQueryChange ).toHaveBeenCalledTimes( 1 );
		expect( onQueryChange.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			pageIndex: 0,
			pageSize: 25,
			globalFilter: '',
		} );
	} );

	it( 'does not client-sort; emits sorting with a page reset instead', () => {
		const onQueryChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				serverMode
				totalCount={ 60 }
				pageIndex={ 2 }
				onQueryChange={ onQueryChange }
			/>,
		);
		act( () =>
			host
				.querySelector(
					'th[data-column="title"] .pmdk-sort-button',
				)
				.click(),
		);
		// rows keep server order (manualSorting)
		expect( firstColumnTexts() ).toEqual( [
			'Charlie',
			'Alpha',
			'Bravo',
		] );
		const lastCall = onQueryChange.mock.calls.at( -1 )[ 0 ];
		expect( lastCall.sorting ).toEqual( [
			{ id: 'title', desc: false },
		] );
		expect( lastCall.pageIndex ).toBe( 0 );
	} );

	it( 'pagination controls request pages through onQueryChange', () => {
		const onQueryChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				data={ bigPage }
				serverMode
				totalCount={ 60 }
				pageIndex={ 0 }
				onQueryChange={ onQueryChange }
			/>,
		);
		const nextButton = host.querySelector(
			'.pmdk-page-controls button:last-child',
		);
		expect( nextButton.disabled ).toBe( false );
		act( () => nextButton.click() );
		expect( onQueryChange.mock.calls.at( -1 )[ 0 ].pageIndex ).toBe( 1 );
		// footer reflects the server total
		expect(
			host.querySelector( '.pmdk-pagination span' ).textContent,
		).toBe( 'Showing 1–25 of 60 records' );
	} );
} );

describe( 'PMDKDataTable — five states', () => {
	it( 'loading keeps the toolbar and shows skeletons', () => {
		render( <PMDKDataTable { ...BASE } data={ [] } status="loading" /> );
		expect( host.querySelector( '.pmdk-toolbar' ) ).toBeTruthy();
		expect( host.querySelector( '.pmdk-state-loading' ) ).toBeTruthy();
		expect(
			host.querySelectorAll( '.pmdk-skeleton' ).length,
		).toBeGreaterThan( 0 );
		expect( host.querySelector( '.pmdk-pagination' ) ).toBeNull();
	} );

	it( 'empty hides the toolbar and renders the product CTA', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				data={ [] }
				status="empty"
				states={ {
					empty: {
						title: 'No records yet',
						action: (
							<button type="button" data-testid="cta">
								New record
							</button>
						),
					},
				} }
			/>,
		);
		expect( host.querySelector( '.pmdk-toolbar' ) ).toBeNull();
		expect( host.textContent ).toContain( 'No records yet' );
		expect(
			host.querySelector( '[data-testid="cta"]' ),
		).toBeTruthy();
	} );

	it( 'error keeps the toolbar (safe query context) + retry slot', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				data={ [] }
				status="error"
				states={ {
					error: { title: 'Failed', action: <button type="button">Retry</button> },
				} }
			/>,
		);
		expect( host.querySelector( '.pmdk-toolbar' ) ).toBeTruthy();
		expect(
			host.querySelector( '.pmdk-state-icon.is-error' ),
		).toBeTruthy();
	} );

	it( 'permission renders the panel, never an empty dataset', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				data={ [] }
				status="permission"
				states={ { permission: { title: 'No access' } } }
			/>,
		);
		expect( host.querySelector( '.pmdk-toolbar' ) ).toBeNull();
		expect( host.querySelector( '.pmdk-table' ) ).toBeNull();
		expect( host.textContent ).toContain( 'No access' );
	} );

	it( 'ready with zero rows shows the inline no-results state', () => {
		render( <PMDKDataTable { ...BASE } data={ [] } /> );
		expect( host.querySelector( '.pmdk-empty' ) ).toBeTruthy();
		expect( host.querySelector( '.pmdk-toolbar' ) ).toBeTruthy();
	} );
} );

describe( 'PMDKDataTable — column defaults', () => {
	it( 'applies defaultColumnVisibility', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				defaultColumnVisibility={ { amount: false } }
			/>,
		);
		expect(
			host.querySelector( 'th[data-column="amount"]' ),
		).toBeNull();
	} );

	it( 'client pagination slices rows and footer counts', () => {
		const many = Array.from( { length: 30 }, ( _, index ) => ( {
			id: index + 1,
			title: `Row ${ String( index + 1 ).padStart( 2, '0' ) }`,
			amount: index,
		} ) );
		render( <PMDKDataTable { ...BASE } data={ many } /> );
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 25 );
		expect(
			host.querySelector( '.pmdk-pagination span' ).textContent,
		).toBe( 'Showing 1–25 of 30 records' );
		act( () =>
			host
				.querySelector( '.pmdk-page-controls button:last-child' )
				.click(),
		);
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 5 );
		expect(
			host.querySelector( '.pmdk-pagination span' ).textContent,
		).toBe( 'Showing 26–30 of 30 records' );
	} );
} );

describe( 'PMDKDataTable — API gaps (review round G1/G2/G3/G5)', () => {
	const FILTERABLE_COLUMNS = [
		{
			accessorKey: 'title',
			id: 'title',
			header: 'Title',
			meta: { label: 'Title' },
			filterFn: ( row, columnId, values ) =>
				! Array.isArray( values ) ||
				! values.length ||
				values.includes( row.getValue( columnId ) ),
			cell: ( info ) => info.getValue(),
		},
		{
			accessorKey: 'amount',
			id: 'amount',
			header: 'Amount',
			meta: { label: 'Amount', numeric: true },
			cell: ( info ) => String( info.getValue() ),
		},
	];

	it( 'G1: columnFilters is fully controlled (prop drives rows, callback reports)', () => {
		const onColumnFiltersChange = vi.fn();
		function Wrapper() {
			const [ filters, setFilters ] = useState( [] );
			return (
				<PMDKDataTable
					{ ...BASE }
					columns={ FILTERABLE_COLUMNS }
					columnFilters={ filters }
					onColumnFiltersChange={ ( next ) => {
						onColumnFiltersChange( next );
						setFilters( next );
					} }
					filterBuilder={ ( { table } ) => (
						<button
							type="button"
							data-testid="apply-filter"
							onClick={ () =>
								table
									.getColumn( 'title' )
									.setFilterValue( [ 'Alpha' ] )
							}
						>
							Only Alpha
						</button>
					) }
					filtersOpen
				/>
			);
		}
		render( <Wrapper /> );
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 3 );
		act( () =>
			host.querySelector( '[data-testid="apply-filter"]' ).click(),
		);
		// setFilterValue routed through the controlled callback -> parent
		// state -> back down -> rows follow the PARENT's state.
		expect( onColumnFiltersChange ).toHaveBeenCalledWith( [
			{ id: 'title', value: [ 'Alpha' ] },
		] );
		expect( firstColumnTexts() ).toEqual( [ 'Alpha' ] );
	} );

	it( 'G1: external filter state changes re-filter without any table interaction', () => {
		function Wrapper( { filters } ) {
			return (
				<PMDKDataTable
					{ ...BASE }
					columns={ FILTERABLE_COLUMNS }
					columnFilters={ filters }
					onColumnFiltersChange={ () => {} }
				/>
			);
		}
		render( <Wrapper filters={ [] } /> );
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 3 );
		act( () =>
			root.render(
				<Wrapper
					filters={ [ { id: 'title', value: [ 'Bravo' ] } ] }
				/>,
			),
		);
		expect( firstColumnTexts() ).toEqual( [ 'Bravo' ] );
	} );

	it( 'G1: filtersOpen is controllable and reports toggle intent', () => {
		const onFiltersOpenChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				filterBuilder={ () => (
					<div data-testid="builder">builder</div>
				) }
				filtersOpen
				onFiltersOpenChange={ onFiltersOpenChange }
			/>,
		);
		// controlled open: builder is out without any click
		expect(
			host.querySelector( '[data-testid="builder"]' ),
		).toBeTruthy();
		act( () =>
			host.querySelector( '.pmdk-toolbar-filter-button' ).click(),
		);
		expect( onFiltersOpenChange ).toHaveBeenCalledWith( false );
		// parent did not flip the prop -> stays open (fully controlled)
		expect(
			host.querySelector( '[data-testid="builder"]' ),
		).toBeTruthy();
	} );

	it( 'G2: initialPreferences seeds the view (wins over defaults)', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				initialPreferences={ {
					sorting: [ { id: 'title', desc: false } ],
					columnVisibility: { amount: false },
				} }
			/>,
		);
		expect( firstColumnTexts() ).toEqual( [
			'Alpha',
			'Bravo',
			'Charlie',
		] );
		expect(
			host
				.querySelector( 'th[data-column="title"]' )
				.getAttribute( 'aria-sort' ),
		).toBe( 'ascending' );
		expect(
			host.querySelector( 'th[data-column="amount"]' ),
		).toBeNull();
	} );

	it( 'G2: onPreferencesChange reports preference changes (pluggable store)', () => {
		const onPreferencesChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				onPreferencesChange={ onPreferencesChange }
			/>,
		);
		act( () =>
			host
				.querySelector(
					'th[data-column="title"] .pmdk-sort-button',
				)
				.click(),
		);
		const lastCall = onPreferencesChange.mock.calls.at( -1 )[ 0 ];
		expect( lastCall.sorting ).toEqual( [
			{ id: 'title', desc: false },
		] );
		expect( lastCall ).toHaveProperty( 'columnVisibility' );
		expect( lastCall ).toHaveProperty( 'columnOrder' );
		expect( lastCall ).toHaveProperty( 'pageSize' );
		// no persistenceKey -> localStorage untouched (store is pluggable)
		expect( window.localStorage.length ).toBe( 0 );
	} );

	it( 'G3: onRowSelectionChange fires for user checks AND kit-side clears', () => {
		const onRowSelectionChange = vi.fn();
		render(
			<PMDKDataTable
				{ ...BASE }
				onRowSelectionChange={ onRowSelectionChange }
				bulkActions={ () => null }
			/>,
		);
		act( () =>
			host.querySelector( 'tbody .pmdk-table-checkbox' ).click(),
		);
		expect( onRowSelectionChange ).toHaveBeenCalledWith( { 1: true } );
		// kit-side clear (the bulk-bar X) must report too
		act( () => host.querySelector( '.pmdk-bulk-clear' ).click() );
		expect( onRowSelectionChange ).toHaveBeenCalledWith( {} );
		expect( host.querySelector( '.pmdk-bulk-row' ) ).toBeNull();
	} );

	it( 'G5: getRowAriaLabel labels each row', () => {
		render(
			<PMDKDataTable
				{ ...BASE }
				getRowAriaLabel={ ( record ) => `Open ${ record.title }` }
			/>,
		);
		expect(
			host
				.querySelector( 'tbody tr' )
				.getAttribute( 'aria-label' ),
		).toBe( 'Open Charlie' );
	} );
} );

describe( 'PMDKDataTable — slot arrays render without React key warnings', () => {
	// Consumer slots are routinely element ARRAYS (Blocksify's 0.2.0 bump
	// surfaced the DEV "unique key" warning with the component stack
	// pointing at the kit's toolbar subtree). The kit auto-keys array slot
	// results via Children.toArray (renderSlot) and falls back to a
	// positional key for id-less menuItems.
	it( 'accepts keyless arrays in toolbarControls/activeFilters/menuItems/bulkActions/primaryAction', () => {
		const spy = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		render(
			<PMDKDataTable
				{ ...BASE }
				enableRowSelection
				toolbarControls={ () => [
					<button type="button">Facet A</button>,
					<button type="button">Facet B</button>,
				] }
				activeFilters={ [
					<span>chip 1</span>,
					<span>chip 2</span>,
				] }
				primaryAction={ [
					<button type="button">New record</button>,
				] }
				menuItems={ [
					{ label: 'Export', onSelect: () => {} },
					{ label: 'Import', onSelect: () => {} },
				] }
				bulkActions={ () => [
					<button type="button">Confirm</button>,
					<button type="button">Cancel</button>,
				] }
			/>,
		);
		// Trip the bulk bar too (its slot renders only with a selection).
		act( () => {
			host.querySelector( 'tbody input[type="checkbox"]' ).click();
		} );

		const keyWarnings = spy.mock.calls.filter( ( args ) =>
			String( args[ 0 ] ).includes( 'unique "key"' ),
		);
		spy.mockRestore();
		expect( keyWarnings ).toEqual( [] );
		// Sanity: the slots actually rendered.
		expect( host.textContent ).toContain( 'Facet A' );
		expect( host.textContent ).toContain( 'chip 1' );
		expect( host.textContent ).toContain( 'Confirm' );
	} );
} );
