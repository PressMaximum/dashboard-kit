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
		},
		module: {
			rules: [
				{
					test: /\.(?:js|mjs|jsx)$/,
					exclude: /node_modules/,
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
				filename: 'style.css',
			} ),
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
