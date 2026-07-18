/**
 * Webpack config for @pressmaximum/dashboard-kit (library distro).
 *
 * Constraints (SPEC §7, handoff risk register):
 *  - ESM output (consumers re-bundle with wp-scripts and tree-shake).
 *  - Two entry surfaces: `index` (core) + `datasets/index` (DataViews,
 *    opt-in heavy peer). Datasets entry stays separate so consumers that
 *    don't import it never pull @wordpress/dataviews into their bundle.
 *  - @wordpress/* + react + react-dom are externalized — WordPress already
 *    ships them on window.wp.*; double-bundling would inflate consumers.
 *  - CSS is extracted with sideEffects:true on the rule so that webpack's
 *    tree-shake keeps `import './editor.css'` statements alive (the
 *    Surfaces spike hit a bug where DataViews's "sideEffects": false in
 *    its package.json caused webpack to strip CSS imports — explicitly
 *    overriding on our own rule prevents that).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const WP_EXTERNALS = [
	'@wordpress/components',
	'@wordpress/data',
	'@wordpress/dataviews',
	'@wordpress/element',
	'@wordpress/hooks',
	'@wordpress/html-entities',
	'@wordpress/icons',
	'@wordpress/url',
	'react',
	'react-dom',
];

const externalsAsModules = Object.fromEntries(
	WP_EXTERNALS.map( ( name ) => [ name, `module ${ name }` ] )
);

/**
 * Webpack always emits a JS chunk for an entry, even a pure-CSS one. The
 * `themes/app` entry exists only to have MiniCssExtract produce
 * `build/themes/app.css`; this plugin deletes the meaningless JS stub (and its
 * sourcemap) so nothing un-exported ships in `build/`.
 */
class RemoveCssEntryJsStubPlugin {
	constructor( stubs ) {
		this.stubs = stubs;
	}
	apply( compiler ) {
		compiler.hooks.compilation.tap(
			'RemoveCssEntryJsStubPlugin',
			( compilation ) => {
				compilation.hooks.processAssets.tap(
					{
						name: 'RemoveCssEntryJsStubPlugin',
						stage: compiler.webpack.Compilation
							.PROCESS_ASSETS_STAGE_SUMMARIZE,
					},
					() => {
						for ( const name of this.stubs ) {
							for ( const asset of [ name, `${ name }.map` ] ) {
								if ( compilation.getAsset( asset ) ) {
									compilation.deleteAsset( asset );
								}
							}
						}
					}
				);
			}
		);
	}
}

export default ( env, argv ) => {
	const isProd = argv.mode === 'production';

	return {
		mode: isProd ? 'production' : 'development',
		devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
		entry: {
			index: path.resolve( __dirname, 'src/index.mjs' ),
			'datasets/index': path.resolve(
				__dirname,
				'src/datasets/index.mjs'
			),
			'editor-helpers/index': path.resolve(
				__dirname,
				'src/editor-helpers/index.mjs'
			),
			// KIT-P3 headless behavior modules (combobox, tablist nav). No CSS
			// import here on purpose — the primitive CSS ships in the separate
			// `primitives/style` entry below, so this stays a pure-JS chunk and
			// its MiniCssExtract name can never collide with `primitives/style.css`.
			'primitives/index': path.resolve(
				__dirname,
				'src/primitives/index.mjs'
			),
			// KIT-P3 data-table component (<PMDKDataTable>). Bundles
			// @tanstack/react-table + @dnd-kit/* (NOT externalized) so consumers
			// import `@pressmaximum/dashboard-kit/table` with zero extra install;
			// react/react-dom/@wordpress/* stay external. Opt-in + separate from
			// core, so Blocksify/Customify never pull this weight.
			'table/index': path.resolve( __dirname, 'src/table/index.mjs' ),
			// KIT-P3 module card (<PMDKModuleCard>, K-018). Own entry (mirrors
			// `table/`) so the React-free contract of `primitives/` holds; zero
			// third-party deps — react stays external.
			'module-card/index': path.resolve(
				__dirname,
				'src/module-card/index.mjs'
			),
			// Opt-in app theme — pure-CSS entry. Emits `build/themes/app.css`
			// only; the JS stub webpack generates for a CSS entry is dropped
			// by RemoveCssEntryJsStubPlugin below (no JS export path exists
			// for the theme — consumers import the .css directly).
			'themes/app': path.resolve( __dirname, 'src/themes/app.css' ),
			// Opt-in primitives stylesheet — pure-CSS entry (slices 1 + 2).
			// Emits `build/primitives/style.css`; JS stub dropped below.
			'primitives/style': path.resolve(
				__dirname,
				'src/primitives/style.css'
			),
		},
		output: {
			path: path.resolve( __dirname, 'build' ),
			filename: '[name].mjs',
			library: { type: 'module' },
			module: true,
			chunkFormat: 'module',
			environment: { module: true, dynamicImport: true },
			clean: true,
		},
		experiments: {
			outputModule: true,
		},
		externalsType: 'module',
		externals: externalsAsModules,
		resolve: {
			extensions: [ '.mjs', '.js', '.jsx' ],
			// Webpack defaults to strict ESM resolution when the entry is
			// `.mjs` / `"type": "module"`, which forbids directory imports
			// like `./layouts/PageWrapper` (it'd require `/index.js`).
			// The kit's source uses `.js` files with directory-index
			// conventions; relax so internal imports resolve naturally.
			fullySpecified: false,
		},
		module: {
			rules: [
				{
					test: /\.(?:js|mjs|jsx)$/,
					exclude: /node_modules/,
					// Inherit the top-level `resolve.fullySpecified: false`
					// per-rule so directory-index imports inside .mjs entries
					// still resolve naturally.
					resolve: { fullySpecified: false },
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								[
									'@babel/preset-env',
									{ targets: { esmodules: true } },
								],
								[
									'@babel/preset-react',
									{ runtime: 'automatic' },
								],
							],
							cacheDirectory: true,
						},
					},
				},
				{
					test: /\.css$/,
					sideEffects: true,
					use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin( {
				// Per-entry CSS output:
				//   `index`              → `build/style.css`            (back-compat
				//                                                       with `@pressmaximum/dashboard-kit/style.css`).
				//   `datasets/index`     → `build/datasets/style.css`   (only ships
				//                                                       when consumer imports the datasets sub-entry,
				//                                                       so theme-only consumers don't pay for
				//                                                       EntityListPage / EntityPreviewFrame CSS).
				//   `editor-helpers/...` → `build/editor-helpers/style.css`
				//                                                       (currently empty — the editor helpers
				//                                                       are pure runtime JS, no CSS).
				filename: ( { chunk } ) => {
					if ( chunk.name === 'index' ) {
						return 'style.css';
					}
					// The theme entry ships as a named file (`themes/app.css`),
					// not the `<dir>/style.css` convention, so consumers import
					// a self-describing path.
					if ( chunk.name === 'themes/app' ) {
						return 'themes/app.css';
					}
					// The primitives sheet ships as a named file too, matching
					// its self-describing export `primitives/style.css`.
					if ( chunk.name === 'primitives/style' ) {
						return 'primitives/style.css';
					}
					const dir = chunk.name.replace( /\/index$/, '' );
					return `${ dir }/style.css`;
				},
			} ),
			new RemoveCssEntryJsStubPlugin( [
				'themes/app.mjs',
				'primitives/style.mjs',
			] ),
		],
		optimization: {
			minimize: isProd,
			sideEffects: true,
			usedExports: true,
		},
		performance: {
			hints: false,
		},
		stats: 'minimal',
	};
};
