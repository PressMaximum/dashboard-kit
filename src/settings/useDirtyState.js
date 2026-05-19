/**
 * useDirtyState — shared dirty-tracking hook for editor flows. SPEC §5.4.
 *
 * Pattern: consumer calls `setDirty(true)` on edit (typically wired off a
 * settings store's `isDirty` selector via useEffect), `setDirty(false)`
 * on save. The hook does three jobs:
 *
 *   1. Registers a `beforeunload` listener while dirty so the browser
 *      surfaces its native "leave site?" confirm on accidental close /
 *      reload. (Modern browsers ignore the message text but still
 *      prompt when `event.returnValue` is set.)
 *
 *   2. Keeps a module-level registry so multiple consumers can declare
 *      dirty state under different keys (e.g. `'settings'`,
 *      `'pro/conditions/42'`) — exported `confirmDiscardAny()` walks
 *      the registry once for the kit's `<NavigationGuardProvider>` to
 *      gate cross-tab navigation.
 *
 *   3. Exposes `confirmDiscard()` for the consumer's own intra-tab
 *      checks (e.g. a back button inside an editor that bypasses the
 *      router guard).
 *
 * `options.onDiscard` runs when the user confirms abandoning the dirty
 * buffer — consumers wire their store's `clearDirty` action here so the
 * next mount reads a clean state. Held in a ref so callers don't have
 * to memoize.
 *
 * `options.discardMessage` is the consumer-translated prompt text. The
 * kit ships an English fallback for the case the consumer forgets to
 * wire it. Last-registered message wins when multiple keys are dirty —
 * fine in practice because the copy is generic across keys.
 *
 * @example
 *   const { setDirty } = useDirtyState('settings', {
 *       onDiscard: clearDirty,
 *       discardMessage: __('You have unsaved changes. Discard them?', 'customify'),
 *   });
 *   useEffect(() => setDirty(isDirty), [isDirty, setDirty]);
 */

import { useEffect, useRef, useState, useCallback } from '@wordpress/element';

const REGISTRY = new Map();
const DISCARD_CALLBACKS = new Map();
const DISCARD_MESSAGES = new Map();

// Tier-1 i18n discipline: kit imports no `__()`. English default acts
// as a safety net so consumers that forget to wire `discardMessage`
// still get a sensible prompt instead of `undefined`.
const DEFAULT_DISCARD_MESSAGE = 'You have unsaved changes. Discard them?';

export function useDirtyState( key, options = {} ) {
	const [ dirty, setDirtyState ] = useState( () =>
		Boolean( REGISTRY.get( key ) ),
	);
	const keyRef = useRef( key );
	keyRef.current = key;

	// Latest-callback ref so `confirmDiscardAny()` (called from outside
	// React's render cycle by the navigation guard) always invokes the
	// current closure without forcing consumers to memoize.
	const onDiscardRef = useRef( options.onDiscard );
	onDiscardRef.current = options.onDiscard;

	if ( options.discardMessage ) {
		DISCARD_MESSAGES.set( key, options.discardMessage );
	}

	useEffect( () => {
		DISCARD_CALLBACKS.set( keyRef.current, () => {
			const cb = onDiscardRef.current;
			if ( typeof cb === 'function' ) {
				try {
					cb();
				} catch ( _ ) {
					// Discard callbacks are best-effort; a thrown store
					// action shouldn't abort the navigation.
				}
			}
		} );
		const cleanupKey = keyRef.current;
		return () => {
			DISCARD_CALLBACKS.delete( cleanupKey );
			DISCARD_MESSAGES.delete( cleanupKey );
		};
	}, [] );

	const setDirty = useCallback( ( next ) => {
		const flag = Boolean( next );
		REGISTRY.set( keyRef.current, flag );
		setDirtyState( flag );
	}, [] );

	useEffect( () => {
		if ( ! dirty ) {
			return undefined;
		}

		function onBeforeUnload( event ) {
			event.preventDefault();
			// Modern browsers ignore the returnValue text but still
			// surface their native confirm dialog when this is set.
			event.returnValue = '';
			return '';
		}

		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ dirty ] );

	const confirmDiscard = useCallback( () => {
		if ( ! REGISTRY.get( keyRef.current ) ) {
			return true;
		}
		const message =
			DISCARD_MESSAGES.get( keyRef.current ) ||
			DEFAULT_DISCARD_MESSAGE;
		// eslint-disable-next-line no-alert -- browser-native confirm is the contract
		const ok = window.confirm( message );
		if ( ok ) {
			REGISTRY.set( keyRef.current, false );
			setDirtyState( false );
			const cb = DISCARD_CALLBACKS.get( keyRef.current );
			if ( cb ) {
				cb();
			}
		}
		return ok;
	}, [] );

	return { isDirty: dirty, setDirty, confirmDiscard };
}

/** True when any registered consumer has flagged itself dirty. */
export function isAnyDirty() {
	for ( const flag of REGISTRY.values() ) {
		if ( flag ) {
			return true;
		}
	}
	return false;
}

/**
 * Walk the registry; prompt once if any consumer is dirty. Returns
 * `true` when the navigation may proceed (no dirty state OR user
 * confirmed discard). The kit's `<NavigationGuardProvider>` consumes
 * this directly — `mountDashboard` wires it as the default guard so
 * tab-strip clicks + version-anchor clicks honor the dirty buffer
 * without consumer wiring.
 *
 * On accept, invokes each dirty key's `onDiscard` callback so stores
 * that own the actual edit buffer clear themselves.
 */
export function confirmDiscardAny() {
	if ( ! isAnyDirty() ) {
		return true;
	}
	// Pick the first dirty key's registered message; falls back to the
	// English default when no consumer registered one. Distinct copy
	// per dirty key is future-friendly but not yet needed.
	let message = DEFAULT_DISCARD_MESSAGE;
	for ( const key of REGISTRY.keys() ) {
		if ( REGISTRY.get( key ) && DISCARD_MESSAGES.has( key ) ) {
			message = DISCARD_MESSAGES.get( key );
			break;
		}
	}
	// eslint-disable-next-line no-alert -- browser-native confirm is the contract
	const ok = window.confirm( message );
	if ( ok ) {
		for ( const key of REGISTRY.keys() ) {
			REGISTRY.set( key, false );
			const cb = DISCARD_CALLBACKS.get( key );
			if ( cb ) {
				cb();
			}
		}
	}
	return ok;
}

/**
 * Test helper — wipe the registry between tests so per-test side-effects
 * don't leak. Not exported from the public surface.
 *
 * @private
 */
export function __resetDirtyRegistry() {
	REGISTRY.clear();
	DISCARD_CALLBACKS.clear();
	DISCARD_MESSAGES.clear();
}

export default useDirtyState;
