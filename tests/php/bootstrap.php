<?php
/**
 * PHPUnit bootstrap — defines minimal WP function + class stubs so the
 * kit's PHP classes can be exercised without a real WordPress install.
 *
 * Tests record hook registrations + script enqueues into `$GLOBALS`
 * arrays that each test resets via `setUp()`. This isn't a full
 * `WP_UnitTestCase` replacement — pure-logic + hook-wiring assertions
 * only. End-to-end REST / template_redirect tests are deferred until
 * the kit ships its own `wp-env` integration scaffold (post-1.0).
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

define( 'PMDK_TESTING', true );

// Composer autoload pulls in `PressMaximum\DashboardKit\*` from
// `includes/` via the PSR-4 entry in composer.json.
require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

/**
 * Shared call-recorder. Tests inspect this; each test resets it via
 * `pmdk_test_reset()`.
 *
 * @var array<string, array<int, mixed>>
 */
$GLOBALS['pmdk_test_state'] = array();

/**
 * Reset the call recorder. Tests call this from `setUp()`.
 */
function pmdk_test_reset(): void {
	$GLOBALS['pmdk_test_state'] = array(
		'actions'        => array(),  // [ [ tag, callable, priority ], ... ]
		'filters'        => array(),
		'menu_pages'     => array(),
		'submenu_pages'  => array(),
		'scripts'        => array(),
		'styles'         => array(),
		'inline_scripts' => array(),
		'translations'   => array(),
		'localizations'  => array(),
		'options'        => array(),  // option_name => stored value
		'rest_routes'    => array(),
		'inline_output'  => '',
	);
}
pmdk_test_reset();

// ---------------------------------------------------------------------
// WordPress function stubs. Each one is defined only if it isn't
// already available (lets the test runner coexist with a future
// real-WP scaffold).
// ---------------------------------------------------------------------

if ( ! function_exists( 'add_action' ) ) {
	function add_action( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		$GLOBALS['pmdk_test_state']['actions'][] = compact( 'tag', 'callable', 'priority', 'accepted_args' );
		return true;
	}
}

if ( ! function_exists( 'add_filter' ) ) {
	function add_filter( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		$GLOBALS['pmdk_test_state']['filters'][] = compact( 'tag', 'callable', 'priority', 'accepted_args' );
		return true;
	}
}

if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( $tag, $value ) {
		return $value;
	}
}

if ( ! function_exists( 'do_action' ) ) {
	function do_action( $tag, ...$args ) {
		// No-op; tests don't fire actions. Recorded for inspection.
		$GLOBALS['pmdk_test_state']['fired_actions'][] = array( $tag, $args );
	}
}

if ( ! function_exists( 'add_menu_page' ) ) {
	function add_menu_page( $page_title, $menu_title, $capability, $menu_slug, $callback, $icon, $position ) {
		$GLOBALS['pmdk_test_state']['menu_pages'][] = compact(
			'page_title',
			'menu_title',
			'capability',
			'menu_slug',
			'callback',
			'icon',
			'position'
		);
		return 'toplevel_page_' . $menu_slug;
	}
}

if ( ! function_exists( 'add_submenu_page' ) ) {
	function add_submenu_page( $parent_slug, $page_title, $menu_title, $capability, $menu_slug, $callback = '', $position = null ) {
		$GLOBALS['pmdk_test_state']['submenu_pages'][] = compact(
			'parent_slug',
			'page_title',
			'menu_title',
			'capability',
			'menu_slug',
			'callback',
			'position'
		);
		return $parent_slug . '_page_' . $menu_slug;
	}
}

if ( ! function_exists( 'wp_enqueue_script' ) ) {
	function wp_enqueue_script( $handle, $src = '', $deps = array(), $version = false, $in_footer = false ) {
		$GLOBALS['pmdk_test_state']['scripts'][] = compact( 'handle', 'src', 'deps', 'version', 'in_footer' );
	}
}

if ( ! function_exists( 'wp_enqueue_style' ) ) {
	function wp_enqueue_style( $handle, $src = '', $deps = array(), $version = false ) {
		$GLOBALS['pmdk_test_state']['styles'][] = compact( 'handle', 'src', 'deps', 'version' );
	}
}

if ( ! function_exists( 'wp_set_script_translations' ) ) {
	function wp_set_script_translations( $handle, $domain ) {
		$GLOBALS['pmdk_test_state']['translations'][] = compact( 'handle', 'domain' );
		return true;
	}
}

if ( ! function_exists( 'wp_localize_script' ) ) {
	function wp_localize_script( $handle, $object_name, $data ) {
		$GLOBALS['pmdk_test_state']['localizations'][] = compact( 'handle', 'object_name', 'data' );
		return true;
	}
}

if ( ! function_exists( 'wp_add_inline_script' ) ) {
	function wp_add_inline_script( $handle, $data, $position = 'after' ) {
		$GLOBALS['pmdk_test_state']['inline_scripts'][] = compact( 'handle', 'data', 'position' );
		return true;
	}
}

if ( ! function_exists( 'wp_json_encode' ) ) {
	function wp_json_encode( $data, $options = 0, $depth = 512 ) {
		return json_encode( $data, $options, $depth );
	}
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $str ) {
		return is_string( $str ) ? trim( strip_tags( $str ) ) : '';
	}
}

if ( ! function_exists( 'esc_html__' ) ) {
	function esc_html__( $text, $domain = 'default' ) {
		return $text;
	}
}

if ( ! function_exists( 'esc_attr' ) ) {
	function esc_attr( $text ) {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
}

if ( ! function_exists( 'current_user_can' ) ) {
	function current_user_can( $cap ) {
		return $GLOBALS['pmdk_test_state']['current_user_can'] ?? true;
	}
}

if ( ! function_exists( 'get_option' ) ) {
	function get_option( $name, $default = false ) {
		return $GLOBALS['pmdk_test_state']['options'][ $name ] ?? $default;
	}
}

if ( ! function_exists( 'update_option' ) ) {
	function update_option( $name, $value, $autoload = null ) {
		$GLOBALS['pmdk_test_state']['options'][ $name ] = $value;
		return true;
	}
}

if ( ! function_exists( 'rest_ensure_response' ) ) {
	function rest_ensure_response( $value ) {
		return $value;
	}
}

if ( ! function_exists( 'register_rest_route' ) ) {
	function register_rest_route( $namespace, $route, $args = array() ) {
		$GLOBALS['pmdk_test_state']['rest_routes'][] = compact( 'namespace', 'route', 'args' );
		return true;
	}
}

if ( ! class_exists( 'WP_REST_Server' ) ) {
	class WP_REST_Server {
		const READABLE  = 'GET';
		const CREATABLE = 'POST';
	}
}

if ( ! class_exists( 'WP_REST_Controller' ) ) {
	abstract class WP_REST_Controller {
		protected $namespace = '';
		protected $rest_base = '';

		public function register_routes() {
		}

		public function get_public_item_schema() {
			return array();
		}
	}
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
	class WP_REST_Request {
		private $params = array();
		private $json_params = null;

		public function set_json_params( $data ): void {
			$this->json_params = $data;
		}

		public function set_params( array $data ): void {
			$this->params = $data;
		}

		public function get_json_params() {
			return $this->json_params;
		}

		public function get_params() {
			return $this->params;
		}
	}
}

// `__return_null` is referenced by `MenuHelpers::addHashSubmenu`.
if ( ! function_exists( '__return_null' ) ) {
	function __return_null() {
		return null;
	}
}

// Screen stub for `Boot` + `EditorIntegration` post-type gating. Tests
// set `$GLOBALS['pmdk_test_state']['current_screen']` to a stdClass
// before invoking the registered callable.
if ( ! function_exists( 'get_current_screen' ) ) {
	function get_current_screen() {
		return $GLOBALS['pmdk_test_state']['current_screen'] ?? null;
	}
}
