/**
 * activeTabId — extract the top-level tab id from a hash route so the
 * tab strip can highlight the correct tab even on sub-routes.
 */

import { describe, it, expect } from 'vitest';
import { activeTabId } from '../../src/core/HashRouter.jsx';

describe( 'activeTabId', () => {
	it( 'returns the first segment of a static hash', () => {
		expect( activeTabId( '#welcome' ) ).toBe( 'welcome' );
	} );

	it( 'returns the parent segment for a sub-route', () => {
		expect( activeTabId( '#conditions/42' ) ).toBe( 'conditions' );
		expect( activeTabId( '#settings/general/typography' ) ).toBe( 'settings' );
	} );

	it( 'accepts a hash without the leading #', () => {
		expect( activeTabId( 'welcome' ) ).toBe( 'welcome' );
	} );

	it( 'returns an empty string for an empty hash', () => {
		expect( activeTabId( '' ) ).toBe( '' );
		expect( activeTabId( '#' ) ).toBe( '' );
	} );
} );
