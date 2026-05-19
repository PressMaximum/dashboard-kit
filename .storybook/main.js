/**
 * Storybook config — Vite-based runner.
 *
 * Story import convention:
 *
 *   Most stories import the component under test via the source-tree
 *   path WITH an explicit `.jsx` extension, e.g.
 *
 *     import TabStrip from '../src/core/TabStrip.jsx';
 *
 *   That's because Vite's import-analysis is stricter than webpack's
 *   (which has `resolve.fullySpecified: false`) and would otherwise
 *   need a custom resolver to handle extension-less or directory-index
 *   imports. The consumer-facing pattern is
 *   `import { TabStrip } from '@pressmaximum/dashboard-kit'`, served by
 *   `src/index.mjs`'s extension-less re-exports — the kit's webpack
 *   build resolves those fine, but Storybook is a separate environment
 *   and stories don't go through that build.
 *
 *   The validation stories (e.g. PageWrapper.dataviews.stories.jsx)
 *   import from `'../src/index.mjs'` instead — that source-tree
 *   equivalent of the public package entry doubles the story as a
 *   regression check on the public export tree (renaming a kit export
 *   would break the story build).
 */
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
