/**
 * K-028 — an open row-action menu must out-paint later rows' sticky cells.
 *
 * `.pmdk-col-action` is `position: sticky; z-index: 3`, which makes every action
 * cell a stacking context. A menu inside one is therefore confined to its
 * CELL's level in the paint order, so the opaque sticky action cells of LATER
 * rows (same z-index, later in tree order) paint over the open menu's trailing
 * edge and truncate its labels. The kit's own z-index on the menu (18 anchored,
 * 120 floating) cannot help — it only orders siblings INSIDE the trapped
 * context.
 *
 * The fix raises the one cell that owns the open menu. This asserts the shipped
 * stylesheet actually does that, and — because paint order is not observable in
 * jsdom — pins the two properties that decide it: the raised cell must
 * out-rank both a closed sibling cell and the sticky header cell, and a cell at
 * rest must not move.
 *
 * jsdom resolves `:has()` in the cascade (verified), so this is a real
 * getComputedStyle assertion, not a string match on the CSS.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const CSS = readFileSync(
	path.resolve( process.cwd(), 'src/primitives/table.css' ),
	'utf8',
);

let host;
let style;

beforeAll( () => {
	style = document.createElement( 'style' );
	style.textContent = CSS;
	document.head.appendChild( style );

	host = document.createElement( 'div' );
	host.className = 'pmdk-dashboard';
	/*
	 * Three action cells: an open one, a closed one after it (the row that used
	 * to paint over the menu), and the sticky header cell.
	 */
	host.innerHTML = `
		<div class="pmdk-table-wrap">
			<table class="pmdk-table">
				<thead>
					<tr><th class="pmdk-col-action" id="head">Actions</th></tr>
				</thead>
				<tbody>
					<tr>
						<td class="pmdk-col-action" id="open">
							<div class="pmdk-row-actions is-open">
								<button type="button" aria-haspopup="menu" aria-expanded="true">⋮</button>
								<div class="pmdk-row-action-menu" role="menu">
									<button type="button" role="menuitem">Duplicate a record</button>
								</div>
							</div>
						</td>
					</tr>
					<tr>
						<td class="pmdk-col-action" id="closed">
							<div class="pmdk-row-actions">
								<button type="button" aria-haspopup="menu" aria-expanded="false">⋮</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>`;
	document.body.appendChild( host );
} );

afterAll( () => {
	host.remove();
	style.remove();
} );

const zIndexOf = ( id ) =>
	Number(
		window
			.getComputedStyle( document.getElementById( id ) )
			.getPropertyValue( 'z-index' ),
	);

describe( 'K-028 sticky action-cell stacking', () => {
	it( 'the cell owning the open menu out-ranks later rows', () => {
		expect( zIndexOf( 'open' ) ).toBeGreaterThan( zIndexOf( 'closed' ) );
	} );

	it( 'it also out-ranks the sticky header cell', () => {
		// Header cells sit at 4 so they cover scrolled rows; a menu opening
		// upward from row 1 must still win.
		expect( zIndexOf( 'open' ) ).toBeGreaterThan( zIndexOf( 'head' ) );
	} );

	it( 'a cell at rest keeps the base z-index — nothing moves when closed', () => {
		expect( zIndexOf( 'closed' ) ).toBe( 3 );
		expect( zIndexOf( 'head' ) ).toBe( 4 );
	} );

	it( 'stays inside the kit z-index scale (below drawer 70 / floating 120)', () => {
		expect( zIndexOf( 'open' ) ).toBeLessThan( 70 );
	} );

	it( 'the raise is keyed on aria-expanded, so it follows the menu state', () => {
		const cell = document.getElementById( 'open' );
		const trigger = cell.querySelector( 'button[aria-expanded]' );
		trigger.setAttribute( 'aria-expanded', 'false' );
		expect( zIndexOf( 'open' ) ).toBe( 3 );
		trigger.setAttribute( 'aria-expanded', 'true' );
		expect( zIndexOf( 'open' ) ).toBe( 35 );
	} );
} );
