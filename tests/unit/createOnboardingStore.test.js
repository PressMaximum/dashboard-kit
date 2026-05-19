/**
 * createOnboardingStore — `complete` / `uncomplete` / `dismiss` are
 * optimistic actions; verify they update state first, then PATCH, with
 * rollback on failure.
 */

import { describe, it, expect, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';

import { createOnboardingStore } from '../../src/welcome/createOnboardingStore.js';

let counter = 0;
function nextName() {
	counter += 1;
	return `pmdk-test/onboarding-${ counter }`;
}

function setup( { fetchImpl } = {} ) {
	const fetch = fetchImpl || vi.fn().mockResolvedValue( {} );
	const { STORE_NAME, store } = createOnboardingStore( {
		storeName: nextName(),
		endpoint: '/pmdk-test/v1/onboarding',
		fetch,
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

describe( 'createOnboardingStore — construction', () => {
	it( 'throws on missing storeName / endpoint / fetch', () => {
		expect( () =>
			createOnboardingStore( {
				endpoint: '/x',
				fetch: () => Promise.resolve(),
			} ),
		).toThrow( /storeName/ );
		expect( () =>
			createOnboardingStore( {
				storeName: nextName(),
				fetch: () => Promise.resolve(),
			} ),
		).toThrow( /endpoint/ );
		expect( () =>
			createOnboardingStore( {
				storeName: nextName(),
				endpoint: '/x',
			} ),
		).toThrow( /fetch/ );
	} );
} );

describe( 'createOnboardingStore — load', () => {
	it( 'populates completed + dismissed from GET payload', async () => {
		const fetch = vi.fn().mockResolvedValue( {
			completed: [ 'configure', 'install' ],
			dismissed: false,
		} );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		expect( fetch ).toHaveBeenCalledWith( {
			path: '/pmdk-test/v1/onboarding',
		} );
		expect( select.getCompleted() ).toEqual( [
			'configure',
			'install',
		] );
		expect( select.isDismissed() ).toBe( false );
		expect( select.isLoaded() ).toBe( true );
	} );

	it( 'is idempotent after first success', async () => {
		const fetch = vi.fn().mockResolvedValue( {
			completed: [],
			dismissed: false,
		} );
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
		expect( select.isLoaded() ).toBe( false );
	} );
} );

describe( 'createOnboardingStore — complete / uncomplete', () => {
	it( 'optimistically adds a task id, then PATCHes', async () => {
		const fetch = vi.fn().mockImplementation( ( req ) => {
			if ( req.method === 'PATCH' ) {
				return Promise.resolve( {
					completed: req.data.completed,
					dismissed: false,
				} );
			}
			return Promise.resolve( { completed: [], dismissed: false } );
		} );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await dispatch.complete( 'configure' );
		expect( select.isCompleted( 'configure' ) ).toBe( true );
		expect( fetch ).toHaveBeenCalledWith( {
			path: '/pmdk-test/v1/onboarding',
			method: 'PATCH',
			data: { completed: [ 'configure' ] },
		} );
	} );

	it( 'is a no-op when the task is already completed', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce( {
				completed: [ 'configure' ],
				dismissed: false,
			} );
		const { dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await dispatch.complete( 'configure' );
		// One call for load, none for the redundant complete.
		expect( fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'rolls back the optimistic update when PATCH fails', async () => {
		const err = new Error( 'server down' );
		const fetch = vi
			.fn()
			.mockResolvedValueOnce( { completed: [], dismissed: false } )
			.mockRejectedValue( err );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await expect( dispatch.complete( 'configure' ) ).rejects.toThrow(
			'server down',
		);
		expect( select.isCompleted( 'configure' ) ).toBe( false );
		expect( select.getError() ).toBe( err );
	} );

	it( 'uncomplete removes a task; no-op when absent', async () => {
		const fetch = vi.fn().mockImplementation( ( req ) => {
			if ( req.method === 'PATCH' ) {
				return Promise.resolve( {
					completed: req.data.completed,
					dismissed: false,
				} );
			}
			return Promise.resolve( {
				completed: [ 'configure' ],
				dismissed: false,
			} );
		} );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await dispatch.uncomplete( 'configure' );
		expect( select.isCompleted( 'configure' ) ).toBe( false );
		// no-op when absent
		const before = fetch.mock.calls.length;
		await dispatch.uncomplete( 'configure' );
		expect( fetch.mock.calls.length ).toBe( before );
	} );
} );

describe( 'createOnboardingStore — dismiss', () => {
	it( 'flips the dismissed flag with rollback on failure', async () => {
		const err = new Error( 'down' );
		const fetch = vi
			.fn()
			.mockResolvedValueOnce( { completed: [], dismissed: false } )
			.mockResolvedValueOnce( { completed: [], dismissed: true } )
			.mockRejectedValueOnce( err );
		const { select, dispatch } = setup( { fetchImpl: fetch } );
		await dispatch.load();
		await dispatch.dismiss( true );
		expect( select.isDismissed() ).toBe( true );

		await expect( dispatch.dismiss( false ) ).rejects.toThrow( 'down' );
		expect( select.isDismissed() ).toBe( true ); // rolled back
		expect( select.getError() ).toBe( err );
	} );
} );
