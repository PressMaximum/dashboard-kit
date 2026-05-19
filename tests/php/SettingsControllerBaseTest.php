<?php
/**
 * SettingsControllerBase — abstract base flow: register_routes, GET
 * merge-saved-over-defaults, POST sanitize-then-save, capability gate.
 *
 * Uses a tiny concrete subclass so the abstract methods have real
 * implementations.
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\REST\SettingsControllerBase;

/**
 * Test fixture — minimal concrete controller. Settings shape is a
 * two-group nested array, matching the spike's
 * `{ performance: {...}, version: {...} }` pattern.
 */
final class FixtureSettingsController extends SettingsControllerBase {

	protected function getNamespace(): string {
		return 'fixture/v1';
	}

	protected function getRestBase(): string {
		return 'settings';
	}

	protected function getCapability(): string {
		return 'manage_options';
	}

	protected function getOptionName(): string {
		return 'fixture_settings';
	}

	protected function getDefaults(): array {
		return array(
			'performance' => array(
				'cache'    => true,
				'compress' => false,
			),
			'version'     => array(
				'channel' => 'stable',
			),
		);
	}

	protected function sanitizeIncoming( array $incoming ): array {
		// Pass through but coerce `cache` + `compress` to bool. Tests the
		// override path.
		if ( isset( $incoming['performance']['cache'] ) ) {
			$incoming['performance']['cache'] = (bool) $incoming['performance']['cache'];
		}
		if ( isset( $incoming['performance']['compress'] ) ) {
			$incoming['performance']['compress'] = (bool) $incoming['performance']['compress'];
		}
		return $incoming;
	}
}

final class SettingsControllerBaseTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	public function test_register_routes_registers_get_and_post(): void {
		( new FixtureSettingsController() )->register_routes();
		$routes = $GLOBALS['pmdk_test_state']['rest_routes'];
		$this->assertCount( 1, $routes );
		$this->assertSame( 'fixture/v1', $routes[0]['namespace'] );
		$this->assertSame( '/settings', $routes[0]['route'] );

		$args = $routes[0]['args'];
		$this->assertCount( 3, $args ); // GET, POST, schema entry.
		$this->assertSame( 'GET', $args[0]['methods'] );
		$this->assertSame( 'POST', $args[1]['methods'] );
	}

	public function test_get_item_returns_merged_saved_over_defaults(): void {
		$GLOBALS['pmdk_test_state']['options']['fixture_settings'] = array(
			'performance' => array( 'cache' => false ),
		);

		$controller = new FixtureSettingsController();
		$response   = $controller->get_item( new \WP_REST_Request() );

		$this->assertSame(
			array(
				'performance' => array(
					'cache'    => false, // overridden
					'compress' => false, // default kept
				),
				'version'     => array(
					'channel' => 'stable',
				),
			),
			$response
		);
	}

	public function test_get_item_returns_defaults_when_option_empty(): void {
		$response = ( new FixtureSettingsController() )->get_item( new \WP_REST_Request() );
		$this->assertSame(
			array(
				'performance' => array( 'cache' => true, 'compress' => false ),
				'version'     => array( 'channel' => 'stable' ),
			),
			$response
		);
	}

	public function test_update_item_sanitizes_and_saves(): void {
		$req = new \WP_REST_Request();
		$req->set_json_params(
			array(
				'performance' => array( 'cache' => 0, 'compress' => 1 ),
				'version'     => array( 'channel' => 'beta' ),
			)
		);

		$response = ( new FixtureSettingsController() )->update_item( $req );

		$this->assertSame(
			array(
				'performance' => array( 'cache' => false, 'compress' => true ),
				'version'     => array( 'channel' => 'beta' ),
			),
			$response
		);
		$this->assertSame(
			$response,
			$GLOBALS['pmdk_test_state']['options']['fixture_settings']
		);
	}

	public function test_update_item_with_empty_body_writes_empty_array_via_default_sanitize(): void {
		$req = new \WP_REST_Request();
		$req->set_json_params( null );
		$req->set_params( array() );

		$response = ( new FixtureSettingsController() )->update_item( $req );
		// The base class default sanitize passes through; subclass adds
		// boolean coercion that doesn't touch missing keys.
		$this->assertSame( array(), $response );
	}

	public function test_permission_check_delegates_to_current_user_can(): void {
		$GLOBALS['pmdk_test_state']['current_user_can'] = false;
		$this->assertFalse( ( new FixtureSettingsController() )->permission_check() );

		$GLOBALS['pmdk_test_state']['current_user_can'] = true;
		$this->assertTrue( ( new FixtureSettingsController() )->permission_check() );
	}
}
