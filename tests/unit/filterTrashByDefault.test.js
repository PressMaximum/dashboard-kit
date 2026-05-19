/**
 * filterTrashByDefault — pure predicate over (items, view).
 */

import { describe, it, expect } from 'vitest';

import { filterTrashByDefault } from '../../src/datasets/filterTrashByDefault.js';

const PUBLISHED = { id: 1, status: 'publish' };
const DRAFT = { id: 2, status: 'draft' };
const TRASHED = { id: 3, status: 'trash' };

describe( 'filterTrashByDefault', () => {
	it( 'hides trashed records when no status filter is set', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, DRAFT, TRASHED ],
			{ filters: [] },
		);
		expect( result ).toEqual( [ PUBLISHED, DRAFT ] );
	} );

	it( 'hides trashed records when status filter targets something else', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, DRAFT, TRASHED ],
			{ filters: [ { field: 'status', value: 'draft' } ] },
		);
		expect( result ).toEqual( [ PUBLISHED, DRAFT ] );
	} );

	it( 'shows trashed records when status filter is single-value `trash`', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, DRAFT, TRASHED ],
			{ filters: [ { field: 'status', value: 'trash' } ] },
		);
		expect( result ).toEqual( [ PUBLISHED, DRAFT, TRASHED ] );
	} );

	it( 'shows trashed records when status filter is array (isAny) containing `trash`', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, DRAFT, TRASHED ],
			{
				filters: [
					{ field: 'status', value: [ 'draft', 'trash' ] },
				],
			},
		);
		expect( result ).toEqual( [ PUBLISHED, DRAFT, TRASHED ] );
	} );

	it( 'hides trashed records when status filter array does not contain `trash`', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, DRAFT, TRASHED ],
			{
				filters: [
					{ field: 'status', value: [ 'draft', 'publish' ] },
				],
			},
		);
		expect( result ).toEqual( [ PUBLISHED, DRAFT ] );
	} );

	it( 'tolerates a missing view (returns items minus trash)', () => {
		const result = filterTrashByDefault(
			[ PUBLISHED, TRASHED ],
			undefined,
		);
		expect( result ).toEqual( [ PUBLISHED ] );
	} );

	it( 'tolerates a view without filters (returns items minus trash)', () => {
		const result = filterTrashByDefault( [ PUBLISHED, TRASHED ], {} );
		expect( result ).toEqual( [ PUBLISHED ] );
	} );

	it( 'returns [] for non-array items', () => {
		expect( filterTrashByDefault( null, {} ) ).toEqual( [] );
		expect( filterTrashByDefault( undefined, {} ) ).toEqual( [] );
		expect( filterTrashByDefault( 'nope', {} ) ).toEqual( [] );
	} );

	it( 'tolerates items with no status field (treats them as non-trash)', () => {
		const result = filterTrashByDefault(
			[ { id: 1 }, { id: 2, status: 'trash' } ],
			{ filters: [] },
		);
		expect( result ).toEqual( [ { id: 1 } ] );
	} );
} );
