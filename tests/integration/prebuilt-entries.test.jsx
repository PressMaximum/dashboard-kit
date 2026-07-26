/**
 * Consumer contract on the PREBUILT entries (K-019).
 *
 * Every other suite imports from `src/`. This one imports what a consumer
 * actually receives — the committed `build/*.mjs` artifacts, whose bare
 * imports (`react`, `react/jsx-runtime`, `@tanstack/react-table`,
 * `@dnd-kit/*`) are resolved from node_modules here exactly as a consumer's
 * bundler resolves them from its own installs. That is the "peer deps
 * provided externally" scenario, run for real.
 *
 * Two things are asserted:
 *
 *  1. The artifact declares its dependencies instead of embedding them. A
 *     bundled `react/jsx-runtime` is the K-019 defect: webpack inlines the
 *     runtime matching the KIT's build mode, i.e. the production one, where
 *     `jsx === jsxs`. Static children arrays then lose the dev runtime's
 *     static marker, so a consumer running a DEV React (WP `SCRIPT_DEBUG`)
 *     re-validates them as dynamic arrays and warns "unique key" on correct
 *     kit markup. Bundled TanStack/dnd-kit is the other half: a second
 *     private copy for any consumer that also uses them.
 *  2. The prebuilt table renders against an external DEV React with no
 *     console noise — the direct proof that the false-positive key warnings
 *     are gone (vitest runs NODE_ENV=test, so `react/jsx-runtime` resolves
 *     to the development runtime, which is what `SCRIPT_DEBUG` gives).
 *
 * NB this tests the COMMITTED artifact, which is the right target (Aponto
 * consumes the kit as a git dependency and gets these files verbatim) but
 * means a src/webpack change is only covered here after `npm run build`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { PMDKDataTable } from '../../build/table/index.mjs';
import { PMDKModuleCard } from '../../build/module-card/index.mjs';
import { SettingsShell } from '../../build/settings-shell/index.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ENTRIES = [
	'build/index.mjs',
	'build/datasets/index.mjs',
	'build/table/index.mjs',
	'build/module-card/index.mjs',
	'build/settings-shell/index.mjs',
	'build/primitives/index.mjs',
	'build/editor-helpers/index.mjs',
];

/*
 * Signatures of an EMBEDDED copy, not of an import. `jsx=…jsxs=` is the
 * production react-jsx-runtime assigning one implementation to both exports;
 * the others are minified top-level bindings TanStack / dnd-kit only have
 * when their source was pulled into the chunk.
 */
const INLINED = [
	[ 'react/jsx-runtime', /jsx=[a-zA-Z_$.]{0,10}jsxs=/ ],
	[ '@tanstack/react-table', /getCoreRowModel=|flexRender=/ ],
	[ '@dnd-kit/*', /useDraggable=|DndContext=|closestCenter=/ ],
];

/* vitest runs from the package root, so entry paths resolve against cwd. */
const readEntry = ( entry ) =>
	readFileSync( path.resolve( process.cwd(), entry ), 'utf8' );

let host;
let root;
let consoleSpies;

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	consoleSpies = {
		error: vi.spyOn( console, 'error' ).mockImplementation( () => {} ),
		warn: vi.spyOn( console, 'warn' ).mockImplementation( () => {} ),
	};
} );

afterEach( () => {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
	host.remove();
	vi.restoreAllMocks();
} );

const render = ( jsx ) => {
	root = createRoot( host );
	act( () => root.render( jsx ) );
};

const consoleCalls = () =>
	[
		...consoleSpies.error.mock.calls,
		...consoleSpies.warn.mock.calls,
	].map( ( args ) => args.join( ' ' ) );

describe( 'prebuilt entries declare their peers instead of embedding them', () => {
	for ( const entry of ENTRIES ) {
		it( `${ entry } has no inlined runtime or third-party copy`, () => {
			const source = readEntry( entry );
			const embedded = INLINED.filter( ( [ , probe ] ) =>
				probe.test( source ),
			).map( ( [ name ] ) => name );
			expect( { entry, embedded } ).toEqual( { entry, embedded: [] } );
		} );
	}

	it( 'the table entry imports its peers as bare specifiers', () => {
		const source = readEntry( 'build/table/index.mjs' );
		const imported = new Set(
			[ ...source.matchAll( /from"([^"]+)"/g ) ]
				.map( ( match ) => match[ 1 ] )
				.filter( ( specifier ) => ! specifier.startsWith( '.' ) ),
		);
		for ( const peer of [
			'react',
			'react/jsx-runtime',
			'@tanstack/react-table',
			'@dnd-kit/core',
			'@dnd-kit/sortable',
			'@dnd-kit/utilities',
		] ) {
			expect( { peer, imported: imported.has( peer ) } ).toEqual( {
				peer,
				imported: true,
			} );
		}
	} );
} );

describe( 'prebuilt table renders against externally provided peers', () => {
	const DATA = [
		{ id: 1, title: 'Charlie', amount: 30 },
		{ id: 2, title: 'Alpha', amount: 10 },
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

	it( 'renders rows through the external TanStack + dnd-kit', () => {
		render(
			<PMDKDataTable
				columns={ COLUMNS }
				data={ DATA }
				getRowId={ ( row ) => String( row.id ) }
				itemsLabel="records"
				enableColumnManager
			/>,
		);
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 2 );
		expect(
			[ ...host.querySelectorAll( 'tbody td[data-column="title"]' ) ].map(
				( cell ) => cell.textContent,
			),
		).toEqual( [ 'Charlie', 'Alpha' ] );
	} );

	it( 'renders under a DEV React with no key warnings (the K-019 symptom)', () => {
		// The toolbar tier is what reproduced it: against the pre-fix artifact
		// this render emitted `Warning: Each child in a list should have a
		// unique "key" prop` from inside build/table/index.mjs, because the
		// inlined PRODUCTION jsx-runtime never marked the kit's static
		// children arrays as validated.
		//
		// Every prop below is a real one (`PMDKDataTable.jsx` §props) and every
		// slot it should light up is asserted afterwards — a typo'd prop is
		// silently ignored by React, so without the assertions this test could
		// go on passing while covering nothing.
		render(
			<PMDKDataTable
				columns={ COLUMNS }
				data={ DATA }
				getRowId={ ( row ) => String( row.id ) }
				itemsLabel="records"
				enableColumnManager
				enableRowSelection
				enableSearch
				defaultPageSize={ 1 }
				bulkActions={ ( { selectedRows } ) => (
					<button type="button">
						Delete { selectedRows.length }
					</button>
				) }
				activeFilters={ <span>Status: paid</span> }
				filterCount={ 1 }
				filterBuilder={ <div>filter controls</div> }
				primaryAction={ <button type="button">New</button> }
			/>,
		);

		// Toolbar query row: search field + the filter toggle the builder adds.
		expect( host.querySelector( 'input[type="search"]' ) ).not.toBeNull();
		expect(
			host.querySelector( '.pmdk-toolbar-filter-button' ),
		).not.toBeNull();
		// filterCount renders the badge on that toggle.
		expect( host.querySelector( '.pmdk-filter-count' ).textContent ).toBe(
			'1',
		);
		// The active-filter row this test claims to cover, with its chip.
		const activeFilters = host.querySelector( '.pmdk-active-filters' );
		expect( activeFilters ).not.toBeNull();
		expect( activeFilters.textContent ).toContain( 'Status: paid' );
		// Toolbar actions: column manager trigger + the product's primary CTA.
		expect(
			host.querySelector( '.pmdk-table-options-trigger' ),
		).not.toBeNull();
		expect( host.querySelector( '.pmdk-toolbar-actions button' ) ).not.toBeNull();
		// Selection column, and pagination because pageSize 1 splits 2 rows.
		expect(
			host.querySelector( 'thead .pmdk-table-checkbox' ),
		).not.toBeNull();
		expect( host.querySelector( '.pmdk-pagination' ) ).not.toBeNull();
		expect( host.querySelectorAll( 'tbody tr' ) ).toHaveLength( 1 );

		// Selecting a row swaps in the bulk bar — another static-children array.
		act( () => host.querySelector( 'tbody .pmdk-table-checkbox' ).click() );
		expect( host.querySelector( '.pmdk-bulk-bar' ) ).not.toBeNull();

		expect( consoleCalls() ).toEqual( [] );
	} );

	it( 'the module-card entry renders clean too', () => {
		render( <PMDKModuleCard title="Bookings" state="enabled" /> );
		expect( host.querySelector( '.pmdk-module-card' ) ).not.toBeNull();
		expect( consoleCalls() ).toEqual( [] );
	} );

	it( 'the settings-shell entry renders clean too', () => {
		render(
			<SettingsShell
				tree={ [
					{
						id: 'general',
						label: 'General',
						children: [ { id: 'business', label: 'Business' } ],
					},
				] }
				activeParent="general"
				activeChild="business"
			>
				<p>panel</p>
			</SettingsShell>,
		);
		expect( host.querySelector( '.pmdk-settings-shell' ) ).not.toBeNull();
		expect(
			host.querySelector( '.pmdk-settings-nav__child[aria-current]' )
				.textContent,
		).toBe( 'Business' );
		expect( consoleCalls() ).toEqual( [] );
	} );
} );
