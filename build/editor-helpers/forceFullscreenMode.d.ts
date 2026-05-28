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
export function forceFullscreenMode(): (() => void) | null;
export default forceFullscreenMode;
