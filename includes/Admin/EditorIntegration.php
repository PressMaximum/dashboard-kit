<?php
/**
 * Editor integration — PHP wrappers that emit inline `<script>` tags
 * calling the kit's P5 editor-helper logic on the block-editor screen.
 * Use these when the consumer prefers a PHP-only path (no separate
 * editor JS bundle); consumers with their own editor entry can call the
 * JS helpers from `@pressmaximum/dashboard-kit/editor-helpers` directly
 * instead.
 *
 * Closes SPEC §11 hack #5 + #6 PHP halves (the JS halves shipped in P5).
 *
 * @package PressMaximum\DashboardKit\Admin
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Admin;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Stateless block-editor glue. Each method registers an
 * `enqueue_block_editor_assets` action that runs the bundled JS via
 * `wp_add_inline_script` on the matching screen.
 */
final class EditorIntegration {

	/**
	 * Stateless utility — never instantiate.
	 */
	private function __construct() {
	}

	/**
	 * Force the block editor into fullscreen mode on the configured post
	 * type's edit screen. Mirrors the spike's `force_fullscreen_mode()`
	 * PHP method (`class-blocksify-dashboard-surfaces-spike.php:130`).
	 *
	 * @param array<string, mixed> $args Config.
	 *
	 * Recognised keys:
	 *   - `post_type` (string, required) Post type to scope to. The
	 *                                    enqueue runs only when
	 *                                    `get_current_screen()->post_type`
	 *                                    matches.
	 *   - `handle`    (string, optional) Script handle to attach the
	 *                                    inline script to. Default
	 *                                    `'wp-editor'` (the editor's main
	 *                                    handle — always enqueued).
	 *
	 * @return void
	 */
	public static function forceFullscreenMode( array $args ): void {
		$post_type = isset( $args['post_type'] ) ? (string) $args['post_type'] : '';
		if ( '' === $post_type ) {
			return;
		}
		$handle = isset( $args['handle'] ) ? (string) $args['handle'] : 'wp-editor';

		\add_action(
			'enqueue_block_editor_assets',
			static function () use ( $post_type, $handle ): void {
				$screen = function_exists( 'get_current_screen' ) ? \get_current_screen() : null;
				if ( ! $screen || $post_type !== $screen->post_type ) {
					return;
				}
				$inline = '(function(){'
					. 'function enable(){'
					. 'if(!window.wp||!window.wp.data)return false;'
					. 'var sel=window.wp.data.select("core/preferences");'
					. 'var dispatch=window.wp.data.dispatch("core/preferences");'
					. 'if(!sel||!dispatch)return false;'
					. 'if(!sel.get("core/edit-post","fullscreenMode")){'
					. 'dispatch.set("core/edit-post","fullscreenMode",true);'
					. '}'
					. 'return true;'
					. '}'
					. 'if(enable())return;'
					. 'if(!window.wp||!window.wp.data||typeof window.wp.data.subscribe!=="function")return;'
					. 'var unsub=window.wp.data.subscribe(function(){if(enable()&&unsub){unsub();unsub=null;}});'
					. '})();';
				\wp_add_inline_script( $handle, $inline );
			}
		);
	}

	/**
	 * Intercept clicks on the block editor's fullscreen-close button and
	 * redirect to a custom URL (typically a dashboard tab). Mirrors the
	 * spike's capture-phase click hijack (same source location as
	 * `forceFullscreenMode`).
	 *
	 * @param array<string, mixed> $args Config.
	 *
	 * Recognised keys:
	 *   - `post_type` (string, required) Post type to scope to.
	 *   - `back_url`  (string, required) Destination URL when the close
	 *                                    button is clicked.
	 *   - `selector`  (string, optional) Override the close-button
	 *                                    selector. Default
	 *                                    `.edit-post-fullscreen-mode-close`.
	 *   - `handle`    (string, optional) Inline-script attach point.
	 *                                    Default `'wp-editor'`.
	 *
	 * @return void
	 */
	public static function rewireBackButton( array $args ): void {
		$post_type = isset( $args['post_type'] ) ? (string) $args['post_type'] : '';
		$back_url  = isset( $args['back_url'] ) ? (string) $args['back_url'] : '';
		if ( '' === $post_type || '' === $back_url ) {
			return;
		}
		$selector = isset( $args['selector'] ) ? (string) $args['selector'] : '.edit-post-fullscreen-mode-close';
		$handle   = isset( $args['handle'] ) ? (string) $args['handle'] : 'wp-editor';

		\add_action(
			'enqueue_block_editor_assets',
			static function () use ( $post_type, $back_url, $selector, $handle ): void {
				$screen = function_exists( 'get_current_screen' ) ? \get_current_screen() : null;
				if ( ! $screen || $post_type !== $screen->post_type ) {
					return;
				}
				$back_url_json = \wp_json_encode( $back_url );
				$selector_json = \wp_json_encode( $selector );
				$inline        = '(function(){'
					. 'var backUrl=' . $back_url_json . ';'
					. 'var selector=' . $selector_json . ';'
					. 'document.addEventListener("click",function(e){'
					. 'var target=e.target;'
					. 'var btn=target&&typeof target.closest==="function"?target.closest(selector):null;'
					. 'if(!btn)return;'
					. 'e.preventDefault();'
					. 'e.stopPropagation();'
					. 'window.location.href=backUrl;'
					. '},{capture:true});'
					. '})();';
				\wp_add_inline_script( $handle, $inline );
			}
		);
	}
}
