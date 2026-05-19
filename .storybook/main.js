/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
	stories: [
		'../stories/**/*.mdx',
		'../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
	],
	addons: [],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
	core: {
		disableTelemetry: true,
	},
	/**
	 * Most kit modules with JSX live in `.jsx` files (P1.5 + P2 rename),
	 * but a handful of consumer-facing surfaces (test-consumer entry,
	 * some stories) still write JSX in `.js` — wp-scripts / Blocksify
	 * convention. Vite's esbuild pre-bundler defaults to plain-JS for
	 * `.js`, so tell it to use the JSX loader for any `.js` / `.jsx`
	 * file under `src/**` (and overshoot the loader map so dep-bundling
	 * doesn't choke either). Harmless on real `.jsx` files.
	 */
	async viteFinal( config ) {
		return {
			...config,
			optimizeDeps: {
				...( config.optimizeDeps || {} ),
				esbuildOptions: {
					...( config.optimizeDeps?.esbuildOptions || {} ),
					loader: {
						...( config.optimizeDeps?.esbuildOptions?.loader || {} ),
						'.js': 'jsx',
					},
				},
			},
			esbuild: {
				...( config.esbuild || {} ),
				loader: 'jsx',
				include: /\/src\/.*\.(?:js|jsx)$/,
			},
		};
	},
};
