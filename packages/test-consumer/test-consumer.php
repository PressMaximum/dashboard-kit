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
 *
 * P0 scaffold: registers the menu + renders the SPA mount node. Boot data
 * + asset enqueue land alongside the P1 core extraction, once the kit
 * actually exposes mountDashboard().
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
 * Render the placeholder mount node.
 *
 * The kit will mount a React SPA into the div below once
 * packages/test-consumer/src/dashboard/index.js calls mountDashboard().
 */
function pmdk_test_consumer_render_page(): void {
	echo '<div class="wrap"><h1>PMDK Test Consumer</h1>';
	echo '<p>P0 scaffold — the kit will mount a dashboard into the div below once P1 lands.</p>';
	echo '<div id="pmdk-test-dashboard" class="pmdk-test-dashboard-root"></div>';
	echo '</div>';
}
