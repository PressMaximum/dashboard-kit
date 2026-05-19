/**
 * forceFullscreenMode — flip the block editor into fullscreen
 * (distraction-free, no WP admin sidebar) for the current screen.
 * SPEC §5.7.
 *
 * Targets the `core/preferences` store key `core/edit-post.fullscreenMode`
 * — the same flag the Gutenberg "Fullscreen mode" menu item toggles.
 * Subscribes to the store until both the selector + dispatcher are
 * registered (they land asynchronously during editor boot), so calling
 * this helper at the top of the consumer's editor entry is safe.
 *
 * Consumer wiring:
 *
 *   import { forceFullscreenMode } from '@pressmaximum/dashboard-kit/editor-helpers';
 *
 *   forceFullscreenMode();           // applies on first render
 *   // or pair with rewireBackButton to mimic Site Editor's UX:
 *   forceFullscreenMode();
 *   rewireBackButton( { href: backUrl } );
 *
 * Pre-conditions: the consumer's PHP enqueue scopes this script to the
 * intended post-type's editor screen (typically
 * `enqueue_block_editor_assets` + a screen check). The kit can't gate
 * by post type because it doesn't run in PHP.
 *
 * @return {(() => void) | null} Unsubscribe handle (cancels the
 *                               pending store subscription if the
 *                               editor never finishes booting), or
 *                               `null` outside a browser.
 */
export function forceFullscreenMode() {
	if ( typeof window === 'undefined' ) {
		return null;
	}

	function tryEnable() {
		const wpData = window.wp && window.wp.data;
		if ( ! wpData ) {
			return false;
		}
		const sel = wpData.select( 'core/preferences' );
		const dispatch = wpData.dispatch( 'core/preferences' );
		if ( ! sel || ! dispatch ) {
			return false;
		}
		if ( ! sel.get( 'core/edit-post', 'fullscreenMode' ) ) {
			dispatch.set( 'core/edit-post', 'fullscreenMode', true );
		}
		return true;
	}

	if ( tryEnable() ) {
		return () => undefined;
	}

	// Editor boot resolves the preferences store asynchronously; subscribe
	// until both halves arrive, then unsubscribe so we don't run on every
	// future store mutation.
	//
	// Note on bounded-by-mutation retries: if `core/preferences` never
	// registers (broken WP install, hostile plugin conflict), the
	// subscriber keeps re-invoking `tryEnable()` on every store
	// mutation. CPU cost per invocation is two selector reads, so the
	// loop is bounded by store-mutation frequency — but still unbounded
	// in wall-clock time. Matches the spike's inline IIFE faithfully.
	// Consumers wanting a hard stop can capture the returned unsubscribe
	// and invoke it after a timeout.
	const wpData = window.wp && window.wp.data;
	if ( ! wpData || typeof wpData.subscribe !== 'function' ) {
		return () => undefined;
	}
	let unsub = null;
	unsub = wpData.subscribe( () => {
		if ( tryEnable() && unsub ) {
			unsub();
			unsub = null;
		}
	} );
	return () => {
		if ( unsub ) {
			unsub();
			unsub = null;
		}
	};
}

export default forceFullscreenMode;
