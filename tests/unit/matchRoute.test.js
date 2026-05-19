/**
 * matchRoute — pure pattern-matching against a route table.
 *
 * SPEC §5.2b: `'#tab'` matches static; `'#tab/:id'` extracts params;
 * static segments win over params; non-match returns `null`.
 */

import { describe, it, expect } from 'vitest';
import { matchRoute } from '../../src/core/HashRouter.jsx';

const ROUTES = {
	'#welcome': { component: 'WelcomePage' },
	'#settings': { component: 'SettingsPage' },
	'#settings/:panelId': { component: 'SettingsPage' },
	'#conditions': { component: 'ConditionsList' },
	'#conditions/:id': { component: 'ConditionsEditor' },
};

describe( 'matchRoute', () => {
	it( 'returns the exact-match entry with empty params for a static hash', () => {
		const result = matchRoute( '#welcome', ROUTES );
		expect( result ).toEqual( {
			route: '#welcome',
			entry: { component: 'WelcomePage' },
			params: {},
		} );
	} );

	it( 'extracts a single :param into the params map', () => {
		const result = matchRoute( '#conditions/42', ROUTES );
		expect( result ).toEqual( {
			route: '#conditions/:id',
			entry: { component: 'ConditionsEditor' },
			params: { id: '42' },
		} );
	} );

	it( 'prefers a static segment over a parameterized peer', () => {
		// `#settings` is both a static key and the prefix of `#settings/:panelId`.
		// Without segment counting the param pattern could swallow it.
		const result = matchRoute( '#settings', ROUTES );
		expect( result.route ).toBe( '#settings' );
		expect( result.params ).toEqual( {} );
	} );

	it( 'decodeURIComponents the param value', () => {
		const result = matchRoute( '#conditions/' + encodeURIComponent( 'foo bar' ), ROUTES );
		expect( result.params.id ).toBe( 'foo bar' );
	} );

	it( 'returns null when no pattern matches', () => {
		expect( matchRoute( '#nope', ROUTES ) ).toBeNull();
		expect( matchRoute( '#conditions/a/b/c', ROUTES ) ).toBeNull();
	} );

	it( 'returns null on a non-object routes argument', () => {
		expect( matchRoute( '#welcome', null ) ).toBeNull();
		expect( matchRoute( '#welcome', undefined ) ).toBeNull();
	} );
} );
