<?php
/**
 * EditorIntegration — hook registration + emitted inline-script content
 * for force-fullscreen + back-button rewire. Verifies the closures
 * register on `enqueue_block_editor_assets` and that invoking them
 * (after stubbing `get_current_screen()`) yields the expected
 * `wp_add_inline_script` call.
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\Admin\EditorIntegration;

final class EditorIntegrationTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	/* ---------------- forceFullscreenMode ---------------- */

	public function test_force_fullscreen_mode_registers_action_on_enqueue_block_editor_assets(): void {
		EditorIntegration::forceFullscreenMode( array( 'post_type' => 'customify_template' ) );

		$actions = $GLOBALS['pmdk_test_state']['actions'];
		$this->assertCount( 1, $actions );
		$this->assertSame( 'enqueue_block_editor_assets', $actions[0]['tag'] );
		$this->assertIsCallable( $actions[0]['callable'] );
	}

	public function test_force_fullscreen_mode_inline_script_emitted_on_matching_screen(): void {
		EditorIntegration::forceFullscreenMode(
			array(
				'post_type' => 'customify_template',
				'handle'    => 'wp-editor',
			)
		);

		// Simulate WP firing the action on the correct screen.
		$GLOBALS['pmdk_test_state']['current_screen'] = (object) array(
			'post_type' => 'customify_template',
		);
		( $GLOBALS['pmdk_test_state']['actions'][0]['callable'] )();

		$inline = $GLOBALS['pmdk_test_state']['inline_scripts'];
		$this->assertCount( 1, $inline );
		$this->assertSame( 'wp-editor', $inline[0]['handle'] );
		$this->assertStringContainsString( 'core/preferences', $inline[0]['data'] );
		$this->assertStringContainsString( 'fullscreenMode', $inline[0]['data'] );
		$this->assertStringContainsString( 'wp.data.subscribe', $inline[0]['data'] );
	}

	public function test_force_fullscreen_mode_silent_on_other_screens(): void {
		EditorIntegration::forceFullscreenMode( array( 'post_type' => 'customify_template' ) );

		$GLOBALS['pmdk_test_state']['current_screen'] = (object) array(
			'post_type' => 'post',
		);
		( $GLOBALS['pmdk_test_state']['actions'][0]['callable'] )();
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['inline_scripts'] );
	}

	public function test_force_fullscreen_mode_no_op_without_post_type(): void {
		EditorIntegration::forceFullscreenMode( array() );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['actions'] );
	}

	/* ---------------- rewireBackButton ---------------- */

	public function test_rewire_back_button_registers_and_emits_capture_phase_intercept(): void {
		EditorIntegration::rewireBackButton(
			array(
				'post_type' => 'customify_template',
				'back_url'  => 'admin.php?page=customify#templates',
			)
		);

		$GLOBALS['pmdk_test_state']['current_screen'] = (object) array(
			'post_type' => 'customify_template',
		);
		( $GLOBALS['pmdk_test_state']['actions'][0]['callable'] )();

		$inline = $GLOBALS['pmdk_test_state']['inline_scripts'];
		$this->assertCount( 1, $inline );
		$data = $inline[0]['data'];
		$this->assertStringContainsString( '"admin.php?page=customify#templates"', $data );
		$this->assertStringContainsString( '".edit-post-fullscreen-mode-close"', $data );
		$this->assertStringContainsString( 'capture:true', $data );
		$this->assertStringContainsString( 'preventDefault', $data );
	}

	public function test_rewire_back_button_honors_custom_selector(): void {
		EditorIntegration::rewireBackButton(
			array(
				'post_type' => 'cpt',
				'back_url'  => 'https://example.test/back',
				'selector'  => '.my-close',
			)
		);
		$GLOBALS['pmdk_test_state']['current_screen'] = (object) array( 'post_type' => 'cpt' );
		( $GLOBALS['pmdk_test_state']['actions'][0]['callable'] )();

		$data = $GLOBALS['pmdk_test_state']['inline_scripts'][0]['data'];
		$this->assertStringContainsString( '".my-close"', $data );
	}

	public function test_rewire_back_button_requires_back_url(): void {
		EditorIntegration::rewireBackButton( array( 'post_type' => 'cpt' ) );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['actions'] );
	}
}
