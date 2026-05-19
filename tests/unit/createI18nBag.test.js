/**
 * createI18nBag — merge a kit component's English defaults with consumer
 * overrides. SPEC §5.13 + §6.2: missing keys in overrides MUST fall back
 * to the kit default so consumers can ship partially-translated.
 */

import { describe, it, expect } from 'vitest';
import { createI18nBag } from '../../src/core/createI18nBag.js';

const DEFAULTS = {
	triggerLabel: 'Open help panel',
	heading: 'Help',
};

describe( 'createI18nBag', () => {
	it( 'returns a fresh copy of defaults when no overrides are passed', () => {
		const bag = createI18nBag( DEFAULTS );
		expect( bag ).toEqual( DEFAULTS );
		expect( bag ).not.toBe( DEFAULTS ); // defensive copy
	} );

	it( 'merges overrides on top of defaults', () => {
		const bag = createI18nBag( DEFAULTS, {
			triggerLabel: 'Mở trợ giúp',
		} );
		expect( bag ).toEqual( {
			triggerLabel: 'Mở trợ giúp',
			heading: 'Help',
		} );
	} );

	it( 'preserves defaults when overrides is null or non-object', () => {
		expect( createI18nBag( DEFAULTS, null ) ).toEqual( DEFAULTS );
		expect( createI18nBag( DEFAULTS, undefined ) ).toEqual( DEFAULTS );
		expect( createI18nBag( DEFAULTS, 'nope' ) ).toEqual( DEFAULTS );
	} );

	it( 'does not mutate the defaults source object', () => {
		const defaults = { ...DEFAULTS };
		createI18nBag( defaults, { triggerLabel: 'X' } );
		expect( defaults ).toEqual( DEFAULTS );
	} );
} );
