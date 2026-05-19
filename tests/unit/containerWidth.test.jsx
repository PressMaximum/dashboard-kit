/**
 * containerWidth — verifies SPEC §5.1 / P2 wiring.
 *
 * `mountDashboard({ containerWidth })` must set `data-container-width`
 * on the outer `.pmdk-dashboard` element. The CSS in DashboardShell.css
 * branches on this attribute to switch between the narrow (1100px max)
 * reading column and wide (full-viewport) DataViews layout.
 *
 * The test uses `act()` from `react-dom/test-utils` to flush the kit's
 * `createRoot` render synchronously, then reads the rendered DOM.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

// Tells React 18 we're in a test harness so `act()` actually batches +
// flushes updates instead of warning that the env "is not configured".
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { mountDashboard } from '../../src/core/mountDashboard.jsx';

let host;
let handle;

function FakeWelcome() {
	return <p>welcome</p>;
}

const BASE_CONFIG = {
	filterNamespace: 'pmdk-test',
	brand: { name: 'Test' },
	baseTabs: [ { id: 'welcome', label: 'Welcome' } ],
	baseRoutes: { '#welcome': { component: FakeWelcome, type: 'page' } },
};

beforeEach( () => {
	host = document.createElement( 'div' );
	host.id = 'pmdk-test-root';
	document.body.appendChild( host );
} );

afterEach( () => {
	if ( handle && typeof handle.unmount === 'function' ) {
		act( () => handle.unmount() );
		handle = undefined;
	}
	if ( host && host.parentNode ) {
		host.parentNode.removeChild( host );
	}
	host = undefined;
} );

describe( 'mountDashboard containerWidth', () => {
	it( 'defaults to narrow', () => {
		act( () => {
			handle = mountDashboard( {
				...BASE_CONFIG,
				rootEl: host,
			} );
		} );
		const dashboard = host.querySelector( '.pmdk-dashboard' );
		expect( dashboard ).toBeTruthy();
		expect( dashboard.getAttribute( 'data-container-width' ) ).toBe(
			'narrow'
		);
	} );

	it( 'sets data-container-width="wide" when passed', () => {
		act( () => {
			handle = mountDashboard( {
				...BASE_CONFIG,
				rootEl: host,
				containerWidth: 'wide',
			} );
		} );
		const dashboard = host.querySelector( '.pmdk-dashboard' );
		expect( dashboard.getAttribute( 'data-container-width' ) ).toBe(
			'wide'
		);
	} );

	it( 'falls back to narrow on an unrecognised value', () => {
		act( () => {
			handle = mountDashboard( {
				...BASE_CONFIG,
				rootEl: host,
				containerWidth: 'huge',
			} );
		} );
		const dashboard = host.querySelector( '.pmdk-dashboard' );
		expect( dashboard.getAttribute( 'data-container-width' ) ).toBe(
			'narrow'
		);
	} );

	it( 'finds the mount node via a selector string', () => {
		act( () => {
			handle = mountDashboard( {
				...BASE_CONFIG,
				rootEl: '#pmdk-test-root',
				containerWidth: 'wide',
			} );
		} );
		const dashboard = host.querySelector( '.pmdk-dashboard' );
		expect( dashboard ).toBeTruthy();
		expect( dashboard.getAttribute( 'data-container-width' ) ).toBe(
			'wide'
		);
	} );
} );
