/**
 * Table preference persistence (KIT-P3 slice 2, Q13).
 *
 * Persists the deliberate view preferences — sort, column visibility, column
 * order and page size — under one namespaced `localStorage` key, and restores
 * them on reload (DESIGN-SYSTEM: "Persistent workspace preferences"). Transient
 * state (open popovers, row selection, current page) is intentionally NOT
 * persisted. Storage failure never blocks the interaction: reads fall back to
 * the passed defaults and writes are swallowed.
 *
 * The product owns the key and namespaces+versions it per surface, e.g.
 * `aponto.bookings.table.v1`.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * SSR/quota-safe localStorage read of a persisted preference blob.
 *
 * @param {string} key Namespaced storage key.
 * @return {Object|null} Parsed preference blob, or null.
 */
export function readTablePrefs( key ) {
	if ( ! key || typeof window === 'undefined' ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( key );
		return raw ? JSON.parse( raw ) : null;
	} catch {
		return null;
	}
}

/**
 * SSR/quota-safe localStorage write; never throws.
 *
 * @param {string} key   Namespaced storage key.
 * @param {Object} value Preference blob to serialise.
 */
export function writeTablePrefs( key, value ) {
	if ( ! key || typeof window === 'undefined' ) {
		return;
	}
	try {
		window.localStorage.setItem( key, JSON.stringify( value ) );
	} catch {
		/* storage unavailable — the in-memory view still works */
	}
}

const PERSISTED_KEYS = [
	'sorting',
	'columnVisibility',
	'columnOrder',
	'pageSize',
];

/**
 * Keep only the persisted-preference fields out of a larger state object.
 *
 * @param {Object} state Any view-state object.
 * @return {Object} Just the persisted-preference fields.
 */
function pickPersisted( state ) {
	const out = {};
	for ( const key of PERSISTED_KEYS ) {
		if ( state[ key ] !== undefined ) {
			out[ key ] = state[ key ];
		}
	}
	return out;
}

/**
 * Hook: seed table view state from (defaults + persisted) and auto-persist the
 * preference subset on every change. Returns the merged initial snapshot plus a
 * `persist(partial)` writer the component calls whenever a persisted field
 * changes.
 *
 * @param {string} key      Namespaced localStorage key ('' disables persistence).
 * @param {Object} defaults { sorting, columnVisibility, columnOrder, pageSize }.
 * @return {{ initial: Object, persist: Function }} Merged initial view + writer.
 */
export function useTablePersistence( key, defaults ) {
	// Read once on mount so a later remount doesn't clobber an in-session edit.
	const [ initial ] = useState( () => ( {
		...defaults,
		...( readTablePrefs( key ) || {} ),
	} ) );
	const snapshot = useRef( pickPersisted( initial ) );

	const persist = useCallback(
		( partial ) => {
			snapshot.current = {
				...snapshot.current,
				...pickPersisted( partial ),
			};
			writeTablePrefs( key, snapshot.current );
		},
		[ key ],
	);

	return useMemo( () => ( { initial, persist } ), [ initial, persist ] );
}
