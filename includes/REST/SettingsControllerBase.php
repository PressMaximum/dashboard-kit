<?php
/**
 * Abstract REST controller base — implements the schema-driven settings
 * lifecycle every dashboard consumer otherwise rewrites:
 *
 *   - GET   /{namespace}/{rest_base}   → merged saved + defaults (sanitized
 *                                        on read so legacy invalid values
 *                                        never reach the client).
 *   - POST  /{namespace}/{rest_base}   → sanitize against schema, persist,
 *                                        return final shape. Empty body
 *                                        resets to defaults.
 *
 * Subclasses provide:
 *   - {@see namespace()}        REST namespace (e.g. `'customify/v1'`).
 *   - {@see rest_base()}        REST base   (e.g. `'settings'`).
 *   - {@see capability()}       Capability gate (typically `'manage_options'`).
 *   - {@see option_name()}      WP option key the merged shape lives at.
 *   - {@see defaults()}         Default settings shape.
 *   - {@see sanitize($body)}    Coerce + validate. Default implementation
 *                               passes through `$body`; subclasses normally
 *                               delegate to a `SchemaBuilder::sanitize()`
 *                               call.
 *
 * SPEC §5.10 + §3.5 (settings save sequence).
 *
 * @package PressMaximum\DashboardKit\REST
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\REST;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Extend in the consumer plugin / theme + register routes inside
 * `rest_api_init`. The base class assumes the parent
 * `WP_REST_Controller` constructor accepts the namespace + rest_base via
 * the abstract methods below.
 */
abstract class SettingsControllerBase extends \WP_REST_Controller {

	/**
	 * Wire `$this->namespace` + `$this->rest_base` for
	 * `register_rest_route()`.
	 */
	public function __construct() {
		$this->namespace = $this->getNamespace();
		$this->rest_base = $this->getRestBase();
	}

	/**
	 * REST namespace, e.g. `'customify/v1'`.
	 */
	abstract protected function getNamespace(): string;

	/**
	 * REST base relative to the namespace, e.g. `'settings'`.
	 */
	abstract protected function getRestBase(): string;

	/**
	 * Capability gated by `permission_check()`.
	 */
	abstract protected function getCapability(): string;

	/**
	 * WP option key the settings shape lives at.
	 */
	abstract protected function getOptionName(): string;

	/**
	 * Default settings shape. Merged over saved values on every read.
	 *
	 * @return array<string, mixed>
	 */
	abstract protected function getDefaults(): array;

	/**
	 * Sanitize an incoming payload before save. Default implementation
	 * passes through unmodified — subclasses normally delegate to a
	 * {@see \PressMaximum\DashboardKit\Schema\SchemaBuilder::sanitize()}
	 * call or their own schema-aware coercion.
	 *
	 * @param array<string, mixed> $incoming Raw body.
	 * @return array<string, mixed>           Sanitized shape.
	 */
	protected function sanitizeIncoming( array $incoming ): array {
		return $incoming;
	}

	/**
	 * Register GET + POST on `/{namespace}/{rest_base}`. Call inside
	 * `rest_api_init`.
	 */
	public function register_routes() {
		\register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Capability gate. Used as the `permission_callback` for both routes.
	 *
	 * @return bool
	 */
	public function permission_check(): bool {
		return \current_user_can( $this->getCapability() );
	}

	/**
	 * GET handler — return merged saved + defaults, re-sanitised on read.
	 *
	 * @param \WP_REST_Request $request Unused but kept for the
	 *                                  `WP_REST_Controller` contract.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		return \rest_ensure_response( $this->readMerged() );
	}

	/**
	 * POST handler — sanitize → save → return final shape. Empty body
	 * (`{}`) resets to defaults.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 *
	 * @return \WP_REST_Response
	 */
	public function update_item( $request ) {
		$body = $request->get_json_params();
		if ( ! is_array( $body ) ) {
			$body = $request->get_params();
			if ( ! is_array( $body ) ) {
				$body = array();
			}
		}
		return \rest_ensure_response( $this->writeMerged( $body ) );
	}

	/**
	 * Read the persisted option deep-merged with defaults + re-sanitised.
	 *
	 * @return array<string, mixed>
	 */
	protected function readMerged(): array {
		$defaults = $this->getDefaults();
		$saved    = \get_option( $this->getOptionName(), array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}

		$merged = self::deepMerge( $defaults, $saved );
		return $this->sanitizeIncoming( $merged );
	}

	/**
	 * Sanitize an incoming body, persist, and return the saved shape.
	 *
	 * @param array<string, mixed> $incoming Raw POST body.
	 * @return array<string, mixed>          Sanitized + saved shape.
	 */
	protected function writeMerged( array $incoming ): array {
		$sanitized = $this->sanitizeIncoming( $incoming );
		\update_option( $this->getOptionName(), $sanitized, false );
		return $sanitized;
	}

	/**
	 * Two-level deep merge — array values from `$override` replace
	 * `$base` keys; nested arrays merge per-key one level deep. Beyond
	 * that the override array wins wholesale (the kit's settings shape
	 * is conventionally `{ group: { field: value } }` — two levels).
	 *
	 * @param array<string, mixed> $base
	 * @param array<string, mixed> $override
	 * @return array<string, mixed>
	 */
	private static function deepMerge( array $base, array $override ): array {
		$out = $base;
		foreach ( $override as $key => $value ) {
			if ( is_array( $value ) && isset( $base[ $key ] ) && is_array( $base[ $key ] ) ) {
				$out[ $key ] = array_replace( $base[ $key ], $value );
			} else {
				$out[ $key ] = $value;
			}
		}
		return $out;
	}
}
