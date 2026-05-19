/**
 * CompareTable — cell dispatch on `row.free` / `row.pro` shape per
 * SPEC §5.3b. Renders the table into a detached jsdom container and
 * asserts the class/text combination per cell.
 *
 * Dispatch contract:
 *   true                   → `.pmdk-compare__check-yes` with check svg
 *   false / null / undefined → `.pmdk-compare__check-no` with em-dash
 *   string                 → `.pmdk-compare__text` literal
 *   { value, muted? }      → `.pmdk-compare__text` (+ `.is-muted` when muted)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import CompareTable from '../../src/compare/CompareTable.jsx';

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

/**
 * Pull the rendered cells of a given row out of the host DOM.
 * @param rowId
 */
function cellsOfRow( rowId ) {
	const row = host.querySelector(
		`.pmdk-compare__row:has(.pmdk-compare__feature)`,
	);
	// host may contain multiple rows — find by feature text instead.
	const allRows = Array.from(
		host.querySelectorAll( '.pmdk-compare__row' ),
	);
	const target = allRows.find( ( r ) =>
		r.textContent.includes( rowId ),
	);
	if ( ! target ) {
		throw new Error( `row "${ rowId }" not found in render` );
	}
	const wraps = Array.from(
		target.querySelectorAll( '.pmdk-compare__cell-wrap' ),
	);
	return wraps.map( ( w ) => w.firstElementChild );
}

const SECTIONS_BASE = [
	{
		id: 'sec',
		label: 'Section',
		rows: [
			{ id: 'r1', label: 'true / false', free: true, pro: false },
			{ id: 'r2', label: 'null / undef', free: null, pro: undefined },
			{ id: 'r3', label: 'string / object', free: 'Read-only', pro: { value: 'Editable', muted: false } },
			{ id: 'r4', label: 'muted object', free: { value: 'Soon', muted: true }, pro: true },
		],
	},
];

describe( 'CompareTable — Cell dispatch', () => {
	beforeEach( () => render( <CompareTable sections={ SECTIONS_BASE } /> ) );

	it( 'renders true as the green check badge', () => {
		const [ free ] = cellsOfRow( 'true / false' );
		expect( free.className ).toContain( 'pmdk-compare__check-yes' );
		expect( free.querySelector( 'svg' ) ).toBeTruthy();
	} );

	it( 'renders false as the gray em-dash badge', () => {
		const [ , pro ] = cellsOfRow( 'true / false' );
		expect( pro.className ).toContain( 'pmdk-compare__check-no' );
		expect( pro.textContent ).toBe( '−' );
	} );

	it( 'treats null / undefined the same as false', () => {
		const [ free, pro ] = cellsOfRow( 'null / undef' );
		expect( free.className ).toContain( 'pmdk-compare__check-no' );
		expect( pro.className ).toContain( 'pmdk-compare__check-no' );
	} );

	it( 'renders a string as a literal text cell', () => {
		const [ free, pro ] = cellsOfRow( 'string / object' );
		expect( free.className ).toBe( 'pmdk-compare__text' );
		expect( free.textContent ).toBe( 'Read-only' );
		expect( pro.className ).toBe( 'pmdk-compare__text' );
		expect( pro.textContent ).toBe( 'Editable' );
	} );

	it( 'renders { value, muted: true } with the muted modifier', () => {
		const [ free, pro ] = cellsOfRow( 'muted object' );
		expect( free.className ).toContain( 'pmdk-compare__text' );
		expect( free.className ).toContain( 'is-muted' );
		expect( free.textContent ).toBe( 'Soon' );
		// pro is `true` → check badge
		expect( pro.className ).toContain( 'pmdk-compare__check-yes' );
	} );
} );

describe( 'CompareTable — structure', () => {
	it( 'returns null on empty sections', () => {
		render( <CompareTable sections={ [] } /> );
		expect( host.querySelector( '.pmdk-compare' ) ).toBeNull();
	} );

	it( 'renders the consumer-supplied header labels', () => {
		render(
			<CompareTable
				sections={ SECTIONS_BASE }
				labels={ {
					headFeature: 'Tính năng',
					headFree: 'Free',
					headPro: 'Pro',
				} }
			/>,
		);
		const headCells = host.querySelectorAll(
			'.pmdk-compare__head-cell',
		);
		expect( headCells[ 0 ].textContent ).toBe( 'Tính năng' );
	} );

	it( 'renders the optional footer CTA', () => {
		render(
			<CompareTable
				sections={ SECTIONS_BASE }
				footer={ {
					title: 'Upgrade now',
					description: 'Lifetime discount',
					ctaLabel: 'Buy',
					ctaHref: 'https://example.com',
				} }
			/>,
		);
		const cta = host.querySelector( '.pmdk-compare__cta' );
		expect( cta ).toBeTruthy();
		expect( cta.querySelector( 'a' )?.getAttribute( 'href' ) ).toBe(
			'https://example.com',
		);
	} );
} );
