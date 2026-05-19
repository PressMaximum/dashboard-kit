/**
 * forceFullscreenMode — flip the `core/edit-post.fullscreenMode`
 * preference, deferring until `wp.data` is ready if needed.
 */

import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	vi,
} from 'vitest';

import { forceFullscreenMode } from '../../src/editor-helpers/forceFullscreenMode.js';

let originalWp;

beforeEach( () => {
	originalWp = window.wp;
} );

afterEach( () => {
	window.wp = originalWp;
} );

function makeWp( {
	current = false,
	withSelectors = true,
	subscribe = null,
} = {} ) {
	const set = vi.fn();
	const get = vi.fn().mockReturnValue( current );
	return {
		set,
		get,
		wp: {
			data: {
				select: vi.fn().mockReturnValue(
					withSelectors ? { get } : null,
				),
				dispatch: vi.fn().mockReturnValue(
					withSelectors ? { set } : null,
				),
				subscribe:
					subscribe ||
					vi.fn().mockImplementation( () => () => undefined ),
			},
		},
	};
}

describe( 'forceFullscreenMode', () => {
	it( 'no-ops when wp.data is missing (returns a noop teardown)', () => {
		window.wp = undefined;
		const cleanup = forceFullscreenMode();
		expect( typeof cleanup ).toBe( 'function' );
		expect( cleanup() ).toBeUndefined();
	} );

	it( 'sets fullscreenMode=true when the store is ready and the pref is off', () => {
		const { wp, set, get } = makeWp( { current: false } );
		window.wp = wp;
		forceFullscreenMode();
		expect( get ).toHaveBeenCalledWith(
			'core/edit-post',
			'fullscreenMode',
		);
		expect( set ).toHaveBeenCalledWith(
			'core/edit-post',
			'fullscreenMode',
			true,
		);
	} );

	it( 'skips dispatch when the pref is already on', () => {
		const { wp, set } = makeWp( { current: true } );
		window.wp = wp;
		forceFullscreenMode();
		expect( set ).not.toHaveBeenCalled();
	} );

	it( 'subscribes until the store resolves when selectors are not ready', () => {
		const setSpy = vi.fn();
		const getSpy = vi.fn().mockReturnValue( false );
		let subscriber;
		let ready = false;
		const unsubFn = vi.fn();
		const subscribeImpl = vi.fn().mockImplementation( ( cb ) => {
			subscriber = cb;
			return unsubFn;
		} );

		window.wp = {
			data: {
				select: vi
					.fn()
					.mockImplementation( () => ( ready ? { get: getSpy } : null ) ),
				dispatch: vi
					.fn()
					.mockImplementation( () => ( ready ? { set: setSpy } : null ) ),
				subscribe: subscribeImpl,
			},
		};

		forceFullscreenMode();
		expect( subscribeImpl ).toHaveBeenCalledTimes( 1 );

		// Editor finishes booting → subscriber sees selectors land.
		ready = true;
		subscriber();
		expect( setSpy ).toHaveBeenCalledWith(
			'core/edit-post',
			'fullscreenMode',
			true,
		);
		expect( unsubFn ).toHaveBeenCalledTimes( 1 );
	} );
} );
