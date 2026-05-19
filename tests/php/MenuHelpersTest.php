<?php
/**
 * MenuHelpers — hash-submenu registration + parent-mirror relabel +
 * inline submenu-active-sync script emission.
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\Admin\MenuHelpers;

final class MenuHelpersTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	/* ---------------- addHashSubmenu ---------------- */

	public function test_add_hash_submenu_calls_add_submenu_page_with_hash_prefixed_slug(): void {
		MenuHelpers::addHashSubmenu(
			array(
				'parent_slug' => 'customify',
				'label'       => 'Templates',
				'menu_label'  => 'Templates',
				'hash'        => '#templates',
			)
		);

		$pages = $GLOBALS['pmdk_test_state']['submenu_pages'];
		$this->assertCount( 1, $pages );
		$this->assertSame( 'customify', $pages[0]['parent_slug'] );
		$this->assertSame( 'customify#templates', $pages[0]['menu_slug'] );
		$this->assertSame( 'manage_options', $pages[0]['capability'] );
		$this->assertSame( 'Templates', $pages[0]['page_title'] );
	}

	public function test_add_hash_submenu_prefixes_hash_when_caller_omits_pound(): void {
		MenuHelpers::addHashSubmenu(
			array(
				'parent_slug' => 'customify',
				'menu_label'  => 'Templates',
				'hash'        => 'templates',
			)
		);
		$pages = $GLOBALS['pmdk_test_state']['submenu_pages'];
		$this->assertSame( 'customify#templates', $pages[0]['menu_slug'] );
	}

	public function test_add_hash_submenu_returns_false_when_required_keys_missing(): void {
		$this->assertFalse( MenuHelpers::addHashSubmenu( array() ) );
		$this->assertSame( array(), $GLOBALS['pmdk_test_state']['submenu_pages'] );

		$this->assertFalse(
			MenuHelpers::addHashSubmenu( array( 'parent_slug' => 'x' ) )
		);
		$this->assertFalse(
			MenuHelpers::addHashSubmenu( array( 'hash' => '#x' ) )
		);
	}

	/* ---------------- relabelParentMirror ---------------- */

	public function test_relabel_parent_mirror_rewrites_submenu_label_when_present(): void {
		global $submenu;
		$submenu = array(
			'customify' => array(
				0 => array( 'Customify', 'manage_options', 'customify' ),
				1 => array( 'Templates', 'manage_options', 'customify#templates' ),
			),
		);

		$this->assertTrue(
			MenuHelpers::relabelParentMirror(
				array(
					'parent_slug' => 'customify',
					'replacement' => 'Welcome',
				)
			)
		);
		$this->assertSame( 'Welcome', $submenu['customify'][0][0] );

		// Cleanup.
		$submenu = array();
	}

	public function test_relabel_parent_mirror_no_op_when_submenu_missing(): void {
		global $submenu;
		$submenu = array();
		$this->assertFalse(
			MenuHelpers::relabelParentMirror(
				array(
					'parent_slug' => 'customify',
					'replacement' => 'Welcome',
				)
			)
		);
	}

	/* ---------------- printSubmenuActiveSync ---------------- */

	public function test_print_submenu_active_sync_emits_inline_script(): void {
		ob_start();
		MenuHelpers::printSubmenuActiveSync(
			array(
				'menu_id' => 'toplevel_page_customify',
				'hash'    => '#templates',
			)
		);
		$out = ob_get_clean();

		$this->assertStringContainsString( '<script>', $out );
		$this->assertStringContainsString( '"toplevel_page_customify"', $out );
		$this->assertStringContainsString( '"#templates"', $out );
		$this->assertStringContainsString( 'addEventListener("hashchange"', $out );
		$this->assertStringContainsString( 'wp-first-item', $out );
	}

	public function test_print_submenu_active_sync_prefixes_hash_pound(): void {
		ob_start();
		MenuHelpers::printSubmenuActiveSync(
			array(
				'menu_id' => 'toplevel_page_x',
				'hash'    => 'templates',
			)
		);
		$out = ob_get_clean();
		$this->assertStringContainsString( '"#templates"', $out );
	}

	public function test_print_submenu_active_sync_no_op_without_menu_id(): void {
		ob_start();
		MenuHelpers::printSubmenuActiveSync( array() );
		$out = ob_get_clean();
		$this->assertSame( '', $out );
	}
}
