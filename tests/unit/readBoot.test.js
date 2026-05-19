/**
 * readBoot — pluck a PHP-localized boot payload off `window[ bootGlobal ]`.
 *
 * SPEC §3.5 + §5.1: kit imposes no required keys, just returns whatever
 * the consumer's PHP set. Missing key / non-object value / SSR all
 * collapse to `{}` so component code can destructure safely.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { readBoot } from '../../src/core/BootDataLoader.jsx';

const KEY = '__pmdkTestBoot';

afterEach( () => {
	delete window[ KEY ];
} );

describe( 'readBoot', () => {
	it( 'returns the object stashed on window under the given key', () => {
		window[ KEY ] = { name: 'Customify', user: { id: 1 } };
		expect( readBoot( KEY ) ).toEqual( { name: 'Customify', user: { id: 1 } } );
	} );

	it( 'returns {} when the key is unset', () => {
		expect( readBoot( KEY ) ).toEqual( {} );
	} );

	it( 'returns {} when the global resolves to a non-object', () => {
		window[ KEY ] = 'not-an-object';
		expect( readBoot( KEY ) ).toEqual( {} );

		window[ KEY ] = 42;
		expect( readBoot( KEY ) ).toEqual( {} );
	} );

	it( 'returns {} when called without a key', () => {
		expect( readBoot() ).toEqual( {} );
		expect( readBoot( '' ) ).toEqual( {} );
	} );
} );
