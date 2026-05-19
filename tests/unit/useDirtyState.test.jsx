/**
 * useDirtyState — registry + confirmDiscardAny semantics.
 *
 * Tests for the React-bound behavior (setDirty side-effects, hooks
 * lifecycle) AND the module-level registry walk (`isAnyDirty`,
 * `confirmDiscardAny`). The registry is process-global, so each test
 * resets it via `__resetDirtyRegistry()`.
 */

import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	vi,
} from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import {
	useDirtyState,
	isAnyDirty,
	confirmDiscardAny,
	__resetDirtyRegistry,
} from '../../src/settings/useDirtyState.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Each `renderHook` call mounts a fresh root so multiple hooks can
 *  coexist (the cross-tab guard tests need 2+ keys live at once).
 */
const MOUNTS = [];

beforeEach( () => {
	__resetDirtyRegistry();
} );

afterEach( () => {
	for ( const m of MOUNTS ) {
		act( () => m.root.unmount() );
		m.host.remove();
	}
	MOUNTS.length = 0;
	__resetDirtyRegistry();
} );

function renderHook( key, options ) {
	const host = document.createElement( 'div' );
	document.body.appendChild( host );
	const root = createRoot( host );
	const captured = { current: null };
	function Harness() {
		captured.current = useDirtyState( key, options );
		return null;
	}
	act( () => root.render( <Harness /> ) );
	MOUNTS.push( { host, root } );
	return captured;
}

describe( 'useDirtyState — single key', () => {
	it( 'starts clean and tracks setDirty(true)/setDirty(false)', () => {
		const hook = renderHook( 'one' );
		expect( hook.current.isDirty ).toBe( false );
		act( () => hook.current.setDirty( true ) );
		expect( hook.current.isDirty ).toBe( true );
		expect( isAnyDirty() ).toBe( true );
		act( () => hook.current.setDirty( false ) );
		expect( hook.current.isDirty ).toBe( false );
		expect( isAnyDirty() ).toBe( false );
	} );

	it( 'coerces the dirty flag to a boolean', () => {
		const hook = renderHook( 'two' );
		act( () => hook.current.setDirty( 'truthy-string' ) );
		expect( hook.current.isDirty ).toBe( true );
		act( () => hook.current.setDirty( 0 ) );
		expect( hook.current.isDirty ).toBe( false );
	} );
} );

describe( 'useDirtyState — confirmDiscard()', () => {
	it( 'returns true without prompting when not dirty', () => {
		const hook = renderHook( 'three' );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( false );
		const result = hook.current.confirmDiscard();
		expect( result ).toBe( true );
		expect( spy ).not.toHaveBeenCalled();
		spy.mockRestore();
	} );

	it( 'prompts when dirty; user accept clears the flag + fires onDiscard', () => {
		const onDiscard = vi.fn();
		const hook = renderHook( 'four', { onDiscard } );
		act( () => hook.current.setDirty( true ) );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( true );
		let result;
		act( () => {
			result = hook.current.confirmDiscard();
		} );
		expect( result ).toBe( true );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( hook.current.isDirty ).toBe( false );
		expect( onDiscard ).toHaveBeenCalledTimes( 1 );
		spy.mockRestore();
	} );

	it( 'returns false when the user declines the prompt', () => {
		const onDiscard = vi.fn();
		const hook = renderHook( 'five', { onDiscard } );
		act( () => hook.current.setDirty( true ) );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( false );
		let result;
		act( () => {
			result = hook.current.confirmDiscard();
		} );
		expect( result ).toBe( false );
		expect( hook.current.isDirty ).toBe( true );
		expect( onDiscard ).not.toHaveBeenCalled();
		spy.mockRestore();
	} );

	it( 'uses the consumer-supplied discardMessage in the confirm prompt', () => {
		const hook = renderHook( 'six', { discardMessage: 'custom msg' } );
		act( () => hook.current.setDirty( true ) );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( true );
		act( () => hook.current.confirmDiscard() );
		expect( spy ).toHaveBeenCalledWith( 'custom msg' );
		spy.mockRestore();
	} );
} );

describe( 'confirmDiscardAny() — cross-tab guard', () => {
	it( 'returns true without prompting when nothing is dirty', () => {
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( false );
		expect( confirmDiscardAny() ).toBe( true );
		expect( spy ).not.toHaveBeenCalled();
		spy.mockRestore();
	} );

	it( 'prompts once when ANY consumer is dirty; clears all on accept', () => {
		const onA = vi.fn();
		const onB = vi.fn();
		const a = renderHook( 'a', { onDiscard: onA } );
		const b = renderHook( 'b', { onDiscard: onB } );
		act( () => {
			a.current.setDirty( true );
			b.current.setDirty( true );
		} );
		expect( isAnyDirty() ).toBe( true );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( true );
		let result;
		act( () => {
			result = confirmDiscardAny();
		} );
		expect( result ).toBe( true );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( onA ).toHaveBeenCalledTimes( 1 );
		expect( onB ).toHaveBeenCalledTimes( 1 );
		expect( isAnyDirty() ).toBe( false );
		spy.mockRestore();
	} );

	it( 'returns false + preserves dirty state when user declines', () => {
		const a = renderHook( 'c', { onDiscard: () => null } );
		act( () => a.current.setDirty( true ) );
		const spy = vi.spyOn( window, 'confirm' ).mockReturnValue( false );
		let result;
		act( () => {
			result = confirmDiscardAny();
		} );
		expect( result ).toBe( false );
		expect( isAnyDirty() ).toBe( true );
		spy.mockRestore();
	} );
} );
