<?php
/**
 * PreviewEndpointRegistrar — register() hook wiring smoke test. Verifies
 * the registrar adds the `query_vars` filter + `template_redirect`
 * action. The render path itself (HTML emission, `wp_die`, `WP_Query`
 * cycle) needs a real WP integration scaffold — out of scope for this
 * unit-level suite (deferred to a post-1.0 wp-env harness).
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\REST\PreviewEndpointRegistrar;

final class PreviewEndpointRegistrarTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	public function test_register_wires_query_vars_filter_and_template_redirect_action(): void {
		PreviewEndpointRegistrar::register(
			array(
				'post_type' => 'customify_template',
				'query_var' => 'customify_template_preview',
			)
		);

		$filters = $GLOBALS['pmdk_test_state']['filters'];
		$actions = $GLOBALS['pmdk_test_state']['actions'];

		$this->assertCount( 1, $filters );
		$this->assertSame( 'query_vars', $filters[0]['tag'] );

		$this->assertCount( 1, $actions );
		$this->assertSame( 'template_redirect', $actions[0]['tag'] );
	}

	public function test_register_no_op_without_required_keys(): void {
		PreviewEndpointRegistrar::register( array() );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['filters'] );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['actions'] );

		PreviewEndpointRegistrar::register( array( 'post_type' => 'x' ) );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['filters'] );

		PreviewEndpointRegistrar::register( array( 'query_var' => 'x' ) );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['filters'] );
	}

	public function test_query_vars_filter_appends_configured_var(): void {
		PreviewEndpointRegistrar::register(
			array(
				'post_type' => 'cpt',
				'query_var' => 'my_var',
			)
		);

		$callable = $GLOBALS['pmdk_test_state']['filters'][0]['callable'];
		$result   = $callable( array( 'foo', 'bar' ) );
		$this->assertSame( array( 'foo', 'bar', 'my_var' ), $result );
	}

	public function test_query_vars_filter_tolerates_non_array_input(): void {
		PreviewEndpointRegistrar::register(
			array(
				'post_type' => 'cpt',
				'query_var' => 'my_var',
			)
		);
		$callable = $GLOBALS['pmdk_test_state']['filters'][0]['callable'];
		// A buggy upstream filter might pass non-array — helper must not
		// crash.
		$result = $callable( 'broken' );
		$this->assertSame( 'broken', $result );
	}
}
