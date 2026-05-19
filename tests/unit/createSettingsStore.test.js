/**
 * createSettingsStore — store action sequence per SPEC §13 P3 test plan:
 *
 *   load → edit → save → reset → discard (clearDirty)
 *
 * Each test isolates a freshly-registered store under a unique name so
 * state doesn't leak between cases (wp.data is process-global).
 */

import { describe, it, expect, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';

import { createSettingsStore } from '../../src/settings/createSettingsStore.js';

let storeCounter = 0;
function nextName() {
	storeCounter += 1;
	return `pmdk-test/settings-${ storeCounter }`;
}

function setup( {
	fetchImpl,
	seedSaved,
} = {} ) {
	const fetch = fetchImpl || vi.fn().mockResolvedValue( {} );
	const { STORE_NAME, store } = createSettingsStore( {
		storeName: nextName(),
		endpoint: '/pmdk-test/v1/settings',
		fetch,
		seedSaved,
	} );
	const registry = createRegistry();
	registry.register( store );
	return {
		STORE_NAME,
		fetch,
		select: registry.select( STORE_NAME ),
		dispatch: registry.dispatch( STORE_NAME ),
	};
}

describe( 'createSettingsStore — construction', () => {
	it( 'throws when storeName is missing', () => {
		expect( () =>
			createSettingsStore( {
				endpoint: '/x',
				fetch: () => Promise.resolve(),
			} )
		).toThrow( /storeName/ );
	} );

	it( 'throws when endpoint is missing', () => {
		expect( () =>
			createSettingsStore( {
				storeName: nextName(),
				fetch: () => Promise.resolve(),
			} )
		).toThrow( /endpoint/ );
	} );

	it( 'throws when fetch is missing or not a function', () => {
		expect( () =>
			createSettingsStore( {
				storeName: nextName(),
				endpoint: '/x',
			} )
		).toThrow( /fetch/ );
		expect( () =>
			createSettingsStore( {
				storeName: nextName(),
				endpoint: '/x',
				fetch: 'nope',
			} )
		).toThrow( /fetch/ );
	} );

	it( 'seeds `saved` from the optional initial value', () => {
		const initial = { panel: { field: 'on' } };
		const { select } = setup( { seedSaved: initial } );
		expect( select.getSavedSettings() ).toEqual( initial );
		expect( select.getSettings() ).toEqual( initial );
		expect( select.isDirty() ).toBe( false );
	} );
} );

describe( 'createSettingsStore — load', () => {
	it( 'GETs the endpoint and populates `saved`', async () => {
		const payload = { performance: { lazy_load: true } };
		const fetch = vi.fn().mockResolvedValue( payload );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		expect( fetch ).toHaveBeenCalledTimes( 1 );
		expect( fetch ).toHaveBeenCalledWith( {
			path: '/pmdk-test/v1/settings',
		} );
		expect( select.getSavedSettings() ).toEqual( payload );
		expect( select.isLoading() ).toBe( false );
	} );

	it( 'early-returns the cache on subsequent loads', async () => {
		const fetch = vi.fn().mockResolvedValue( { a: 1 } );
		const { dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await dispatch.load();
		await dispatch.load();
		expect( fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'surfaces a load failure via getError', async () => {
		const err = new Error( 'boom' );
		const fetch = vi.fn().mockRejectedValue( err );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await expect( dispatch.load() ).rejects.toThrow( 'boom' );
		expect( select.getError() ).toBe( err );
		expect( select.isLoading() ).toBe( false );
		expect( select.getSavedSettings() ).toBeNull();
	} );
} );

describe( 'createSettingsStore — edit + save', () => {
	it( 'stages edits into the dirty buffer without touching saved', async () => {
		const { select, dispatch } = setup( {
			seedSaved: { panel: { a: 1, b: 2 } },
		} );
		dispatch.edit( 'panel.a', 9 );
		expect( select.getDirty() ).toEqual( { panel: { a: 9 } } );
		expect( select.getSavedSettings() ).toEqual( {
			panel: { a: 1, b: 2 },
		} );
		expect( select.isDirty() ).toBe( true );
	} );

	it( 'projects the dirty buffer over saved via getSettings', async () => {
		const { select, dispatch } = setup( {
			seedSaved: { panel: { a: 1, b: 2 } },
		} );
		dispatch.edit( 'panel.a', 9 );
		dispatch.edit( 'panel.c.deep', 'new' );
		expect( select.getSettings() ).toEqual( {
			panel: { a: 9, b: 2, c: { deep: 'new' } },
		} );
	} );

	it( 'POSTs the merged settings on save and clears dirty', async () => {
		const responsePayload = { panel: { a: 9, b: 2 } };
		const fetch = vi.fn().mockResolvedValue( responsePayload );
		const { select, dispatch } = setup( {
			fetchImpl: fetch,
			seedSaved: { panel: { a: 1, b: 2 } },
		} );
		dispatch.edit( 'panel.a', 9 );
		await dispatch.save();
		expect( fetch ).toHaveBeenCalledWith( {
			path: '/pmdk-test/v1/settings',
			method: 'POST',
			data: { panel: { a: 9, b: 2 } },
		} );
		expect( select.getSavedSettings() ).toEqual( responsePayload );
		expect( select.getDirty() ).toEqual( {} );
		expect( select.isDirty() ).toBe( false );
		expect( select.isSaving() ).toBe( false );
	} );

	it( 'preserves dirty buffer when save fails', async () => {
		const err = new Error( 'server down' );
		const fetch = vi.fn().mockRejectedValue( err );
		const { select, dispatch } = setup( {
			fetchImpl: fetch,
			seedSaved: { panel: { a: 1 } },
		} );
		dispatch.edit( 'panel.a', 9 );
		await expect( dispatch.save() ).rejects.toThrow( 'server down' );
		expect( select.getDirty() ).toEqual( { panel: { a: 9 } } );
		expect( select.getError() ).toBe( err );
		expect( select.isSaving() ).toBe( false );
	} );
} );

describe( 'createSettingsStore — reset', () => {
	it( 'POSTs {} and replaces saved with the server response', async () => {
		const defaults = { panel: { a: 0, b: 0 } };
		const fetch = vi.fn().mockResolvedValue( defaults );
		const { select, dispatch } = setup( {
			fetchImpl: fetch,
			seedSaved: { panel: { a: 9 } },
		} );
		dispatch.edit( 'panel.b', 5 );
		await dispatch.reset();
		expect( fetch ).toHaveBeenCalledWith( {
			path: '/pmdk-test/v1/settings',
			method: 'POST',
			data: {},
		} );
		expect( select.getSavedSettings() ).toEqual( defaults );
		expect( select.getDirty() ).toEqual( {} );
	} );
} );

describe( 'createSettingsStore — clearDirty', () => {
	it( 'discards the dirty buffer without touching saved', () => {
		const { select, dispatch } = setup( {
			seedSaved: { panel: { a: 1 } },
		} );
		dispatch.edit( 'panel.a', 9 );
		dispatch.edit( 'panel.b', 7 );
		expect( select.isDirty() ).toBe( true );
		dispatch.clearDirty();
		expect( select.isDirty() ).toBe( false );
		expect( select.getDirty() ).toEqual( {} );
		expect( select.getSavedSettings() ).toEqual( {
			panel: { a: 1 },
		} );
	} );
} );
