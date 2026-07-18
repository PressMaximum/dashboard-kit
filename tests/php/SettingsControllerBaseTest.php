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

/**
 * Second fixture — sanitize delegates to a real SchemaBuilder, mirroring
 * the documented consumer wiring. Used by the partial-body / reset tests.
 */
final class SchemaBackedSettingsController extends SettingsControllerBase {

	protected function getNamespace(): string {
		return 'fixture/v1';
	}

	protected function getRestBase(): string {
		return 'schema-settings';
	}

	protected function getCapability(): string {
		return 'manage_options';
	}

	protected function getOptionName(): string {
		return 'fixture_schema_settings';
	}

	private function builder(): \PressMaximum\DashboardKit\Schema\SchemaBuilder {
		return \PressMaximum\DashboardKit\Schema\SchemaBuilder::create()
			->panel( 'performance', 'Performance' )
			->booleanField( 'cache', 'Cache', true )
			->numberField( 'ttl', 'TTL', 60, array( 'min' => 0, 'max' => 3600 ) )
			->endPanel()
			->panel( 'version', 'Version' )
			->selectField(
				'channel',
				'Channel',
				'stable',
				array(
					'stable' => 'Stable',
					'beta'   => 'Beta',
				)
			);
	}

	protected function getDefaults(): array {
		return $this->builder()->buildDefaults();
	}

	protected function sanitizeIncoming( array $incoming ): array {
		return $this->builder()->sanitize( $incoming );
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

	/* ------------- partial-body reset fix (SchemaBuilder-backed) ------- */

	public function test_update_item_partial_body_preserves_saved_fields(): void {
		// Saved state diverges from every default on purpose.
		$GLOBALS['pmdk_test_state']['options']['fixture_schema_settings'] = array(
			'performance' => array(
				'cache' => false,
				'ttl'   => 600,
			),
			'version'     => array( 'channel' => 'beta' ),
		);

		// Partial POST touches only performance.ttl.
		$req = new \WP_REST_Request();
		$req->set_json_params(
			array( 'performance' => array( 'ttl' => 120 ) )
		);

		$response = ( new SchemaBackedSettingsController() )->update_item( $req );

		// Pre-fix: cache reset to true (default) and channel reset to
		// 'stable' (default). Post-fix: both keep their SAVED values.
		$this->assertSame( false, $response['performance']['cache'] );
		$this->assertSame( 120.0, $response['performance']['ttl'] );
		$this->assertSame( 'beta', $response['version']['channel'] );
		$this->assertSame(
			$response,
			$GLOBALS['pmdk_test_state']['options']['fixture_schema_settings']
		);
	}

	public function test_update_item_empty_body_still_resets_to_defaults(): void {
		$GLOBALS['pmdk_test_state']['options']['fixture_schema_settings'] = array(
			'performance' => array(
				'cache' => false,
				'ttl'   => 600,
			),
			'version'     => array( 'channel' => 'beta' ),
		);

		// Empty body = the documented reset contract; the merge-over-saved
		// step must NOT resurrect saved values here.
		$req = new \WP_REST_Request();
		$req->set_json_params( array() );

		$response = ( new SchemaBackedSettingsController() )->update_item( $req );

		$this->assertSame(
			array(
				'performance' => array(
					'cache' => true,
					'ttl'   => 60.0,
				),
				'version'     => array( 'channel' => 'stable' ),
			),
			$response
		);
		$this->assertSame(
			$response,
			$GLOBALS['pmdk_test_state']['options']['fixture_schema_settings']
		);
	}
}
