/**
 * ViewPersistence — localStorage round-trip with defensive fallbacks.
 *
 * Uses a stub localStorage that records calls + can be told to throw,
 * so the test exercises both the happy path and the quota / corrupt
 * paths without relying on jsdom's specific localStorage behaviour.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ViewPersistence } from '../../src/datasets/ViewPersistence.js';

let store;
let originalLocalStorage;

const DEFAULT_VIEW = {
	type: 'grid',
	perPage: 20,
	sort: { field: 'modified', direction: 'desc' },
};

beforeEach( () => {
	store = new Map();
	originalLocalStorage = window.localStorage;
	Object.defineProperty( window, 'localStorage', {
		configurable: true,
		writable: true,
		value: {
			getItem: vi.fn( ( k ) =>
				store.has( k ) ? store.get( k ) : null,
			),
			setItem: vi.fn( ( k, v ) => store.set( k, v ) ),
			removeItem: vi.fn( ( k ) => store.delete( k ) ),
			clear: vi.fn( () => store.clear() ),
		},
	} );
} );

afterEach( () => {
	Object.defineProperty( window, 'localStorage', {
		configurable: true,
		writable: true,
		value: originalLocalStorage,
	} );
} );

describe( 'ViewPersistence.create — argument validation', () => {
	it( 'throws when storageKey is missing', () => {
		expect( () =>
			ViewPersistence.create( { defaultView: DEFAULT_VIEW } ),
		).toThrow( /storageKey/ );
	} );

	it( 'throws when defaultView is missing or not an object', () => {
		expect( () =>
			ViewPersistence.create( { storageKey: 'k' } ),
		).toThrow( /defaultView/ );
		expect( () =>
			ViewPersistence.create( {
				storageKey: 'k',
				defaultView: 'nope',
			} ),
		).toThrow( /defaultView/ );
	} );
} );

describe( 'ViewPersistence.create — load', () => {
	it( 'returns defaultView when storage is empty', () => {
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( DEFAULT_VIEW );
	} );

	it( 'merges stored view over defaultView (stored wins on collisions)', () => {
		store.set(
			'k',
			JSON.stringify( {
				type: 'table',
				sort: { field: 'title', direction: 'asc' },
			} ),
		);
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( {
			type: 'table',
			perPage: 20,
			sort: { field: 'title', direction: 'asc' },
		} );
	} );

	it( 'returns defaultView when stored JSON is corrupt', () => {
		store.set( 'k', '{not-json' );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( DEFAULT_VIEW );
	} );

	it( 'returns defaultView when stored value is a non-object (array, null, primitive)', () => {
		store.set( 'k', JSON.stringify( null ) );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( DEFAULT_VIEW );
	} );

	it( 'returns defaultView when localStorage is unavailable (SSR)', () => {
		Object.defineProperty( window, 'localStorage', {
			configurable: true,
			writable: true,
			value: undefined,
		} );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( DEFAULT_VIEW );
	} );

	it( 'returns defaultView when getItem throws (storage access denied)', () => {
		window.localStorage.getItem = vi.fn( () => {
			throw new Error( 'access denied' );
		} );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( p.load() ).toEqual( DEFAULT_VIEW );
	} );
} );

describe( 'ViewPersistence.create — save', () => {
	it( 'writes JSON to localStorage under the configured key', () => {
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		p.save( { type: 'table' } );
		expect( store.get( 'k' ) ).toBe( JSON.stringify( { type: 'table' } ) );
	} );

	it( 'is a no-op when localStorage is unavailable', () => {
		Object.defineProperty( window, 'localStorage', {
			configurable: true,
			writable: true,
			value: undefined,
		} );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( () => p.save( { type: 'table' } ) ).not.toThrow();
	} );

	it( 'swallows setItem errors (quota / private-mode)', () => {
		window.localStorage.setItem = vi.fn( () => {
			throw new Error( 'quota exceeded' );
		} );
		const p = ViewPersistence.create( {
			storageKey: 'k',
			defaultView: DEFAULT_VIEW,
		} );
		expect( () => p.save( { type: 'table' } ) ).not.toThrow();
	} );
} );
