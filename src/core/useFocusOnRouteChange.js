/**
 * useFocusOnRouteChange — SPA focus management.
 *
 * When the active route changes, move focus to the new view's main
 * landmark so screen-reader users get a clear signal that content
 * swapped. Without this, focus stays on the clicked tab anchor and AT
 * users don't know the page advanced.
 *
 * The hook returns a ref to attach to the focus target — typically
 * `<main tabIndex={ -1 }>`. The initial mount doesn't focus — we don't
 * want to steal the user's normal browser focus on first paint, only
 * on subsequent route transitions.
 *
 * `preventScroll: true` is critical: without it the browser scrolls the
 * focused `<main>` into view on every route change, which yanks long
 * content to the top of the viewport. AT users still get the landmark
 * announcement because the focus moved.
 */

import { useEffect, useRef } from '@wordpress/element';

export function useFocusOnRouteChange( route ) {
	const ref = useRef( null );
	const initial = useRef( true );

	useEffect( () => {
		if ( initial.current ) {
			initial.current = false;
			return;
		}
		if ( ref.current && typeof ref.current.focus === 'function' ) {
			ref.current.focus( { preventScroll: true } );
		}
	}, [ route ] );

	return ref;
}

export default useFocusOnRouteChange;
