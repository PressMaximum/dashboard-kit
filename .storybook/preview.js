/**
 * Storybook global decorators + parameters.
 *
 * tokens.css imported once at the top so every story renders against the
 * kit's CSS custom properties (SPEC §16.1). Per-component CSS lives with
 * each component's source and is imported by its story.
 */
import '../src/styles/tokens.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		backgrounds: {
			default: 'wp-admin',
			values: [
				{ name: 'wp-admin', value: '#f0f0f1' },
				{ name: 'white', value: '#ffffff' },
			],
		},
	},
};

export default preview;
