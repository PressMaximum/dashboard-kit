/**
 * createSettingsStore — `@wordpress/data` store factory for schema-driven
 * settings forms. SPEC §5.4.
 *
 * State shape (locked at 0.1.0):
 *
 *   {
 *     saved: Record<string, unknown> | null,  // last server-confirmed values
 *     dirty: Record<string, unknown>,         // local-only edits, deep-merged
 *                                             //  over `saved` by getSettings
 *     loading: boolean,                       // GET in flight
 *     saving:  boolean,                       // POST in flight (save or reset)
 *     error:   unknown | null,                // last load/save/reset error
 *   }
 *
 * Action sequence (also verified by tests):
 *
 *   load()  → START_LOAD  → LOAD_SUCCESS|LOAD_ERROR
 *   edit()  → EDIT                    (mutates dirty buffer)
 *   save()  → START_SAVE → SAVE_SUCCESS|SAVE_ERROR  (clears dirty on success)
 *   reset() → START_SAVE → SAVE_SUCCESS|SAVE_ERROR  (POSTs body={}, clears dirty on success)
 *   clearDirty() → CLEAR_DIRTY        (used by useDirtyState onDiscard)
 *
 * Why an injected `fetch` callable instead of `import @wordpress/api-fetch`?
 * SPEC §3.3 forbids the kit from importing `@wordpress/api-fetch` — the
 * consumer wires its own REST client (typically a thin wrapper around
 * `apiFetch` with nonce + namespace handling) and hands it to the kit.
 * Keeps the kit free of WP-specific REST plumbing and lets consumers
 * point the store at any URL/transport.
 *
 * Why an optional `seedSaved`?
 * First-mount renders run synchronously when the consumer's PHP shipped
 * the settings inside the boot payload — no spinner flash on cold visit
 * to the Settings tab. Falls back to `null` and the consumer dispatches
 * `load()` to fill.
 *
 * @example
 *   import { createSettingsStore } from '@pressmaximum/dashboard-kit';
 *   import { register } from '@wordpress/data';
 *   import apiFetch from '@wordpress/api-fetch';
 *
 *   const { STORE_NAME, store } = createSettingsStore({
 *       storeName: 'customify/settings',
 *       endpoint: '/customify/v1/settings',
 *       fetch: ({ path, method, data }) => apiFetch({ path, method, data }),
 *       seedSaved: boot.settings,
 *   });
 *   register(store);
 */

import { createReduxStore } from '@wordpress/data';

const TYPES = {
	START_LOAD: 'START_LOAD',
	LOAD_SUCCESS: 'LOAD_SUCCESS',
	LOAD_ERROR: 'LOAD_ERROR',
	EDIT: 'EDIT',
	START_SAVE: 'START_SAVE',
	SAVE_SUCCESS: 'SAVE_SUCCESS',
	SAVE_ERROR: 'SAVE_ERROR',
	CLEAR_DIRTY: 'CLEAR_DIRTY',
};

/**
 * Functional immutable setter — given `{ a: { b: 1 } }` and path `'a.c'`
 * + value `2`, returns `{ a: { b: 1, c: 2 } }`. Used by `edit()` to
 * accumulate edits into the dirty buffer without mutating prior state.
 *
 * @param {Record<string, unknown>} target Source object (never mutated).
 * @param {string}                  path   Dotted path, e.g. `'panel.field'`.
 * @param {unknown}                 value  New value at `path`.
 * @return {Record<string, unknown>} New object with the path set.
 */
function setAtPath( target, path, value ) {
	const segments = String( path || '' ).split( '.' ).filter( Boolean );
	if ( segments.length === 0 ) {
		return target;
	}
	const [ head, ...rest ] = segments;
	if ( rest.length === 0 ) {
		return { ...target, [ head ]: value };
	}
	const child =
		target && typeof target[ head ] === 'object' ? target[ head ] : {};
	const nested = setAtPath( child, rest.join( '.' ), value );
	return { ...target, [ head ]: nested };
}

/**
 * Deep-merge two plain objects — overlay wins per-key. Arrays are
 * replaced wholesale (not concatenated) because a partial save would
 * otherwise grow arrays unboundedly across reloads. Used by
 * `getSettings()` to project the dirty buffer over the saved snapshot.
 *
 * @param {Record<string, unknown> | null} base    Underlying object.
 * @param {Record<string, unknown> | null} overlay Object whose keys win.
 * @return {Record<string, unknown>} Merged result (always a new object).
 */
function deepMerge( base, overlay ) {
	if ( ! overlay || typeof overlay !== 'object' ) {
		return base;
	}
	const out = Array.isArray( base ) ? [ ...base ] : { ...( base || {} ) };
	for ( const key of Object.keys( overlay ) ) {
		const value = overlay[ key ];
		if (
			value &&
			typeof value === 'object' &&
			! Array.isArray( value ) &&
			out[ key ] &&
			typeof out[ key ] === 'object'
		) {
			out[ key ] = deepMerge( out[ key ], value );
		} else {
			out[ key ] = value;
		}
	}
	return out;
}

/**
 * @param {Object}   config
 * @param {string}   config.storeName   wp.data store key, e.g. `'customify/settings'`.
 * @param {string}   config.endpoint    Path passed verbatim to `fetch({ path, ... })`.
 * @param {Function} config.fetch       `({ path, method?, data? }) => Promise<unknown>`.
 *                                      Consumer-owned REST client (forbidden imports
 *                                      in the kit per SPEC §3.3).
 * @param {Object}   [config.seedSaved] Initial `saved` value so first-mount
 *                                      render is synchronous. Defaults to `null`.
 * @return {{ STORE_NAME: string, store: import('@wordpress/data').StoreDescriptor }}
 *         Store descriptor + the resolved store name, ready to `register()`.
 */
export function createSettingsStore( {
	storeName,
	endpoint,
	fetch,
	seedSaved = null,
} = {} ) {
	if ( ! storeName ) {
		throw new TypeError(
			'createSettingsStore: `storeName` is required.',
		);
	}
	if ( ! endpoint ) {
		throw new TypeError(
			'createSettingsStore: `endpoint` is required.',
		);
	}
	if ( typeof fetch !== 'function' ) {
		throw new TypeError(
			'createSettingsStore: `fetch` callable is required (SPEC §3.3 — kit cannot import @wordpress/api-fetch).',
		);
	}

	const DEFAULT_STATE = {
		saved: seedSaved && typeof seedSaved === 'object' ? seedSaved : null,
		dirty: {},
		loading: false,
		saving: false,
		error: null,
	};

	function reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case TYPES.START_LOAD:
				return { ...state, loading: true, error: null };
			case TYPES.LOAD_SUCCESS:
				return {
					...state,
					loading: false,
					saved: action.payload,
					error: null,
				};
			case TYPES.LOAD_ERROR:
				return { ...state, loading: false, error: action.error };
			case TYPES.EDIT:
				return {
					...state,
					dirty: setAtPath( state.dirty, action.path, action.value ),
				};
			case TYPES.START_SAVE:
				return { ...state, saving: true, error: null };
			case TYPES.SAVE_SUCCESS:
				return {
					...state,
					saving: false,
					saved: action.payload,
					dirty: {},
					error: null,
				};
			case TYPES.SAVE_ERROR:
				return { ...state, saving: false, error: action.error };
			case TYPES.CLEAR_DIRTY:
				return { ...state, dirty: {} };
			default:
				return state;
		}
	}

	const selectors = {
		/**
		 * Merged view: saved snapshot + dirty edits projected on top.
		 *
		 * @param {Object} state Reducer state.
		 */
		getSettings( state ) {
			return deepMerge( state.saved || {}, state.dirty );
		},
		/**
		 * Last server-confirmed values — what a Reset would restore to.
		 *
		 * @param {Object} state Reducer state.
		 */
		getSavedSettings( state ) {
			return state.saved;
		},
		/**
		 * Local-only edit buffer. Empty after a successful save / reset.
		 *
		 * @param {Object} state Reducer state.
		 */
		getDirty( state ) {
			return state.dirty;
		},
		isDirty( state ) {
			return Object.keys( state.dirty ).length > 0;
		},
		isLoading( state ) {
			return state.loading;
		},
		isSaving( state ) {
			return state.saving;
		},
		getError( state ) {
			return state.error;
		},
	};

	const actions = {
		/**
		 * GET the endpoint, populate `saved`. Idempotent — early-returns
		 * the cached `saved` when one exists and there's no prior error,
		 * so tab remounts don't burn a round-trip on every navigation.
		 */
		load() {
			return async ( { dispatch, select } ) => {
				const saved = select.getSavedSettings();
				if ( saved !== null && ! select.getError() ) {
					return saved;
				}
				dispatch( { type: TYPES.START_LOAD } );
				try {
					const data = await fetch( { path: endpoint } );
					dispatch( { type: TYPES.LOAD_SUCCESS, payload: data } );
					return data;
				} catch ( error ) {
					dispatch( { type: TYPES.LOAD_ERROR, error } );
					throw error;
				}
			};
		},
		/**
		 * Stage an edit into the dirty buffer. Path uses dotted notation
		 * (`'panelId.fieldId'` or `'panelId.field.nested'`). The reducer
		 * deep-merges into the existing buffer so accumulating edits
		 * across panels works without consumer juggling.
		 *
		 * @param {string}  path  Dotted path to the field.
		 * @param {unknown} value Next value at the field.
		 */
		edit( path, value ) {
			return { type: TYPES.EDIT, path, value };
		},
		/**
		 * POST the merged settings. On success the server response
		 * replaces `saved` wholesale + clears the dirty buffer.
		 */
		save() {
			return async ( { dispatch, select } ) => {
				const merged = select.getSettings();
				dispatch( { type: TYPES.START_SAVE } );
				try {
					const data = await fetch( {
						path: endpoint,
						method: 'POST',
						data: merged,
					} );
					dispatch( { type: TYPES.SAVE_SUCCESS, payload: data } );
					return data;
				} catch ( error ) {
					dispatch( { type: TYPES.SAVE_ERROR, error } );
					throw error;
				}
			};
		},
		/**
		 * POST an empty body — the server-side `SettingsControllerBase`
		 * contract (SPEC §5.10) interprets this as "reset to defaults"
		 * and replies with the defaults snapshot, which becomes the new
		 * `saved`. Dirty buffer clears on success.
		 */
		reset() {
			return async ( { dispatch } ) => {
				dispatch( { type: TYPES.START_SAVE } );
				try {
					const data = await fetch( {
						path: endpoint,
						method: 'POST',
						data: {},
					} );
					dispatch( { type: TYPES.SAVE_SUCCESS, payload: data } );
					return data;
				} catch ( error ) {
					dispatch( { type: TYPES.SAVE_ERROR, error } );
					throw error;
				}
			};
		},
		/**
		 * Discard the dirty buffer without touching `saved`. Wired into
		 * `useDirtyState.onDiscard` so accepting the nav-away confirm
		 * clears the buffer instead of letting a future remount restore
		 * the discarded edits.
		 */
		clearDirty() {
			return { type: TYPES.CLEAR_DIRTY };
		},
	};

	const store = createReduxStore( storeName, {
		reducer,
		actions,
		selectors,
	} );

	return { STORE_NAME: storeName, store };
}

export default createSettingsStore;
