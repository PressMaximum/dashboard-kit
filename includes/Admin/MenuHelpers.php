<?php
/**
 * Admin menu helpers — boilerplate every dashboard consumer rewrites for
 * hash-routed submenu items, parent-mirror relabelling, and the inline
 * `<script>` that keeps WP's submenu `.current` class in sync with the
 * SPA's hash route (PHP wrapper around P5's
 * `registerSubmenuActive` JS helper).
 *
 * Why client-side highlight sync?
 * WP highlights submenu items by comparing `?page=` server-side; the
 * hash portion is invisible to PHP. For a SPA where every tab is
 * `admin.php?page=<slug>#tab`, WP would either always highlight the
 * parent mirror or nothing. The helper closes the gap on the client.
 * SPEC §5.9 + §11 hack #5.
 *
 * @package PressMaximum\DashboardKit\Admin
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Admin;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Stateless submenu helpers. Call inside the consumer's `admin_menu`
 * action.
 */
final class MenuHelpers {

	/**
	 * Stateless utility — never instantiate.
	 */
	private function __construct() {
	}

	/**
	 * Register a submenu item whose menu URL ends in a hash route.
	 * Equivalent to `add_submenu_page()` with `menu_slug` set to
	 * `<parent_slug>#<hash>`, plus the noop render callback (the SPA
	 * already owns the parent page).
	 *
	 * @param array<string, mixed> $args Submenu config.
	 *
	 * Recognised keys:
	 *   - `parent_slug` (string, required) Top-level menu slug.
	 *   - `label`       (string, required) Page title (sr-only — the
	 *                                      SPA renders its own heading).
	 *   - `menu_label`  (string, required) Submenu entry text.
	 *   - `capability`  (string, optional) Default `manage_options`.
	 *   - `hash`        (string, required) Hash route, e.g. `'#templates'`.
	 *                                      `#` prefix optional — added if
	 *                                      omitted.
	 *   - `position`    (int|null, optional) Submenu position passed to
	 *                                       `add_submenu_page`.
	 *
	 * @return false|string Result of `add_submenu_page` (page hook
	 *                      suffix), or `false` if required keys missing.
	 */
	public static function addHashSubmenu( array $args ) {
		$parent_slug = isset( $args['parent_slug'] ) ? (string) $args['parent_slug'] : '';
		$label       = isset( $args['label'] ) ? (string) $args['label'] : '';
		$menu_label  = isset( $args['menu_label'] ) ? (string) $args['menu_label'] : '';
		$hash        = isset( $args['hash'] ) ? (string) $args['hash'] : '';
		if ( '' === $parent_slug || '' === $hash ) {
			return false;
		}
		if ( '' === $label ) {
			$label = $menu_label;
		}
		if ( '' === $menu_label ) {
			$menu_label = $label;
		}
		$capability = isset( $args['capability'] ) ? (string) $args['capability'] : 'manage_options';
		$position   = $args['position'] ?? null;

		// Prefix the hash with `#` if the consumer omitted it.
		if ( 0 !== strpos( $hash, '#' ) ) {
			$hash = '#' . $hash;
		}

		return \add_submenu_page(
			$parent_slug,
			$label,
			$menu_label,
			$capability,
			$parent_slug . $hash,
			'__return_null',
			$position
		);
	}

	/**
	 * Replace the auto-created parent mirror submenu entry's label.
	 *
	 * When WP registers a parent menu via `add_menu_page()`, it duplicates
	 * the parent label as the first submenu item. For a SPA dashboard the
	 * first item is conventionally the welcome tab — keeping the
	 * duplicate-of-the-parent label there is confusing. Call this on
	 * `admin_menu` (priority > 9) to rename it.
	 *
	 * @param array<string, mixed> $args Relabel config.
	 *
	 * Recognised keys:
	 *   - `parent_slug` (string, required) Top-level menu slug.
	 *   - `replacement` (string, required) New label.
	 *
	 * @return bool True when the relabel applied, false when the parent
	 *              menu or its mirror entry isn't registered yet.
	 */
	public static function relabelParentMirror( array $args ): bool {
		$parent_slug = isset( $args['parent_slug'] ) ? (string) $args['parent_slug'] : '';
		$replacement = isset( $args['replacement'] ) ? (string) $args['replacement'] : '';
		if ( '' === $parent_slug || '' === $replacement ) {
			return false;
		}

		// The parent mirror lives at `$submenu[ parent_slug ][0]`. The label
		// is at index `[0][0]`.
		global $submenu;
		if ( ! is_array( $submenu ) || ! isset( $submenu[ $parent_slug ][0][0] ) ) {
			return false;
		}
		$submenu[ $parent_slug ][0][0] = $replacement;
		return true;
	}

	/**
	 * Emit an inline `<script>` that keeps the WP submenu's `.current`
	 * class in sync with the SPA's hash route. PHP wrapper around the JS
	 * `registerSubmenuActive` helper (P5 / SPEC §11 hack #5). Hook on
	 * `admin_footer-{page_hook}` (or wherever the menu DOM is in the
	 * document).
	 *
	 * The inline script is self-contained so consumers who don't bundle
	 * the kit's `/editor-helpers` JS still get the highlight behaviour.
	 * Consumers who DO bundle that entry can call
	 * `registerSubmenuActive({ menuId, hash })` from their dashboard JS
	 * instead — both paths are valid.
	 *
	 * @param array<string, mixed> $args Sync config.
	 *
	 * Recognised keys:
	 *   - `menu_id` (string, required) DOM id of the parent menu wrapper,
	 *                                  e.g. `'toplevel_page_customify'`.
	 *   - `hash`    (string, optional) Hash route to match. Default
	 *                                  `'#templates'`. `#` prefix optional.
	 *
	 * @return void
	 */
	public static function printSubmenuActiveSync( array $args ): void {
		$menu_id = isset( $args['menu_id'] ) ? (string) $args['menu_id'] : '';
		$hash    = isset( $args['hash'] ) ? (string) $args['hash'] : '';
		if ( '' === $menu_id ) {
			return;
		}
		if ( '' !== $hash && 0 !== strpos( $hash, '#' ) ) {
			$hash = '#' . $hash;
		}

		// Build the inline IIFE. JSON-encode both inputs so any quote /
		// embedded-script attempt comes out as a string literal, not as
		// JS syntax. `wp_json_encode` returns a JSON-safe representation.
		$menu_id_json = \wp_json_encode( $menu_id );
		$hash_json    = \wp_json_encode( $hash );

		$script = '(function(){'
			. 'var menuId=' . $menu_id_json . ';'
			. 'var hash=' . $hash_json . ';'
			. 'var submenu=document.querySelector("#"+menuId+" .wp-submenu");'
			. 'if(!submenu)return;'
			. 'var items=Array.prototype.slice.call(submenu.querySelectorAll("li"));'
			. 'var target=null;'
			. 'if(hash){'
			. 'for(var i=0;i<items.length;i++){'
			. 'var a=items[i].querySelector("a");'
			. 'if(a&&a.getAttribute("href")&&a.getAttribute("href").indexOf(hash)!==-1){target=items[i];break;}'
			. '}'
			. '}'
			. 'function sync(){'
			. 'var onMatch=hash&&window.location.hash===hash;'
			. 'for(var j=0;j<items.length;j++){items[j].classList.remove("current");}'
			. 'if(onMatch&&target){target.classList.add("current");return;}'
			. 'for(var k=0;k<items.length;k++){'
			. 'if(items[k].querySelector("a.wp-first-item")){items[k].classList.add("current");break;}'
			. '}'
			. '}'
			. 'sync();'
			. 'window.addEventListener("hashchange",sync);'
			. '})();';

		echo "<script>\n" . $script . "\n</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
