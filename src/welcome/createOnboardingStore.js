/**
 * createOnboardingStore — `@wordpress/data` store for user-meta-backed
 * Welcome checklist completion + a dismissed flag. SPEC §5.5.
 *
 * State shape (locked at 0.1.0):
 *
 *   {
 *     completed: string[],    // task ids the user has manually marked done
 *     dismissed: boolean,     // user dismissed the entire Welcome surface
 *     loaded:    boolean,     // initial GET landed at least once
 *     loading:   boolean,     // GET in flight
 *     error:     unknown,     // last error (load or patch)
 *   }
 *
 * Endpoint contract: GET returns `{ completed, dismissed }`; PATCH
 * accepts a partial body `{ completed?, dismissed? }` and returns the
 * updated full record. Same contract as the Blocksify Free
 * `/dashboard/v1/onboarding` route.
 *
 * Optimistic updates: `complete()`, `uncomplete()`, `dismiss()` all
 * mutate state BEFORE the PATCH resolves so the UI feels immediate;
 * on failure the reducer rolls back to the prior value.
 *
 * Why an injected `fetch` callable?
 * Same rationale as `createSettingsStore` — SPEC §3.3 forbids the kit
 * from importing `@wordpress/api-fetch`. Consumer wires its own REST
 * client (typically a thin wrapper around `apiFetch`).
 *
 * @example
 *   const { STORE_NAME, store } = createOnboardingStore({
 *       storeName: 'customify/onboarding',
 *       endpoint: '/customify/v1/onboarding',
 *       fetch: ({ path, method, data }) => apiFetch({ path, method, data }),
 *   });
 *   register(store);
 */

import { createReduxStore } from '@wordpress/data';

const DEFAULT_STATE = {
	completed: [],
	dismissed: false,
	loaded: false,
	loading: false,
	error: null,
};

const TYPES = {
	START_LOAD: 'START_LOAD',
	LOAD_SUCCESS: 'LOAD_SUCCESS',
	LOAD_ERROR: 'LOAD_ERROR',
	SET_COMPLETED: 'SET_COMPLETED',
	SET_DISMISSED: 'SET_DISMISSED',
	PATCH_ERROR: 'PATCH_ERROR',
};

function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case TYPES.START_LOAD:
			return { ...state, loading: true, error: null };
		case TYPES.LOAD_SUCCESS:
			return {
				...state,
				loaded: true,
				loading: false,
				completed: Array.isArray( action.payload?.completed )
					? action.payload.completed
					: [],
				dismissed: Boolean( action.payload?.dismissed ),
				error: null,
			};
		case TYPES.LOAD_ERROR:
		case TYPES.PATCH_ERROR:
			return { ...state, loading: false, error: action.error };
		case TYPES.SET_COMPLETED:
			return { ...state, completed: action.payload };
		case TYPES.SET_DISMISSED:
			return { ...state, dismissed: action.payload };
		default:
			return state;
	}
}

const selectors = {
	isCompleted( state, taskId ) {
		return state.completed.includes( taskId );
	},
	isDismissed( state ) {
		return state.dismissed;
	},
	getCompleted( state ) {
		return state.completed;
	},
	isLoading( state ) {
		return state.loading;
	},
	isLoaded( state ) {
		return state.loaded;
	},
	getError( state ) {
		return state.error;
	},
};

/**
 * @param {Object}   config
 * @param {string}   config.storeName wp.data store key, e.g. `'customify/onboarding'`.
 * @param {string}   config.endpoint  REST path. GET loads, PATCH persists deltas.
 * @param {Function} config.fetch     `({ path, method?, data? }) => Promise<unknown>`.
 * @return {{ STORE_NAME: string, store: import('@wordpress/data').StoreDescriptor }}
 *         Store descriptor + the resolved name, ready to `register()`.
 */
export function createOnboardingStore( {
	storeName,
	endpoint,
	fetch,
} = {} ) {
	if ( ! storeName ) {
		throw new TypeError(
			'createOnboardingStore: `storeName` is required.',
		);
	}
	if ( ! endpoint ) {
		throw new TypeError(
			'createOnboardingStore: `endpoint` is required.',
		);
	}
	if ( typeof fetch !== 'function' ) {
		throw new TypeError(
			'createOnboardingStore: `fetch` callable is required (SPEC §3.3 — kit cannot import @wordpress/api-fetch).',
		);
	}

	async function patch( body ) {
		return fetch( { path: endpoint, method: 'PATCH', data: body } );
	}

	const actions = {
		/**
		 * GET the endpoint, populate `completed` + `dismissed`. Idempotent
		 * — early-returns when `loaded` is true AND no prior error.
		 */
		load() {
			return async ( { dispatch, select } ) => {
				if ( select.isLoaded() && ! select.getError() ) {
					return null;
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
		 * Add a task id to the completed list (no-op when already there).
		 * Optimistic: UI updates immediately; rolls back on PATCH failure.
		 *
		 * @param {string} taskId Stable identifier from the consumer's
		 *                        Welcome checklist item shape.
		 */
		complete( taskId ) {
			return async ( { dispatch, select } ) => {
				const current = select.getCompleted() || [];
				if ( current.includes( taskId ) ) {
					return current;
				}
				const next = [ ...current, taskId ];
				dispatch( { type: TYPES.SET_COMPLETED, payload: next } );
				try {
					const data = await patch( { completed: next } );
					dispatch( { type: TYPES.LOAD_SUCCESS, payload: data } );
					return data.completed;
				} catch ( error ) {
					dispatch( {
						type: TYPES.SET_COMPLETED,
						payload: current,
					} );
					dispatch( { type: TYPES.PATCH_ERROR, error } );
					throw error;
				}
			};
		},
		/**
		 * Remove a task id from the completed list (no-op when absent).
		 *
		 * @param {string} taskId Task identifier.
		 */
		uncomplete( taskId ) {
			return async ( { dispatch, select } ) => {
				const current = select.getCompleted() || [];
				if ( ! current.includes( taskId ) ) {
					return current;
				}
				const next = current.filter( ( id ) => id !== taskId );
				dispatch( { type: TYPES.SET_COMPLETED, payload: next } );
				try {
					const data = await patch( { completed: next } );
					dispatch( { type: TYPES.LOAD_SUCCESS, payload: data } );
					return data.completed;
				} catch ( error ) {
					dispatch( {
						type: TYPES.SET_COMPLETED,
						payload: current,
					} );
					dispatch( { type: TYPES.PATCH_ERROR, error } );
					throw error;
				}
			};
		},
		/**
		 * Toggle the dismissed flag. Optimistic; rolls back on failure.
		 *
		 * @param {boolean} flag Next dismissed state.
		 */
		dismiss( flag ) {
			return async ( { dispatch, select } ) => {
				const nextFlag = Boolean( flag );
				const previous = select.isDismissed();
				if ( previous === nextFlag ) {
					return previous;
				}
				dispatch( {
					type: TYPES.SET_DISMISSED,
					payload: nextFlag,
				} );
				try {
					const data = await patch( { dismissed: nextFlag } );
					dispatch( { type: TYPES.LOAD_SUCCESS, payload: data } );
					return data.dismissed;
				} catch ( error ) {
					dispatch( {
						type: TYPES.SET_DISMISSED,
						payload: previous,
					} );
					dispatch( { type: TYPES.PATCH_ERROR, error } );
					throw error;
				}
			};
		},
	};

	const store = createReduxStore( storeName, {
		reducer,
		actions,
		selectors,
	} );

	return { STORE_NAME: storeName, store };
}

export default createOnboardingStore;
