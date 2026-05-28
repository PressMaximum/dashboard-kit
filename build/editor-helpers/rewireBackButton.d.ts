/**
 * rewireBackButton — intercept clicks on the block editor's
 * fullscreen-close button (the WP logo top-left) and redirect to a
 * consumer-supplied URL instead of the default `edit.php?post_type=…`
 * landing page. SPEC §5.7.
 *
 * Why click-capture instead of attribute rewiring?
 * The fullscreen close button is a React-rendered anchor; React keeps
 * the `href` attribute pinned across renders, so any attribute-level
 * rewire loses the race on the next render. Intercepting the click in
 * capture phase + `preventDefault()` is the only reliable hook the kit
 * has without forking Gutenberg.
 *
 * Tracking: SPEC §11 hack #6 — `editor.PostBackButton` slot would let
 * the kit replace this with a proper slot fill. Watch the Gutenberg
 * issue tracker; when WP minimum bumps to the version that ships the
 * slot, this helper becomes the fallback path.
 *
 * Consumer wiring (typical):
 *
 *   // consumer-plugin/src/editor.js — bundled and enqueued via
 *   //   `enqueue_block_editor_assets` on the consumer's CPT screen.
 *   import { rewireBackButton } from '@pressmaximum/dashboard-kit/editor-helpers';
 *
 *   rewireBackButton( {
 *       selector: '.edit-post-fullscreen-mode-close',
 *       href: window.customifyEditorBoot.backUrl, // e.g. admin.php?page=customify#templates
 *   } );
 *
 * @param {Object} config
 * @param {string} [config.selector] CSS selector for the close button.
 *                                   Defaults to the post-editor's standard
 *                                   class so most consumers can omit it.
 * @param {string} config.href       Destination URL. Required.
 * @return {(() => void) | null}     Unsubscribe handle (removes the listener),
 *                                   or `null` when called outside a browser
 *                                   (SSR / module-eval contexts).
 */
export function rewireBackButton({ selector, href, }?: {
    selector?: string;
    href: string;
}): (() => void) | null;
export default rewireBackButton;
