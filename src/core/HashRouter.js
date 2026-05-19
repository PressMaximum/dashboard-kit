/**
 * Minimal hash router for the dashboard SPA.
 *
 * Why not `@wordpress/router`? At time of extraction WP's package is
 * query-param based (`?path=/welcome`); the kit's SPEC §6.2 commits to a
 * hash-based URL scheme (`#welcome`) so deep links stay bookmark-stable
 * across consumer plugins that don't own the page path. Rolling a thin
 * `hashchange` listener keeps the contract simple.
 *
 * Route-table shape (locked, SPEC §5.1 + §6.3):
 *
 *   { '#welcome': { component, type: 'page' | 'list' | 'editor',
 *                   label?, parent?, ...extra } }
 *
 * Hash format: `#route` or `#route/segment/:id`. `useRoute()` returns
 * `{ route, entry, params }` where `route` is the matching template
 * (e.g. `#conditions/:id`) and `params` resolves the id map.
 *
 * Dirty-state coupling lives behind `NavigationGuardContext` — P3's
 * `useDirtyState` registers a guard via the provider; this module knows
 * nothing about the dirty buffer.
 */

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';

const HASH_PREFIX = '#';
const DEFAULT_INITIAL_ROUTE = '#welcome';

/* -------------------------------------------------------------------------
 * Low-level location helpers
 * ------------------------------------------------------------------------- */

export function readHash( fallback = DEFAULT_INITIAL_ROUTE ) {
	if ( typeof window === 'undefined' ) {
		return fallback;
	}
	const raw = window.location.hash || fallback;
	return raw.startsWith( HASH_PREFIX ) ? raw : HASH_PREFIX + raw;
}

export function navigate( hash ) {
	if ( typeof window === 'undefined' ) {
		return;
	}
	const target = hash.startsWith( HASH_PREFIX ) ? hash : HASH_PREFIX + hash;
	if ( window.location.hash !== target ) {
		window.location.hash = target;
	}
}

function stripHash( value ) {
	return value && value.startsWith( HASH_PREFIX )
		? value.slice( 1 )
		: value;
}

/* -------------------------------------------------------------------------
 * Hooks — subscription + matching
 * ------------------------------------------------------------------------- */

/**
 * Subscribe to `hashchange` and return the current hash.
 *
 * @param {string} [initialRoute='#welcome'] Default returned when no hash is set.
 */
export function useHash( initialRoute = DEFAULT_INITIAL_ROUTE ) {
	const [ hash, setHash ] = useState( () => readHash( initialRoute ) );

	useEffect( () => {
		const handler = () => setHash( readHash( initialRoute ) );
		window.addEventListener( 'hashchange', handler );
		return () => window.removeEventListener( 'hashchange', handler );
	}, [ initialRoute ] );

	return hash;
}

/**
 * Match the current hash against a route table. Returns the matched
 * entry + extracted `:param` values, or `null` when nothing matches.
 *
 * Pattern: `#conditions/:id` matches `#conditions/42` with
 * `params: { id: '42' }`. Static segments take precedence over params.
 *
 * @param {string}                  hash   Current `#...` hash.
 * @param {Record<string, unknown>} routes Hash → route-entry table.
 * @return {{ route: string, entry: unknown, params: Record<string, string> } | null}
 *         Matched entry + params, or `null` when no pattern matches.
 */
export function matchRoute( hash, routes ) {
	if ( ! routes || typeof routes !== 'object' ) {
		return null;
	}

	if ( routes[ hash ] ) {
		return { route: hash, entry: routes[ hash ], params: {} };
	}

	const incoming = stripHash( hash ).split( '/' ).filter( Boolean );

	for ( const pattern of Object.keys( routes ) ) {
		const patternSegs = stripHash( pattern )
			.split( '/' )
			.filter( Boolean );
		if ( patternSegs.length !== incoming.length ) {
			continue;
		}

		const params = {};
		let ok = true;
		for ( let i = 0; i < patternSegs.length; i++ ) {
			const seg = patternSegs[ i ];
			if ( seg.startsWith( ':' ) ) {
				params[ seg.slice( 1 ) ] = decodeURIComponent(
					incoming[ i ],
				);
			} else if ( seg !== incoming[ i ] ) {
				ok = false;
				break;
			}
		}
		if ( ok ) {
			return { route: pattern, entry: routes[ pattern ], params };
		}
	}

	return null;
}

/**
 * High-level hook consumed by `DashboardShell`. Returns the resolved
 * route or falls back to `initialRoute` when the hash is unknown / empty.
 *
 * @param {Object} routes                    Hash → route-entry table.
 * @param {string} [initialRoute='#welcome'] Default route when nothing matches.
 */
export function useRoute( routes, initialRoute = DEFAULT_INITIAL_ROUTE ) {
	const hash = useHash( initialRoute );

	const fallback = useMemo(
		() =>
			matchRoute( initialRoute, routes ) || {
				route: initialRoute,
				entry: null,
				params: {},
			},
		[ routes, initialRoute ],
	);

	const matched = useMemo(
		() => matchRoute( hash, routes ),
		[ hash, routes ],
	);

	const result = matched || fallback;

	useEffect( () => {
		if ( ! matched && hash !== fallback.route ) {
			navigate( fallback.route );
		}
	}, [ hash, matched, fallback.route ] );

	return result;
}

/**
 * Top-level tab id for highlighting the tab strip.
 *
 *   activeTabId( '#conditions/42' ) === 'conditions'
 *
 * @param {string} route Hash route, with or without leading `#`.
 * @return {string} First path segment (the tab id), or `''` when empty.
 */
export function activeTabId( route ) {
	const stripped = stripHash( route );
	return stripped.split( '/' )[ 0 ] || '';
}

/* -------------------------------------------------------------------------
 * Navigation guard — pluggable predicate that vetoes navigation.
 * P3's `useDirtyState` will register a guard via the provider; for P1
 * the default is "always allow".
 * ------------------------------------------------------------------------- */

const ALWAYS_ALLOW = () => true;

const NavigationGuardContext = createContext( ALWAYS_ALLOW );

/**
 * Wrap the dashboard tree with a navigation guard so dirty buffers,
 * unsaved edits, or any other "can leave this route" predicate can
 * intercept tab / link clicks. The guard receives no arguments and
 * returns `true` to allow nav, `false` to cancel.
 *
 * @param {Object}                    props
 * @param {() => boolean}             props.guard    Predicate, returns `true` to allow.
 * @param {import('react').ReactNode} props.children
 */
export function NavigationGuardProvider( { guard, children } ) {
	return (
		<NavigationGuardContext.Provider
			value={ typeof guard === 'function' ? guard : ALWAYS_ALLOW }
		>
			{ children }
		</NavigationGuardContext.Provider>
	);
}

/**
 * Click handler factory for tab strip / Link-style components.
 * `onClick={ useNavigate()( '#welcome' ) }` is the call shape — curried
 * to match the call sites extracted from Blocksify Free's App.js and
 * SubNav. Calls `preventDefault` so the browser doesn't scroll to a
 * named anchor; consults the navigation guard before navigating.
 */
export function useNavigate() {
	const guard = useContext( NavigationGuardContext );
	return useCallback(
		( hash ) => ( event ) => {
			if ( event ) {
				event.preventDefault();
			}
			if ( ! guard() ) {
				return;
			}
			navigate( hash );
		},
		[ guard ],
	);
}

export { NavigationGuardContext };
