<?php
/**
 * Asset enqueue helper — wraps the standard
 * `wp_enqueue_script` + `wp_set_script_translations` +
 * `wp_localize_script` + `wp_enqueue_style` boilerplate every dashboard
 * consumer otherwise rewrites. SPEC §5.9 + §8.1.
 *
 * Reads the `*.asset.php` file emitted by `@wordpress/scripts` so deps
 * (`wp-element`, `wp-components`, `wp-dataviews`, etc.) + version hash
 * arrive automatically. Skips gracefully when the build output isn't on
 * disk yet (dev workflow where PHP loads before `npm run build`
 * finishes).
 *
 * @package PressMaximum\DashboardKit\Admin
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Admin;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Stateless asset-enqueue helper. Call from inside the consumer's
 * `admin_enqueue_scripts` callback.
 */
final class AssetEnqueue {

	/**
	 * Stateless utility — never instantiate.
	 */
	private function __construct() {
	}

	/**
	 * Enqueue the kit-consuming dashboard's script + style + boot payload.
	 *
	 * @param string               $hook   Current admin page hook (the
	 *                                     same `$hook` passed to the
	 *                                     consumer's `admin_enqueue_scripts`
	 *                                     callback).
	 * @param array<string, mixed> $config Enqueue config — see keys below.
	 *
	 * Recognised `$config` keys:
	 *   - `handle`      (string, required)  Script + style handle.
	 *   - `src_js`      (string, required)  URL to the built JS bundle.
	 *   - `src_css`     (string, optional)  URL to the built CSS bundle.
	 *   - `asset_php`   (string, optional)  Absolute path to the
	 *                                       `*.asset.php` emitted by
	 *                                       @wordpress/scripts. When set
	 *                                       + the file exists, deps +
	 *                                       version come from it.
	 *   - `deps`        (string[], optional) Fallback script deps when
	 *                                       `asset_php` isn't supplied.
	 *   - `version`     (string, optional)  Fallback version when
	 *                                       `asset_php` isn't supplied.
	 *   - `style_deps`  (string[], optional) Default `['wp-components']`.
	 *   - `boot_global` (string, optional)  Window-property key for the
	 *                                       boot payload (e.g.
	 *                                       `customifyDashboard`).
	 *   - `boot_data`   (array|callable, optional) Boot payload value or
	 *                                              a callable returning it.
	 *   - `text_domain` (string, optional)  Consumer text domain for
	 *                                       `wp_set_script_translations`.
	 *   - `page_hook`   (string, optional)  When set, the helper short-
	 *                                       circuits when `$hook` doesn't
	 *                                       match — saves the caller a
	 *                                       guard. Omit to always enqueue
	 *                                       (caller scopes).
	 *
	 * @return bool True when the script was enqueued, false when skipped
	 *              (wrong hook or required keys missing).
	 */
	public static function enqueueOn( string $hook, array $config ): bool {
		if ( isset( $config['page_hook'] ) && $config['page_hook'] !== $hook ) {
			return false;
		}

		$handle = isset( $config['handle'] ) ? (string) $config['handle'] : '';
		$src_js = isset( $config['src_js'] ) ? (string) $config['src_js'] : '';
		if ( '' === $handle || '' === $src_js ) {
			return false;
		}

		$asset       = self::loadAssetPhp( isset( $config['asset_php'] ) ? (string) $config['asset_php'] : '' );
		$deps        = $asset['dependencies'] ?? ( $config['deps'] ?? array() );
		$version     = $asset['version'] ?? ( $config['version'] ?? false );
		$style_deps  = isset( $config['style_deps'] ) ? (array) $config['style_deps'] : array( 'wp-components' );
		$text_domain = isset( $config['text_domain'] ) ? (string) $config['text_domain'] : '';

		\wp_enqueue_script(
			$handle,
			$src_js,
			$deps,
			$version,
			true
		);

		if ( '' !== $text_domain ) {
			\wp_set_script_translations( $handle, $text_domain );
		}

		if ( ! empty( $config['boot_global'] ) ) {
			$boot_data = $config['boot_data'] ?? array();
			if ( is_callable( $boot_data ) ) {
				$boot_data = call_user_func( $boot_data );
			}
			\wp_localize_script(
				$handle,
				(string) $config['boot_global'],
				is_array( $boot_data ) ? $boot_data : array()
			);
		}

		if ( ! empty( $config['src_css'] ) ) {
			\wp_enqueue_style(
				$handle,
				(string) $config['src_css'],
				$style_deps,
				$version
			);
		}

		return true;
	}

	/**
	 * Read `*.asset.php` when present + sanity-check the shape. Returns
	 * an empty array when the file is missing / unreadable so callers can
	 * fall back to their own `deps` / `version`.
	 *
	 * @param string $path Absolute path to the asset manifest file.
	 *
	 * @return array<string, mixed> Either an empty array or
	 *                              `{ dependencies: string[], version: string }`.
	 */
	private static function loadAssetPhp( string $path ): array {
		if ( '' === $path || ! file_exists( $path ) || ! is_readable( $path ) ) {
			return array();
		}
		// `require` of a manifest file emitted by @wordpress/scripts — the
		// file's only side effect is returning the array literal.
		$asset = require $path;
		return is_array( $asset ) ? $asset : array();
	}
}
