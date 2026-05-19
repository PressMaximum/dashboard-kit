<?php
/**
 * Boot — one-call convenience that wires the dashboard chassis (admin
 * menu page, asset enqueue, body class) for consumers that don't need
 * fine-grained control. Consumers wanting custom hooks (e.g. attaching
 * the dashboard under an existing parent menu) should skip `Boot` and
 * call the helpers ({@see Admin\AssetEnqueue}, etc.) directly.
 *
 * Equivalent to the spike's `Blocksify_Dashboard::boot()`, made
 * consumer-agnostic so every kit consumer wires its own menu slug, brand,
 * capability, and boot-data callable.
 *
 * SPEC §4.2 + §8.1.
 *
 * @package PressMaximum\DashboardKit
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit;

use PressMaximum\DashboardKit\Admin\AssetEnqueue;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Stateless chassis wiring. Call `Boot::register([...])` once during
 * plugin / theme bootstrap.
 */
final class Boot {

	/**
	 * Stateless utility — never instantiate.
	 */
	private function __construct() {
	}

	/**
	 * Register admin menu page, enqueue, body class, and render callback
	 * for a kit-consuming dashboard.
	 *
	 * @param array<string, mixed> $args Chassis config.
	 *
	 * Recognised keys:
	 *   - `menu_slug`    (string, required) Top-level menu slug, e.g.
	 *                                       `'customify'`.
	 *   - `page_title`   (string, required) Browser title.
	 *   - `menu_title`   (string, required) Sidebar menu entry text.
	 *   - `capability`   (string, optional) Default `'manage_options'`.
	 *   - `menu_icon`    (string, optional) Dashicons string or
	 *                                       `data:image/svg+xml;base64,...`.
	 *                                       Default `'dashicons-admin-generic'`.
	 *   - `menu_position` (int|null, optional) Default `58` (Comments
	 *                                          group; matches spike).
	 *   - `root_id`      (string, optional) Mount node id. Default
	 *                                       `'{menu_slug}-dashboard'`.
	 *   - `root_class`   (string, optional) Mount node class. Default
	 *                                       `'{menu_slug}-dashboard-root'`.
	 *   - `body_class`   (string, optional) Extra body class on the
	 *                                       dashboard page. Default
	 *                                       `'{menu_slug}-dashboard-page'`.
	 *   - Asset enqueue (forwarded to {@see AssetEnqueue::enqueueOn()}):
	 *       `script_handle`, `src_js`, `src_css`, `asset_php`,
	 *       `boot_global`, `boot_data`, `text_domain`, `deps`,
	 *       `version`, `style_deps`.
	 *
	 * @return string The resolved `page_hook` (`'toplevel_page_<slug>'`).
	 */
	public static function register( array $args ): string {
		$menu_slug = isset( $args['menu_slug'] ) ? (string) $args['menu_slug'] : '';
		if ( '' === $menu_slug ) {
			throw new \InvalidArgumentException( 'Boot::register(): menu_slug is required.' );
		}

		$page_hook  = 'toplevel_page_' . $menu_slug;
		$root_id    = isset( $args['root_id'] ) ? (string) $args['root_id'] : $menu_slug . '-dashboard';
		$root_class = isset( $args['root_class'] ) ? (string) $args['root_class'] : $menu_slug . '-dashboard-root';
		$body_class = isset( $args['body_class'] ) ? (string) $args['body_class'] : $menu_slug . '-dashboard-page';

		\add_action(
			'admin_menu',
			static function () use ( $args, $menu_slug, $root_id, $root_class ): void {
				\add_menu_page(
					isset( $args['page_title'] ) ? (string) $args['page_title'] : $menu_slug,
					isset( $args['menu_title'] ) ? (string) $args['menu_title'] : $menu_slug,
					isset( $args['capability'] ) ? (string) $args['capability'] : 'manage_options',
					$menu_slug,
					static function () use ( $root_id, $root_class ): void {
						echo '<div id="' . \esc_attr( $root_id ) . '" class="' . \esc_attr( $root_class ) . '"></div>';
					},
					isset( $args['menu_icon'] ) ? (string) $args['menu_icon'] : 'dashicons-admin-generic',
					isset( $args['menu_position'] ) ? $args['menu_position'] : 58
				);
			}
		);

		\add_action(
			'admin_enqueue_scripts',
			static function ( $hook ) use ( $args, $page_hook ): void {
				AssetEnqueue::enqueueOn(
					(string) $hook,
					array(
						'page_hook'   => $page_hook,
						'handle'      => isset( $args['script_handle'] ) ? (string) $args['script_handle'] : ( $args['handle'] ?? '' ),
						'src_js'      => isset( $args['src_js'] ) ? (string) $args['src_js'] : '',
						'src_css'     => isset( $args['src_css'] ) ? (string) $args['src_css'] : '',
						'asset_php'   => isset( $args['asset_php'] ) ? (string) $args['asset_php'] : '',
						'deps'        => isset( $args['deps'] ) ? (array) $args['deps'] : array(),
						'version'     => $args['version'] ?? false,
						'style_deps'  => isset( $args['style_deps'] ) ? (array) $args['style_deps'] : array( 'wp-components' ),
						'boot_global' => isset( $args['boot_global'] ) ? (string) $args['boot_global'] : '',
						'boot_data'   => $args['boot_data'] ?? array(),
						'text_domain' => isset( $args['text_domain'] ) ? (string) $args['text_domain'] : '',
					)
				);
			}
		);

		\add_filter(
			'admin_body_class',
			static function ( $classes ) use ( $page_hook, $body_class ): string {
				$screen = function_exists( 'get_current_screen' ) ? \get_current_screen() : null;
				if ( $screen && isset( $screen->id ) && $page_hook === $screen->id ) {
					$classes .= ' ' . $body_class;
				}
				return (string) $classes;
			}
		);

		return $page_hook;
	}
}
