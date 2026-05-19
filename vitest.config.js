import { defineConfig } from 'vitest/config';

/**
 * `src/**` JSX lives in `.jsx` files (P1.5 rename — modules with JSX
 * carry the `.jsx` extension; pure-JS utilities stay `.js`). Vite's
 * default loader picks up `.jsx`, but defaults to the classic JSX
 * runtime which requires `React` in scope. The kit follows wp-scripts
 * convention with the automatic runtime (no explicit `import React`),
 * so tell esbuild to use that here.
 */
export default defineConfig( {
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: 'react',
	},
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
