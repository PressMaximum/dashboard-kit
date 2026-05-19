import Hero from '../src/welcome/Hero.jsx';

export default {
	title: 'Welcome/Hero',
	component: Hero,
	parameters: { layout: 'padded' },
	tags: [ 'autodocs' ],
};

const ILLUSTRATION = (
	<div
		style={ {
			width: 200,
			height: 140,
			background:
				'linear-gradient(135deg, #c7d2fe 0%, #fce7f3 100%)',
			borderRadius: 8,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: '#4f46e5',
			fontWeight: 600,
		} }
	>
		Illustration
	</div>
);

export const WithEverything = {
	args: {
		greeting: 'Welcome, Jack',
		tagline: 'Configure Customify in three quick steps.',
		primaryCta: { label: 'Start tour', href: '#start' },
		illustration: ILLUSTRATION,
	},
};

export const GreetingOnly = {
	args: {
		greeting: 'Welcome back',
	},
};

export const WithoutIllustration = {
	args: {
		greeting: 'Welcome, Jack',
		tagline: 'No illustration; content fills the card.',
		primaryCta: { label: 'Get started', href: '#start' },
	},
};
