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
	 * The kit's source uses `.js` files containing JSX (wp-scripts /
	 * Blocksify convention). Webpack handles this via babel-loader's
	 * preset-react; Vite's esbuild pre-bundler needs an explicit hint.
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
