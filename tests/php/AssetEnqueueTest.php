<?php
/**
 * AssetEnqueue — wp_enqueue_script + wp_localize_script + style enqueue
 * boilerplate. Verifies the right calls land for the right hook +
 * config combinations.
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\Admin\AssetEnqueue;

final class AssetEnqueueTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	public function test_enqueues_script_with_handle_and_src(): void {
		$ok = AssetEnqueue::enqueueOn(
			'toplevel_page_customify',
			array(
				'handle' => 'customify-dashboard',
				'src_js' => 'https://example.test/build/dashboard.js',
			)
		);
		$this->assertTrue( $ok );

		$scripts = $GLOBALS['pmdk_test_state']['scripts'];
		$this->assertCount( 1, $scripts );
		$this->assertSame( 'customify-dashboard', $scripts[0]['handle'] );
		$this->assertSame( 'https://example.test/build/dashboard.js', $scripts[0]['src'] );
		$this->assertTrue( $scripts[0]['in_footer'] );
	}

	public function test_short_circuits_when_page_hook_mismatches(): void {
		$ok = AssetEnqueue::enqueueOn(
			'edit.php',
			array(
				'page_hook' => 'toplevel_page_customify',
				'handle'    => 'customify-dashboard',
				'src_js'    => 'https://example.test/x.js',
			)
		);
		$this->assertFalse( $ok );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['scripts'] );
	}

	public function test_runs_when_page_hook_matches(): void {
		$ok = AssetEnqueue::enqueueOn(
			'toplevel_page_customify',
			array(
				'page_hook' => 'toplevel_page_customify',
				'handle'    => 'customify-dashboard',
				'src_js'    => 'https://example.test/x.js',
			)
		);
		$this->assertTrue( $ok );
		$this->assertCount( 1, $GLOBALS['pmdk_test_state']['scripts'] );
	}

	public function test_required_keys_missing_returns_false(): void {
		$this->assertFalse(
			AssetEnqueue::enqueueOn( 'h', array( 'handle' => '' ) )
		);
		$this->assertFalse(
			AssetEnqueue::enqueueOn(
				'h',
				array(
					'handle' => 'x',
					'src_js' => '',
				)
			)
		);
	}

	public function test_localizes_boot_data_when_boot_global_set(): void {
		AssetEnqueue::enqueueOn(
			'h',
			array(
				'handle'      => 'x',
				'src_js'      => 'x.js',
				'boot_global' => 'customifyDashboard',
				'boot_data'   => array( 'foo' => 'bar' ),
			)
		);
		$loc = $GLOBALS['pmdk_test_state']['localizations'];
		$this->assertCount( 1, $loc );
		$this->assertSame( 'customifyDashboard', $loc[0]['object_name'] );
		$this->assertSame( array( 'foo' => 'bar' ), $loc[0]['data'] );
	}

	public function test_boot_data_callable_is_invoked_lazily(): void {
		$counter = 0;
		AssetEnqueue::enqueueOn(
			'h',
			array(
				'handle'      => 'x',
				'src_js'      => 'x.js',
				'boot_global' => 'g',
				'boot_data'   => function () use ( &$counter ) {
					$counter++;
					return array( 'n' => $counter );
				},
			)
		);
		$loc = $GLOBALS['pmdk_test_state']['localizations'];
		$this->assertSame( array( 'n' => 1 ), $loc[0]['data'] );
		$this->assertSame( 1, $counter );
	}

	public function test_sets_script_translations_when_text_domain_set(): void {
		AssetEnqueue::enqueueOn(
			'h',
			array(
				'handle'      => 'x',
				'src_js'      => 'x.js',
				'text_domain' => 'customify',
			)
		);
		$trans = $GLOBALS['pmdk_test_state']['translations'];
		$this->assertCount( 1, $trans );
		$this->assertSame( 'customify', $trans[0]['domain'] );
	}

	public function test_enqueues_style_when_src_css_provided(): void {
		AssetEnqueue::enqueueOn(
			'h',
			array(
				'handle'  => 'x',
				'src_js'  => 'x.js',
				'src_css' => 'x.css',
			)
		);
		$styles = $GLOBALS['pmdk_test_state']['styles'];
		$this->assertCount( 1, $styles );
		$this->assertSame( 'x.css', $styles[0]['src'] );
		$this->assertSame( array( 'wp-components' ), $styles[0]['deps'] );
	}

	public function test_style_deps_override(): void {
		AssetEnqueue::enqueueOn(
			'h',
			array(
				'handle'     => 'x',
				'src_js'     => 'x.js',
				'src_css'    => 'x.css',
				'style_deps' => array( 'wp-components', 'wp-dataviews' ),
			)
		);
		$this->assertSame(
			array( 'wp-components', 'wp-dataviews' ),
			$GLOBALS['pmdk_test_state']['styles'][0]['deps']
		);
	}
}
