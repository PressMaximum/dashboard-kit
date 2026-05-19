<?php
/**
 * Plugin Name: PMDK Test Consumer
 * Plugin URI:  https://github.com/pressmaximum/dashboard-kit
 * Description: Internal test plugin for @pressmaximum/dashboard-kit development. Loads the kit from the parent repo via a symlinked node_modules entry and mounts a placeholder dashboard so contributors can smoke-test changes in a real WordPress admin without standing up a production plugin. NOT FOR DISTRIBUTION.
 * Version:     0.0.0
 * Requires PHP: 7.4
 * Requires at least: 6.5
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain: pmdk-test-consumer
 *
 * @package PressMaximum\DashboardKit\TestConsumer
 */

defined( 'ABSPATH' ) || exit;

const PMDK_TEST_CONSUMER_VERSION = '0.0.0';

/**
 * Register the toplevel admin page that hosts the test dashboard.
 */
add_action(
	'admin_menu',
	static function () {
		add_menu_page(
			'PMDK Test Consumer',
			'PMDK Test',
			'manage_options',
			'pmdk-test',
			'pmdk_test_consumer_render_page',
			'dashicons-dashboard',
			59
		);
	}
);

/**
 * Render the SPA mount node. `src/dashboard/index.js` calls
 * `mountDashboard({ rootEl: '#pmdk-test-dashboard', ... })` against this.
 */
function pmdk_test_consumer_render_page(): void {
	echo '<div class="wrap"><h1>PMDK Test Consumer</h1>';
	echo '<div id="pmdk-test-dashboard" class="pmdk-test-dashboard-root"></div>';
	echo '</div>';
}

/**
 * Enqueue the bundled dashboard JS + CSS and localize the boot payload.
 *
 * The build output (built by the consumer's own wp-scripts) is expected at
 * `build/dashboard.{js,asset.php,css}`. The dev loop ships the kit source
 * via `npm link`; consumer rebuilds its own bundle.
 */
add_action(
	'admin_enqueue_scripts',
	static function ( $hook ): void {
		if ( 'toplevel_page_pmdk-test' !== $hook ) {
			return;
		}

		$asset_path = __DIR__ . '/build/dashboard.asset.php';
		$asset      = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array(),
				'version'      => PMDK_TEST_CONSUMER_VERSION,
			);

		wp_enqueue_script(
			'pmdk-test-dashboard',
			plugins_url( 'build/dashboard.js', __FILE__ ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( __DIR__ . '/build/dashboard.css' ) ) {
			wp_enqueue_style(
				'pmdk-test-dashboard',
				plugins_url( 'build/dashboard.css', __FILE__ ),
				array(),
				$asset['version']
			);
		}

		$user = wp_get_current_user();
		wp_add_inline_script(
			'pmdk-test-dashboard',
			'window.pmdkTestDashboard = ' . wp_json_encode(
				array(
					'name'       => 'PMDK Test',
					'wpVersion'  => get_bloginfo( 'version' ),
					'phpVersion' => PHP_VERSION,
					'user'       => array(
						'id'          => (int) $user->ID,
						'displayName' => (string) $user->display_name,
					),
				)
			) . ';',
			'before'
		);
	}
);
