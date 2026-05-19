<?php
/**
 * Composer autoload entry for `@pressmaximum/dashboard-kit` (PHP half).
 *
 * This file holds the kit's version constant — nothing else. Loading the
 * file via Composer's PSR-4 autoloader is a no-op side-effect-wise; it
 * exists so consumers can `class_exists( Bootstrap::class )` to detect
 * the kit's presence without triggering any registration.
 *
 * Hooks / action wiring lives in {@see Boot::register()}; helpers expose
 * their own static entry points. Per SPEC §4.2.
 *
 * @package PressMaximum\DashboardKit
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Kit version marker. Mirrors the JS `__KIT_VERSION__` export so both
 * halves move in lockstep (§3.4).
 */
final class Bootstrap {

	/**
	 * Current kit version. Bumped by release tooling (`npm version` script
	 * rewrites both package.json + this constant in one pass — lands with
	 * P9).
	 */
	public const VERSION = '0.0.0';

	/**
	 * Bootstrap is purely a namespace anchor — never instantiate.
	 */
	private function __construct() {
	}
}
