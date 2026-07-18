/**
 * Table preference persistence — storage-safe read/write + persisted-subset
 * contract (KIT-P3 slice 2). Transient state must never reach localStorage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	readTablePrefs,
	writeTablePrefs,
} from '../../src/table/useTablePersistence.js';

const KEY = 'test.table.v1';

beforeEach( () => {
	window.localStorage.clear();
} );

describe( 'readTablePrefs / writeTablePrefs', () => {
	it( 'round-trips a preference blob', () => {
		writeTablePrefs( KEY, { pageSize: 50 } );
		expect( readTablePrefs( KEY ) ).toEqual( { pageSize: 50 } );
	} );

	it( 'returns null with no key or no stored value', () => {
		expect( readTablePrefs( '' ) ).toBeNull();
		expect( readTablePrefs( KEY ) ).toBeNull();
	} );

	it( 'returns null on corrupted JSON instead of throwing', () => {
		window.localStorage.setItem( KEY, '{not json' );
		expect( readTablePrefs( KEY ) ).toBeNull();
	} );

	it( 'write failure is swallowed (quota/unavailable)', () => {
		const spy = vi
			.spyOn( Storage.prototype, 'setItem' )
			.mockImplementation( () => {
				throw new Error( 'quota' );
			} );
		expect( () =>
			writeTablePrefs( KEY, { pageSize: 25 } ),
		).not.toThrow();
		spy.mockRestore();
	} );

	it( 'no-key write is a no-op', () => {
		writeTablePrefs( '', { pageSize: 25 } );
		expect( window.localStorage.length ).toBe( 0 );
	} );
} );
