<?php
/**
 * Preview-endpoint registrar — reusable factory for the
 * `?{query_var}={id}` pattern that powers the Surfaces / Templates
 * in-dashboard preview iframe. Wraps the `template_redirect` interceptor
 * pattern from the spike (`class-blocksify-dashboard-surfaces-spike.php`
 * lines 264-337) as a consumer-configurable static call.
 *
 * Why a single full-page HTML render?
 * The iframe needs the same `wp_head()` enqueue chain a public-site
 * request would fire, so theme + plugin CSS arrive naturally. Calling
 * `wp_head()` + `wp_footer()` in a custom template gives us that
 * fidelity without the chrome (admin bar suppressed, scripts limited to
 * what the previewed content needs).
 *
 * SPEC §5.8.
 *
 * @package PressMaximum\DashboardKit\REST
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\REST;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Stateless preview-endpoint registrar. Multiple consumers (Pro plugins
 * with their own CPTs, etc.) can call `register()` independently.
 */
final class PreviewEndpointRegistrar {

	/**
	 * Stateless utility — never instantiate.
	 */
	private function __construct() {
	}

	/**
	 * Register a preview endpoint for the configured CPT.
	 *
	 * @param array<string, mixed> $config Endpoint config.
	 *
	 * Recognised keys:
	 *   - `post_type`       (string, required) Post type to gate the
	 *                                          preview behind. Requests
	 *                                          for any other post type
	 *                                          404.
	 *   - `query_var`       (string, required) Query var to listen on,
	 *                                          e.g. `'customify_template_preview'`.
	 *                                          Requests with this var set
	 *                                          to a positive integer
	 *                                          trigger the preview render.
	 *   - `capability`      (string, optional) Default `'edit_posts'`.
	 *   - `shell_css`       (string, optional) Extra CSS injected into the
	 *                                          `<head>` of the preview
	 *                                          document. Use sparingly —
	 *                                          most styling should arrive
	 *                                          via the plugin enqueue chain.
	 *   - `body_class`      (string, optional) Extra class added to
	 *                                          `<body>` for consumer-side
	 *                                          targeting.
	 *   - `viewport_width`  (int, optional)    Default 1200. Sets the
	 *                                          `<meta name=viewport>` so
	 *                                          theme media queries
	 *                                          resolve consistently.
	 *   - `hide_admin_bar`  (bool, optional)   Default true.
	 *   - `noindex`         (bool, optional)   Default true (sends
	 *                                          `X-Robots-Tag: noindex`).
	 *
	 * @return void
	 */
	public static function register( array $config ): void {
		$post_type = isset( $config['post_type'] ) ? (string) $config['post_type'] : '';
		$query_var = isset( $config['query_var'] ) ? (string) $config['query_var'] : '';
		if ( '' === $post_type || '' === $query_var ) {
			return;
		}

		\add_filter(
			'query_vars',
			static function ( $vars ) use ( $query_var ) {
				if ( is_array( $vars ) ) {
					$vars[] = $query_var;
				}
				return $vars;
			}
		);

		\add_action(
			'template_redirect',
			static function () use ( $config, $post_type, $query_var ): void {
				self::maybeRender( $config, $post_type, $query_var );
			}
		);
	}

	/**
	 * Inspect the current request + render the preview document when the
	 * configured query var is present + valid. No-op otherwise so other
	 * `template_redirect` consumers keep running.
	 *
	 * @param array<string, mixed> $config    Endpoint config from `register()`.
	 * @param string               $post_type Bound post type.
	 * @param string               $query_var Bound query var.
	 *
	 * @return void
	 */
	private static function maybeRender( array $config, string $post_type, string $query_var ): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$raw = isset( $_GET[ $query_var ] ) ? $_GET[ $query_var ] : null;
		if ( null === $raw ) {
			return;
		}
		$id = is_scalar( $raw ) ? (int) $raw : 0;
		if ( $id <= 0 ) {
			return;
		}

		$capability = isset( $config['capability'] ) ? (string) $config['capability'] : 'edit_posts';
		if ( ! \current_user_can( $capability ) ) {
			\wp_die(
				\esc_html__( 'You are not allowed to view this preview.', 'default' ),
				'',
				array( 'response' => 403 )
			);
		}

		$post = \get_post( $id );
		if ( ! $post || $post_type !== $post->post_type ) {
			\wp_die(
				\esc_html__( 'Preview target not found.', 'default' ),
				'',
				array( 'response' => 404 )
			);
		}

		// Make `is_singular()` / `get_queried_object_id()` resolve to this
		// post — required by anything that scopes rendering to the queried
		// object (CSS pipelines, block dynamic renders, etc.).
		global $wp_query;
		$wp_query = new \WP_Query( // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			array(
				'p'         => $id,
				'post_type' => $post_type,
			)
		);
		if ( ! $wp_query->have_posts() ) {
			\wp_die(
				\esc_html__( 'Preview target not found.', 'default' ),
				'',
				array( 'response' => 404 )
			);
		}
		$wp_query->the_post();

		$hide_admin_bar = ! isset( $config['hide_admin_bar'] ) || (bool) $config['hide_admin_bar'];
		$noindex        = ! isset( $config['noindex'] ) || (bool) $config['noindex'];

		if ( $hide_admin_bar ) {
			\show_admin_bar( false );
			\remove_action( 'wp_head', '_admin_bar_bump_cb' );
			\remove_action( 'wp_footer', 'wp_admin_bar_render', 1000 );
			\remove_action( 'wp_head', 'wp_admin_bar_header' );
		}

		\nocache_headers();
		header( 'Content-Type: text/html; charset=' . \get_bloginfo( 'charset' ) );
		if ( $noindex ) {
			header( 'X-Robots-Tag: noindex, nofollow' );
		}

		$viewport_width = isset( $config['viewport_width'] ) ? (int) $config['viewport_width'] : 1200;
		$body_class     = isset( $config['body_class'] ) ? (string) $config['body_class'] : '';
		$shell_css      = isset( $config['shell_css'] ) ? (string) $config['shell_css'] : '';

		self::renderDocument( $viewport_width, $body_class, $shell_css );

		\wp_reset_postdata();
		exit;
	}

	/**
	 * Print the preview document. Kept separate from `maybeRender` so
	 * that unit-style tests can exercise the surrounding pre-conditions
	 * without having to capture `<!DOCTYPE>`-prefixed output.
	 *
	 * @param int    $viewport_width Sets `<meta name=viewport>`.
	 * @param string $body_class     Extra body class (sanitised by
	 *                               `body_class()`).
	 * @param string $shell_css      Inline CSS appended to `<head>`.
	 *
	 * @return void
	 */
	private static function renderDocument( int $viewport_width, string $body_class, string $shell_css ): void {
		$viewport_width = max( 320, min( 4096, $viewport_width ) );

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<!DOCTYPE html>' . "\n";
		echo '<html ';
		\language_attributes();
		echo ">\n<head>\n";
		echo '<meta charset="' . \esc_attr( \get_bloginfo( 'charset' ) ) . '">' . "\n";
		echo '<meta name="viewport" content="width=' . (int) $viewport_width . '">' . "\n";

		\wp_head();

		echo '<style id="pmdk-preview-shell">'
			. 'html,body{margin:0;background:#fff;}'
			. 'img,video,iframe{max-width:100%;height:auto;}'
			. '</style>' . "\n";

		if ( '' !== $shell_css ) {
			echo '<style id="pmdk-preview-shell-extra">' . $shell_css . '</style>' . "\n";
		}

		echo "</head>\n<body ";
		\body_class( $body_class );
		echo ">\n";

		echo \apply_filters( 'the_content', \get_the_content() );

		\wp_footer();

		echo "\n</body>\n</html>\n";
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
