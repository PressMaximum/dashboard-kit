/**
 * ChecklistItem — completion resolution: the `manualCompleted` contract
 * (consumer's onboarding store) OR the auto-detect `check()` result.
 *
 * Regression suite for the KIT-P4 fix: earlier revisions listed
 * `manualCompleted` in the effect deps (re-running the check when the
 * flag flipped) but never used it in the rendered completion value, so
 * store-driven completions never displayed as complete unless their
 * `check()` also happened to pass. Blocksify threads the flag exactly
 * per the docstring (src/dashboard/tabs/Welcome/index.js) and hit this.
 *
 * The module-scoped CHECK_CACHE survives across tests by design
 * (session-scoped stale-while-revalidate) — every test uses unique item
 * ids so cached answers can't bleed between cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ChecklistItem from '../../src/welcome/ChecklistItem.jsx';

let host;
let root;

async function render( jsx ) {
	root = createRoot( host );
	// Two async act passes: mount + the check()-promise resolution.
	await act( async () => root.render( jsx ) );
}

beforeEach( () => {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
} );

afterEach( () => {
	if ( root ) {
		act( () => root.unmount() );
		root = null;
	}
	if ( host && host.parentNode ) {
		host.parentNode.removeChild( host );
	}
} );

function row() {
	return host.querySelector( '.pmdk-checklist__item' );
}

function srStatus() {
	return host.querySelector( '.screen-reader-text' ).textContent;
}

describe( 'ChecklistItem — manualCompleted contract', () => {
	it( 'renders complete when manualCompleted=true and no check() exists', async () => {
		await render(
			<ChecklistItem
				item={ {
					id: 'mc-only',
					label: 'Store-driven task',
					manualCompleted: true,
				} }
			/>,
		);
		expect( row().className ).toContain( 'is-complete' );
		expect( srStatus() ).toBe( 'Completed' );
	} );

	it( 'renders complete when manualCompleted=true even though check() returns false', async () => {
		await render(
			<ChecklistItem
				item={ {
					id: 'mc-overrides-check',
					label: 'Manually done',
					manualCompleted: true,
					check: () => false,
				} }
			/>,
		);
		expect( row().className ).toContain( 'is-complete' );
		expect( srStatus() ).toBe( 'Completed' );
	} );

	it( 'still renders complete from check() alone (auto path unchanged)', async () => {
		await render(
			<ChecklistItem
				item={ {
					id: 'auto-only',
					label: 'Auto-detected task',
					check: () => Promise.resolve( true ),
				} }
			/>,
		);
		expect( row().className ).toContain( 'is-complete' );
	} );

	it( 'renders pending when neither the flag nor the check passes', async () => {
		await render(
			<ChecklistItem
				item={ {
					id: 'neither',
					label: 'Untouched task',
					manualCompleted: false,
					check: () => false,
				} }
			/>,
		);
		expect( row().className ).not.toContain( 'is-complete' );
		expect( srStatus() ).toBe( 'Pending' );
	} );

	it( 'follows the flag in both directions across re-renders (no cache poisoning)', async () => {
		const item = {
			id: 'flip-flop',
			label: 'Store toggles',
			check: () => false,
		};
		await render(
			<ChecklistItem item={ { ...item, manualCompleted: false } } />,
		);
		expect( row().className ).not.toContain( 'is-complete' );

		// Store marks it complete → row flips on.
		await act( async () =>
			root.render(
				<ChecklistItem item={ { ...item, manualCompleted: true } } />,
			),
		);
		expect( row().className ).toContain( 'is-complete' );

		// Store un-marks it → row flips back off. A cache that folded the
		// manual flag into the check() answer would stay stuck complete.
		await act( async () =>
			root.render(
				<ChecklistItem item={ { ...item, manualCompleted: false } } />,
			),
		);
		expect( row().className ).not.toContain( 'is-complete' );
	} );

	it( 'shows the check icon (not the spinner) while a manually-completed item re-checks', async () => {
		// A check() that never resolves keeps the item permanently in the
		// "checking" phase — completed must still win the status display.
		await render(
			<ChecklistItem
				item={ {
					id: 'manual-during-check',
					label: 'Done while re-checking',
					manualCompleted: true,
					check: () => new Promise( () => {} ),
				} }
			/>,
		);
		expect( row().className ).toContain( 'is-complete' );
		expect( srStatus() ).toBe( 'Completed' );
		expect( host.querySelector( '.components-spinner' ) ).toBeNull();
	} );
} );
