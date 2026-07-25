<?php
/**
 * Admin page + asset enqueue sample for a @pressmaximum/dashboard-kit consumer.
 *
 * COPY THIS FILE into your plugin and rename the class/constants. It is a
 * template, not kit runtime — nothing autoloads it and the kit never calls it.
 *
 * What it demonstrates, in the order the guide explains it
 * (see docs/ADOPTING.md §3):
 *
 *   1. One top-level menu whose submenu items are HASH deep-links into the same
 *      SPA page, so the whole dashboard is a single PHP page load.
 *   2. Manifest-driven enqueue: deps + cache-busting version come from the
 *      `*.asset.php` that `@wordpress/scripts` emits, so `react`,
 *      `react-jsx-runtime`, `wp-components`, … are never hand-maintained.
 *   3. The two-stylesheet order — the kit's extracted base first, your own
 *      bundle (tokens/bridge/product chrome) second.
 *   4. The boot payload as an inline script BEFORE the bundle, read by
 *      `mountDashboard({ bootGlobal })`.
 *   5. The mount markup: an outer theme/token scope wrapping the inner
 *      `.pmdk-dashboard` chassis.
 *
 * Requires PHP 7.4+ (matches the kit's composer package).
 *
 * @package YourPlugin\Admin
 */

declare(strict_types=1);

namespace YourPlugin\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the dashboard admin page and enqueues its assets.
 */
final class AdminPage {

	/**
	 * Admin page slug. Also the `page=` query arg every submenu hash hangs off.
	 */
	private const SLUG = 'your-plugin';

	/**
	 * Capability gating the whole dashboard. Use your own, not `manage_options`,
	 * unless the dashboard really is administrator-only.
	 */
	private const CAPABILITY = 'manage_options';

	/**
	 * Script/style handle base and the `window` key holding the boot payload.
	 * `BOOT_GLOBAL` must equal the `bootGlobal` passed to `mountDashboard()`.
	 */
	private const HANDLE      = 'your-plugin-admin';
	private const BOOT_GLOBAL = 'yourPluginDashboard';

	/**
	 * Build output, relative to the plugin root. `npm run build` (wp-scripts)
	 * writes `admin.js`, `admin.asset.php`, `admin.css` and — when your entry
	 * imports the kit's stylesheet — `style-admin.css` here.
	 */
	private const DIST_REL = 'build';

	/**
	 * Page hook suffix, captured at registration so the enqueue callback can
	 * bail on every other admin screen.
	 *
	 * @var string
	 */
	private static string $hook_suffix = '';

	/**
	 * Wire the WordPress hooks. Call once from your plugin bootstrap.
	 */
	public static function register(): void {
		add_action( 'admin_menu', array( self::class, 'registerMenu' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueueAssets' ) );
	}

	/**
	 * Register the top-level page plus one submenu entry per SPA route.
	 *
	 * The first submenu item re-uses the parent slug so the default landing
	 * renders the app (which then resolves the hash itself). Every other item is
	 * a hash deep-link on the same page slug — WordPress highlights the parent,
	 * and the kit's `registerSubmenuActive()` helper syncs the active child on
	 * the client. Keep these ids identical to your `baseTabs` / `baseRoutes` keys.
	 */
	public static function registerMenu(): void {
		self::$hook_suffix = (string) add_menu_page(
			__( 'Your Plugin', 'your-plugin' ),
			__( 'Your Plugin', 'your-plugin' ),
			self::CAPABILITY,
			self::SLUG,
			array( self::class, 'renderRoot' ),
			'dashicons-screenoptions',
			58
		);

		$routes = array(
			'welcome'  => __( 'Welcome', 'your-plugin' ),
			'modules'  => __( 'Modules', 'your-plugin' ),
			'settings' => __( 'Settings', 'your-plugin' ),
		);

		$first = true;
		foreach ( $routes as $route => $label ) {
			$menu_slug = $first
				? self::SLUG
				: 'admin.php?page=' . self::SLUG . '#' . $route;

			add_submenu_page(
				self::SLUG,
				$label,
				$label,
				self::CAPABILITY,
				$menu_slug,
				$first ? array( self::class, 'renderRoot' ) : ''
			);

			$first = false;
		}
	}

	/**
	 * Print the SPA mount node.
	 *
	 * Two nested elements on purpose:
	 *
	 *   - the OUTER element owns theming state — the optional `.pmdk-theme-app`
	 *     scope class, your own token-scope class, and any `data-*` attribute
	 *     your bridge keys a dark preset off. The kit reads
	 *     `data-pmdk-color-scheme="dark"` on the same element that carries
	 *     `.pmdk-theme-app`; a product-owned attribute (as below) is fine too as
	 *     long as your bridge CSS selects on it.
	 *   - the INNER element is the kit chassis. Every `.pmdk-*` primitive and
	 *     data-table rule is scoped under `.pmdk-dashboard`, and its `id` is what
	 *     `mountDashboard({ rootEl })` resolves.
	 *
	 * The spinner is replaced on mount; it prevents a blank screen on slow loads.
	 */
	public static function renderRoot(): void {
		printf(
			'<div class="your-plugin-scope pmdk-theme-app" data-pmdk-color-scheme="light">'
				. '<div class="your-plugin-admin pmdk-dashboard" id="%1$s">%2$s</div>'
				. '</div>',
			esc_attr( self::SLUG . '-root' ),
			'<div role="status" aria-live="polite"><span class="spinner is-active" style="float:none"></span> '
				. esc_html__( 'Loading…', 'your-plugin' )
				. '</div>'
		);
	}

	/**
	 * Enqueue the dashboard bundle, its styles and the boot payload.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 */
	public static function enqueueAssets( string $hook_suffix ): void {
		if ( '' === self::$hook_suffix || self::$hook_suffix !== $hook_suffix ) {
			return;
		}

		$base_dir = plugin_dir_path( YOUR_PLUGIN_FILE ) . self::DIST_REL;
		$base_url = plugins_url( self::DIST_REL, YOUR_PLUGIN_FILE );
		$js_file  = $base_dir . '/admin.js';

		if ( ! file_exists( $js_file ) ) {
			return; // Not built yet — stay silent instead of enqueueing a 404.
		}

		/*
		 * wp-scripts writes the real dependency list here. Because the kit
		 * externalizes `react/jsx-runtime` (K-019), the handle `react-jsx-runtime`
		 * shows up in this array automatically — do not hand-maintain deps, and do
		 * not remove that handle.
		 */
		$asset    = array(
			'dependencies' => array( 'react', 'react-dom', 'react-jsx-runtime', 'wp-components', 'wp-element', 'wp-hooks', 'wp-i18n' ),
			'version'      => (string) filemtime( $js_file ),
		);
		$manifest = $base_dir . '/admin.asset.php';
		if ( file_exists( $manifest ) ) {
			$loaded = include $manifest;
			if ( is_array( $loaded ) ) {
				$asset = $loaded;
			}
		}

		wp_enqueue_script(
			self::HANDLE,
			$base_url . '/admin.js',
			isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array(),
			isset( $asset['version'] ) ? (string) $asset['version'] : false,
			true
		);

		/*
		 * Style order matters (docs/ADOPTING.md §4):
		 *   1. `style-admin.css` — the chunk wp-scripts extracts from your entry's
		 *      `import '@pressmaximum/dashboard-kit/style.css'` (plus the opt-in
		 *      theme + primitives sheets, if you import them). Kit base FIRST.
		 *   2. `admin.css` — your own SCSS/CSS entry: brand bridge then product
		 *      chrome. It must load AFTER, so its `--pmdk-*` overrides win.
		 * Declaring #1 as a dependency of #2 makes the order explicit rather than
		 * relying on enqueue sequence.
		 */
		$kit_css  = $base_dir . '/style-admin.css';
		$css_deps = array();
		if ( file_exists( $kit_css ) ) {
			wp_enqueue_style(
				self::HANDLE . '-kit',
				$base_url . '/style-admin.css',
				array(),
				(string) filemtime( $kit_css )
			);
			$css_deps[] = self::HANDLE . '-kit';
		}

		// The kit's core components render @wordpress/components UI, whose styles
		// are a separate core stylesheet that is NOT enqueued for you.
		wp_enqueue_style( 'wp-components' );

		$css_file = $base_dir . '/admin.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				self::HANDLE,
				$base_url . '/admin.css',
				$css_deps,
				(string) filemtime( $css_file )
			);
			// wp-scripts emits `*-rtl.css` variants; let WP swap them on RTL locales.
			wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
		}

		/*
		 * Boot payload. `'before'` matters: the bundle reads
		 * `window[ bootGlobal ]` during `mountDashboard()`, so the global has to
		 * exist by the time the bundle runs. Ship only what the UI needs — this is
		 * printed into the page.
		 */
		wp_add_inline_script(
			self::HANDLE,
			'window.' . self::BOOT_GLOBAL . ' = ' . wp_json_encode( self::bootConfig() ) . ';',
			'before'
		);

		wp_set_script_translations(
			self::HANDLE,
			'your-plugin',
			plugin_dir_path( YOUR_PLUGIN_FILE ) . 'languages'
		);
	}

	/**
	 * Boot payload consumed by `mountDashboard({ bootGlobal })`.
	 *
	 * Keep it small and serialisable. `nonce` + `restBase` cover the usual
	 * fetches; `capabilities` lets the SPA hide what the user cannot do (never
	 * the only check — the REST controller must re-verify).
	 *
	 * @return array<string, mixed>
	 */
	private static function bootConfig(): array {
		return array(
			'version'      => defined( 'YOUR_PLUGIN_VERSION' ) ? YOUR_PLUGIN_VERSION : '0.0.0',
			'restBase'     => esc_url_raw( rest_url( 'your-plugin/v1' ) ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),
			'adminUrl'     => esc_url_raw( admin_url( 'admin.php?page=' . self::SLUG ) ),
			'capabilities' => array(
				'manage' => current_user_can( self::CAPABILITY ),
			),
		);
	}
}
