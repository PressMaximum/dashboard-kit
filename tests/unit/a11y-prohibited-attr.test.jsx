/**
 * K-020 — no ARIA naming attribute on a role that prohibits it.
 *
 * Aponto's axe report flagged ~25 serious `aria-prohibited-attr` violations on
 * the kit's own chrome: `.pmdk-active-filters` and the `.pmdk-compare__check-*`
 * cells carried `aria-label` on bare `<div>` / `<span>` elements, which map to
 * `role="generic"` — a role with no name-from-author support. Screen readers
 * dropped the label or announced it inconsistently, so the label was not just
 * invalid, it was doing nothing.
 *
 * Real axe-core, scoped to exactly that rule, over the two affected surfaces
 * plus the states no story reaches (`activeFilters`, filter panel open). The
 * rule is a pure DOM/ARIA check, so jsdom's lack of layout does not weaken it.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axe from 'axe-core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import CompareTable from '../../src/compare/CompareTable.jsx';
import { PMDKDataTable } from '../../src/table/index.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
} );

afterEach( () => {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
	host.remove();
} );

function render( jsx ) {
	root = createRoot( host );
	act( () => root.render( jsx ) );
}

/**
 * Runs axe over the mounted fixture for the K-020 rule only.
 *
 * @return {Promise<Array>} Flat list of `selector — message` strings.
 */
async function prohibitedAttrViolations() {
	const results = await axe.run( host, {
		runOnly: { type: 'rule', values: [ 'aria-prohibited-attr' ] },
	} );
	return results.violations.flatMap( ( violation ) =>
		violation.nodes.map(
			( node ) =>
				`${ node.target.join( ' ' ) } — ${ violation.id }: ${
					node.failureSummary?.split( '\n' ).pop()?.trim() ||
					violation.help
				}`,
		),
	);
}

describe( 'K-020 aria-prohibited-attr', () => {
	it( '<CompareTable> boolean cells are named without a prohibited attr', async () => {
		render(
			<CompareTable
				sections={ [
					{
						id: 'core',
						label: 'Core',
						rows: [
							{ id: 'bookings', label: 'Bookings', free: true, pro: true },
							{ id: 'payments', label: 'Payments', free: false, pro: true },
							{ id: 'seats', label: 'Seats', free: null, pro: '10' },
						],
					},
				] }
			/>,
		);
		expect( await prohibitedAttrViolations() ).toEqual( [] );
	} );

	it( 'the boolean cells keep an accessible name (role=img + label)', () => {
		render(
			<CompareTable
				sections={ [
					{
						id: 'core',
						label: 'Core',
						rows: [ { id: 'x', label: 'X', free: true, pro: false } ],
					},
				] }
			/>,
		);
		const yes = host.querySelector( '.pmdk-compare__check-yes' );
		const no = host.querySelector( '.pmdk-compare__check-no' );
		expect( [ yes.getAttribute( 'role' ), no.getAttribute( 'role' ) ] ).toEqual(
			[ 'img', 'img' ],
		);
		expect( [
			yes.getAttribute( 'aria-label' ),
			no.getAttribute( 'aria-label' ),
		] ).toEqual( [ 'Included', 'Not included' ] );
	} );

	it( '<PMDKDataTable> active-filter chips are named without a prohibited attr', async () => {
		render(
			<PMDKDataTable
				columns={ [
					{
						accessorKey: 'title',
						id: 'title',
						header: 'Title',
						meta: { label: 'Title' },
						cell: ( info ) => info.getValue(),
					},
				] }
				data={ [ { id: 1, title: 'Alpha' } ] }
				getRowId={ ( row ) => String( row.id ) }
				itemsLabel="records"
				activeFilters={ <span>Status: paid</span> }
			/>,
		);
		const group = host.querySelector( '.pmdk-active-filters' );
		expect( group.getAttribute( 'role' ) ).toBe( 'group' );
		expect( group.getAttribute( 'aria-label' ) ).toBeTruthy();
		expect( await prohibitedAttrViolations() ).toEqual( [] );
	} );

	it( '<PMDKDataTable> open filter panel is named without a prohibited attr', async () => {
		render(
			<PMDKDataTable
				columns={ [
					{
						accessorKey: 'title',
						id: 'title',
						header: 'Title',
						meta: { label: 'Title' },
						cell: ( info ) => info.getValue(),
					},
				] }
				data={ [ { id: 1, title: 'Alpha' } ] }
				getRowId={ ( row ) => String( row.id ) }
				itemsLabel="records"
				filtersOpen
				filterBuilder={ <div>filter controls</div> }
			/>,
		);
		const panel = host.querySelector( '.pmdk-filter-builder' );
		expect( panel.getAttribute( 'role' ) ).toBe( 'group' );
		expect( await prohibitedAttrViolations() ).toEqual( [] );
	} );
} );
