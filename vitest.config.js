import { defineConfig } from 'vitest/config';

/**
 * `src/**` JSX lives in `.jsx` files (P1.5 rename — modules with JSX
 * carry the `.jsx` extension; pure-JS utilities stay `.js`). Vite's
 * default loader picks up `.jsx` automatically, so no extra esbuild
 * configuration is needed here.
 */
export default defineConfig( {
	test: {
		environment: 'jsdom',
		globals: true,
		include: [
			'tests/unit/**/*.{test,spec}.{js,mjs,jsx}',
			'tests/integration/**/*.{test,spec}.{js,mjs,jsx}',
			'src/**/*.{test,spec}.{js,mjs,jsx}',
		],
		exclude: [
			'node_modules',
			'build',
			'storybook-static',
			'_ref',
			'packages/test-consumer',
		],
		coverage: {
			provider: 'v8',
			reporter: [ 'text', 'lcov' ],
			include: [ 'src/**/*.{js,mjs,jsx}' ],
		},
	},
} );
