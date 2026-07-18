/**
 * ESLint config for @pressmaximum/dashboard-kit.
 *
 * The no-restricted-imports rule enforces the kit's i18n-clean contract
 * (SPEC §6.1) — kit source MUST NOT call __() or fetch data directly.
 * Strings come in as props; data comes in as injected hooks/stores.
 *
 * The restriction applies to src/** only. Test consumer + tests + stories
 * are real consumers and may import what they need.
 */
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended-with-formatting' ],
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
	env: {
		browser: true,
		es2022: true,
		node: true,
	},
	settings: {
		react: { version: '18' },
	},
	ignorePatterns: [
		'build/',
		'storybook-static/',
		'coverage/',
		'node_modules/',
		'vendor/',
		'_ref/',
		'packages/test-consumer/vendor/',
	],
	rules: {
		'import/no-unresolved': 'off',
		'@wordpress/i18n-text-domain': 'off',
		'@wordpress/i18n-translator-comments': 'off',
	},
	overrides: [
		{
			files: [ 'src/**/*.{js,mjs,jsx}' ],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						paths: [
							{
								name: '@wordpress/i18n',
								message:
									'Kit must not call __ directly. Accept text via props/config (SPEC §6.1).',
							},
							{
								name: '@wordpress/core-data',
								message:
									'Kit must not fetch entities. Consumer supplies data via props/hooks (SPEC §6.1).',
							},
							{
								name: '@wordpress/api-fetch',
								message:
									'Kit must not call REST. Consumer wires fetches (SPEC §6.1).',
							},
						],
					},
				],
			},
		},
		{
			files: [
				'packages/test-consumer/**/*.{js,mjs,jsx}',
				'tests/**/*.{js,mjs,jsx}',
				'stories/**/*.{js,mjs,jsx}',
				'.storybook/**/*.{js,mjs,jsx,cjs}',
			],
			rules: {
				'no-restricted-imports': 'off',
			},
		},
		{
			// The DS compact-field contract (KIT-P3 primitives + their
			// stories) nests the control inside its <label> — floating-label
			// anatomy from the Aponto mockup. Nesting IS a valid association;
			// accept it instead of demanding htmlFor/id pairs, which a
			// reusable component can't hardcode. depth 3 covers
			// label > input + icon/label spans. Scoped here so the rest of
			// the repo keeps the stricter default.
			files: [
				'src/primitives/**/*.{js,mjs,jsx}',
				'src/table/**/*.{js,mjs,jsx}',
				'src/module-card/**/*.{js,mjs,jsx}',
				'stories/**/*.{js,mjs,jsx}',
			],
			rules: {
				'jsx-a11y/label-has-associated-control': [
					'error',
					{ assert: 'either', depth: 3 },
				],
			},
		},
		{
			files: [ '*.cjs', '.eslintrc.cjs', 'webpack.config.js' ],
			env: { node: true },
		},
	],
};
